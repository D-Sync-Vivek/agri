import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

export async function requireActiveSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);

  if (req.currentUser!.role === "admin") {
    next();
    return;
  }

  const subscription = await prisma.deviceSubscription.findFirst({
    where: { userId, deviceId, status: "active", OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
  });

  if (!subscription) {
    res.status(402).json({ status: "error", message: "Payment required for this device", paymentRequired: true });
    return;
  }

  next();
}

