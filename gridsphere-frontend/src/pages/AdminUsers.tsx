import { useEffect, useState } from "react";
import { adminListUsers, adminUpdateUser, adminDeleteUser, AdminUser, AdminUserUpdatePayload } from "../api/admin";
import { useAuth } from "../context/AuthContext";
import { Edit, Trash2, RefreshCw, UserPlus, Filter } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminUserUpdatePayload>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth();

  function loadUsers() {
    setIsLoading(true);
    adminListUsers()
      .then(setUsers)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load users"))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await adminUpdateUser(editingUser.id, editForm);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(userId: number) {
    if (!window.confirm("Are you sure you want to delete this user? This action is irreversible.")) return;
    try {
      await adminDeleteUser(userId);
      loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Delete failed");
    }
  }

  function startEdit(user: AdminUser) {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role as "user" | "admin",
      is_active: user.isActive,
    });
  }

  return (
    <main className="p-4 md:p-6 space-y-6 relative">
      {/* Background decoration (optional) */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-card relative">
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0 border border-brand-200 shadow-sm">
            <span className="material-symbols-outlined text-2xl fill">manage_accounts</span>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-1">User Management</h2>
            <p className="text-sm text-ink-dim max-w-2xl">
              Manage users and their access to the system. Assign roles, monitor status, and control device permissions.
            </p>
          </div>
        </div>
        <div className="relative z-10 shrink-0 flex gap-3">
          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-brand-700 font-semibold text-sm rounded-lg hover:bg-gray-50 transition shadow-sm hover:cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        {/* Table Actions Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            
            <span className="text-sm text-ink-dim hidden sm:inline-block">
              {users.length} User{users.length !== 1 ? "s" : ""} Total
            </span>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-xs font-semibold text-ink-dim uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="py-3 px-4 text-xs font-semibold text-ink-dim uppercase tracking-wider whitespace-nowrap">Email</th>
                <th className="py-3 px-4 text-xs font-semibold text-ink-dim uppercase tracking-wider whitespace-nowrap">Role</th>
                <th className="py-3 px-4 text-xs font-semibold text-ink-dim uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-ink-dim uppercase tracking-wider whitespace-nowrap">Devices</th>
                <th className="py-3 px-4 text-xs font-semibold text-ink-dim uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-dim">Loading users…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-dim">No users found.</td>
                </tr>
              ) : (
                users.map((user) => {
                  const isCurrentUser = user.id === currentUser?.id;
                  const isAdmin = user.role === "admin";

                  // Get initials for avatar
                  const initials = user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  // Avatar background color
                  const avatarBg = isAdmin ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-700";

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shadow-sm ring-2 ring-white ${avatarBg}`}>
                            {initials}
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-ink-dim">{user.email}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                            isAdmin
                              ? "bg-brand-50 text-brand-700 border border-brand-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="text-sm text-ink-dim">{user.isActive ? "Active" : "Inactive"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-ink-dim text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-ink-dim">devices</span>
                          {user.deviceCount}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(user)}
                            disabled={isCurrentUser}
                            className={`p-1.5 rounded-md text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors ${
                              isCurrentUser ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title={isCurrentUser ? "Cannot edit yourself" : "Edit User"}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={isCurrentUser}
                            className={`p-1.5 rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors ${
                              isCurrentUser ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title={isCurrentUser ? "Cannot delete yourself" : "Delete User"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <span className="text-sm text-ink-dim">
            Showing <span className="font-semibold text-gray-900">1</span> to{" "}
            <span className="font-semibold text-gray-900">{users.length}</span> of{" "}
            <span className="font-semibold text-gray-900">{users.length}</span> users
          </span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded-md text-ink-dim hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 transition-colors" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-md bg-brand-600 text-white text-sm font-medium shadow-sm flex items-center justify-center">
              1
            </button>
            <button className="p-1 rounded-md text-ink-dim hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 transition-colors" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal (reusing existing modal logic) */}
      {editingUser && (
        <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
          <form
            className="modal-card max-w-md"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleUpdate}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-4">Edit User</p>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Name</label>
                <input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Email</label>
                <input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Role</label>
                <select
                  value={editForm.role || "user"}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as "user" | "admin" })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_active ?? true}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 focus:ring-brand-600"
                />
                <label className="text-sm font-medium text-ink-dim">Active</label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}