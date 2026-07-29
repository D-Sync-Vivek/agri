import { Request } from "express";

/**
 * Ownership filter for device-scoped queries. Admins bypass the
 * per-user assignment check and can access any device; regular users
 * are restricted to devices they're assigned to via device_users.
 */
export function deviceOwnershipWhere(req: Request, deviceId: number) {
  if (req.currentUser?.role === "admin") {
    return { id: deviceId };
  }
  return { id: deviceId, userAssociations: { some: { userId: req.currentUser!.id } } };
}