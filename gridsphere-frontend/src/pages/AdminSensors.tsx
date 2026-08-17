import { useEffect, useState } from "react";
import { listSensorTypes, createSensorType, updateSensorType, deleteSensorType } from "../api/sensors";
import { SensorType } from "../types";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit, Trash2, X } from "lucide-react";

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

  // Helper to get Material Symbol icon name for a category
  const getCategoryIcon = (category?: string | null) => {
    const map: Record<string, string> = {
      weather: "cloud",
      soil: "grass",
      wind: "wind_power",
      air: "air",
      solar: "sunny",
      water: "water_drop",
    };
    return map[category?.toLowerCase() || ""] || "sensors";
  };

  // Helper to format min/max display
  const formatRange = (min?: number | null, max?: number | null) => {
    if (min === undefined && max === undefined) return "—";
    const parts = [];
    if (min !== undefined && min !== null) parts.push(min);
    if (max !== undefined && max !== null) parts.push(max);
    if (parts.length === 0) return "—";
    return parts.join(" — ");
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-ink-dim">
        <p className="text-lg font-bold">Admin access required</p>
        <p className="text-sm">You need admin privileges to manage sensor types.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 md:p-8 space-y-6 relative">
      {/* Decorative background */}
      <div className="absolute bottom-0 right-0 opacity-5 pointer-events-none w-96 h-96 bg-brand-600 rounded-tl-full mix-blend-multiply" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">sensors</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Sensor Types</h2>
          </div>
          <p className="text-sm text-ink-dim mt-1">
            Manage the master list of sensor types available for installation on devices.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex w-fit items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-bold text-sm hover:brightness-105 transition shadow-sm hover:cursor-pointer hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          New Sensor
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-ink-dim text-xs uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4 sm:px-6 font-semibold">Name</th>
                <th className="py-4 px-4 sm:px-6 font-semibold">Code</th>
                <th className="py-4 px-4 sm:px-6 font-semibold">Unit</th>
                <th className="py-4 px-4 sm:px-6 font-semibold">Category</th>
                <th className="py-4 px-4 sm:px-6 font-semibold">Data Type</th>
                <th className="py-4 px-4 sm:px-6 font-semibold">Min/Max</th>
                <th className="py-4 px-4 sm:px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-dim">Loading sensor types…</td>
                </tr>
              ) : sensorTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-dim">No sensor types defined yet.</td>
                </tr>
              ) : (
                sensorTypes.map((s) => {
                  const isEditing = editingId === s.id;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                      {isEditing ? (
                        // Edit mode row
                        <>
                          <td className="py-3 px-4 sm:px-6">
                            <input
                              value={editForm.name || ""}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                            />
                          </td>
                          <td className="py-3 px-4 sm:px-6">
                            <input
                              value={editForm.code || ""}
                              onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                            />
                          </td>
                          <td className="py-3 px-4 sm:px-6">
                            <input
                              value={editForm.unit || ""}
                              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                            />
                          </td>
                          <td className="py-3 px-4 sm:px-6">
                            <input
                              value={editForm.category || ""}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                            />
                          </td>
                          <td className="py-3 px-4 sm:px-6">
                            <select
                              value={editForm.data_type || "float"}
                              onChange={(e) => setEditForm({ ...editForm, data_type: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                            >
                              <option value="float">Float</option>
                              <option value="integer">Integer</option>
                              <option value="boolean">Boolean</option>
                              <option value="string">String</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 sm:px-6">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="any"
                                value={editForm.min_value !== undefined && editForm.min_value !== null ? editForm.min_value : ""}
                                onChange={(e) => setEditForm({ ...editForm, min_value: e.target.value ? parseFloat(e.target.value) : null })}
                                placeholder="min"
                                className="w-16 bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-600"
                              />
                              <span className="text-ink-dim">—</span>
                              <input
                                type="number"
                                step="any"
                                value={editForm.max_value !== undefined && editForm.max_value !== null ? editForm.max_value : ""}
                                onChange={(e) => setEditForm({ ...editForm, max_value: e.target.value ? parseFloat(e.target.value) : null })}
                                placeholder="max"
                                className="w-16 bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-600"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdate(s.id)}
                                className="px-3 py-1 bg-brand-600 text-white rounded text-xs font-bold hover:brightness-105 transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-bold hover:bg-gray-300 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // View mode row
                        <>
                          <td className="py-3 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center text-gray-500 border border-gray-100">
                                <span className="material-symbols-outlined text-[18px]">
                                  {getCategoryIcon(s.category)}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">{s.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 sm:px-6">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-brand-50 text-brand-700 font-mono text-xs border border-brand-200">
                              {s.code}
                            </span>
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-ink-dim">{s.unit || "—"}</td>
                          <td className="py-3 px-4 sm:px-6">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                              {s.category || "Uncategorized"}
                            </span>
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-ink-dim">{s.dataType || "float"}</td>
                          <td className="py-3 px-4 sm:px-6 text-ink-dim">
                            {formatRange(s.minValue, s.maxValue)}
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">  
                              <button
                                onClick={() => startEdit(s)}
                                className="p-1.5 text-brand-700 bg-brand-50 rounded hover:bg-brand-100 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(s.id)}
                                className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (static) */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-ink-dim">
          <span>
            Showing <span className="font-medium text-gray-900">{sensorTypes.length}</span> of{" "}
            <span className="font-medium text-gray-900">{sensorTypes.length}</span> entries
          </span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 border border-gray-300 rounded text-gray-400 cursor-not-allowed" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 border border-brand-600 bg-brand-600 text-white rounded font-medium">1</button>
            <button className="px-3 py-1.5 border border-gray-300 text-ink-dim hover:bg-gray-50 rounded">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <form
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-dim">New Sensor Type</p>
              <button type="button" onClick={() => setShowCreate(false)} className="text-ink-dim hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

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
    </main>
  );
}

