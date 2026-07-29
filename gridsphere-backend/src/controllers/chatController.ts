import { Request, Response } from "express";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { getForecastForCoordinates } from "../services/forecastService";
import { computeTodayEt0 } from "../services/etService";
import { chatWithAssistant, ChatTurn } from "../services/deepseekService";
import { deviceOwnershipWhere } from "../utils/deviceAccess";

const HISTORY_TURNS = 10;
const HISTORY_DAYS = 7;

/** Group readings by date (YYYY-MM-DD) and compute min, max, avg */
function groupReadingsByDay(
  readings: { value: number; recordedAt: Date }[]
): Map<string, { min: number; max: number; avg: number; }> {
  const map = new Map<string, { min: number; max: number; avg: number; count: number; sum: number }>();
  for (const r of readings) {
    const dateKey = r.recordedAt.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!map.has(dateKey)) {
      map.set(dateKey, { min: r.value, max: r.value, sum: r.value, count: 1, avg: r.value });
    } else {
      const entry = map.get(dateKey)!;
      entry.min = Math.min(entry.min, r.value);
      entry.max = Math.max(entry.max, r.value);
      entry.sum += r.value;
      entry.count += 1;
      entry.avg = entry.sum / entry.count;
    }
  }
  // Convert to final format with avg
  const result = new Map<string, { min: number; max: number; avg: number }>();
  for (const [date, entry] of map) {
    result.set(date, { min: entry.min, max: entry.max, avg: entry.avg });
  }
  return result;
}

/** Generate a detailed daily summary for a given metric label */
function generateDailySummary(
  readings: { value: number; recordedAt: Date }[],
  label: string,
  unit: string
): string {
  if (readings.length === 0) return "";

  const daily = groupReadingsByDay(readings);
  // Sort dates descending (most recent first)
  const sortedDates = Array.from(daily.keys()).sort((a, b) => b.localeCompare(a));

  const lines: string[] = [];
  for (const date of sortedDates) {
    const d = daily.get(date)!;
    lines.push(`${date}: avg ${d.avg.toFixed(1)} (min ${d.min.toFixed(1)}, max ${d.max.toFixed(1)})`);
  }
  return `${label} (${unit}):\n${lines.join("\n")}`;
}

export async function sendChatMessage(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);
  const message = (req.body?.message as string | undefined)?.trim();

  if (!message) {
    throw new ApiError(400, "message is required");
  }

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, deviceId),
    include: { crop: true },
  });
  if (!device) {
    throw new ApiError(404, "Device not found or unauthorized");
  }

  const sensors = await prisma.deviceSensor.findMany({ where: { deviceId, isActive: true } });

  // Helper to get latest reading for a label
  async function latestValueForLabel(label: string): Promise<number | null> {
    const sensor = sensors.find((s) => s.sensorLabel?.toLowerCase() === label);
    if (!sensor) return null;
    const reading = await prisma.sensorReading.findFirst({
      where: { deviceSensorId: sensor.id },
      orderBy: { recordedAt: "desc" },
    });
    return reading?.value ?? null;
  }

  // Helper to get historical readings for a label (past N days)
  async function historyForLabel(label: string, days: number): Promise<{ value: number; recordedAt: Date }[]> {
    const sensor = sensors.find((s) => s.sensorLabel?.toLowerCase() === label);
    if (!sensor) return [];
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const readings = await prisma.sensorReading.findMany({
      where: { deviceSensorId: sensor.id, recordedAt: { gte: cutoff } },
      orderBy: { recordedAt: "asc" },
      select: { value: true, recordedAt: true },
    });
    return readings.filter((r) => r.value !== null).map((r) => ({ value: r.value!, recordedAt: r.recordedAt! }));
  }

  // Fetch latest values
  const [temperatureC, humidityPct, windSpeedMs, windDirectionDeg, rainfallMm, soilMoisturePct] = await Promise.all([
    latestValueForLabel("temp"),
    latestValueForLabel("humidity"),
    latestValueForLabel("wind_speed"),
    latestValueForLabel("wind_direction"),
    latestValueForLabel("rainfall"),
    latestValueForLabel("soil_moisture"),
  ]);

  // Fetch historical readings for key metrics
  const [tempHistory, humidityHistory, windHistory, rainHistory, soilHistory] = await Promise.all([
    historyForLabel("temp", HISTORY_DAYS),
    historyForLabel("humidity", HISTORY_DAYS),
    historyForLabel("wind_speed", HISTORY_DAYS),
    historyForLabel("rainfall", HISTORY_DAYS),
    historyForLabel("soil_moisture", HISTORY_DAYS),
  ]);

  // Build a detailed daily history summary
  const historyParts: string[] = [];
  const tempSummary = generateDailySummary(tempHistory, "Temperature", "°C");
  if (tempSummary) historyParts.push(tempSummary);
  const humSummary = generateDailySummary(humidityHistory, "Humidity", "%");
  if (humSummary) historyParts.push(humSummary);
  const windSummary = generateDailySummary(windHistory, "Wind speed", "m/s");
  if (windSummary) historyParts.push(windSummary);
  const rainSummary = generateDailySummary(rainHistory, "Rainfall", "mm");
  if (rainSummary) historyParts.push(rainSummary);
  const soilSummary = generateDailySummary(soilHistory, "Soil moisture", "%");
  if (soilSummary) historyParts.push(soilSummary);

  const historySummary =
    historyParts.length > 0
      ? `Historical data for the last ${HISTORY_DAYS} days (most recent first):\n\n${historyParts.join("\n\n")}`
      : "No historical data available for the past week.";

  const tempSensor = sensors.find((s) => s.sensorLabel?.toLowerCase() === "temp");
  const et0Result = await computeTodayEt0({
    tempSensorId: tempSensor?.id ?? null,
    latitude: device.latitude,
    longitude: device.longitude,
  });
  const et0MmPerDay = et0Result?.value ?? null;

  let precipitationProbabilityNext12hPct: number | null = null;
  if (device.latitude !== null && device.longitude !== null) {
    try {
      const forecast = await getForecastForCoordinates(device.latitude, device.longitude);
      const probs = forecast.hourly.precipitation_probability?.slice(0, 12) ?? [];
      if (probs.length > 0) precipitationProbabilityNext12hPct = Math.max(...probs);
    } catch {
      precipitationProbabilityNext12hPct = null;
    }
  }

  const priorMessages = await prisma.deviceChatMessage.findMany({
    where: { deviceId, userId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_TURNS,
  });
  const history: ChatTurn[] = priorMessages.reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const reply = await chatWithAssistant(
    {
      cropName: device.crop?.name ?? null,
      locationName: device.locationName,
      temperatureC,
      humidityPct,
      windSpeedMs,
      windDirectionDeg,
      rainfallMm,
      soilMoisturePct,
      et0MmPerDay,
      precipitationProbabilityNext12hPct,
      historySummary,
    },
    history,
    message
  );

  await prisma.$transaction([
    prisma.deviceChatMessage.create({
      data: { deviceId, userId, role: "user", content: message },
    }),
    prisma.deviceChatMessage.create({
      data: { deviceId, userId, role: "assistant", content: reply },
    }),
  ]);

  res.status(200).json({ status: "success", data: { reply } });
}

export async function getChatHistory(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;
  const deviceId = parseInt(req.params.device_id, 10);

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, deviceId),
  });
  if (!device) {
    throw new ApiError(404, "Device not found or unauthorized");
  }

  const messages = await prisma.deviceChatMessage.findMany({
    where: { deviceId, userId },
    orderBy: { createdAt: "asc" },
  });

  res.status(200).json({ status: "success", data: messages });
}

