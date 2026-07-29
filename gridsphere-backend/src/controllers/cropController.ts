import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { withEffectiveStatus } from "../utils/deviceStatus";
import { deviceOwnershipWhere } from "../utils/deviceAccess";

/**
 * GET /crops
 * Lists every crop a device can be set to. Nothing here is hardcoded to
 * mango/apple - those are just what prisma/seed.ts happens to pre-populate
 * on a fresh database. Any user can add more via POST /crops (below), and
 * they show up here immediately.
 */
export async function listCrops(_req: Request, res: Response): Promise<void> {
  const crops = await prisma.crop.findMany({ orderBy: { name: "asc" } });
  res.status(200).json({ status: "success", data: crops });
}

const CropCreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

/** "Cherry Tomato" -> "cherry_tomato". Used as the crop's unique code. */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * POST /crops
 * Adds a new crop to the shared crop list. Crops are global reference
 * data (like sensor_types), not owned by a single user - anyone adding
 * "Grape" makes it selectable by every user's devices, same as the
 * seeded mango/apple. That's intentional (a shared, growing crop
 * catalog), not a bug - flagging it here since it's a deliberate design
 * choice worth knowing about.
 *
 * Idempotent: if a crop with the same generated code already exists
 * (e.g. someone already added "Mango"), returns the existing row instead
 * of erroring, so the frontend can call this optimistically without
 * needing a separate "does it exist" check.
 */
export async function createCrop(req: Request, res: Response): Promise<void> {
  const { name } = CropCreateSchema.parse(req.body);
  const code = slugify(name);

  if (!code) {
    throw new ApiError(400, "Crop name must contain at least one letter or number.");
  }

  const existing = await prisma.crop.findUnique({ where: { code } });
  if (existing) {
    res.status(200).json({ status: "success", data: existing, message: "Crop already existed" });
    return;
  }

  const crop = await prisma.crop.create({ data: { name, code } });
  res.status(201).json({ status: "success", data: crop });
}

const SetDeviceCropSchema = z.object({
  crop_code: z.string().nullable(), // null clears the crop selection
});

/**
 * POST /devices/:device_id/crop
 * Sets (or clears, with crop_code: null) the crop associated with a
 * device. This is what drives crop-specific dashboard data and AI
 * advisories (see advisoryController.ts).
 */
export async function setDeviceCrop(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);
  const { crop_code } = SetDeviceCropSchema.parse(req.body);

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, deviceId),
  });
  if (!device) {
    throw new ApiError(404, "Device not found or unauthorized");
  }

  if (crop_code === null) {
    const updated = await prisma.device.update({ where: { id: deviceId }, data: { cropId: null } });
    res.status(200).json({ status: "success", data: withEffectiveStatus(updated) });
    return;
  }

  const crop = await prisma.crop.findUnique({ where: { code: crop_code } });
  if (!crop) {
    throw new ApiError(404, `Unknown crop code "${crop_code}". See GET /crops for supported crops.`);
  }

  const updated = await prisma.device.update({ where: { id: deviceId }, data: { cropId: crop.id } });
  res.status(200).json({ status: "success", data: withEffectiveStatus(updated) });
}