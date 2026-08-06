import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HomeIcon, DevicesIcon, ProfileIcon, AdminIcon } from "./icons";
import { Brain, BarChart3, Cloud, LineChart, MessageSquare, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium transition ${
      isActive
        ? "bg-white/20 text-white"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-brand-600 shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <img
            src="/logo1.png"
            alt="GridSphere Logo"
            width={150}
            className="filter brightness-0 invert"
          />
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition text-white"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col p-3 gap-1">
          {!isAdmin ? (
            <>
              <NavLink to="/" end className={linkClass} onClick={onClose}>
                <HomeIcon size={20} />
                Home
              </NavLink>
              <NavLink to="/advisory" className={linkClass} onClick={onClose}>
                <Brain size={20} />
                Advisory
              </NavLink>
              <NavLink to="/insights" className={linkClass} onClick={onClose}>
                <BarChart3 size={20} />
                Insights
              </NavLink>
              <NavLink to="/analytics" className={linkClass} onClick={onClose}>
                <LineChart size={20} />
                Analytics
              </NavLink>
              <NavLink to="/chat" className={linkClass} onClick={onClose}>
                <MessageSquare size={20} />
                Chat
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/admin" className={linkClass} onClick={onClose}>
                <AdminIcon size={20} />
                Admin
              </NavLink>
              <NavLink to="/devices" className={linkClass} onClick={onClose}>
                <DevicesIcon size={20} />
                Devices
              </NavLink>
              <NavLink to="/admin/sensors" className={linkClass} onClick={onClose}>
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l6.22 6.22a1.65 1.65 0 0 0 2.36 0l6.22-6.22z" />
                  <path d="M10 10V7a2 2 0 0 1 4 0v3" />
                </svg>
                Sensors
              </NavLink>
              <NavLink to="/admin/users" className={linkClass} onClick={onClose}>
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
                </svg>
                Users
              </NavLink>
            </>
          )}
          <div className="border-t border-white/20 my-2" />
          <NavLink to="/profile" className={linkClass} onClick={onClose}>
            <ProfileIcon size={20} />
            Profile
          </NavLink>
        </nav>
      </div>
    </>
  );
}