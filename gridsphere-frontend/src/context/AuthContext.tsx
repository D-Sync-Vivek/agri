import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, RegisterPayload, fetchCurrentUser } from "../api/auth";
import { AuthResponse, User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("gridsphere_token");
    const storedUser = localStorage.getItem("gridsphere_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      // The stored user from login may not have deviceCount/createdAt, but that's okay
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const result = await loginUser(email, password);
    localStorage.setItem("gridsphere_token", result.access_token);
    localStorage.setItem("gridsphere_user", JSON.stringify(result.user));
    setToken(result.access_token);
    setUser(result.user);
  }

  async function register(payload: RegisterPayload) {
    await registerUser(payload);
    await login(payload.email, payload.password);
  }

  function logout() {
    localStorage.removeItem("gridsphere_token");
    localStorage.removeItem("gridsphere_user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

