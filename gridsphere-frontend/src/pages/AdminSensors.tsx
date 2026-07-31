import { useEffect, useState } from "react";
import { listSensorTypes, createSensorType, updateSensorType, deleteSensorType } from "../api/sensors";
import { SensorType } from "../types";
import { useAuth } from "../context/AuthContext";

type EditFormState = {
  name?: string;
  code?: string;
  unit?: string | null;
  data_type?: string;
  category?: string | null;
  min_value?: number | null;
  max_value?: number | null;
};

const emptyForm = {
  name: "",
  code: "",
  unit: "",
  data_type: "float",
  category: "",
  min_value: "",
  max_value: "",
};

export default function AdminSensors() {
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({});

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  function load() {
    setIsLoading(true);
    listSensorTypes()
      .then(setSensorTypes)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load sensor types"))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await createSensorType({
        name: form.name,
        code: form.code,
        unit: form.unit || null,
        data_type: form.data_type,
        category: form.category || null,
        min_value: form.min_value ? parseFloat(form.min_value) : null,
        max_value: form.max_value ? parseFloat(form.max_value) : null,
      });
      setShowCreate(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Create failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(id: number) {
    setError(null);
    try {
      await updateSensorType(id, {
        name: editForm.name,
        code: editForm.code,
        unit: editForm.unit || null,
        data_type: editForm.data_type,
        category: editForm.category || null,
        // Simplified – if undefined, send null; otherwise send the number (or null if already null)
        min_value: editForm.min_value === undefined ? null : editForm.min_value,
        max_value: editForm.max_value === undefined ? null : editForm.max_value,
      });
      setEditingId(null);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Update failed");
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this sensor type? It cannot be used by any device.")) return;
    setError(null);
    try {
      await deleteSensorType(id);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Delete failed");
    }
  }

  function startEdit(s: SensorType) {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      code: s.code,
      unit: s.unit || "",
      data_type: s.dataType || "float",
      category: s.category || "",
      min_value: s.minValue !== undefined && s.minValue !== null ? s.minValue : null,
      max_value: s.maxValue !== undefined && s.maxValue !== null ? s.maxValue : null,
    });
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <h3 className="text-lg font-bold mb-2">Admin access required</h3>
          <p className="text-ink-dim">You need admin privileges to manage sensor types.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
          <h1 className="text-2xl font-extrabold">Sensor Types</h1>
          <p className="text-sm text-ink-dim mt-1">
            Manage the master list of sensor types available for installation on devices.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition"
        >
          + New Sensor
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
      {isLoading && <div className="text-center text-ink-dim py-12">Loading sensor types…</div>}

      {!isLoading && sensorTypes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <h3 className="text-lg font-bold mb-2">No sensor types defined</h3>
          <p className="text-ink-dim">Create your first sensor type to make it available for device installation.</p>
        </div>
      )}

      {!isLoading && sensorTypes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Name</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Code</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Unit</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Category</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Data Type</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Min</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Max</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sensorTypes.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0">
                    {editingId === s.id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            value={editForm.name || ""}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={editForm.code || ""}
                            onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={editForm.unit || ""}
                            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={editForm.category || ""}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={editForm.data_type || "float"}
                            onChange={(e) => setEditForm({ ...editForm, data_type: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                          >
                            <option value="float">Float</option>
                            <option value="integer">Integer</option>
                            <option value="boolean">Boolean</option>
                            <option value="string">String</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="any"
                            value={editForm.min_value !== undefined && editForm.min_value !== null ? editForm.min_value : ""}
                            onChange={(e) => setEditForm({ ...editForm, min_value: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="any"
                            value={editForm.max_value !== undefined && editForm.max_value !== null ? editForm.max_value : ""}
                            onChange={(e) => setEditForm({ ...editForm, max_value: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                          />
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => handleUpdate(s.id)}
                            className="bg-brand-50 text-brand-700 font-semibold px-3 py-1 rounded-full text-xs hover:brightness-95 transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-transparent border border-gray-200 text-ink px-3 py-1 rounded-full text-xs hover:border-brand-600 transition"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-semibold">{s.name}</td>
                        <td className="px-4 py-3">
                          <code className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-xs font-mono">{s.code}</code>
                        </td>
                        <td className="px-4 py-3">{s.unit || "—"}</td>
                        <td className="px-4 py-3">{s.category || "—"}</td>
                        <td className="px-4 py-3">{s.dataType || "float"}</td>
                        <td className="px-4 py-3">{s.minValue !== undefined && s.minValue !== null ? s.minValue : "—"}</td>
                        <td className="px-4 py-3">{s.maxValue !== undefined && s.maxValue !== null ? s.maxValue : "—"}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => startEdit(s)}
                            className="bg-brand-50 text-brand-700 font-semibold px-3 py-1 rounded-full text-xs hover:brightness-95 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="bg-red-50 text-red-600 font-semibold px-3 py-1 rounded-full text-xs hover:brightness-95 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
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
          <form
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-4">New Sensor Type</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Name *</label>
                <input
                  required
                  placeholder="e.g. Temperature"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Code *</label>
                <input
                  required
                  placeholder="e.g. temp"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
                <p className="text-xs text-ink-dim mt-1">
                  Used as the query parameter in /readings/add. Use lowercase with underscores.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Unit</label>
                <input
                  placeholder="e.g. °C, %, hPa"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Data Type</label>
                <select
                  value={form.data_type}
                  onChange={(e) => setForm({ ...form, data_type: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                >
                  <option value="float">Float</option>
                  <option value="integer">Integer</option>
                  <option value="boolean">Boolean</option>
                  <option value="string">String</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Min Value</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. -40"
                  value={form.min_value}
                  onChange={(e) => setForm({ ...form, min_value: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Max Value</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 60"
                  value={form.max_value}
                  onChange={(e) => setForm({ ...form, max_value: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Category</label>
                <input
                  placeholder="e.g. weather, soil, air_quality"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition disabled:opacity-60"
              >
                {isSubmitting ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}