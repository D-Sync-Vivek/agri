import { useEffect, useState } from "react";
import {
  adminListDevices,
  adminCreateDevice,
  adminUpdateDevice,
  adminDeleteDevice,
  adminAssignDevice,
  adminUnassignDevice,
  adminGetDevice,
  AdminDeviceResponse,
  AdminDeviceCreatePayload,
} from "../api/admin";

const emptyForm: AdminDeviceCreatePayload = {
  device_uid: "",
  device_name: "",
  description: "",
  frequency: 5,
  location_name: "",
  latitude: null,
  longitude: null,
};

export default function AdminDevices() {
  const [devices, setDevices] = useState<AdminDeviceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<AdminDeviceCreatePayload>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign panel state
  const [assignDeviceId, setAssignDeviceId] = useState<number | null>(null);
  const [assignUsers, setAssignUsers] = useState<any[]>([]);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState("viewer");

  function loadDevices() {
    setIsLoading(true);
    adminListDevices()
      .then(setDevices)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load devices"))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadDevices, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await adminCreateDevice(form);
      setShowCreate(false);
      setForm(emptyForm);
      loadDevices();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Create failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(deviceId: number) {
    if (!window.confirm("Delete this device? This cannot be undone.")) return;
    try {
      await adminDeleteDevice(deviceId);
      loadDevices();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Delete failed");
    }
  }

  async function openAssign(deviceId: number) {
    setAssignDeviceId(deviceId);
    setAssignUserId("");
    setAssignRole("viewer");
    try {
      const detail = await adminGetDevice(deviceId);
      setAssignUsers(detail.users || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not load assignments");
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignDeviceId || !assignUserId) return;
    try {
      await adminAssignDevice(assignDeviceId, parseInt(assignUserId, 10), assignRole);
      await openAssign(assignDeviceId);
      loadDevices();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Assign failed");
    }
  }

  async function handleUnassign(userId: number) {
    if (!assignDeviceId) return;
    try {
      await adminUnassignDevice(assignDeviceId, userId);
      await openAssign(assignDeviceId);
      loadDevices();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unassign failed");
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Admin</p>
          <h1 className="page-title">Device Management</h1>
        </div>
        <div className="flex-row">
          <button className="btn-secondary" onClick={loadDevices} disabled={isLoading}>
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + New Device
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {isLoading && <div className="loading-text">Loading devices…</div>}

      {!isLoading && devices.length === 0 && (
        <div className="empty-state panel">
          <h3>No devices found</h3>
        </div>
      )}

      {!isLoading && devices.length > 0 && (
        <div className="panel" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>UID</th>
                <th>Name</th>
                <th>Location</th>
                <th>Sensors</th>
                <th>Users</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td>{d.deviceUid}</td>
                  <td>{d.deviceName || "—"}</td>
                  <td>{d.locationName || "—"}</td>
                  <td>{d.sensorCount}</td>
                  <td>{d.users.length}</td>
                  <td>
                    <button className="btn-ghost" onClick={() => openAssign(d.id)}>
                      Assign
                    </button>
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

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <p className="section-title">New Device</p>
            <div className="field">
              <label>Device UID</label>
              <input
                required
                value={form.device_uid}
                onChange={(e) => setForm({ ...form, device_uid: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Name</label>
              <input
                value={form.device_name || ""}
                onChange={(e) => setForm({ ...form, device_name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Location</label>
              <input
                value={form.location_name || ""}
                onChange={(e) => setForm({ ...form, location_name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Reporting frequency (min)</label>
              <input
                type="number"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: parseInt(e.target.value, 10) || 60 })}
              />
            </div>
            <div className="flex-row" style={{ marginTop: 20 }}>
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <div className="spacer" />
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Modal */}
      {assignDeviceId !== null && (
        <div className="modal-backdrop" onClick={() => setAssignDeviceId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="section-title">Manage Assignments</p>

            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {assignUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.isOwner ? "owner" : u.role}</td>
                    <td>
                      <button className="btn-ghost" onClick={() => handleUnassign(u.id)} style={{ color: "var(--red)" }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {assignUsers.length === 0 && (
                  <tr>
                    <td colSpan={4}>No users assigned</td>
                  </tr>
                )}
              </tbody>
            </table>

            <form onSubmit={handleAssign}>
              <div className="field">
                <label>User ID to assign</label>
                <input value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} placeholder="e.g. 4" />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)}>
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="flex-row" style={{ marginTop: 20 }}>
                <button type="button" className="btn-secondary" onClick={() => setAssignDeviceId(null)}>
                  Close
                </button>
                <div className="spacer" />
                <button type="submit" className="btn-primary">
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}