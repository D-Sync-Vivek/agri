import { useEffect, useState } from "react";
import {
  adminListDevices,
  adminCreateDevice,
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
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
          <h1 className="text-2xl font-extrabold">Device Management</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={loadDevices} disabled={isLoading} className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition disabled:opacity-60">
            Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition">
            + New Device
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
      {isLoading && <div className="text-center text-ink-dim py-12">Loading devices…</div>}

      {!isLoading && devices.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <h3 className="text-lg font-bold mb-2">No devices found</h3>
        </div>
      )}

      {!isLoading && devices.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">UID</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Name</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Location</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Sensors</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Users</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">{d.deviceUid}</td>
                    <td className="px-4 py-3">{d.deviceName || "—"}</td>
                    <td className="px-4 py-3">{d.locationName || "—"}</td>
                    <td className="px-4 py-3">{d.sensorCount}</td>
                    <td className="px-4 py-3">{d.users.length}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => openAssign(d.id)} className="bg-brand-50 text-brand-700 font-semibold px-3 py-1 rounded-full text-xs hover:brightness-95 transition">Assign</button>
                      <button onClick={() => handleDelete(d.id)} className="bg-red-50 text-red-600 font-semibold px-3 py-1 rounded-full text-xs hover:brightness-95 transition">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-4">New Device</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Device UID</label>
                <input
                  required
                  value={form.device_uid}
                  onChange={(e) => setForm({ ...form, device_uid: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Name</label>
                <input
                  value={form.device_name || ""}
                  onChange={(e) => setForm({ ...form, device_name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Location</label>
                <input
                  value={form.location_name || ""}
                  onChange={(e) => setForm({ ...form, location_name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Reporting frequency (min)</label>
                <input
                  type="number"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: parseInt(e.target.value, 10) || 60 })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowCreate(false)} className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition disabled:opacity-60">
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
            <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-4">Manage Assignments</p>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-2 py-2">Name</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-2 py-2">Email</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-2 py-2">Role</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {assignUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-2 py-2">{u.name}</td>
                      <td className="px-2 py-2">{u.email}</td>
                      <td className="px-2 py-2">{u.isOwner ? "owner" : u.role}</td>
                      <td className="px-2 py-2">
                        <button onClick={() => handleUnassign(u.id)} className="text-red-600 text-xs font-semibold hover:underline">Remove</button>
                      </td>
                    </tr>
                  ))}
                  {assignUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-ink-dim text-center py-2">No users assigned</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <form onSubmit={handleAssign}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">User ID to assign</label>
                <input
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  placeholder="e.g. 4"
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Role</label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setAssignDeviceId(null)} className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition">Close</button>
                <button type="submit" className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}