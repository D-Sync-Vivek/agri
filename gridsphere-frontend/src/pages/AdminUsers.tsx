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
    <div className="container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Admin</p>
          <h1 className="page-title">User Management</h1>
        </div>
        <button className="btn-secondary" onClick={loadUsers} disabled={isLoading}>
          Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {isLoading && <div className="loading-text">Loading users…</div>}

      {!isLoading && users.length === 0 && (
        <div className="empty-state panel">
          <h3>No users found</h3>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="panel" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Devices</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`pill ${u.role === "admin" ? "on" : "off"}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`pill ${u.isActive ? "on" : "off"}`}>
                      {u.isActive ? "active" : "inactive"}
                    </span>
                  </td>
                  <td>{u.deviceCount}</td>
                  <td>
                    <button className="btn-ghost" onClick={() => startEdit(u)} disabled={u.id === currentUser?.id}>
                      Edit
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => handleDelete(u.id)}
                      disabled={u.id === currentUser?.id}
                      style={{ color: "var(--red)" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleUpdate}>
            <p className="section-title">Edit User</p>
            {error && <div className="error-banner">{error}</div>}

            <div className="field">
              <label>Name</label>
              <input
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={editForm.email || ""}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Role</label>
              <select
                value={editForm.role || "user"}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as "user" | "admin" })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={editForm.is_active ?? true}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                />{" "}
                Active
              </label>
            </div>

            <div className="flex-row" style={{ marginTop: 20 }}>
              <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </button>
              <div className="spacer" />
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}