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
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
          <h1 className="text-2xl font-extrabold">Device Fleet</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/users" className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition">Users</Link>
          <button onClick={() => setShowAddModal(true)} className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition">+ Register device</button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
            <div className="text-sm text-ink-dim font-medium">Total Devices</div>
            <div className="text-2xl font-extrabold">{stats.devices.total}</div>
            <div className="text-xs text-ink-dim">+{stats.devices.newLast24h} in 24h</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
            <div className="text-sm text-ink-dim font-medium">Online</div>
            <div className="text-2xl font-extrabold">{stats.devices.online}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
            <div className="text-sm text-ink-dim font-medium">Total Readings</div>
            <div className="text-2xl font-extrabold">{stats.readings.total.toLocaleString()}</div>
            <div className="text-xs text-ink-dim">{stats.readings.last24h} in 24h</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
            <div className="text-sm text-ink-dim font-medium">Users</div>
            <div className="text-2xl font-extrabold">{stats.users.total}</div>
            <div className="text-xs text-ink-dim">{stats.users.active} active</div>
          </div>
        </div>
      )}

      {isLoading && <div className="text-center text-ink-dim py-12">Loading devices…</div>}

      {!isLoading && devices.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <h3 className="text-lg font-bold mb-2">No devices registered</h3>
          <p className="text-ink-dim">Register your first device to start collecting data.</p>
        </div>
      )}

      {!isLoading && devices.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">ID</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">UID</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Name</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Location</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Status</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Users</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">{d.id}</td>
                    <td className="px-4 py-3">{d.deviceUid}</td>
                    <td className="px-4 py-3">{d.deviceName || "—"}</td>
                    <td className="px-4 py-3">{d.locationName || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${d.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{d.users.length}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <Link to={`/devices/${d.id}`} className="bg-brand-50 text-brand-700 font-semibold px-3 py-1 rounded-full text-xs hover:brightness-95 transition">View</Link>
                      <button onClick={() => handleDelete(d.id)} className="bg-red-50 text-red-600 font-semibold px-3 py-1 rounded-full text-xs hover:brightness-95 transition">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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