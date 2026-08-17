import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand">
          <span className="brand-dot" />
          GRIDSPHERE
          <span className="brand-sub">station console</span>
        </Link>

        {token && (
          <nav className="topbar-nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
              Devices
            </NavLink>
            <NavLink to="/plans" className={({ isActive }) => (isActive ? "active" : "")}>
              Plans
            </NavLink>
            <span className="muted">{user?.name}</span>
            <button className="btn-ghost" onClick={handleLogout}>
              Sign out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}


