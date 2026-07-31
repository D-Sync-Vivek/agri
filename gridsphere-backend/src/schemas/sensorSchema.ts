import { z } from "zod";

// Equivalent of app/schemas/sensor_schema.py -> SensorTypeCreate
export const SensorTypeCreateSchema = z.object({
  name: z.string(),
  code: z.string(),
  unit: z.string().optional().nullable(),
  data_type: z.string().optional().default("float"),
  category: z.string().optional().nullable(),
  min_value: z.number().optional().nullable(),
  max_value: z.number().optional().nullable(),
});
export type SensorTypeCreate = z.infer<typeof SensorTypeCreateSchema>;

// Equivalent of app/schemas/sensor_schema.py -> DeviceSensorCreate
export const DeviceSensorCreateSchema = z.object({
  device_id: z.number().int(),
  sensor_type_id: z.number().int(),
  sensor_label: z.string(),
  hardware_port: z.string().optional().nullable(),
  calibration_offset: z.number().default(0.0),
  calibration_scale: z.number().default(1.0),
});
export type DeviceSensorCreate = z.infer<typeof DeviceSensorCreateSchema>;

// Equivalent of app/schemas/sensor_schema.py -> DeviceSensorUpdate
export const DeviceSensorUpdateSchema = z.object({
  sensor_label: z.string().optional(),
  hardware_port: z.string().optional(),
  calibration_offset: z.number().optional(),
  calibration_scale: z.number().optional(),
  is_active: z.boolean().optional(),
});
export type DeviceSensorUpdate = z.infer<typeof DeviceSensorUpdateSchema>;

export const SensorTypeUpdateSchema = SensorTypeCreateSchema.partial();
