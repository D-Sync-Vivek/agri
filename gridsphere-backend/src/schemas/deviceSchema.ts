import { z } from "zod";

// Equivalent of app/schemas/device_schema.py -> DeviceCreate
export const DeviceCreateSchema = z.object({
  device_uid: z.string(),
  device_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  frequency: z.number().int().default(5),
  location_name: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});
export type DeviceCreate = z.infer<typeof DeviceCreateSchema>;

// Equivalent of app/schemas/device_schema.py -> DeviceResponse (DeviceCreate + id/status/created_at)
