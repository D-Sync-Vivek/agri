import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HomeIcon, DevicesIcon, ProfileIcon, AdminIcon } from "./icons";

export default function BottomNav() {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) return null;
  if (location.pathname === "/login" || location.pathname === "/register") return null;

  const isAdmin = user?.role === "admin";

  return (
    <nav className="sticky bg-white bottom-0 border-t border-gray-200 flex items-center justify-around px-2 py-2 pb-safe z-20 w-full">
      {!isAdmin && (
        <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center gap-1 text-xs py-1 px-3 ${isActive ? 'text-brand-600 font-semibold' : 'text-ink-dim'}`}>
          <HomeIcon />
          Home
        </NavLink>
      )}
      {isAdmin && (
        <>
          <NavLink to="/admin" className={({ isActive }) => `flex flex-col items-center gap-1 text-xs py-1 px-3 ${isActive ? 'text-brand-600 font-semibold' : 'text-ink-dim'}`}>
            <AdminIcon />
            Admin
          </NavLink>
          <NavLink to="/devices" className={({ isActive }) => `flex flex-col items-center gap-1 text-xs py-1 px-3 ${isActive ? 'text-brand-600 font-semibold' : 'text-ink-dim'}`}>
            <DevicesIcon />
            Devices
          </NavLink>
          
          <NavLink to="/admin/sensors" className={({ isActive }) => (isActive ? "active" : "")}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l6.22 6.22a1.65 1.65 0 0 0 2.36 0l6.22-6.22z" />
              <path d="M10 10V7a2 2 0 0 1 4 0v3" />
            </svg>
            Sensors
          </NavLink>
        
          <NavLink to="/admin/users" className={({ isActive }) => `flex flex-col items-center gap-1 text-xs py-1 px-3 ${isActive ? 'text-brand-600 font-semibold' : 'text-ink-dim'}`}>
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
      <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 text-xs py-1 px-3 ${isActive ? 'text-brand-600 font-semibold' : 'text-ink-dim'}`}>
        <ProfileIcon />
        Profile
      </NavLink>
    </nav>
  );
}