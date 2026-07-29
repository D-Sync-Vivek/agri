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
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-left">
          <div className="app-logo-badge">GS</div>
          <div>
            <div className="app-title">Grid Sphere</div>
            {!isAdmin && (
              <div style={{ position: "relative" }}>
                <button className="device-switcher" onClick={() => setOpen((o) => !o)}>
                  Device ID: {selectedDevice?.id ?? "—"} <span>▾</span>
                </button>
                {open && devices.length > 0 && (
                  <div
                    className="panel"
                    style={{
                      position: "absolute",
                      top: 24,
                      left: 0,
                      minWidth: 200,
                      zIndex: 30,
                      color: "var(--ink)",
                    }}
                  >
                    {devices.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          selectDevice(d.id);
                          setOpen(false);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          padding: "10px 14px",
                          cursor: "pointer",
                          fontSize: 13,
                          borderBottom: "1px solid var(--hairline)",
                        }}
                      >
                        {d.deviceName || d.deviceUid} <span className="muted">#{d.id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <Link to="/profile" className="avatar-btn">
          <ProfileIcon size={18} />
        </Link>
      </div>
    </header>
  );
}