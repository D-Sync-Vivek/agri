import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HomeIcon, DevicesIcon, ProfileIcon, AdminIcon } from "./icons";
import { Brain, BarChart3, Cloud, LineChart, MessageSquare } from "lucide-react";

export default function AppNav() {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) return null;
  if (location.pathname === "/login" || location.pathname === "/register") return null;

  const isAdmin = user?.role === "admin";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-medium tracking-wide transition-all duration-150 ease-in-out group ${
      isActive
        ? "bg-white/20 text-white"
        : "text-white/70 hover:text-white hover:bg-white/10"
    }`;

  return (
    <nav
      aria-label="Main navigation"
      className="hidden md:flex fixed left-0 top-0 h-full w-22 flex-col items-center py-8 z-50 bg-brand-600 text-white shadow-sm overflow-y-auto"
    >
      <div className="mb-6 flex flex-col items-center">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-2">
          <span className="text-brand-600 font-black text-sm">GS</span>
        </div>
        <span className="text-[10px] font-bold text-white text-center leading-tight">
          GRIDSPHERE
        </span>
      </div>

      <div className="flex flex-col gap-4 w-full px-2">
        {!isAdmin ? (
          <>
            <NavLink to="/" end className={linkClass}>
              <HomeIcon size={24} />
              <span>Home</span>
            </NavLink>
            <NavLink to="/advisory" className={linkClass}>
              <Brain size={24} />
              <span>Advisory</span>
            </NavLink>
            <NavLink to="/insights" className={linkClass}>
              <BarChart3 size={24} />
              <span>Insights</span>
            </NavLink>
            <NavLink to="/forecast" className={linkClass}>
              <Cloud size={24} />
              <span>Forecast</span>
            </NavLink>
            <NavLink to="/analytics" className={linkClass}>
              <LineChart size={24} />
              <span>Analytics</span>
            </NavLink>
            <NavLink to="/chat" className={linkClass}>
              <MessageSquare size={24} />
              <span>Chat</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/admin" end className={linkClass}>
              <AdminIcon size={24} />
              <span>Admin</span>
            </NavLink>
            <NavLink to="/devices" className={linkClass}>
              <DevicesIcon size={24} />
              <span>Devices</span>
            </NavLink>
            <NavLink to="/admin/sensors" className={linkClass}>
              <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l6.22 6.22a1.65 1.65 0 0 0 2.36 0l6.22-6.22z" />
                <path d="M10 10V7a2 2 0 0 1 4 0v3" />
              </svg>
              <span>Sensors</span>
            </NavLink>
            <NavLink to="/admin/users" className={linkClass}>
              <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
              </svg>
              <span>Users</span>
            </NavLink>
          </>
        )}
      </div>

      <div className="mt-auto w-full px-2">
        <NavLink to="/profile" className={linkClass}>
          <ProfileIcon size={24} />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}