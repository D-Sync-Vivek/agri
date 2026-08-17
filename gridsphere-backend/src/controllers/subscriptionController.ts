import { Request, Response } from "express";
import prisma from "../config/prisma";
import { createRazorpayOrder, verifyRazorpaySignature } from "../services/razorpay";

/** GET /subscriptions/plans */
export async function getAvailablePlans(_req: Request, res: Response): Promise<void> {
  const plans = await prisma.subscriptionPlan.findMany();
  res.status(200).json({ status: "success", data: plans });
}

/** GET /subscriptions/device/:device_id — scoped to the requesting user */
export async function getDeviceSubscription(req: Request, res: Response): Promise<void> {
  const deviceId = parseInt(req.params.device_id, 10);
  const userId = req.currentUser!.id;

  const subscription = await prisma.deviceSubscription.findFirst({
    where: { deviceId, userId, status: "active" },
  });

  res.status(200).json({
    status: "success",
    data: subscription,
    hasAccess: !!subscription,
  });
}

/** GET /subscriptions/devices — all of the user's devices + their paid/unpaid status */
export async function getMyDevicesWithSubscriptions(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;

  const devices = await prisma.device.findMany({
    where: { userAssociations: { some: { userId } } },
  });

  const subs = await prisma.deviceSubscription.findMany({
    where: { userId, status: "active", deviceId: { in: devices.map((d) => d.id) } },
    include: { plan: true },
  });
  const subByDevice = new Map(subs.map((s) => [s.deviceId, s]));

  const result = devices.map((d) => ({
    ...d,
    subscription: subByDevice.get(d.id) || null,
    hasAccess: subByDevice.has(d.id),
  }));

  res.status(200).json({ status: "success", data: result });
}

/** POST /subscriptions/checkout  { deviceId, planId } */
export async function createCheckout(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const { deviceId, planId, couponCode } = req.body as { deviceId: number; planId: number; couponCode?: string };

  const association = await prisma.deviceUser.findFirst({ where: { userId, deviceId } });
  if (!association) {
    res.status(403).json({ status: "error", message: "You don't have access to this device" });
    return;
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.priceMonthly) {
    res.status(404).json({ status: "error", message: "Plan not found" });
    return;
  }

  let finalPrice = Number(plan.priceMonthly);
  let appliedCouponCode: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });

    if (!coupon) {
      res.status(400).json({ status: "error", message: "Invalid coupon code" });
      return;
    }
    if (coupon.usedByUserId) {
      res.status(400).json({ status: "error", message: "This coupon has already been used" });
      return;
    }
    if (coupon.expiresAt < new Date()) {
      res.status(400).json({ status: "error", message: "This coupon has expired" });
      return;
    }

    finalPrice = Math.round(finalPrice * (1 - coupon.discountPercent / 100) * 100) / 100;
    appliedCouponCode = coupon.code;
  }

  const amountInPaise = Math.round(finalPrice * 100);
  const receipt = `dev${deviceId}_u${userId}_${Date.now()}`;
  const order = await createRazorpayOrder(amountInPaise, receipt);

  await prisma.deviceSubscription.upsert({
    where: { userId_deviceId: { userId, deviceId } },
    update: {
      planId,
      status: "created",
      razorpayOrderId: order.id,
      pricePaid: finalPrice,
      billingCycle: "monthly",
      couponCode: appliedCouponCode,
    },
    create: {
      userId,
      deviceId,
      planId,
      status: "created",
      razorpayOrderId: order.id,
      pricePaid: finalPrice,
      billingCycle: "monthly",
      couponCode: appliedCouponCode,
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      originalPrice: plan.priceMonthly,
      finalPrice,
      discountApplied: appliedCouponCode !== null,
    },
  });
}

/** POST /subscriptions/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature } */
export async function verifyPayment(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const valid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    res.status(400).json({ status: "error", message: "Payment verification failed" });
    return;
  }

  const subscription = await prisma.deviceSubscription.findFirst({
    where: { razorpayOrderId: razorpay_order_id, userId },
  });
  if (!subscription) {
    res.status(404).json({ status: "error", message: "Subscription record not found" });
    return;
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const [updated] = await prisma.$transaction([
    prisma.deviceSubscription.update({
      where: { id: subscription.id },
      data: { status: "active", razorpayPaymentId: razorpay_payment_id, startDate, endDate },
    }),
    ...(subscription.couponCode
      ? [
          prisma.coupon.updateMany({
            where: { code: subscription.couponCode, usedByUserId: null }, // guards against a race/double-use
            data: { usedByUserId: userId, usedAt: new Date() },
          }),
        ]
      : []),
  ]);

  res.status(200).json({ status: "success", data: updated });
}

