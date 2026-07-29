import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { DeviceCreateSchema } from "../schemas/deviceSchema";
import { calculateDerivedMetrics } from "../utils/agroMetrics";
import { generateAdvisories } from "../services/insightsService";
import { getForecastForCoordinates } from "../services/forecastService";
import { withEffectiveStatus } from "../utils/deviceStatus";
import { computeTodayEt0 } from "../services/etService";
import { getWindAnalytics, getRainAnalytics } from "../services/windRainAnalyticsService";
import { deviceOwnershipWhere } from "../utils/deviceAccess";

/**
 * POST /devices/
 * Equivalent of app/routers/device_router.py -> create_device
 * Registers a new device and links it to the user via device_users (owner).
 */
export async function createDevice(req: Request, res: Response): Promise<void> {
  const deviceIn = DeviceCreateSchema.parse(req.body);
  const userId = req.currentUser!.id;

  const newDevice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const device = await tx.device.create({
      data: {
        deviceUid: deviceIn.device_uid,
        deviceName: deviceIn.device_name ?? undefined,
        description: deviceIn.description ?? undefined,
        frequency: deviceIn.frequency,
        locationName: deviceIn.location_name ?? undefined,
        latitude: deviceIn.latitude ?? undefined,
        longitude: deviceIn.longitude ?? undefined,
      },
    });

    await tx.deviceUser.create({
      data: {
        userId,
        deviceId: device.id,
        isOwner: true,
        role: "owner",
      },
    });

    return device;
  });

  res.status(201).json(withEffectiveStatus(newDevice));
}

/**
 * GET /devices/
 * Equivalent of app/routers/device_router.py -> get_my_devices
 */
export async function getMyDevices(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;

  const devices = await prisma.device.findMany({
    where: req.currentUser?.role === "admin" ? {} : { userAssociations: { some: { userId } } },
  });

  res.status(200).json(devices.map(withEffectiveStatus));
}

/**
 * GET /devices/:device_id/live-data
 * Equivalent of app/routers/device_router.py -> get_live_data
 */
export async function getLiveData(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, deviceId),
  });

  if (!device) {
    throw new ApiError(404, "Device not found or unauthorized");
  }

  const latestReading = await prisma.sensorReading.findFirst({
    where: { deviceSensor: { deviceId } },
    orderBy: { recordedAt: "desc" },
  });

  res.status(200).json({ status: true, data: latestReading ?? {} });
}

/**
 * GET /devices/:device_id/history
 * Equivalent of app/routers/device_router.py -> get_device_history
 */
export async function getDeviceHistory(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);
  const range = (req.query.range as string) || "weekly";
  const fromDate = req.query.from as string | undefined;
  const toDate = req.query.to as string | undefined;

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, deviceId),
  });

  if (!device) {
    throw new ApiError(404, "Device not found or unauthorized");
  }

  const now = new Date();
  const where: Record<string, unknown> = { deviceSensor: { deviceId } };

  if (range === "daily") {
    // Today only (since local midnight), not a rolling 24h window.
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.recordedAt = { gte: startOfDay };
  } else if (range === "weekly") {
    // Rolling window: the last 7 days of data, including today.
    where.recordedAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  } else if (range === "monthly") {
    // The current calendar month (from the 1st through now), not a
    // rolling 30-day window.
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    where.recordedAt = { gte: startOfMonth };
  } else if (range === "custom" && fromDate && toDate) {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, "Invalid date format. Use ISO 8601.");
    }
    where.recordedAt = { gte: start, lte: end };
  }

  const readings = await prisma.sensorReading.findMany({
    where,
    orderBy: { recordedAt: "desc" },
  });

  res.status(200).json({ status: true, data: readings });
}

/**
 * GET /devices/:device_id/industry
 * Equivalent of app/routers/device_router.py -> get_industry_type (mock response, preserved as-is)
 */
export async function getIndustryType(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ status: true, data: { industry_label: "Agriculture" } });
}

/**
 * POST /devices/:device_id/industry
 * Equivalent of app/routers/device_router.py -> update_industry_type (mock response, preserved as-is)
 */
export async function updateIndustryType(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ status: true, message: "Industry type updated successfully" });
}

/**
 * GET /devices/:device_id/forecast
 * New. Fetches a 7-day hourly+daily forecast for the device's own
 * lat/long from Open-Meteo (free, no API key). Requires the device to
 * have latitude/longitude set (via POST /devices/) - if not, returns 400
 * rather than guessing a location.
 */
export async function getForecast(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, deviceId),
  });

  if (!device) {
    throw new ApiError(404, "Device not found or unauthorized");
  }

  if (device.latitude === null || device.longitude === null) {
    throw new ApiError(400, "This device has no location set - add latitude/longitude to fetch a forecast.");
  }

  const forecast = await getForecastForCoordinates(device.latitude, device.longitude);
  res.status(200).json({ status: "success", data: forecast });
}

/**
 * GET /devices/:device_id/insights
 * New. Rule-based advisories (see services/insightsService.ts) plus
 * derived metrics (dew point, heat index, VPD) computed from the
 * device's most recent temp/humidity readings. Explicitly NOT machine
 * learning - simple, explainable threshold rules over real data.
 * Forecast-dependent advisories are skipped (not treated as false) if the
 * device has no location set or the forecast call fails.
 */
export async function getInsights(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, deviceId),
  });

  if (!device) {
    throw new ApiError(404, "Device not found or unauthorized");
  }

  const sensors = await prisma.deviceSensor.findMany({ where: { deviceId, isActive: true } });

  async function latestValueForLabel(label: string): Promise<number | null> {
    const sensor = sensors.find((s: { sensorLabel: string | null }) => s.sensorLabel?.toLowerCase() === label);
    if (!sensor) return null;
    const reading = await prisma.sensorReading.findFirst({
      where: { deviceSensorId: sensor.id },
      orderBy: { recordedAt: "desc" },
    });
    return reading?.value ?? null;
  }

  const tempSensor = sensors.find((s: { sensorLabel: string | null }) => s.sensorLabel?.toLowerCase() === "temp");

  const [temperatureC, humidityPct, windSpeedMs, et0Result] = await Promise.all([
    latestValueForLabel("temp"),
    latestValueForLabel("humidity"),
    latestValueForLabel("wind_speed"),
    computeTodayEt0({ tempSensorId: tempSensor?.id ?? null, latitude: device.latitude, longitude: device.longitude }),
  ]);

  const derived = calculateDerivedMetrics(temperatureC, humidityPct);
  derived.et0MmPerDay = et0Result?.value ?? null;
  derived.et0Source = et0Result?.source ?? null; // "station" | "forecast" | null - lets the UI label a forecast-based estimate

  let precipitationProbabilityNext12h: number | null = null;
  if (device.latitude !== null && device.longitude !== null) {
    try {
      const forecast = await getForecastForCoordinates(device.latitude, device.longitude);
      const probs = forecast.hourly.precipitation_probability?.slice(0, 12) ?? [];
      if (probs.length > 0) {
        precipitationProbabilityNext12h = Math.max(...probs);
      }
    } catch {
      // Forecast unavailable - skip forecast-dependent advisories rather than fail the whole endpoint.
      precipitationProbabilityNext12h = null;
    }
  }

  const advisories = generateAdvisories({
    temperatureC,
    humidityPct,
    windSpeedMs,
    heatIndexC: derived.heatIndexC,
    precipitationProbabilityNext12h,
  });

  res.status(200).json({
    status: "success",
    data: {
      derivedMetrics: derived,
      advisories,
    },
  });
}

/**
 * GET /devices/:device_id/history/export
 * New. Same filtering as GET /devices/:device_id/history (range=daily|
 * weekly|monthly|custom), but returns text/csv instead of JSON, joined
 * with the sensor label/unit for readability (Data Export feature).
 */
export async function exportHistoryCsv(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);
  const range = (req.query.range as string) || "weekly";
  const fromDate = req.query.from as string | undefined;
  const toDate = req.query.to as string | undefined;

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, deviceId),
  });

  if (!device) {
    throw new ApiError(404, "Device not found or unauthorized");
  }

  const now = new Date();
  const where: Record<string, unknown> = { deviceSensor: { deviceId } };

  if (range === "daily") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.recordedAt = { gte: startOfDay };
  } else if (range === "weekly") {
    where.recordedAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  } else if (range === "monthly") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    where.recordedAt = { gte: startOfMonth };
  } else if (range === "custom" && fromDate && toDate) {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, "Invalid date format. Use ISO 8601.");
    }
    where.recordedAt = { gte: start, lte: end };
  }

  const readings = await prisma.sensorReading.findMany({
    where,
    orderBy: { recordedAt: "asc" },
    include: { deviceSensor: true },
  });

  const header = "sensor_label,value,quality_flag,recorded_at\n";
  const rows = readings
    .map(
      (r: { deviceSensor: { sensorLabel: string | null }; value: number | null; qualityFlag: string | null; recordedAt: Date | null }) =>
        `${r.deviceSensor.sensorLabel ?? ""},${r.value ?? ""},${r.qualityFlag ?? ""},${r.recordedAt?.toISOString() ?? ""}`
    )
    .join("\n");

  res.status(200);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="device-${deviceId}-history-${range}.csv"`);
  res.send(header + rows);
}

/** GET /devices/:device_id/wind-analytics?range=daily|weekly|monthly */
export async function getWindAnalyticsHandler(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);
  const range = (req.query.range as string) || "weekly";

  const device = await prisma.device.findFirst({ where: deviceOwnershipWhere(req, deviceId) });
  if (!device) throw new ApiError(404, "Device not found or unauthorized");

  const data = await getWindAnalytics(deviceId, range);
  res.status(200).json({ status: "success", data });
}

/** GET /devices/:device_id/rain-analytics */
export async function getRainAnalyticsHandler(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);

  const device = await prisma.device.findFirst({ where: deviceOwnershipWhere(req, deviceId) });
  if (!device) throw new ApiError(404, "Device not found or unauthorized");

  const data = await getRainAnalytics(deviceId);
  res.status(200).json({ status: "success", data });
}
