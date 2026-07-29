import { Request, Response } from "express";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { calculateDerivedMetrics } from "../utils/agroMetrics";
import { getForecastForCoordinates } from "../services/forecastService";
import { generateAdvisory } from "../services/deepseekService";
import { computeTodayEt0 } from "../services/etService";
import { deviceOwnershipWhere } from "../utils/deviceAccess";

// How long a cached advisory stays valid before it's considered stale and
// eligible for regeneration. DeepSeek calls cost money and take a couple
// seconds, so we don't call it on every page load - only when there's no
// recent-enough cached result, or the caller explicitly asks for a fresh
// one (?refresh=true).
const ADVISORY_STALE_MINUTES = 60;

/**
 * GET /devices/:device_id/advisory?refresh=true
 *
 * Builds an AI advisory from the device's real, current data:
 *  - latest temp/humidity/wind/rainfall/soil_moisture readings (whichever
 *    the device actually has sensors for - nothing is invented)
 *  - derived metrics (dew point, heat index, VPD)
 *  - forecast precipitation probability, if the device has a location
 *  - the crop assigned to the device (see POST /devices/:id/crop)
 *
 * Requires a crop to be set on the device (400 if not) - the advisory is
 * inherently crop-specific (pest/fungal risk varies enormously by crop).
 *
 * Results are cached in device_advisories and reused for
 * ADVISORY_STALE_MINUTES unless ?refresh=true is passed, since each
 * generation is a real DeepSeek API call.
 */
export async function getAdvisory(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);
  const forceRefresh = req.query.refresh === "true";

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, deviceId),
    include: { crop: true },
  });

  if (!device) {
    throw new ApiError(404, "Device not found or unauthorized");
  }

  if (!device.crop) {
    throw new ApiError(400, "This device has no crop set. Use POST /devices/:id/crop first (see GET /crops for options).");
  }

  if (!forceRefresh) {
    const cached = await prisma.deviceAdvisory.findFirst({
      where: { deviceId, cropId: device.cropId },
      orderBy: { generatedAt: "desc" },
    });
    if (cached) {
      const ageMinutes = (Date.now() - cached.generatedAt.getTime()) / 60000;
      if (ageMinutes < ADVISORY_STALE_MINUTES) {
        res.status(200).json({
          status: "success",
          data: {
            summary: cached.summary,
            precautions: cached.precautions,
            risks: cached.risks,
            cropName: device.crop.name,
            generatedAt: cached.generatedAt,
            fromCache: true,
          },
        });
        return;
      }
    }
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

  const [temperatureC, humidityPct, windSpeedMs, windDirectionDeg, rainfallMm, soilMoisturePct, soilTempC, leafWetnessPct, pm2_5, co2Ppm] =
    await Promise.all([
      latestValueForLabel("temp"),
      latestValueForLabel("humidity"),
      latestValueForLabel("wind_speed"),
      latestValueForLabel("wind_direction"),
      latestValueForLabel("rainfall"),
      latestValueForLabel("soil_moisture"),
      latestValueForLabel("soil_temp"),
      latestValueForLabel("leaf_wetness"),
      latestValueForLabel("pm2_5"),
      latestValueForLabel("co2"),
    ]);

  const tempSensor = sensors.find((s: { sensorLabel: string | null }) => s.sensorLabel?.toLowerCase() === "temp");
  const et0Result = await computeTodayEt0({ tempSensorId: tempSensor?.id ?? null, latitude: device.latitude, longitude: device.longitude });
  const et0MmPerDay = et0Result?.value ?? null;

  const derived = calculateDerivedMetrics(temperatureC, humidityPct);

  let precipitationProbabilityNext12hPct: number | null = null;
  if (device.latitude !== null && device.longitude !== null) {
    try {
      const forecast = await getForecastForCoordinates(device.latitude, device.longitude);
      const probs = forecast.hourly.precipitation_probability?.slice(0, 12) ?? [];
      if (probs.length > 0) {
        precipitationProbabilityNext12hPct = Math.max(...probs);
      }
    } catch {
      precipitationProbabilityNext12hPct = null;
    }
  }

  const advisory = await generateAdvisory({
    cropName: device.crop.name,
    temperatureC,
    humidityPct,
    windSpeedMs,
    windDirectionDeg,
    rainfallMm,
    soilMoisturePct,
    soilTempC,
    leafWetnessPct,
    pm2_5,
    co2Ppm,
    dewPointC: derived.dewPointC,
    heatIndexC: derived.heatIndexC,
    vpdKPa: derived.vpdKPa,
    et0MmPerDay,
    precipitationProbabilityNext12hPct,
    locationName: device.locationName,
  });

  const saved = await prisma.deviceAdvisory.create({
    data: {
      deviceId,
      cropId: device.cropId,
      summary: advisory.summary,
      precautions: advisory.precautions as any,
      risks: advisory.risks as any,
      modelName: "deepseek-chat",
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      summary: saved.summary,
      precautions: saved.precautions,
      risks: saved.risks,
      cropName: device.crop.name,
      generatedAt: saved.generatedAt,
      fromCache: false,
    },
  });
}