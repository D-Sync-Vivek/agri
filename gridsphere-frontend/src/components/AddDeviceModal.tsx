import { FormEvent, useState, useEffect } from "react";
import { createDevice, DeviceCreatePayload } from "../api/devices";
import { adminCreateDevice, adminListUsers } from "../api/admin";
import { AdminUser } from "../types";
import { useAuth } from "../context/AuthContext";

interface Props {
  onClose: () => void;
  onCreated: () => void;
  isAdmin?: boolean;
}

export default function AddDeviceModal({ onClose, onCreated, isAdmin = false }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<DeviceCreatePayload & { assign_to_user_id?: number | null }>({
    device_uid: "",
    device_name: "",
    location_name: "",
    frequency: 60,
    assign_to_user_id: null,
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      adminListUsers()
        .then(setUsers)
        .catch(() => {});
    }
  }, [isAdmin]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await adminCreateDevice(form);
      } else {
        await createDevice(form);
      }
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not register device");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-4">Register Device {isAdmin ? "(Admin)" : ""}</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-dim mb-1.5">Device UID *</label>
            <input
              required
              placeholder="esp32-001"
              value={form.device_uid}
              onChange={(e) => setForm({ ...form, device_uid: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-dim mb-1.5">Display name</label>
            <input
              placeholder="North Field Hub"
              value={form.device_name}
              onChange={(e) => setForm({ ...form, device_name: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-dim mb-1.5">Location name</label>
            <input
              placeholder="North Field"
              value={form.location_name}
              onChange={(e) => setForm({ ...form, location_name: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-dim mb-1.5">Reporting frequency (minutes)</label>
            <input
              type="number"
              min={1}
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: parseInt(e.target.value, 10) || 5 })}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
            />
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-ink-dim mb-1.5">Assign to user (optional)</label>
              <select
                value={form.assign_to_user_id || ""}
                onChange={(e) => setForm({ ...form, assign_to_user_id: e.target.value ? parseInt(e.target.value, 10) : null })}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
              >
                <option value="">— None —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition disabled:opacity-60">
            {isSubmitting ? "Registering…" : "Register device"}
          </button>
        </div>
      </form>
    </div>
  );
}

