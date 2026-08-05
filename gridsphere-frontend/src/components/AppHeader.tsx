import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDevices } from "../context/DeviceContext";
import { ProfileIcon } from "./icons";
import { RefreshCw, Clock, Menu } from "lucide-react";
import MobileMenu from "./MobileMenu";

export default function AppHeader() {
  const { token, user } = useAuth();
  const { devices, selectedDevice, selectDevice, refresh, isLoading } = useDevices();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  if (!token) return null;
  if (location.pathname === "/login" || location.pathname === "/register") return null;

  const isAdmin = user?.role === "admin";

  return (
    <>
      <header className="fixed top-0 left-0 md:left-22 w-full md:w-[calc(100%-88px)] h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 min-w-0">
          {/* Hamburger menu button - visible only on mobile */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden p-2 text-ink-dim hover:text-brand-600 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          {!isAdmin && (
            <div className="relative">
              <button
                className="text-ink font-bold text-sm sm:text-base flex items-center gap-1 hover:text-brand-600 transition"
                onClick={() => setOpen(!open)}
              >
                Device: {selectedDevice?.deviceName || selectedDevice?.deviceUid || "—"}
                <span className="text-ink-dim">▾</span>
              </button>
              {open && devices.length > 0 && (
                <div className="absolute top-8 left-0 min-w-56 z-30 bg-white rounded-lg shadow-card border border-gray-200 text-ink">
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
          {isAdmin && <span className="text-ink font-bold text-base">Admin Console</span>}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => refresh()}
            title="Refresh devices"
            className={`p-2 text-ink-dim hover:text-brand-600 transition-colors rounded-full hover:bg-gray-100 ${
              isLoading ? "animate-spin" : ""
            }`}
          >
            <RefreshCw size={20} />
          </button>
          
          <Link
            to="/profile"
            className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 hover:bg-brand-100 transition"
          >
            <ProfileIcon size={18} />
          </Link>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}