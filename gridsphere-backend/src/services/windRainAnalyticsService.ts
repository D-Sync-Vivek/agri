import prisma from "../config/prisma";

interface RangeWindow {
  gte: Date;
}

function rangeToWindow(range: string): RangeWindow {
  const now = new Date();
  if (range === "daily") return { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
  if (range === "monthly") return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  return { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }; // weekly default
}

async function sensorIdForLabel(deviceId: number, label: string): Promise<number | null> {
  const sensor = await prisma.deviceSensor.findFirst({
    where: { deviceId, isActive: true, sensorLabel: { equals: label, mode: "insensitive" } },
  });
  return sensor?.id ?? null;
}

const COMPASS_LABELS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

function degToCompass(deg: number): string {
  const idx = Math.round((deg % 360) / 22.5) % 16;
  return COMPASS_LABELS[idx];
}

export interface WindAnalytics {
  averageSpeedMs: number | null;
  maxGustMs: number | null;
  dominantDirection: string | null;
  windRose: { direction: string; count: number; avgSpeedMs: number }[];
}

/**
 * GET /devices/:device_id/wind-analytics
 * Pairs each wind_speed reading with the wind_direction reading closest
 * to it in time (readings for different sensors don't share timestamps
 * exactly) to build a wind rose - the standard "which direction is wind
 * usually blowing from, and how hard" chart.
 */
export async function getWindAnalytics(deviceId: number, range: string): Promise<WindAnalytics> {
  const window = rangeToWindow(range);
  const [speedSensorId, dirSensorId] = await Promise.all([
    sensorIdForLabel(deviceId, "wind_speed"),
    sensorIdForLabel(deviceId, "wind_direction"),
  ]);

  if (speedSensorId === null) {
    return { averageSpeedMs: null, maxGustMs: null, dominantDirection: null, windRose: [] };
  }

  const speedReadingsRaw = await prisma.sensorReading.findMany({
    where: { deviceSensorId: speedSensorId, recordedAt: { gte: window.gte } },
    orderBy: { recordedAt: "asc" },
  });

  // Filter out readings with null value or recordedAt
  const speedReadings = speedReadingsRaw.filter((r) => r.value !== null && r.recordedAt !== null) as {
    value: number;
    recordedAt: Date;
  }[];

  if (speedReadings.length === 0) {
    return { averageSpeedMs: null, maxGustMs: null, dominantDirection: null, windRose: [] };
  }

  const averageSpeedMs = Math.round((speedReadings.reduce((a, r) => a + r.value, 0) / speedReadings.length) * 100) / 100;
  const maxGustMs = Math.round(Math.max(...speedReadings.map((r) => r.value)) * 100) / 100;

  if (dirSensorId === null) {
    return { averageSpeedMs, maxGustMs, dominantDirection: null, windRose: [] };
  }

  const dirReadingsRaw = await prisma.sensorReading.findMany({
    where: { deviceSensorId: dirSensorId, recordedAt: { gte: window.gte } },
    orderBy: { recordedAt: "asc" },
  });

  // Filter out nulls
  const dirReadings = dirReadingsRaw.filter((r) => r.value !== null && r.recordedAt !== null) as {
    value: number;
    recordedAt: Date;
  }[];

  // Nearest-neighbor match by timestamp between the two independent sensors.
  const buckets = new Map<string, { count: number; speedSum: number }>();
  let dirIdx = 0;
  for (const s of speedReadings) {
    // Ensure dirIdx is within bounds
    while (
      dirIdx < dirReadings.length - 1 &&
      Math.abs(dirReadings[dirIdx + 1].recordedAt.getTime() - s.recordedAt.getTime()) <
        Math.abs(dirReadings[dirIdx].recordedAt.getTime() - s.recordedAt.getTime())
    ) {
      dirIdx++;
    }
    const nearestDir = dirReadings[dirIdx];
    if (!nearestDir) continue;
    const compass = degToCompass(nearestDir.value);
    const bucket = buckets.get(compass) ?? { count: 0, speedSum: 0 };
    bucket.count += 1;
    bucket.speedSum += s.value;
    buckets.set(compass, bucket);
  }

  const windRose = COMPASS_LABELS.filter((c) => buckets.has(c)).map((direction) => {
    const b = buckets.get(direction)!;
    return { direction, count: b.count, avgSpeedMs: Math.round((b.speedSum / b.count) * 100) / 100 };
  });

  const dominantDirection = windRose.length > 0 ? windRose.reduce((a, b) => (b.count > a.count ? b : a)).direction : null;

  return { averageSpeedMs, maxGustMs, dominantDirection, windRose };
}

export interface RainAnalytics {
  todayMm: number | null;
  weeklyMm: number | null;
  monthlyMm: number | null;
  maxIntensityMmPerHour: number | null;
  rainDurationHours: number | null;
  cumulativeSeries: { date: string; mm: number }[];
}

/**
 * GET /devices/:device_id/rain-analytics
 * Assumes rainfall readings are incremental (mm since last reading), which
 * matches how the addReading ingestion + hardware report it - sums rather
 * than averages. Intensity is the highest single-reading mm value divided
 * by the actual sampling interval that day, a reasonable proxy without
 * requiring a dedicated tipping-bucket rate sensor.
 */
export async function getRainAnalytics(deviceId: number): Promise<RainAnalytics> {
  const rainSensorId = await sensorIdForLabel(deviceId, "rainfall");
  if (rainSensorId === null) {
    // No rain sensor installed at all - genuinely nothing to show.
    return { todayMm: null, weeklyMm: null, monthlyMm: null, maxIntensityMmPerHour: null, rainDurationHours: null, cumulativeSeries: [] };
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayReadingsRaw, weekReadingsRaw, monthReadingsRaw] = await Promise.all([
    prisma.sensorReading.findMany({ where: { deviceSensorId: rainSensorId, recordedAt: { gte: startOfDay } }, orderBy: { recordedAt: "asc" } }),
    prisma.sensorReading.findMany({ where: { deviceSensorId: rainSensorId, recordedAt: { gte: startOfWeek } }, orderBy: { recordedAt: "asc" } }),
    prisma.sensorReading.findMany({ where: { deviceSensorId: rainSensorId, recordedAt: { gte: startOfMonth } }, orderBy: { recordedAt: "asc" } }),
  ]);

  // Filter out readings with null value or recordedAt
  const todayReadings = todayReadingsRaw.filter((r) => r.value !== null && r.recordedAt !== null) as { value: number; recordedAt: Date }[];
  const weekReadings = weekReadingsRaw.filter((r) => r.value !== null && r.recordedAt !== null) as { value: number; recordedAt: Date }[];
  const monthReadings = monthReadingsRaw.filter((r) => r.value !== null && r.recordedAt !== null) as { value: number; recordedAt: Date }[];

  // The sensor IS installed, so an empty window is a real "0 mm" - not
  // "no data". Only the "no sensor at all" case above should be null.
  const sum = (rows: { value: number }[]) => Math.round(rows.reduce((a, r) => a + r.value, 0) * 100) / 100;

  const todayMm = sum(todayReadings);
  const weeklyMm = sum(weekReadings);
  const monthlyMm = sum(monthReadings);

  let maxIntensityMmPerHour: number | null = null;
  let rainDurationHours: number | null = null;
  if (todayReadings.length > 1) {
    let maxRate = 0;
    let wetIntervalsHours = 0;
    for (let i = 1; i < todayReadings.length; i++) {
      const dtHours = (todayReadings[i].recordedAt.getTime() - todayReadings[i - 1].recordedAt.getTime()) / (1000 * 60 * 60);
      if (dtHours <= 0) continue;
      const rate = todayReadings[i].value / dtHours;
      if (rate > maxRate) maxRate = rate;
      if (todayReadings[i].value > 0) wetIntervalsHours += dtHours;
    }
    maxIntensityMmPerHour = Math.round(maxRate * 100) / 100;
    rainDurationHours = Math.round(wetIntervalsHours * 10) / 10;
  }

  const dayTotals = new Map<string, number>();
  for (const r of monthReadings) {
    const key = r.recordedAt.toISOString().slice(0, 10);
    dayTotals.set(key, (dayTotals.get(key) ?? 0) + r.value);
  }
  const cumulativeSeries = Array.from(dayTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, mm]) => ({ date, mm: Math.round(mm * 100) / 100 }));

  return { todayMm, weeklyMm, monthlyMm, maxIntensityMmPerHour, rainDurationHours, cumulativeSeries };
}

