import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { listDevices } from "../api/devices";
import { adminListDevices } from "../api/admin";
import { Device } from "../types";
import { useAuth } from "./AuthContext";

interface DeviceContextValue {
  devices: Device[];
  selectedDevice: Device | null;
  selectDevice: (id: number) => void;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const stored = localStorage.getItem("gridsphere_selected_device");
    return stored ? parseInt(stored, 10) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

 const refresh = useCallback(async () => {
  if (!token) return;
  setIsLoading(true);
  setError(null);
  try {
    let list: Device[];
    if (user?.role === "admin") {
      list = await adminListDevices(); 
    } else {
      list = await listDevices();
    }
    setDevices(list);
    
    // 🛑 FIX: Only auto-select a device if the current user actually owns it
    if (list.length > 0) {
      // If we have a stored ID, check if the Admin actually owns it now
      if (selectedId !== null && !list.some((d) => d.id === selectedId)) {
        // The stored ID isn't in the Admin's list, so don't auto-select anything.
        setSelectedId(null);
        localStorage.removeItem("gridsphere_selected_device");
      } else if (selectedId === null) {
        // If no ID is stored, we can default to the first one, 
        // BUT for an Admin with no devices, we let it remain null.
        setSelectedId(list[0].id);
        localStorage.setItem("gridsphere_selected_device", String(list[0].id));
      }
    } else {
      // If list is empty, completely clear the selection
      setSelectedId(null);
      localStorage.removeItem("gridsphere_selected_device");
    }
  } catch (err: any) {
    setError(err?.response?.data?.detail || "Could not load devices");
  } finally {
    setIsLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function selectDevice(id: number) {
    setSelectedId(id);
    localStorage.setItem("gridsphere_selected_device", String(id));
  }

  const selectedDevice = devices.find((d) => d.id === selectedId) || null;

  return (
    <DeviceContext.Provider value={{ devices, selectedDevice, selectDevice, isLoading, error, refresh }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevices(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevices must be used within a DeviceProvider");
  return ctx;
}

