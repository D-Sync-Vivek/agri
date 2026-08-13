import { checkDeepSeekHealth, getDeepSeekBalance } from "../services/deepseekService";
import { Request, Response } from "express";
import { AdminService } from "../services/adminService";
import {
  AdminDeviceCreateSchema,
  AdminDeviceAssignSchema,
  AdminDeviceUnassignSchema,
  AdminUserUpdateSchema,
} from "../schemas/adminSchema";
import { generateCouponCode } from "../utils/couponCode";
import prisma from "../config/prisma";

const adminService = new AdminService();

// ===== DEVICE ENDPOINTS =====

export async function adminCreateDevice(req: Request, res: Response) {
  const data = AdminDeviceCreateSchema.parse(req.body);
  const device = await adminService.createDevice(data);
  res.status(201).json({ status: "success", data: device });
}

export async function adminListDevices(req: Request, res: Response) {
  const devices = await adminService.getAllDevices();
  res.status(200).json({ status: "success", data: devices });
}

export async function adminGetDevice(req: Request, res: Response) {
  const deviceId = parseInt(req.params.device_id, 10);
  const device = await adminService.getDeviceDetails(deviceId);
  res.status(200).json({ status: "success", data: device });
}

export async function adminUpdateDevice(req: Request, res: Response) {
  const deviceId = parseInt(req.params.device_id, 10);
  const data = AdminDeviceCreateSchema.partial().parse(req.body);
  const device = await adminService.updateDevice(deviceId, data);
  res.status(200).json({ status: "success", data: device });
}

export async function adminDeleteDevice(req: Request, res: Response) {
  const deviceId = parseInt(req.params.device_id, 10);
  const result = await adminService.deleteDevice(deviceId);
  res.status(200).json({ status: "success", ...result });
}

export async function adminAssignDevice(req: Request, res: Response) {
  const deviceId = parseInt(req.params.device_id, 10);
  const data = AdminDeviceAssignSchema.parse(req.body);
  const result = await adminService.assignDeviceToUser(deviceId, data);
  res.status(200).json({ status: "success", data: result });
}

export async function adminUnassignDevice(req: Request, res: Response) {
  const deviceId = parseInt(req.params.device_id, 10);
  const data = AdminDeviceUnassignSchema.parse(req.body);
  const result = await adminService.unassignDeviceFromUser(deviceId, data);
  res.status(200).json({ status: "success", ...result });
}

// ===== USER ENDPOINTS =====

export async function adminListUsers(req: Request, res: Response) {
  const users = await adminService.getAllUsers();
  res.status(200).json({ status: "success", data: users });
}

export async function adminGetUser(req: Request, res: Response) {
  const userId = parseInt(req.params.user_id, 10);
  const user = await adminService.getUserDetails(userId);
  res.status(200).json({ status: "success", data: user });
}

export async function adminUpdateUser(req: Request, res: Response) {
  const userId = parseInt(req.params.user_id, 10);
  const data = AdminUserUpdateSchema.parse(req.body);
  const user = await adminService.updateUser(userId, data);
  res.status(200).json({ status: "success", data: user });
}

export async function adminDeleteUser(req: Request, res: Response) {
  const userId = parseInt(req.params.user_id, 10);
  const result = await adminService.deleteUser(userId);
  res.status(200).json({ status: "success", ...result });
}

// ===== SYSTEM STATS =====

export async function adminGetStats(req: Request, res: Response) {
  const stats = await adminService.getSystemStats();
  res.status(200).json({ status: "success", data: stats });
}

export async function checkDeepSeekStatus(req: Request, res: Response) {
  const result = await checkDeepSeekHealth();
  res.status(200).json({ status: "success", data: result });
}

export async function getDeepSeekBalanceHandler(req: Request, res: Response) {
  const result = await getDeepSeekBalance();
  res.status(200).json({ status: "success", data: result });
}


/** POST /admin/coupons  { discountPercent, expiryMinutes } */
export async function createCoupon(req: Request, res: Response): Promise<void> {
  const { discountPercent, expiryMinutes } = req.body as { discountPercent: number; expiryMinutes: number };

  if (!discountPercent || discountPercent <= 0 || discountPercent > 100) {
    res.status(400).json({ status: "error", message: "discountPercent must be between 1 and 100" });
    return;
  }
  if (!expiryMinutes || expiryMinutes <= 0) {
    res.status(400).json({ status: "error", message: "expiryMinutes must be a positive number" });
    return;
  }

  let code = generateCouponCode();
  // extremely unlikely collision, but guard anyway
  while (await prisma.coupon.findUnique({ where: { code } })) {
    code = generateCouponCode();
  }

  const expiresAt = new Date(Date.now() + expiryMinutes * 60_000);

  const coupon = await prisma.coupon.create({
    data: {
      code,
      discountPercent,
      expiresAt,
      createdByAdminId: req.currentUser!.id,
    },
  });

  res.status(201).json({ status: "success", data: coupon });
}

/** GET /admin/coupons */
export async function listCoupons(_req: Request, res: Response): Promise<void> {
  const coupons = await prisma.coupon.findMany({
    include: { usedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json({ status: "success", data: coupons });
}

/** DELETE /admin/coupons/:coupon_id — revoke an unused coupon */
export async function revokeCoupon(req: Request, res: Response): Promise<void> {
  const couponId = parseInt(req.params.coupon_id, 10);
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });

  if (!coupon) {
    res.status(404).json({ status: "error", message: "Coupon not found" });
    return;
  }
  if (coupon.usedByUserId) {
    res.status(400).json({ status: "error", message: "Cannot revoke a coupon that's already been used" });
    return;
  }

  await prisma.coupon.delete({ where: { id: couponId } });
  res.status(200).json({ status: "success", message: "Coupon revoked" });
}