import { apiClient } from "./client";
import { Device, User, Coupon, AdminUserDetail, AdminUser} from "../types";

// ===== STATS =====
export interface SystemStats {
  users: { total: number; active: number; newLast24h: number };
  devices: { total: number; online: number; newLast24h: number };
  readings: { total: number; last24h: number };
  sensors: { installed: number };
  crops: number;
  subscriptions: number;
}

export async function getAdminStats(): Promise<SystemStats> {
  const { data } = await apiClient.get("/admin/stats");
  return data.data;
}

// ===== DEVICE MANAGEMENT =====
export interface AdminDeviceCreatePayload {
  device_uid: string;
  device_name?: string | null;
  description?: string | null;
  frequency?: number;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  assign_to_user_id?: number | null;
}

export interface AdminDeviceUpdatePayload extends Partial<AdminDeviceCreatePayload> {}

export interface AdminDeviceResponse extends Device {
  users: {
    id: number;
    name: string;
    email: string;
    role: string;
    isOwner: boolean;
    hasActiveSubscription: boolean;
  }[];
  sensorCount: number;
  activeSubscriptionCount: number;
}

export async function adminListDevices(): Promise<AdminDeviceResponse[]> {
  const { data } = await apiClient.get("/admin/devices");
  return data.data;
}

export async function adminCreateDevice(payload: AdminDeviceCreatePayload): Promise<Device> {
  const { data } = await apiClient.post("/admin/devices", payload);
  return data.data;
}

// Returns full device detail INCLUDING its user assignments (`.users`).
// There is no separate "/admin/devices/:id/assignments" endpoint on the
// backend - use this instead of calling one.
export async function adminGetDevice(deviceId: number): Promise<any> {
  const { data } = await apiClient.get(`/admin/devices/${deviceId}`);
  return data.data;
}

export async function adminUpdateDevice(deviceId: number, payload: AdminDeviceUpdatePayload): Promise<Device> {
  const { data } = await apiClient.put(`/admin/devices/${deviceId}`, payload);
  return data.data;
}

export async function adminDeleteDevice(deviceId: number): Promise<void> {
  await apiClient.delete(`/admin/devices/${deviceId}`);
}

// ===== DEVICE ASSIGNMENT =====
export interface DeviceAssignment {
  id: number;
  userId: number;
  isOwner: boolean;
  role: string | null;
  user: { id: number; name: string; email: string; phone?: string | null };
}

export async function adminAssignDevice(deviceId: number, userId: number, role: string = "viewer"): Promise<DeviceAssignment> {
  const { data } = await apiClient.post(`/admin/devices/${deviceId}/assign`, { user_id: userId, role });
  return data.data;
}

export async function adminUnassignDevice(deviceId: number, userId: number): Promise<void> {
  await apiClient.delete(`/admin/devices/${deviceId}/assign`, { data: { user_id: userId } });
}

// ===== USER MANAGEMENT =====


export interface AdminUserUpdatePayload {
  name?: string;
  email?: string;
  role?: "user" | "admin";
  is_active?: boolean;
}

export async function adminListUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get("/admin/users");
  return data.data;
}

export async function adminGetUser(userId: number): Promise<AdminUserDetail> {
  const { data } = await apiClient.get(`/admin/users/${userId}`);
  return data.data;
}

export async function adminUpdateUser(userId: number, payload: AdminUserUpdatePayload): Promise<User> {
  const { data } = await apiClient.put(`/admin/users/${userId}`, payload);
  return data.data;
}

export async function adminDeleteUser(userId: number): Promise<void> {
  await apiClient.delete(`/admin/users/${userId}`);
}

export async function adminListDeviceAssignments(deviceId: number): Promise<DeviceAssignment[]> {
  const device = await adminGetDevice(deviceId);
  if (!device.users || !Array.isArray(device.users)) return [];
  return device.users.map((u: any) => ({
    id: u.id,               
    userId: u.id,
    isOwner: u.isOwner,
    role: u.role,
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || null,
    },
  }));
}

export async function checkDeepSeekStatus(): Promise<{ ok: boolean; message: string; model?: string }> {
  const { data } = await apiClient.get("/admin/deepseek/status");
  return data.data;
}

export async function getDeepSeekBalance(): Promise<{ ok: boolean; balance?: number; currency?: string; message?: string }> {
  const { data } = await apiClient.get("/admin/deepseek/balance");
  return data.data;
}


// ====== COUPON ======
export async function adminCreateCoupon(discountPercent: number, expiryMinutes: number): Promise<Coupon> {
  const { data } = await apiClient.post("/admin/coupons", { discountPercent, expiryMinutes });
  return data.data;
}

export async function adminListCoupons(): Promise<Coupon[]> {
  const { data } = await apiClient.get("/admin/coupons");
  return data.data;
}

export async function adminRevokeCoupon(couponId: number): Promise<void> {
  await apiClient.delete(`/admin/coupons/${couponId}`);
}