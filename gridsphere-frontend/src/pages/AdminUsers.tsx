import { useEffect, useState } from "react";
import { adminListUsers, adminUpdateUser, adminDeleteUser, AdminUser, AdminUserUpdatePayload } from "../api/admin";
import { useAuth } from "../context/AuthContext";

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
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
          <h1 className="text-2xl font-extrabold">User Management</h1>
        </div>
        <button onClick={loadUsers} disabled={isLoading} className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition disabled:opacity-60">
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {isLoading && <div className="text-center text-ink-dim py-12">Loading users…</div>}

      {!isLoading && users.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <h3 className="text-lg font-bold mb-2">No users found</h3>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Name</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Email</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Role</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Active</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Devices</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-ink-dim'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${u.isActive ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'}`}>
                        {u.isActive ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.deviceCount}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => startEdit(u)} disabled={u.id === currentUser?.id} className="bg-brand-50 text-brand-700 font-semibold px-3 py-1 rounded-full text-xs hover:brightness-95 transition disabled:opacity-50">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(u.id)} disabled={u.id === currentUser?.id} className="bg-red-50 text-red-600 font-semibold px-3 py-1 rounded-full text-xs hover:brightness-95 transition disabled:opacity-50">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleUpdate}>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-4">Edit User</p>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

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
              <button type="button" onClick={() => setEditingUser(null)} className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition disabled:opacity-60">
                {isSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}