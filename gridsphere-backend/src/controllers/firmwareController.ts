import { Request, Response } from "express";
import fs from "fs";
import prisma from "../config/prisma";
import { firmwarePath } from "../utils/firmwareStorage";

/**
 * GET /firmware/version?device_id=123
 * No auth - devices poll this directly (same contract as the original
 * standalone ota.txt server). Unlike that version, updates are targeted
 * per-device: a device only sees an update if an admin has assigned one
 * to it (Device.targetFirmwareId) via POST /admin/firmware/:id/assign.
 * No assignment = no update - the safer default for "update individual
 * or selected devices" rather than pushing to the whole fleet.
 */
export async function getFirmwareVersion(req: Request, res: Response): Promise<void> {
  const deviceId = parseInt(req.query.device_id as string, 10);
  if (!deviceId) {
    res.status(400).json({ error: "device_id query param is required" });
    return;
  }

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: { targetFirmware: true },
  });

  if (!device || !device.targetFirmware) {
    res.status(404).json({ error: "no update targeted for this device" });
    return;
  }

  res.status(200).json({
    version: device.targetFirmware.version,
    size: device.targetFirmware.size,
    sha256: device.targetFirmware.sha256,
  });
}

/**
 * GET /firmware/download?device_id=123
 * No auth. Streams the firmware binary currently assigned to this
 * device. Same 404-if-unassigned rule as /firmware/version above.
 */
export async function downloadFirmware(req: Request, res: Response): Promise<void> {
  const deviceId = parseInt(req.query.device_id as string, 10);
  if (!deviceId) {
    res.status(400).send("device_id query param is required");
    return;
  }

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: { targetFirmware: true },
  });

  if (!device || !device.targetFirmware) {
    res.status(404).send("no update targeted for this device");
    return;
  }

  const filePath = firmwarePath(device.targetFirmware.filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).send("firmware file missing on server");
    return;
  }

  res.download(filePath, "firmware.bin");
}
