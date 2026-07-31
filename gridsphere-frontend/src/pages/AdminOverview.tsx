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
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
          <h1 className="text-2xl font-extrabold">Overview</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/devices" className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition">Manage Devices</Link>
          <Link to="/admin/users" className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition">Manage Users</Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
      {isLoading && <div className="text-center text-ink-dim py-12">Loading stats…</div>}

      {stats && (
        <>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-ink-dim mb-3">Users</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Total</div>
                <div className="text-2xl font-extrabold">{stats.users.total}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Active</div>
                <div className="text-2xl font-extrabold text-brand-600">{stats.users.active}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">New (24h)</div>
                <div className="text-2xl font-extrabold">{stats.users.newLast24h}</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold text-ink-dim mb-3">Devices</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Total</div>
                <div className="text-2xl font-extrabold">{stats.devices.total}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Online</div>
                <div className={`text-2xl font-extrabold ${stats.devices.online > 0 ? 'text-brand-600' : 'text-red-600'}`}>{stats.devices.online}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">New (24h)</div>
                <div className="text-2xl font-extrabold">{stats.devices.newLast24h}</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold text-ink-dim mb-3">Data & Sensors</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Total Readings</div>
                <div className="text-2xl font-extrabold">{stats.readings.total.toLocaleString()}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Last 24h</div>
                <div className="text-2xl font-extrabold">{stats.readings.last24h.toLocaleString()}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Sensors Installed</div>
                <div className="text-2xl font-extrabold">{stats.sensors.installed}</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-ink-dim mb-3">System</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Crops</div>
                <div className="text-2xl font-extrabold">{stats.crops}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Subscriptions</div>
                <div className="text-2xl font-extrabold">{stats.subscriptions}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}