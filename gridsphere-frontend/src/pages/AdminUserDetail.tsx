import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminGetUser } from "../api/admin";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { AdminUserDetail } from "../types";


export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    adminGetUser(parseInt(userId, 10))
      .then(setUser)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load user details"))
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-ink-dim py-12">Loading user details…</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error || "User not found"}
        </div>
        <Link to="/admin/users" className="inline-block mt-4 text-brand-600 font-semibold hover:underline">
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <Link to="/admin/users" className="text-sm text-ink-dim hover:text-brand-600 transition flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Link>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{user.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-ink-dim">{user.email}</span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{user.role}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {user.phone && <p className="text-sm text-ink-dim mt-1">📞 {user.phone}</p>}
            {user.companyName && <p className="text-sm text-ink-dim">🏢 {user.companyName}</p>}
            <p className="text-xs text-ink-dim mt-1">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">Devices ({user.devices.length})</h2>
        </div>
        {user.devices.length === 0 ? (
          <div className="p-5 text-ink-dim">This user has no devices assigned.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Device</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Role</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Sensors</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Status</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Subscription</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Expires</th>
                </tr>
              </thead>
              <tbody>
                {user.devices.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/devices/${d.id}`} className="text-brand-600 hover:underline">
                        {d.deviceName || d.deviceUid}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${d.isOwner ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-ink-dim'}`}>
                        {d.isOwner ? "Owner" : d.role || "Viewer"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{d.sensorCount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${
                        d.status === "active" ? 'bg-green-50 text-green-700' : 
                        d.status === "offline" ? 'bg-amber-50 text-amber-700' : 
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.subscription ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 text-xs font-bold px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {d.subscription.planName || "Active"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 text-xs font-bold px-2 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> None
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-dim">
                      {d.subscription?.endDate ? new Date(d.subscription.endDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}