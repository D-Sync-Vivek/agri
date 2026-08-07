import { useEffect, useMemo, useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getDeviceHistory,
  HistoryRange,
  deleteDeviceReadings,
  downloadHistoryCsv,
  deleteReadingsByIds,
} from "../api/devices";
import { listDeviceSensors, listSensorTypes, updateDeviceSensor } from "../api/sensors";
import { DeviceSensor, SensorReading, SensorType } from "../types";
import { getMetricMeta, formatMetricValue, getLocalISOStringWithOffset, toDatetimeLocalValue } from "../utils/metrics";
import AddSensorModal from "../components/AddSensorModal";
import {
  adminGetDevice,
  adminUpdateDevice,
  adminListDeviceAssignments,
  adminAssignDevice,
  adminUnassignDevice,
  DeviceAssignment,
  adminListUsers,
  AdminUser,
} from "../api/admin";

type Tab = "info" | "history" | "sensors" | "access";

const LINE_COLORS = ["#1F6E44", "#E0932E", "#2F86C9", "#D64545", "#9b7fc7"];

function getReadingStatus(sensorLabel: string, value: number): { label: string; className: string } {
  const label = sensorLabel.toLowerCase();
  const optimal = { label: "Optimal", className: "bg-brand-50 text-brand-700" };
  const warning = { label: "Warning", className: "bg-amber-100 text-amber-800" };
  const stable = { label: "Stable", className: "bg-gray-100 text-ink-dim" };

  if (label.includes("humidity") && (value < 30 || value > 80)) return warning;
  if (label.includes("leaf_wetness") && value > 60) return warning;
  if (label.includes("soil_moisture") && (value < 15 || value > 70)) return warning;
  if (["wind_direction", "atmospheric_pressure"].some((k) => label.includes(k))) return stable;
  return optimal;
}

function formatErrorDetail(detail: any): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((err: any) => err.message || JSON.stringify(err)).join(", ");
  }
  return String(detail);
}

export default function DeviceDetail() {
  const { deviceId } = useParams();
  const id = parseInt(deviceId || "0", 10);

  const [tab, setTab] = useState<Tab>("info");
  const [sensors, setSensors] = useState<DeviceSensor[]>([]);
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>([]);
  const [historyReadings, setHistoryReadings] = useState<SensorReading[]>([]);
  const [range, setRange] = useState<HistoryRange>("weekly");
  const [showAddSensor, setShowAddSensor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [isCustomRange, setIsCustomRange] = useState<boolean>(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFrom, setDeleteFrom] = useState<string>("");
  const [deleteTo, setDeleteTo] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  // New: selection state – store a Set of reading IDs (all IDs from selected rows)
  const [selectedReadingIds, setSelectedReadingIds] = useState<Set<number>>(new Set());
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isConfirmDeleting, setIsConfirmDeleting] = useState(false);

  const [device, setDevice] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const [assignments, setAssignments] = useState<DeviceAssignment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  function loadDevice() {
    adminGetDevice(id)
      .then((data) => {
        setDevice(data);
        setEditForm(data);
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail || "Could not load device";
        if (err.response?.status === 404) {
          setError("Device not found or you don't have permission to view it.");
        } else {
          setError(formatErrorDetail(detail));
        }
      });
  }

  function loadAssignments() {
    adminListDeviceAssignments(id)
      .then(setAssignments)
      .catch((err) =>
        setError(formatErrorDetail(err?.response?.data?.detail || "Could not load access list"))
      );
  }

  function loadUsers() {
    adminListUsers()
      .then(setUsers)
      .catch(() => {});
  }

  async function loadSensors() {
    try {
      const [deviceSensors, types] = await Promise.all([
        listDeviceSensors(id),
        listSensorTypes(),
      ]);
      setSensors(deviceSensors);
      setSensorTypes(types);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Sensors not available for this device.");
      } else {
        setError(formatErrorDetail(err?.response?.data?.detail || "Could not load device data"));
      }
    }
  }

  useEffect(() => {
    loadDevice();
    loadSensors();
    loadUsers();
  }, [id]);

  const fetchHistory = (rangeType: HistoryRange, from?: string, to?: string) => {
    if (tab !== "history") return;
    getDeviceHistory(id, rangeType, from, to)
      .then(setHistoryReadings)
      .catch((err) =>
        setError(formatErrorDetail(err?.response?.data?.detail || "Could not load history"))
      );
  };

  useEffect(() => {
    if (tab === "history") {
      if (isCustomRange && customFrom && customTo) {
        const fromISO = getLocalISOStringWithOffset(customFrom);
        const toISO = getLocalISOStringWithOffset(customTo);
        fetchHistory("custom", fromISO, toISO);
      } else {
        fetchHistory(range);
      }
    }
  }, [tab, range, id, isCustomRange, customFrom, customTo]);

  const applyCustomRange = () => {
    if (!customFrom || !customTo) {
      setError("Please select both start and end date/time.");
      return;
    }
    const fromDate = new Date(customFrom);
    const toDate = new Date(customTo);
    if (fromDate > toDate) {
      setError("Start date must be before end date.");
      return;
    }
    setError(null);
    setIsCustomRange(true);
    const fromISO = getLocalISOStringWithOffset(customFrom);
    const toISO = getLocalISOStringWithOffset(customTo);
    fetchHistory("custom", fromISO, toISO);
  };

  const clearCustomRange = () => {
    setIsCustomRange(false);
    setCustomFrom("");
    setCustomTo("");
    setRange("weekly");
    fetchHistory("weekly");
  };

  const openDeleteModal = () => {
    if (isCustomRange && customFrom && customTo) {
      setDeleteFrom(customFrom);
      setDeleteTo(customTo);
    } else {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      setDeleteFrom(toDatetimeLocalValue(twentyFourHoursAgo));
      setDeleteTo(toDatetimeLocalValue(now));
    }
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteFrom || !deleteTo) {
      setError("Please select both start and end date/time for deletion.");
      return;
    }
    const fromDate = new Date(deleteFrom);
    const toDate = new Date(deleteTo);
    if (fromDate > toDate) {
      setError("Start date must be before end date.");
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      const fromISO = getLocalISOStringWithOffset(deleteFrom);
      const toISO = getLocalISOStringWithOffset(deleteTo);
      const result = await deleteDeviceReadings(id, fromISO, toISO);
      if (isCustomRange && customFrom && customTo) {
        const fISO = getLocalISOStringWithOffset(customFrom);
        const tISO = getLocalISOStringWithOffset(customTo);
        fetchHistory("custom", fISO, tISO);
      } else {
        fetchHistory(range);
      }
      setShowDeleteModal(false);
      alert(result.message);
    } catch (err: any) {
      setError(formatErrorDetail(err?.response?.data?.detail || "Could not delete readings"));
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (tab !== "access") return;
    loadAssignments();
  }, [tab, id]);

  async function handleUpdateDevice(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        device_uid: editForm.deviceUid,
        device_name: editForm.deviceName,
        description: editForm.description,
        frequency: editForm.frequency,
        location_name: editForm.locationName,
        latitude: editForm.latitude,
        longitude: editForm.longitude,
      };
      await adminUpdateDevice(id, payload);
      setIsEditing(false);
      loadDevice();
    } catch (err: any) {
      setError(formatErrorDetail(err?.response?.data?.detail || "Update failed"));
    }
  }

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    if (selectedUserId === "") return;
    setIsAssigning(true);
    setAssignMessage(null);
    setError(null);
    try {
      await adminAssignDevice(id, selectedUserId);
      setAssignMessage("Access granted successfully");
      setSelectedUserId("");
      loadAssignments();
    } catch (err: any) {
      setError(formatErrorDetail(err?.response?.data?.detail || "Could not grant access"));
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleUnassign(userId: number) {
    setError(null);
    try {
      await adminUnassignDevice(id, userId);
      loadAssignments();
    } catch (err: any) {
      setError(formatErrorDetail(err?.response?.data?.detail || "Could not revoke access"));
    }
  }

  const sensorLabelById = useMemo(() => {
    const map = new Map<number, DeviceSensor>();
    sensors.forEach((s) => map.set(s.id, s));
    return map;
  }, [sensors]);

  const latestBySensor = useMemo(() => {
    const map = new Map<number, SensorReading>();
    for (const r of historyReadings) {
      const existing = map.get(r.deviceSensorId);
      if (!existing || new Date(r.recordedAt) > new Date(existing.recordedAt)) {
        map.set(r.deviceSensorId, r);
      }
    }
    return map;
  }, [historyReadings]);

  const latestReadingTime = useMemo(() => {
    let latest: Date | null = null;
    for (const r of latestBySensor.values()) {
      const t = new Date(r.recordedAt);
      if (!latest || t > latest) latest = t;
    }
    return latest;
  }, [latestBySensor]);

  const chartData = useMemo(() => {
    const byTime = new Map<string, Record<string, number | string>>();
    for (const r of historyReadings) {
      const sensor = sensorLabelById.get(r.deviceSensorId);
      const label = sensor?.sensorLabel || `sensor_${r.deviceSensorId}`;
      const t = new Date(r.recordedAt).toLocaleString();
      if (!byTime.has(t)) byTime.set(t, { time: t });
      byTime.get(t)![label] = r.value;
    }
    return Array.from(byTime.values()).sort(
      (a, b) => new Date(a.time as string).getTime() - new Date(b.time as string).getTime()
    );
  }, [historyReadings, sensorLabelById]);

  const chartLabels = useMemo(() => {
    const labels = new Set<string>();
    sensors.forEach((s) => labels.add(s.sensorLabel));
    return Array.from(labels);
  }, [sensors]);

  // Compute logRows – each row now has an array of all reading IDs
  const logRows = useMemo(() => {
    const byTime = new Map<
      string,
      {
        time: string;
        readingIds: number[];
        deviceId: number;
        quality: string;
        values: Record<string, number>;
      }
    >();
    for (const r of historyReadings) {
      const sensor = sensorLabelById.get(r.deviceSensorId);
      const label = sensor?.sensorLabel || `sensor_${r.deviceSensorId}`;
      const t = r.recordedAt;
      if (!byTime.has(t)) {
        byTime.set(t, { time: t, readingIds: [], deviceId: id, quality: "ok", values: {} });
      }
      const row = byTime.get(t)!;
      row.readingIds.push(r.id);
      row.values[label] = r.value;
      if (r.qualityFlag && r.qualityFlag.toLowerCase() !== "ok") row.quality = r.qualityFlag;
    }
    return Array.from(byTime.values()).sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }, [historyReadings, sensorLabelById, id]);

  const [hiddenLabels, setHiddenLabels] = useState<Set<string>>(new Set());

  function toggleLabelVisibility(label: string) {
    setHiddenLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  async function toggleSensorActive(sensor: DeviceSensor) {
    try {
      await updateDeviceSensor(sensor.id, { is_active: !sensor.isActive });
      loadSensors();
    } catch (err: any) {
      setError(formatErrorDetail(err?.response?.data?.detail || "Could not update sensor"));
    }
  }

  // --- Row‑level selection handlers ---
  function toggleSelectRow(row: typeof logRows[0]) {
    const allIds = row.readingIds;
    const isSelected = allIds.every((id) => selectedReadingIds.has(id));
    setSelectedReadingIds((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleSelectAll(rows: typeof logRows) {
    const allIds = rows.flatMap((r) => r.readingIds);
    const allSelected = allIds.every((id) => selectedReadingIds.has(id));
    setSelectedReadingIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function openDeleteSelectedModal() {
    if (selectedReadingIds.size === 0) return;
    setDeleteConfirmationText("");
    setShowConfirmDeleteModal(true);
  }

  async function handleConfirmDelete() {
    if (deleteConfirmationText.toLowerCase() !== "delete") return;
    setIsConfirmDeleting(true);
    setError(null);
    try {
      const result = await deleteReadingsByIds(id, Array.from(selectedReadingIds));
      setSelectedReadingIds(new Set());
      setShowConfirmDeleteModal(false);
      // Refresh history
      if (isCustomRange && customFrom && customTo) {
        const fromISO = getLocalISOStringWithOffset(customFrom);
        const toISO = getLocalISOStringWithOffset(customTo);
        fetchHistory("custom", fromISO, toISO);
      } else {
        fetchHistory(range);
      }
      alert(result.message);
    } catch (err: any) {
      setError(formatErrorDetail(err?.response?.data?.detail || "Could not delete readings"));
    } finally {
      setIsConfirmDeleting(false);
    }
  }

  // Count selected rows (rows where all its reading IDs are selected)
  const selectedRowCount = logRows.filter((row) =>
    row.readingIds.every((id) => selectedReadingIds.has(id))
  ).length;

  if (!device) return <div className="text-center text-ink-dim py-12">Loading device…</div>;

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">
            <Link to="/devices" className="text-ink-dim hover:text-brand-600 transition">← All devices</Link>
          </p>
          <h1 className="text-2xl font-extrabold">Device #{id}</h1>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition">Edit</button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <div className="flex gap-1 mb-4 bg-brand-50 rounded-full p-1 overflow-x-auto">
        {["info", "history", "sensors", "access"].map((t) => (
          <button
            key={t}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition ${
              tab === t ? 'bg-brand-600 text-white' : 'text-brand-700 hover:bg-brand-100'
            }`}
            onClick={() => setTab(t as Tab)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Info tab – unchanged */}
      {tab === "info" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Device Information</span>
          </div>
          <div className="p-5">
            {isEditing ? (
              <form onSubmit={handleUpdateDevice}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-dim mb-1.5">Device UID</label>
                    <input
                      value={editForm.deviceUid || ""}
                      onChange={(e) => setEditForm({ ...editForm, deviceUid: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-dim mb-1.5">Device Name</label>
                    <input
                      value={editForm.deviceName || ""}
                      onChange={(e) => setEditForm({ ...editForm, deviceName: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-dim mb-1.5">Description</label>
                    <input
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-dim mb-1.5">Location Name</label>
                    <input
                      value={editForm.locationName || ""}
                      onChange={(e) => setEditForm({ ...editForm, locationName: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-dim mb-1.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editForm.latitude ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-dim mb-1.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editForm.longitude ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-dim mb-1.5">Frequency (minutes)</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.frequency || 5}
                      onChange={(e) => setEditForm({ ...editForm, frequency: parseInt(e.target.value, 10) || 5 })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsEditing(false)} className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition">Cancel</button>
                  <button type="submit" className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition">Save</button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-ink-dim">Device UID</div>
                  <div className="font-bold">{device.deviceUid}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-dim">Name</div>
                  <div className="font-bold">{device.deviceName || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-dim">Description</div>
                  <div className="font-bold">{device.description || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-dim">Location</div>
                  <div className="font-bold">{device.locationName || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-dim">Coordinates</div>
                  <div className="font-bold">
                    {device.latitude !== null && device.longitude !== null
                      ? `${device.latitude}, ${device.longitude}`
                      : "Not set"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-ink-dim">Frequency</div>
                  <div className="font-bold">Every {device.frequency} min</div>
                </div>
                <div>
                  <div className="text-xs text-ink-dim">Status</div>
                  <div className="font-bold">
                    <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${device.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'}`}>
                      {device.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-ink-dim">Last Seen</div>
                  <div className="font-bold">
                    {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Never"}
                  </div>
                </div>
                {device.signalStrengthDbm != null && (
                  <div>
                    <div className="text-xs text-ink-dim">Signal</div>
                    <div className="font-bold">{device.signalStrengthDbm} dBm</div>
                  </div>
                )}
                {device.firmwareVersion && (
                  <div>
                    <div className="text-xs text-ink-dim">Firmware</div>
                    <div className="font-bold">{device.firmwareVersion}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-ink-dim">Crop</div>
                  <div className="font-bold">{device.crop?.name || "Not set"}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-dim">Users</div>
                  <div className="font-bold">{device.users?.length || 0}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History tab – modified with row selection */}
      {tab === "history" && (
        <>
          <div className="flex flex-col gap-3 mb-4 p-4 bg-white rounded-xl border border-gray-200 shadow-card">
            <div className="flex gap-1 flex-wrap">
              {(["daily", "weekly", "monthly"] as HistoryRange[]).map((r) => (
                <button
                  key={r}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                    !isCustomRange && range === r
                      ? 'bg-brand-600 text-white'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  }`}
                  onClick={() => {
                    setIsCustomRange(false);
                    setRange(r);
                  }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                <label className="text-xs text-ink-dim shrink-0">From:</label>
                <input
                  type="datetime-local"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full sm:w-auto min-w-0 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                />
                <label className="text-xs text-ink-dim shrink-0">To:</label>
                <input
                  type="datetime-local"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full sm:w-auto min-w-0 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applyCustomRange}
                  className="bg-brand-600 text-white font-semibold px-4 py-1.5 rounded-lg hover:brightness-105 transition"
                >
                  Apply
                </button>
                {isCustomRange && (
                  <button
                    onClick={clearCustomRange}
                    className="bg-gray-200 text-ink-dim font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-300 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={openDeleteModal}
                className="bg-red-50 text-red-600 font-semibold px-4 py-2 rounded-lg hover:bg-red-100 transition"
              >
                Delete Range
              </button>
              <button
                onClick={async () => {
                  try {
                    if (isCustomRange && customFrom && customTo) {
                      const fromISO = getLocalISOStringWithOffset(customFrom);
                      const toISO = getLocalISOStringWithOffset(customTo);
                      await downloadHistoryCsv(id, "custom", fromISO, toISO);
                    } else {
                      await downloadHistoryCsv(id, range);
                    }
                  } catch (err: any) {
                    setError(
                      formatErrorDetail(err?.response?.data?.detail || "Could not export CSV")
                    );
                  }
                }}
                className="bg-brand-50 text-brand-700 font-semibold px-4 py-2 rounded-lg hover:brightness-95 transition"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Device Vitals Banner – unchanged */}
          <div
            className="w-full rounded-xl text-white flex flex-wrap gap-8 items-center px-8 py-6 mb-6 shadow-card"
            style={{ background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)" }}
          >
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Status</div>
              <div className="font-bold text-lg capitalize">{device.status}</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Location</div>
              <div className="font-bold text-lg">{device.locationName || "—"}</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Reporting</div>
              <div className="font-bold text-lg">Every {device.frequency} min</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Last Seen</div>
              <div className="font-bold text-lg">
                {device.lastSeenAt
                  ? new Date(device.lastSeenAt).toLocaleTimeString(undefined, { hour12: false })
                  : "Never"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Latest Readings</span>
                {latestReadingTime && (
                  <span className="text-xs text-ink-dim">As of {latestReadingTime.toLocaleTimeString(undefined, { hour12: false })}</span>
                )}
              </div>
              <div className="p-5">
                {sensors.filter((s) => s.isActive).length === 0 ? (
                  <p className="text-ink-dim">No active sensors on this device.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {sensors.filter((s) => s.isActive).map((sensor) => {
                      const reading = latestBySensor.get(sensor.id);
                      const meta = getMetricMeta(sensor.sensorLabel);
                      const status = reading ? getReadingStatus(sensor.sensorLabel, reading.value) : null;
                      return (
                        <div key={sensor.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-card flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-3">
                            <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-700">
                              {meta.icon}
                            </div>
                            {status && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                                {status.label}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-ink-dim font-medium mb-1">{meta.name}</div>
                          <div>
                            {reading ? (
                              meta.format ? (
                                <span className="text-xl font-extrabold">{formatMetricValue(sensor.sensorLabel, reading.value)}</span>
                              ) : (
                                <>
                                  <span className="text-2xl font-extrabold">{reading.value.toFixed(1)}</span>
                                  <span className="text-sm font-semibold text-ink-dim ml-1">{meta.unit}</span>
                                </>
                              )
                            ) : (
                              <span className="text-2xl font-extrabold">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Historical Trend</span>
              </div>
              <div className="p-5">
                {chartData.length === 0 ? (
                  <p className="text-ink-dim">No readings in this range yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={340}>
                    <LineChart data={chartData}>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#6b7a73" fontSize={11} tick={{ fill: "#6b7a73" }} />
                      <YAxis stroke="#6b7a73" fontSize={11} tick={{ fill: "#6b7a73" }} />
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", fontSize: 12 }}
                        labelStyle={{ color: "#1a2421" }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        onClick={(entry: any) => toggleLabelVisibility(entry.value)}
                        formatter={(value: string) => (
                          <span
                            style={{
                              cursor: "pointer",
                              textDecoration: hiddenLabels.has(value) ? "line-through" : "none",
                              opacity: hiddenLabels.has(value) ? 0.5 : 1,
                            }}
                          >
                            {value}
                          </span>
                        )}
                      />
                      {chartLabels.map((label, idx) => (
                        <Line
                          key={label}
                          type="monotone"
                          dataKey={label}
                          stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                          dot={false}
                          strokeWidth={2}
                          connectNulls
                          hide={hiddenLabels.has(label)}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Reading Log with row‑level selection */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Reading Log</span>
              <span className="text-xs text-ink-dim">{logRows.length} row{logRows.length !== 1 ? 's' : ''}</span>
            </div>
            {logRows.length === 0 ? (
              <p className="text-ink-dim p-5">No readings in this range yet.</p>
            ) : (
              <>
                {/* Delete Selected bar – shows row count */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200">
                  <span className="text-xs text-ink-dim">{selectedRowCount} row{selectedRowCount !== 1 ? 's' : ''} selected</span>
                  <button
                    onClick={openDeleteSelectedModal}
                    disabled={selectedRowCount === 0}
                    className="bg-red-50 text-red-600 font-semibold px-4 py-1.5 rounded-lg text-sm hover:bg-red-100 transition disabled:opacity-50"
                  >
                    Delete Selected
                  </button>
                </div>

                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={logRows.length > 0 && logRows.every((row) =>
                              row.readingIds.every((id) => selectedReadingIds.has(id))
                            )}
                            onChange={() => toggleSelectAll(logRows)}
                            className="w-4 h-4 rounded border-gray-300 focus:ring-brand-600"
                          />
                        </th>
                        <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Status</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Reading Id</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">D Id</th>
                        {chartLabels.map((label) => (
                          <th key={label} className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logRows.map((row) => {
                        const isRowSelected = row.readingIds.every((id) => selectedReadingIds.has(id));
                        return (
                          <tr key={row.time} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isRowSelected}
                                onChange={() => toggleSelectRow(row)}
                                className="w-4 h-4 rounded border-gray-300 focus:ring-brand-600"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${row.quality === 'ok' ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'}`}>
                                {row.quality.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {/* Display the first reading ID as a representative, or a range */}
                              {row.readingIds.length > 1
                                ? `${Math.min(...row.readingIds)}…${Math.max(...row.readingIds)}`
                                : row.readingIds[0]}
                            </td>
                            <td className="px-4 py-3">{row.deviceId}</td>
                            {chartLabels.map((label) => (
                              <td key={label} className="px-4 py-3">
                                {row.values[label] !== undefined ? row.values[label].toFixed(2) : "—"}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Sensors and Access tabs – unchanged */}
      {tab === "sensors" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Installed Sensors</span>
            <button onClick={() => setShowAddSensor(true)} className="bg-brand-50 text-brand-700 font-semibold px-4 py-2 rounded-full text-sm hover:brightness-95 transition">+ Install sensor</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Label</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Type</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Calibration</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Status</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sensors.map((sensor) => {
                  const type = sensorTypes.find((t) => t.id === sensor.sensorTypeId);
                  return (
                    <tr key={sensor.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3">{sensor.sensorLabel}</td>
                      <td className="px-4 py-3">{type?.name || sensor.sensorTypeId}</td>
                      <td className="px-4 py-3">×{sensor.calibrationScale} +{sensor.calibrationOffset}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${sensor.isActive ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'}`}>
                          {sensor.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSensorActive(sensor)} className="bg-brand-50 text-brand-700 font-semibold px-3 py-1 rounded-full text-xs hover:brightness-95 transition">
                          {sensor.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sensors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-ink-dim text-center py-4">No sensors installed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "access" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Who Has Access</span>
          </div>
          <div className="p-5">
            {assignMessage && (
              <div className="text-sm text-brand-600 font-semibold mb-4">{assignMessage}</div>
            )}

            <form onSubmit={handleAssign} className="flex flex-wrap items-end gap-3 mb-4">
              <div className="flex-1 min-w-50">
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Select a user</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(parseInt(e.target.value, 10) || "")}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                >
                  <option value="">— Select a user —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={isAssigning} className="bg-brand-600 text-white font-bold px-4 py-2.5 rounded-lg hover:brightness-105 transition disabled:opacity-60">
                {isAssigning ? "Granting…" : "Grant access"}
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Name</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Email</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Role</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3">{a.user.name}</td>
                      <td className="px-4 py-3">{a.user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${a.isOwner ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-ink-dim'}`}>
                          {a.isOwner ? "owner" : "viewer"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!a.isOwner && (
                          <button onClick={() => handleUnassign(a.userId)} className="bg-red-50 text-red-600 font-semibold px-3 py-1 rounded-full text-xs hover:brightness-95 transition">Revoke</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-ink-dim text-center py-4">No users have access yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAddSensor && (
        <AddSensorModal
          deviceId={id}
          sensorTypes={sensorTypes}
          installedSensorTypeIds={sensors.filter((s) => s.isActive).map((s) => s.sensorTypeId)}
          onClose={() => setShowAddSensor(false)}
          onCreated={() => {
            setShowAddSensor(false);
            loadSensors();
          }}
        />
      )}

      {/* Delete Range Modal – unchanged */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Delete Readings by Range</h3>
            <p className="text-sm text-ink-dim mb-4">
              This will permanently delete all sensor readings for this device within the selected date/time range. This action cannot be undone.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">From</label>
                <input
                  type="datetime-local"
                  value={deleteFrom}
                  onChange={(e) => setDeleteFrom(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">To</label>
                <input
                  type="datetime-local"
                  value={deleteTo}
                  onChange={(e) => setDeleteTo(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition disabled:opacity-60"
              >
                {isDeleting ? "Deleting…" : "Delete Range"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Selected Modal – updated message */}
      {showConfirmDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowConfirmDeleteModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Delete Selected Rows</h3>
            <p className="text-sm text-ink-dim mb-4">
              You are about to delete <strong>{selectedRowCount}</strong> row{selectedRowCount !== 1 ? 's' : ''} containing <strong>{selectedReadingIds.size}</strong> sensor reading{selectedReadingIds.size !== 1 ? 's' : ''}. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-ink-dim mb-1.5">
                Type <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">delete</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="delete"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteModal(false)}
                className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isConfirmDeleting || deleteConfirmationText.toLowerCase() !== "delete"}
                className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition disabled:opacity-60"
              >
                {isConfirmDeleting ? "Deleting…" : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}