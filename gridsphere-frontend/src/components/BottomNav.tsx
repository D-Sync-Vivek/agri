import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HomeIcon, DevicesIcon, ProfileIcon } from "./icons";

export default function BottomNav() {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) return null;
  if (location.pathname === "/login" || location.pathname === "/register") return null;

  const isAdmin = user?.role === "admin";

  return (
    <nav className="bottom-nav">
      {!isAdmin && (
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          <HomeIcon />
          Home
        </NavLink>
      )}
      {isAdmin && (
        <>
          <NavLink to="/devices" className={({ isActive }) => (isActive ? "active" : "")}>
            <DevicesIcon />
            Devices
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => (isActive ? "active" : "")}>
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
      <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
        <ProfileIcon />
        Profile
      </NavLink>
    </nav>
  );
}