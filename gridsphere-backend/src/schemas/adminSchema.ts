// src/schemas/adminSchema.ts
import { z } from "zod";

export const AdminDeviceCreateSchema = z.object({
  device_uid: z.string().min(1),
  device_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  frequency: z.number().int().default(5),
  location_name: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  // Admin can optionally assign to a user immediately
  assign_to_user_id: z.number().int().optional().nullable(),
});

export const AdminDeviceAssignSchema = z.object({
  user_id: z.number().int(),
  role: z.enum(["owner", "viewer", "editor"]).default("viewer"),
});

export const AdminDeviceUnassignSchema = z.object({
  user_id: z.number().int(),
});

export const AdminUserUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["user", "admin"]).optional(),
  is_active: z.boolean().optional(),
});

export type AdminDeviceCreate = z.infer<typeof AdminDeviceCreateSchema>;
export type AdminDeviceAssign = z.infer<typeof AdminDeviceAssignSchema>;
export type AdminDeviceUnassign = z.infer<typeof AdminDeviceUnassignSchema>;
export type AdminUserUpdate = z.infer<typeof AdminUserUpdateSchema>;