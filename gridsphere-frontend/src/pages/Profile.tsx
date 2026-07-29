import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchCurrentUser } from "../api/auth";
import { User } from "../types";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser()
      .then(setProfile)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load profile"));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Account</p>
          <h1 className="page-title">Profile</h1>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <span className="panel-title">Account details</span>
          <span className="role-badge">{profile?.role || user?.role || "user"}</span>
        </div>
        <div className="panel-body">
          <div className="info-grid">
            <div>
              <div className="info-item-label">Name</div>
              <div className="info-item-value">{profile?.name || user?.name}</div>
            </div>
            <div>
              <div className="info-item-label">Email</div>
              <div className="info-item-value">{profile?.email || user?.email}</div>
            </div>
            {profile?.phone && (
              <div>
                <div className="info-item-label">Phone</div>
                <div className="info-item-value">{profile.phone}</div>
              </div>
            )}
            {profile?.company_name && (
              <div>
                <div className="info-item-label">Company</div>
                <div className="info-item-value">{profile.company_name}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <button className="btn-secondary" onClick={handleLogout}>
        Sign out
      </button>

      <Link to="/plans" style={{ display: "block", marginTop: 16, fontSize: 13, color: "var(--brand-green)", fontWeight: 600, textDecoration: "none" }}>
        View subscription plans →
      </Link>
    </div>
  );
}


