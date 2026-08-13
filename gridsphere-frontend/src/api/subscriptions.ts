import { apiClient } from "./client";
import { SubscriptionPlan, DeviceWithSubscription, CheckoutOrder } from "../types";

export async function listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await apiClient.get("/subscriptions/plans");
  return data.data;
}

export async function getDeviceSubscription(deviceId: number) {
  const { data } = await apiClient.get(`/subscriptions/device/${deviceId}`);
  return data.data;
}

export async function getMyDevicesWithSubscriptions(): Promise<DeviceWithSubscription[]> {
  const { data } = await apiClient.get("/subscriptions/devices");
  return data.data;
}

export async function createCheckoutOrder(
  deviceId: number,
  planId: number,
  couponCode?: string
): Promise<CheckoutOrder & { originalPrice: number; finalPrice: number; discountApplied: boolean }> {
  const { data } = await apiClient.post("/subscriptions/checkout", { deviceId, planId, couponCode });
  return data.data;
}

export async function verifyPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const { data } = await apiClient.post("/subscriptions/verify", payload);
  return data.data;
}