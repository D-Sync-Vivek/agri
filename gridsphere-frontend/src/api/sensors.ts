import { apiClient } from "./client";
import { DeviceSensor, SensorType } from "../types";

export async function listSensorTypes(): Promise<SensorType[]> {
  const { data } = await apiClient.get("/sensors/types");
  return data.data;
}

export async function createSensorType(payload: {
  name: string;
  code: string;
  unit?: string | null;
  data_type?: string;
  category?: string | null;
  min_value?: number | null;
  max_value?: number | null;
}): Promise<SensorType> {
  const { data } = await apiClient.post("/sensors/types", payload);
  return data.data;
}



export async function listDeviceSensors(deviceId: number): Promise<DeviceSensor[]> {
  const { data } = await apiClient.get(`/sensors/device/${deviceId}`);
  return data.data;
}

export interface DeviceSensorCreatePayload {
  device_id: number;
  sensor_type_id: number;
  sensor_label: string;          
  hardware_port?: string;
  calibration_offset?: number;
  calibration_scale?: number;
}

export async function installDeviceSensor(payload: DeviceSensorCreatePayload): Promise<DeviceSensor> {
  const { data } = await apiClient.post("/sensors/device", payload);
  return data.data;
}

export async function updateDeviceSensor(
  deviceSensorId: number,
  payload: Partial<{ hardware_port: string; calibration_offset: number; calibration_scale: number; is_active: boolean }>
): Promise<DeviceSensor> {
  const { data } = await apiClient.patch(`/sensors/device/sensor/${deviceSensorId}`, payload);
  return data.data;
}

export async function getRecentReadings(deviceId: number, limit = 50) {
  const { data } = await apiClient.get(`/readings/${deviceId}/history`, { params: { limit } });
  return data.data;
}


export async function updateSensorType(
  id: number, 
  payload: {
    name?: string;
    code?: string;
    unit?: string | null;
    data_type?: string;
    category?: string | null;
    min_value?: number | null;
    max_value?: number | null;
  }
): Promise<SensorType> {
  const { data } = await apiClient.put(`/sensors/types/${id}`, payload);
  return data.data;
}

export async function deleteSensorType(id: number): Promise<void> {
  await apiClient.delete(`/sensors/types/${id}`);
}

