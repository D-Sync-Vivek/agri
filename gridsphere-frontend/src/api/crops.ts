import { apiClient } from "./client";
import { Crop, Device } from "../types";

export async function listCrops(): Promise<Crop[]> {
  const { data } = await apiClient.get("/crops");
  return data.data;
}

/**
 * Adds a new crop to the shared crop list. Idempotent server-side - if
 * the name already exists, the backend returns the existing crop instead
 * of erroring, so this is safe to call without a separate "does it
 * exist" check.
 */
export async function createCrop(name: string): Promise<Crop> {
  const { data } = await apiClient.post("/crops", { name });
  return data.data;
}

/** Pass null to clear the crop selection for a device. */
export async function setDeviceCrop(deviceId: number, cropCode: string | null): Promise<Device> {
  const { data } = await apiClient.post(`/devices/${deviceId}/crop`, { crop_code: cropCode });
  return data.data;
}




