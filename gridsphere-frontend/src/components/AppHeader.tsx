import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDevices } from "../context/DeviceContext";
import { ProfileIcon } from "./icons";
import { RefreshCw, Menu } from "lucide-react";
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
      <header className="fixed top-0 left-0 md:left-22 w-full md:w-[calc(100%-88px)] h-16 bg-brand-600 z-40 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 min-w-0">
          {/* Hamburger menu button - now with brand background */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden p-2 bg-brand-600 text-white hover:bg-brand-700 transition-colors rounded-full"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          {!isAdmin && (
            <div className="relative">
              <button
                className="text-white font-bold text-sm sm:text-base flex items-center gap-1 hover:text-white/80 transition"
                onClick={() => setOpen(!open)}
              >
                Device: {selectedDevice?.deviceName || selectedDevice?.deviceUid || "—"}
                <span className="text-white/70">▾</span>
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
          {isAdmin && <span className="text-white font-bold text-base">Admin Console</span>}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => refresh()}
            title="Refresh devices"
            className={`p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 ${
              isLoading ? "animate-spin" : ""
            }`}
          >
            <RefreshCw size={20} />
          </button>
          
          <Link
            to="/profile"
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
          >
            <ProfileIcon size={18} />
          </Link>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

