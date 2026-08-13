import { apiClient } from "./client";
import { ChatMessage } from "../types";

export async function getChatHistory(deviceId: number): Promise<ChatMessage[]> {
  const { data } = await apiClient.get(`/devices/${deviceId}/chat`);
  return data.data;
}

/**
 * Sends a message to the AI Chat Assistant and returns the assistant’s reply.
 */
export async function sendChatMessage(deviceId: number, message: string): Promise<string> {
  const { data } = await apiClient.post(`/devices/${deviceId}/chat`, { message });
  return data.data.reply;
}