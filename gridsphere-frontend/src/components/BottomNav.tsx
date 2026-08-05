import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HomeIcon, DevicesIcon, ProfileIcon, AdminIcon } from "./icons";
import { Brain, BarChart3, Cloud, LineChart, MessageSquare } from "lucide-react";

export default function BottomNav() {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) return null;
  if (location.pathname === "/login" || location.pathname === "/register") return null;

  const isAdmin = user?.role === "admin";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 text-[11px] py-1.5 px-3 rounded-xl transition ${
      isActive ? "bg-brand-50 text-brand-700 font-semibold" : "text-ink-dim"
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex items-center justify-around px-2 py-2 pb-safe z-20 overflow-x-auto">
      {!isAdmin ? (
        <>
          <NavLink to="/" end className={linkClass}>
            <HomeIcon size={20} />
            Home
          </NavLink>
          <NavLink to="/advisory" className={linkClass}>
            <Brain size={20} />
            Advisory
          </NavLink>
          <NavLink to="/insights" className={linkClass}>
            <BarChart3 size={20} />
            Insights
          </NavLink>
          <NavLink to="/forecast" className={linkClass}>
            <Cloud size={20} />
            Forecast
          </NavLink>
          <NavLink to="/analytics" className={linkClass}>
            <LineChart size={20} />
            Analytics
          </NavLink>
          <NavLink to="/chat" className={linkClass}>
            <MessageSquare size={20} />
            Chat
          </NavLink>
        </>
      ) : (
        <>
          <NavLink to="/admin" className={linkClass}>
            <AdminIcon size={20} />
            Admin
          </NavLink>
          <NavLink to="/devices" className={linkClass}>
            <DevicesIcon size={20} />
            Devices
          </NavLink>
          <NavLink to="/admin/sensors" className={linkClass}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l6.22 6.22a1.65 1.65 0 0 0 2.36 0l6.22-6.22z" />
              <path d="M10 10V7a2 2 0 0 1 4 0v3" />
            </svg>
            Sensors
          </NavLink>
          <NavLink to="/admin/users" className={linkClass}>
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
      <NavLink to="/profile" className={linkClass}>
        <ProfileIcon size={20} />
        Profile
      </NavLink>
    </nav>
  );
}