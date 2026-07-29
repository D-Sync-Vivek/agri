import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HomeIcon, DevicesIcon, ProfileIcon } from "./icons";

type AppNavProps = {
  variant: "mobile" | "desktop";
};

export default function AppNav({ variant }: AppNavProps) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) return null;
  if (location.pathname === "/login" || location.pathname === "/register") return null;

  const className = variant === "mobile" ? "app-nav app-nav--mobile" : "app-nav app-nav--desktop";

  return (
    <nav className={className} aria-label="Main navigation">
      <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
        <HomeIcon />
        <span>Home</span>
      </NavLink>
      <NavLink to="/devices" className={({ isActive }) => (isActive ? "active" : "")}>
        <DevicesIcon />
        <span>Devices</span>
      </NavLink>
      {user?.role === "admin" && (
        <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
          <DevicesIcon />
          <span>Admin</span>
        </NavLink>
      )}
      <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
        <ProfileIcon />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}