import { Request, Response } from "express";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import * as readingRepository from "../services/readingRepository";
import { deviceOwnershipWhere } from "../utils/deviceAccess";

function toFloatOrUndefined(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = parseFloat(v as string);
  return isNaN(n) ? undefined : n;
}

// Query params that are never sensor readings: either routing info, or
// device-health telemetry that updates the Device row directly instead
// (see the dedicated handling below). Everything else in the query
// string is treated as a potential sensor label/value pair.
const NON_SENSOR_QUERY_KEYS = new Set([
  "d_id",
  "timestamp",
  "is_solar_charging",
  "signal_strength_dbm",
  "battery_v",          // new
  "battery_pct",        // new
  "ota",                // new
]);

/**
 * GET /readings/add
 * Equivalent of app/routers/reading_router.py -> add_reading
 * IoT devices hit this via GET to log data; translates hardware payload
 * into the EAV-style sensor_readings table via active device_sensors.
 *
 * Fully dynamic: any query param whose (lowercased) key matches an
 * installed device_sensor's label gets stored as a reading for that
 * sensor - no hardcoded metric list. Adding a new sensor is just
 * `POST /sensors/device` with a new label; this endpoint picks it up
 * automatically.
 *
 * Device-health telemetry (battery, is_solar_charging,
 * signal_strength_dbm, firmware_version) is handled separately since it
 * describes the device itself, not a field condition, and updates the
 * Device row directly rather than being stored as a sensor reading.
 *
 * Every successful ingestion also marks the device "active" and stamps
 * lastSeenAt, so "Device Online/Offline" and "Last Sync Time" actually
 * reflect reality.
 */
export async function addReading(req: Request, res: Response): Promise<void> {
  const dIdParam = req.query.d_id as string | undefined;
  if (!dIdParam) {
    res.status(400).type("text/plain").send("Missing d_id");
    return;
  }

  // d_id is the device's public UID (device_uid), not the internal numeric
  // primary key - this is what's printed/configured on the hardware and
  // shown as "UID" in the admin fleet table.
  const device = await prisma.device.findUnique({ where: { deviceUid: dIdParam } });
  if (!device) {
    res.status(404).type("text/plain").send("Unknown device");
    return;
  }
  const dId = device.id;

  const timestamp = req.query.timestamp as string | undefined;

  const batteryLevel = toFloatOrUndefined(req.query.battery);
  const signalStrengthDbm = toFloatOrUndefined(req.query.signal_strength_dbm);
  const firmwareVersion = req.query.firmware_version as string | undefined;
  const isSolarChargingRaw = req.query.is_solar_charging as string | undefined;
  const isSolarCharging =
    isSolarChargingRaw === undefined ? undefined : isSolarChargingRaw === "true" || isSolarChargingRaw === "1";
  const batteryPct = toFloatOrUndefined(req.query.battery_pct);
  const batteryVoltage = toFloatOrUndefined(req.query.battery_v);
  const otaVersion = req.query.ota as string | undefined;

  let parsedTime: Date | null = null;
  if (timestamp) {
    const t = new Date(timestamp);
    if (!isNaN(t.getTime())) {
      parsedTime = t;
    }
  }
  if (!parsedTime) {
    parsedTime = new Date();
  }

  const activeSensors = await prisma.deviceSensor.findMany({
    where: { deviceId: dId, isActive: true },
  });

  const sensorMap: Record<string, number> = {};
  for (const sensor of activeSensors) {
    if (sensor.sensorLabel) {
      sensorMap[sensor.sensorLabel.toLowerCase()] = sensor.id;
    }
  }

  const readingsToInsert: { device_sensor_id: number; value: number; recorded_at: Date; quality_flag: string }[] = [];

  // Dynamically walk every query param instead of a hardcoded list, so
  // adding a new sensor (temp, humidity, whatever) only requires adding a
  // matching row in device_sensors - no code change needed here.
  for (const [rawKey, rawValue] of Object.entries(req.query)) {
    if (NON_SENSOR_QUERY_KEYS.has(rawKey)) continue;

    const label = rawKey.toLowerCase();
    if (!(label in sensorMap)) continue; // unknown/unregistered sensor label, skip

    const value = toFloatOrUndefined(Array.isArray(rawValue) ? rawValue[0] : rawValue);
    if (value === undefined) continue;

    readingsToInsert.push({
      device_sensor_id: sensorMap[label],
      value,
      recorded_at: parsedTime as Date,
      quality_flag: "GOOD",
    });
  }

  if (readingsToInsert.length > 0) {
    await readingRepository.insertBulkReadings(readingsToInsert);
  }

  const deviceUpdate: Record<string, unknown> = {
  status: "active",
  lastSeenAt: parsedTime,
};


if (batteryPct !== undefined) {
  deviceUpdate.batteryLevel = batteryPct;
} else if (batteryLevel !== undefined) {  // batteryLevel comes from the old "battery" param
  deviceUpdate.batteryLevel = batteryLevel;
}

if (batteryVoltage !== undefined) {
  deviceUpdate.batteryVoltage = batteryVoltage;
}

if (signalStrengthDbm !== undefined) {
  deviceUpdate.signalStrengthDbm = Math.round(signalStrengthDbm);
}

if (otaVersion !== undefined) {
  deviceUpdate.firmwareVersion = otaVersion;
}

if (isSolarCharging !== undefined) {
  deviceUpdate.isSolarCharging = isSolarCharging;
}

  await prisma.device.updateMany({ where: { id: dId }, data: deviceUpdate });

  res.status(200).type("text/plain").send("Readings added successfully");
}

/**
 * GET /readings/:d_id/history
 * Equivalent of app/routers/reading_router.py -> get_device_history
 */
export async function getDeviceHistory(req: Request, res: Response): Promise<void> {
  const dId = parseInt(req.params.d_id, 10);
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const userId = req.currentUser!.id;

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, dId),
  });

  if (!device) {
    throw new ApiError(404, "Device not found or not authorized");
  }

  const readings = await prisma.sensorReading.findMany({
    where: { deviceSensor: { deviceId: dId } },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });

  res.status(200).json({ status: "success", data: readings });
}