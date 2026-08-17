import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  adminListDevices,
  adminDeleteDevice,
  getAdminStats,
  SystemStats,
  AdminDeviceResponse,
} from "../api/admin";
import AddDeviceModal from "../components/AddDeviceModal";
import {
  Router,
  Wifi,
  BarChart3,
  Users,
  Plus,
  Eye,
  Trash2,
  ArrowUp,
  Filter,
  Leaf,
} from "lucide-react";

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
      .catch((err) =>
        setError(err?.response?.data?.detail || "Could not load admin data")
      )
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(deviceId: number) {
    if (!window.confirm("Delete this device? This cannot be undone.")) return;
    try {
      await adminDeleteDevice(deviceId);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Delete failed");
    }
  }

  const formatLastSeen = (dateStr?: string | null) => {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 relative">
      {/* Decorative background blobs */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-100/30 rounded-tl-full -z-10 blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-50/30 rounded-tr-full -z-10 blur-3xl opacity-50" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Device Fleet
          </h2>
          <p className="text-sm text-ink-dim mt-1">
            Manage and monitor all your field devices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-brand-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition shadow-sm h-10"
          >
            <Users className="w-4 h-4" />
            Users
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-105 transition shadow-sm h-10 hover:cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register Device
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {!isLoading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Router className="w-6 h-6" />}
            label="Total Devices"
            value={stats.devices.total}
            trend={`${stats.devices.newLast24h} in 24h`}
            trendUp
            iconBg="bg-brand-100"
          />
          <SummaryCard
            icon={<Wifi className="w-6 h-6" />}
            label="Online Devices"
            value={stats.devices.online}
            trend={`${Math.round((stats.devices.online / (stats.devices.total || 1)) * 100)}% online`}
            iconBg="bg-green-100"
            valueClassName="text-green-700"
          />
          <SummaryCard
            icon={<BarChart3 className="w-6 h-6" />}
            label="Total Readings"
            value={stats.readings.total.toLocaleString()}
            trend={`${stats.readings.last24h.toLocaleString()} in 24h`}
            trendUp
            iconBg="bg-blue-100"
          />
          <SummaryCard
            icon={<Users className="w-6 h-6" />}
            label="Total Users"
            value={stats.users.total}
            trend={`${stats.users.active} active`}
            iconBg="bg-purple-100"
          />
        </div>
      )}

      {/* Device Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-gray-900">Device List</h3>
          </div>
          <button className="text-ink-dim hover:text-brand-600 transition">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-ink-dim">Loading devices…</div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 text-ink-dim">
            No devices registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-ink-dim text-xs uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 sm:px-6 font-semibold">ID</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold">UID</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold">Name</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold">Location</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold">Status</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold text-center">Users</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold">Last Seen</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {devices.map((device) => {
                  const isOnline = device.status === "active";
                  return (
                    <tr
                      key={device.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="py-4 px-4 sm:px-6 text-ink-dim">{device.id}</td>
                      <td className="py-4 px-4 sm:px-6 font-medium">{device.deviceUid}</td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <Router className="w-4 h-4 text-ink-dim" />
                          </div>
                          {device.deviceName || device.deviceUid}
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-ink-dim">
                        {device.locationName || "—"}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isOnline
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-600" : "bg-red-600"
                              }`}
                          />
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center">
                        {device.users?.length ?? 0}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-ink-dim">
                        {formatLastSeen(device.lastSeenAt)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/devices/${device.id}`}
                            className="p-1.5 text-ink-dim hover:text-brand-600 rounded-md hover:bg-gray-100 transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          
                          <button
                            onClick={() => handleDelete(device.id)}
                            className="p-1.5 text-ink-dim hover:text-red-600 rounded-md hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-ink-dim">
          <span>Showing 1 to {devices.length} of {devices.length} entries</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded border border-gray-300 text-gray-400 cursor-not-allowed">
              Previous
            </button>
            <button className="px-3 py-1 rounded bg-brand-600 text-white">1</button>
            <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Device Modal */}
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
    </main>
  );
}

// Helper component for summary cards
function SummaryCard({
  icon,
  label,
  value,
  trend,
  trendUp = false,
  iconBg = "bg-brand-100",
  valueClassName = "text-gray-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend: string;
  trendUp?: boolean;
  iconBg?: string;
  valueClassName?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-card border border-gray-200 hover:border-brand-300 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center text-brand-700`}>
          {icon}
        </div>
        <span className="flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md">
          {trendUp && <ArrowUp className="w-3 h-3 mr-1" />}
          {trend}
        </span>
      </div>
      <p className="text-sm text-ink-dim mb-1">{label}</p>
      <p className={`text-3xl font-extrabold ${valueClassName}`}>{value}</p>
    </div>
  );
}

