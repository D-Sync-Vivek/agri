import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminStats, SystemStats } from "../api/admin";

export default function AdminOverview() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load stats"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Admin</p>
          <h1 className="page-title">Overview</h1>
        </div>
        <div className="flex-row" style={{ gap: 10 }}>
          <Link className="btn-secondary" to="/admin/devices">
            Manage Devices
          </Link>
          <Link className="btn-secondary" to="/admin/users">
            Manage Users
          </Link>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {isLoading && <div className="loading-text">Loading stats…</div>}

      {stats && (
        <>
          {/* === Users === */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-dim)", marginBottom: 12 }}>
              Users
            </h2>
            <div className="readout-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Total</div>
                <div>
                  <span className="readout-value">{stats.users.total}</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Active</div>
                <div>
                  <span className="readout-value" style={{ color: "var(--brand-green-dark)" }}>
                    {stats.users.active}
                  </span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">New (24h)</div>
                <div>
                  <span className="readout-value">{stats.users.newLast24h}</span>
                </div>
              </div>
            </div>
          </div>

          {/* === Devices === */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-dim)", marginBottom: 12 }}>
              Devices
            </h2>
            <div className="readout-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Total</div>
                <div>
                  <span className="readout-value">{stats.devices.total}</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Online</div>
                <div>
                  <span className="readout-value" style={{ color: stats.devices.online > 0 ? "var(--brand-green-dark)" : "var(--red)" }}>
                    {stats.devices.online}
                  </span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">New (24h)</div>
                <div>
                  <span className="readout-value">{stats.devices.newLast24h}</span>
                </div>
              </div>
            </div>
          </div>

          {/* === Readings & Sensors === */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-dim)", marginBottom: 12 }}>
              Data & Sensors
            </h2>
            <div className="readout-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Total Readings</div>
                <div>
                  <span className="readout-value">{stats.readings.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Last 24h</div>
                <div>
                  <span className="readout-value">{stats.readings.last24h.toLocaleString()}</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Sensors Installed</div>
                <div>
                  <span className="readout-value">{stats.sensors.installed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* === Other === */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-dim)", marginBottom: 12 }}>
              System
            </h2>
            <div className="readout-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Crops</div>
                <div>
                  <span className="readout-value">{stats.crops}</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Subscriptions</div>
                <div>
                  <span className="readout-value">{stats.subscriptions}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}