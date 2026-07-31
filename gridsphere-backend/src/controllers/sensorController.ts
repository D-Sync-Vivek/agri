import { Request, Response } from "express";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { SensorTypeCreateSchema, DeviceSensorCreateSchema, DeviceSensorUpdateSchema, SensorTypeUpdateSchema } from "../schemas/sensorSchema";
import { deviceOwnershipWhere } from "../utils/deviceAccess";

// ==========================================
// SENSOR TYPES (Reference Data)
// ==========================================

/** GET /sensors/types */
export async function getSensorTypes(_req: Request, res: Response): Promise<void> {
  const types = await prisma.sensorType.findMany();
  res.status(200).json({ status: "success", data: types });
}

/** POST /sensors/types */
export async function createSensorType(req: Request, res: Response): Promise<void> {
  const typeIn = SensorTypeCreateSchema.parse(req.body);

  const existing = await prisma.sensorType.findUnique({ where: { code: typeIn.code } });
  if (existing) {
    throw new ApiError(400, "Sensor type with this code already exists.");
  }

  const newType = await prisma.sensorType.create({
    data: {
      name: typeIn.name,
      code: typeIn.code,
      unit: typeIn.unit ?? undefined,
      dataType: typeIn.data_type ?? "float",
      category: typeIn.category ?? undefined,
      minValue: typeIn.min_value ?? undefined,
      maxValue: typeIn.max_value ?? undefined,
    },
  });

  res.status(201).json({ status: "success", data: newType });
}

// ==========================================
// DEVICE SENSORS (Installed Sensors)
// ==========================================

/** GET /sensors/device/:device_id */
export async function getDeviceSensors(req: Request, res: Response): Promise<void> {
  const deviceId = parseInt(req.params.device_id, 10);
  const userId = req.currentUser!.id;

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, deviceId),
  });

  if (!device) {
    throw new ApiError(404, "Device not found or unauthorized");
  }

  const sensors = await prisma.deviceSensor.findMany({
    where: { deviceId, isActive: true },
  });

  res.status(200).json({ status: "success", data: sensors });
}

/** POST /sensors/device */
export async function installDeviceSensor(req: Request, res: Response): Promise<void> {
  const sensorIn = DeviceSensorCreateSchema.parse(req.body);
  const userId = req.currentUser!.id;

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, sensorIn.device_id),
  });

  if (!device) {
    throw new ApiError(404, "Device not found or unauthorized");
  }

  const sensorType = await prisma.sensorType.findUnique({ where: { id: sensorIn.sensor_type_id } });
  if (!sensorType) {
    throw new ApiError(404, "Sensor Type not found");
  }

  const newDeviceSensor = await prisma.deviceSensor.create({
    data: {
      deviceId: sensorIn.device_id,
      sensorTypeId: sensorIn.sensor_type_id,
      sensorLabel: sensorIn.sensor_label,
      hardwarePort: sensorIn.hardware_port ?? undefined,
      calibrationOffset: sensorIn.calibration_offset,
      calibrationScale: sensorIn.calibration_scale,
    },
  });

  res.status(201).json({ status: "success", data: newDeviceSensor });
}

/** PATCH /sensors/device/sensor/:device_sensor_id */
export async function updateDeviceSensor(req: Request, res: Response): Promise<void> {
  const deviceSensorId = parseInt(req.params.device_sensor_id, 10);
  const updateData = DeviceSensorUpdateSchema.parse(req.body);
  const userId = req.currentUser!.id;

  const sensor = await prisma.deviceSensor.findUnique({ where: { id: deviceSensorId } });
  if (!sensor) {
    throw new ApiError(404, "Device sensor not found");
  }

  const device = await prisma.device.findFirst({
    where: deviceOwnershipWhere(req, sensor.deviceId),
  });

  if (!device) {
    throw new ApiError(403, "Unauthorized to modify this device's sensors");
  }

  // Only update fields actually provided in the request (exclude_unset=True equivalent)
  const data: Record<string, unknown> = {};
  if (updateData.sensor_label !== undefined) data.sensorLabel = updateData.sensor_label;
  if (updateData.hardware_port !== undefined) data.hardwarePort = updateData.hardware_port;
  if (updateData.calibration_offset !== undefined) data.calibrationOffset = updateData.calibration_offset;
  if (updateData.calibration_scale !== undefined) data.calibrationScale = updateData.calibration_scale;
  if (updateData.is_active !== undefined) data.isActive = updateData.is_active;

  const updatedSensor = await prisma.deviceSensor.update({
    where: { id: deviceSensorId },
    data,
  });

  res.status(200).json({ status: "success", message: "Sensor updated successfully", data: updatedSensor });
}

// PUT /sensors/types/:id
export async function updateSensorType(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  const updateData = SensorTypeUpdateSchema.parse(req.body);

  const existing = await prisma.sensorType.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Sensor type not found");

  // If code is being changed, ensure it's unique
  if (updateData.code && updateData.code !== existing.code) {
    const duplicate = await prisma.sensorType.findUnique({ where: { code: updateData.code } });
    if (duplicate) throw new ApiError(400, "Sensor type with this code already exists.");
  }

  const updated = await prisma.sensorType.update({
    where: { id },
    data: {
      name: updateData.name,
      code: updateData.code,
      unit: updateData.unit,
      dataType: updateData.data_type,
      category: updateData.category,
      minValue: updateData.min_value,
      maxValue: updateData.max_value,
    },
  });

  res.status(200).json({ status: "success", data: updated });
}

// DELETE /sensors/types/:id
export async function deleteSensorType(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.sensorType.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Sensor type not found");

  // Check if any device_sensor references this type
  const inUse = await prisma.deviceSensor.findFirst({ where: { sensorTypeId: id } });
  if (inUse) throw new ApiError(400, "Cannot delete sensor type that is currently installed on a device.");

  await prisma.sensorType.delete({ where: { id } });
  res.status(200).json({ status: "success", message: "Sensor type deleted" });
}