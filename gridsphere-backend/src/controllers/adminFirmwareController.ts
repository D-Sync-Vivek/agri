import { Request, Response } from "express";
import fs from "fs";
import { z } from "zod";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { ensureFirmwareDir, firmwarePath, sha256File } from "../utils/firmwareStorage";

/** POST /admin/firmware (multipart: file=firmware.bin, version=1.0.3) */
export async function uploadFirmware(req: Request, res: Response): Promise<void> {
  const file = req.file;
  const version = (req.body?.version || "").trim();
  if (!file) throw new ApiError(400, "firmware file is required (field name: file)");
  if (!version) throw new ApiError(400, "version is required");

  ensureFirmwareDir();
  const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const dest = firmwarePath(filename);
  fs.renameSync(file.path, dest);

  const firmware = await prisma.firmware.create({
    data: { version, filename, sha256: sha256File(dest), size: fs.statSync(dest).size },
  });
  res.status(201).json({ status: "success", data: firmware });
}

/** GET /admin/firmware - list all uploaded firmware, with how many devices target each */
export async function listFirmware(_req: Request, res: Response): Promise<void> {
  const firmware = await prisma.firmware.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { devices: true } } },
  });
  res.status(200).json({ status: "success", data: firmware });
}

/** DELETE /admin/firmware/:id - refuses if any device still targets it */
export async function deleteFirmware(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  const inUse = await prisma.device.count({ where: { targetFirmwareId: id } });
  if (inUse > 0) throw new ApiError(400, `${inUse} device(s) still target this firmware - unassign them first`);

  const firmware = await prisma.firmware.findUnique({ where: { id } });
  if (!firmware) throw new ApiError(404, "Firmware not found");

  await prisma.firmware.delete({ where: { id } });
  const filePath = firmwarePath(firmware.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.status(200).json({ status: "success" });
}

const AssignSchema = z.object({ device_ids: z.array(z.number().int()).min(1) });

/**
 * POST /admin/firmware/:id/assign
 * Body: { "device_ids": [1, 2, 3] } - targets this firmware to exactly
 * those devices (this is the "update individual or selected devices"
 * mechanism). Pass an empty target via the unassign endpoint below to
 * stop an update.
 */
export async function assignFirmware(req: Request, res: Response): Promise<void> {
  const firmwareId = parseInt(req.params.id, 10);
  const { device_ids } = AssignSchema.parse(req.body);

  const firmware = await prisma.firmware.findUnique({ where: { id: firmwareId } });
  if (!firmware) throw new ApiError(404, "Firmware not found");

  await prisma.device.updateMany({
    where: { id: { in: device_ids } },
    data: { targetFirmwareId: firmwareId },
  });
  res.status(200).json({ status: "success", message: `Targeted ${device_ids.length} device(s) to firmware ${firmware.version}` });
}

const UnassignSchema = z.object({ device_ids: z.array(z.number().int()).min(1) });

/** POST /admin/firmware/unassign - clears the target firmware for the given devices (stops the update). */
export async function unassignFirmware(req: Request, res: Response): Promise<void> {
  const { device_ids } = UnassignSchema.parse(req.body);
  await prisma.device.updateMany({ where: { id: { in: device_ids } }, data: { targetFirmwareId: null } });
  res.status(200).json({ status: "success" });
}
