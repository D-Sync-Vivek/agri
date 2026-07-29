import prisma from "../config/prisma";

interface BulkReadingInput {
  device_sensor_id: number;
  value: number;
  quality_flag?: string;
  recorded_at?: Date;
}

/**
 * Equivalent of app/repositories/reading_repo.py -> insert_sensor_reading
 */
export async function insertSensorReading(
  deviceSensorId: number,
  value: number,
  qualityFlag = "GOOD",
  recordedAt?: Date
) {
  const recorded = recordedAt ?? new Date();
  return prisma.sensorReading.create({
    data: {
      deviceSensorId,
      value,
      qualityFlag,
      recordedAt: recorded,
    },
  });
}

/**
 * Equivalent of app/repositories/reading_repo.py -> insert_bulk_readings
 */
export async function insertBulkReadings(readings: BulkReadingInput[]): Promise<number> {
  const now = new Date();

  const data = readings.map((r) => ({
    deviceSensorId: r.device_sensor_id,
    value: r.value,
    qualityFlag: r.quality_flag ?? "GOOD",
    recordedAt: r.recorded_at ?? now,
  }));

  const result = await prisma.sensorReading.createMany({ data });
  return result.count;
}
