import { apiClient } from "./client";

export interface Firmware {
  id: number;
  version: string;
  filename: string;
  sha256: string;
  size: number;
  createdAt: string;
  _count: { devices: number };
}

export async function listFirmware(): Promise<Firmware[]> {
  const { data } = await apiClient.get("/admin/firmware");
  return data.data;
}

export async function uploadFirmware(file: File, version: string): Promise<Firmware> {
  const form = new FormData();
  form.append("file", file);
  form.append("version", version);
  const { data } = await apiClient.post("/admin/firmware", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function deleteFirmware(id: number): Promise<void> {
  await apiClient.delete(`/admin/firmware/${id}`);
}

export async function assignFirmware(id: number, deviceIds: number[]): Promise<{ message: string }> {
  const { data } = await apiClient.post(`/admin/firmware/${id}/assign`, { device_ids: deviceIds });
  return data;
}

export async function unassignFirmware(deviceIds: number[]): Promise<void> {
  await apiClient.post("/admin/firmware/unassign", { device_ids: deviceIds });
}
