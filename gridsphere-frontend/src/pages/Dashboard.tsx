import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminListDevices, adminDeleteDevice, getAdminStats, SystemStats, AdminDeviceResponse } from "../api/admin";
import AddDeviceModal from "../components/AddDeviceModal";

export default function Dashboard() {
  const [devices, setDevices] = useState<AdminDeviceResponse[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  function loadData() {
    setIsLoading(true);
    setError(null);
    Promise.all([adminListDevices(), getAdminStats()])
      .then(([devicesData, statsData]) => {
        setDevices(devicesData);
        setStats(statsData);
      })
      .catch((err) => setError(err?.response?.data?.detail || "Could not load admin data"))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(deviceId: number) {
    if (!window.confirm("Are you sure you want to delete this device? All associated data will be removed.")) return;
    try {
      await adminDeleteDevice(deviceId);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Delete failed");
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Admin</p>
          <h1 className="page-title">Device Fleet</h1>
        </div>
        <div className="flex-row" style={{ gap: 10 }}>
          <Link to="/admin/users" className="btn-secondary" style={{ width: "auto" }}>
            Users
          </Link>
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => setShowAddModal(true)}>
            + Register device
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Stats Cards */}
      {stats && (
        <div className="readout-grid" style={{ marginBottom: 24 }}>
          <div className="readout-tile" style={{ cursor: "default" }}>
            <div className="readout-label">Total Devices</div>
            <div>
              <span className="readout-value">{stats.devices.total}</span>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>+{stats.devices.newLast24h} in 24h</div>
          </div>
          <div className="readout-tile" style={{ cursor: "default" }}>
            <div className="readout-label">Online</div>
            <div>
              <span className="readout-value">{stats.devices.online}</span>
            </div>
          </div>
          <div className="readout-tile" style={{ cursor: "default" }}>
            <div className="readout-label">Total Readings</div>
            <div>
              <span className="readout-value">{stats.readings.total.toLocaleString()}</span>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>{stats.readings.last24h} in 24h</div>
          </div>
          <div className="readout-tile" style={{ cursor: "default" }}>
            <div className="readout-label">Users</div>
            <div>
              <span className="readout-value">{stats.users.total}</span>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>{stats.users.active} active</div>
          </div>
        </div>
      )}

      {isLoading && <div className="loading-text">Loading devices…</div>}

      {!isLoading && devices.length === 0 && (
        <div className="empty-state panel">
          <h3>No devices registered</h3>
          <p>Register your first device to start collecting data.</p>
        </div>
      )}

      {!isLoading && devices.length > 0 && (
        <div className="panel" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>UID</th>
                <th>Name</th>
                <th>Location</th>
                <th>Status</th>
                <th>Users</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{d.deviceUid}</td>
                  <td>{d.deviceName || "—"}</td>
                  <td>{d.locationName || "—"}</td>
                  <td>
                    <span className={`pill ${d.status === "active" ? "on" : d.status === "inactive" ? "off" : "off"}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>{d.users.length}</td>
                  <td>
                    <Link to={`/devices/${d.id}`} className="btn-ghost">
                      View
                    </Link>
                    <button className="btn-ghost" onClick={() => handleDelete(d.id)} style={{ color: "var(--red)" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddDeviceModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            loadData();
          }}
          isAdmin
        />
      )}
    </div>
  );
}