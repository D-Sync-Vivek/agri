import prisma from "../config/prisma";
import { calculateReferenceET0 } from "../utils/agroMetrics";
import { getForecastForCoordinates } from "./forecastService";

/**
 * Computes today's reference evapotranspiration (ET0) for a device.
 *
 * Primary source: the device's own "temp" sensor readings since local
 * midnight (most accurate, since it reflects the field's actual
 * microclimate). Hargreaves-Samani needs a real diurnal (max-min) swing to
 * mean anything, so if the device doesn't yet have enough readings/spread
 * today (e.g. a new device, or only a couple of manually-entered test
 * readings), we fall back to Open-Meteo's forecasted today's max/min for
 * the device's coordinates instead of just returning null - a forecast
 * min/max is still a real, defensible number, just slightly less precise
 * than the station's own reading once it has enough data.
 *
 * Returns null only if there's truly no usable data at all (no temp
 * sensor, and no location to fall back to a forecast with).
 *
 * Shared between GET /devices/:id/insights, GET /devices/:id/advisory, and
 * the chat assistant so all three surface the same number.
 */
export interface Et0Result {
  value: number;
  source: "station" | "forecast";
}

export async function computeTodayEt0(params: {
  tempSensorId: number | null;
  latitude: number | null;
  longitude?: number | null;
}): Promise<Et0Result | null> {
  const { tempSensorId, latitude, longitude } = params;
  if (latitude === null) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let tMax: number | null = null;
  let tMin: number | null = null;
  let tMean: number | null = null;
  let usedForecastFallback = false;

  if (tempSensorId !== null) {
    const readings = await prisma.sensorReading.findMany({
      where: { deviceSensorId: tempSensorId, recordedAt: { gte: startOfDay } },
      select: { value: true },
    });
    const values = readings.map((r) => r.value).filter((v): v is number => v !== null);

    if (values.length > 0) {
      const localMax = Math.max(...values);
      const localMin = Math.min(...values);
      // Only trust the station's own range once it actually shows a real
      // diurnal swing - otherwise sqrt(tMax-tMin) collapses to ~0 and the
      // formula is meaningless, even though we do have "data".
      if (localMax - localMin >= 0.5) {
        tMax = localMax;
        tMin = localMin;
        tMean = values.reduce((a, b) => a + b, 0) / values.length;
      }
    }
  }

  if (tMax === null || tMin === null) {
    if (longitude === undefined || longitude === null) return null;
    try {
      const forecast = await getForecastForCoordinates(latitude, longitude);
      const todayIdx = 0; // Open-Meteo daily[0] is today given timezone=auto
      const fMax = forecast.daily.temperature_2m_max?.[todayIdx];
      const fMin = forecast.daily.temperature_2m_min?.[todayIdx];
      if (fMax === undefined || fMin === undefined) return null;
      tMax = fMax;
      tMin = fMin;
      tMean = tMean ?? (fMax + fMin) / 2; // keep station's own mean if we had one, else forecast mean
      usedForecastFallback = true;
    } catch {
      return null;
    }
  }

  if (tMax === null || tMin === null || tMean === null) return null;

  const et0 = calculateReferenceET0({ tMaxC: tMax, tMinC: tMin, tMeanC: tMean, latitudeDeg: latitude, date: now });
  const rounded = Math.round(et0 * 100) / 100;

  return { value: rounded, source: usedForecastFallback ? "forecast" : "station" };
}

