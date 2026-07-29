import { Request, Response } from "express";
import prisma from "../config/prisma";

/** GET /subscriptions/plans */
export async function getAvailablePlans(_req: Request, res: Response): Promise<void> {
  const plans = await prisma.subscriptionPlan.findMany();
  res.status(200).json({ status: "success", data: plans });
}

/** GET /subscriptions/device/:device_id */
export async function getDeviceSubscription(req: Request, res: Response): Promise<void> {
  const deviceId = parseInt(req.params.device_id, 10);

  const subscription = await prisma.deviceSubscription.findFirst({
    where: { deviceId, status: "active" },
  });

  if (!subscription) {
    res.status(200).json({ status: "success", data: null, message: "No active subscription found" });
    return;
  }

  res.status(200).json({ status: "success", data: subscription });
}
