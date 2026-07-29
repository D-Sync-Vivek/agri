import { apiClient } from "./client";
import { SubscriptionPlan } from "../types";

export async function listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await apiClient.get("/subscriptions/plans");
  return data.data;
}

export async function getDeviceSubscription(deviceId: number) {
  const { data } = await apiClient.get(`/subscriptions/device/${deviceId}`);
  return data.data;
}


