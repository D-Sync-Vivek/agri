import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDevices } from "../context/DeviceContext";
import { ProfileIcon } from "./icons";

export default function AppHeader() {
  const { token, user } = useAuth();
  const { devices, selectedDevice, selectDevice } = useDevices();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (!token) return null;
  if (location.pathname === "/login" || location.pathname === "/register") return null;

  const isAdmin = user?.role === "admin";

  return (
    <header className="bg-brand-600 text-white py-4 px-6 w-full">
      <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-base shrink-0">
            GS
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">Grid Sphere</div>
            {!isAdmin && (
              <div className="relative">
                <button
                  className="text-white/85 text-sm flex items-center gap-1 hover:text-white transition"
                  onClick={() => setOpen(!open)}
                >
                  Device ID: {selectedDevice?.id ?? "—"} <span>▾</span>
                </button>
                {open && devices.length > 0 && (
                  <div className="absolute top-6 left-0 min-w-50 z-30 bg-white rounded-lg shadow-card border border-gray-200 text-ink">
                    {devices.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          selectDevice(d.id);
                          setOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2.5 hover:bg-brand-50 text-sm border-b border-gray-100 last:border-0 transition"
                      >
                        {d.deviceName || d.deviceUid} <span className="text-ink-dim">#{d.id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <Link to="/profile" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
          <ProfileIcon size={18} />
        </Link>
      </div>
    </header>
  );
}