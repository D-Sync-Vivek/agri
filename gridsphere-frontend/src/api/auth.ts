import { apiClient } from "./client";
import { AuthResponse, User } from "../types";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export async function registerUser(payload: RegisterPayload) {
  const { data } = await apiClient.post("/register", payload);
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  // The backend's /login route expects OAuth2 form-encoding, with the
  // email in a field literally called "username".
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const { data } = await apiClient.post<AuthResponse>("/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get("/users/");
  return data.data;
}
