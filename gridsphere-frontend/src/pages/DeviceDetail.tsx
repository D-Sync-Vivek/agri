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
import { getDeviceHistory, HistoryRange } from "../api/devices";
import { listDeviceSensors, listSensorTypes, updateDeviceSensor } from "../api/sensors";
import { DeviceSensor, SensorReading, SensorType } from "../types";
import { getMetricMeta, formatMetricValue } from "../utils/metrics";
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

  // Device info
  const [device, setDevice] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Access management
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
      if (err.response?.status === 404) {
        setError("Device not found or you don't have permission to view it.");
      } else {
        setError(err?.response?.data?.detail || "Could not load device");
      }
    });
}

  function loadAssignments() {
    adminListDeviceAssignments(id)
      .then(setAssignments)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load access list"));
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
      setError(err?.response?.data?.detail || "Could not load device data");
    }
  }
}

  useEffect(() => {
    loadDevice();
    loadSensors();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (tab !== "history") return;
    getDeviceHistory(id, range)
      .then(setHistoryReadings)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load history"));
  }, [tab, range, id]);

  useEffect(() => {
    if (tab !== "access") return;
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    loadDevice(); // reload to reflect changes
  } catch (err: any) {
    setError(err?.response?.data?.detail || "Update failed");
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
      setError(err?.response?.data?.detail || "Could not grant access");
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
      setError(err?.response?.data?.detail || "Could not revoke access");
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

  const logRows = useMemo(() => {
    const byTime = new Map<
      string,
      { time: string; readingId: number; deviceId: number; quality: string; values: Record<string, number> }
    >();
    for (const r of historyReadings) {
      const sensor = sensorLabelById.get(r.deviceSensorId);
      const label = sensor?.sensorLabel || `sensor_${r.deviceSensorId}`;
      const t = r.recordedAt;
      if (!byTime.has(t)) {
        byTime.set(t, { time: t, readingId: r.id, deviceId: id, quality: "ok", values: {} });
      }
      const row = byTime.get(t)!;
      row.readingId = Math.min(row.readingId, r.id);
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
      setError(err?.response?.data?.detail || "Could not update sensor");
    }
  }

  if (!device) return <div className="loading-text">Loading device…</div>;

  return (
    <div className="container container-wide">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            <Link to="/devices" className="muted" style={{ textDecoration: "none" }}>
              ← All devices
            </Link>
          </p>
          <h1 className="page-title">Device #{id}</h1>
        </div>
        {!isEditing && (
          <button className="btn-secondary" onClick={() => setIsEditing(true)}>
            Edit
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="tab-row">
        <button className={`tab-btn ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>
          Info
        </button>
        <button className={`tab-btn ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
          History
        </button>
        <button className={`tab-btn ${tab === "sensors" ? "active" : ""}`} onClick={() => setTab("sensors")}>
          Sensors
        </button>
        <button className={`tab-btn ${tab === "access" ? "active" : ""}`} onClick={() => setTab("access")}>
          Access
        </button>
      </div>

      {tab === "info" && (
        <div className="panel" style={{ marginBottom: 32 }}>
          <div className="panel-header">
            <span className="panel-title">Device Information</span>
          </div>
          <div className="panel-body">
            {isEditing ? (
              <form onSubmit={handleUpdateDevice}>
                <div className="field">
                  <label>Device UID</label>
                  <input
                    value={editForm.deviceUid || ""}
                    onChange={(e) => setEditForm({ ...editForm, deviceUid: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Device Name</label>
                  <input
                    value={editForm.deviceName || ""}
                    onChange={(e) => setEditForm({ ...editForm, deviceName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Description</label>
                  <input
                    value={editForm.description || ""}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Location Name</label>
                  <input
                    value={editForm.locationName || ""}
                    onChange={(e) => setEditForm({ ...editForm, locationName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.latitude ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
                <div className="field">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.longitude ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
                <div className="field">
                  <label>Frequency (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.frequency || 5}
                    onChange={(e) => setEditForm({ ...editForm, frequency: parseInt(e.target.value, 10) || 5 })}
                  />
                </div>

                <div className="flex-row" style={{ marginTop: 20 }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <div className="spacer" />
                  <button type="submit" className="btn-primary" style={{ width: "auto" }}>
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="info-grid">
                <div>
                  <div className="info-item-label">Device UID</div>
                  <div className="info-item-value">{device.deviceUid}</div>
                </div>
                <div>
                  <div className="info-item-label">Name</div>
                  <div className="info-item-value">{device.deviceName || "—"}</div>
                </div>
                <div>
                  <div className="info-item-label">Description</div>
                  <div className="info-item-value">{device.description || "—"}</div>
                </div>
                <div>
                  <div className="info-item-label">Location</div>
                  <div className="info-item-value">{device.locationName || "—"}</div>
                </div>
                <div>
                  <div className="info-item-label">Coordinates</div>
                  <div className="info-item-value">
                    {device.latitude !== null && device.longitude !== null
                      ? `${device.latitude}, ${device.longitude}`
                      : "Not set"}
                  </div>
                </div>
                <div>
                  <div className="info-item-label">Frequency</div>
                  <div className="info-item-value">Every {device.frequency} min</div>
                </div>
                <div>
                  <div className="info-item-label">Status</div>
                  <div className="info-item-value">
                    <span className={`pill ${device.status === "active" ? "on" : "off"}`}>{device.status}</span>
                  </div>
                </div>
                <div>
                  <div className="info-item-label">Last Seen</div>
                  <div className="info-item-value">
                    {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Never"}
                  </div>
                </div>
                {device.batteryLevel != null && (
                  <div>
                    <div className="info-item-label">Battery</div>
                    <div className="info-item-value">
                      {device.batteryLevel.toFixed(0)}%{device.isSolarCharging ? " ☀️ charging" : ""}
                    </div>
                  </div>
                )}
                {device.batteryVoltage != null && (
                  <div>
                    <div className="info-item-label">Battery Voltage</div>
                    <div className="info-item-value">{device.batteryVoltage.toFixed(2)} V</div>
                  </div>
                )}
                {device.signalStrengthDbm != null && (
                  <div>
                    <div className="info-item-label">Signal</div>
                    <div className="info-item-value">{device.signalStrengthDbm} dBm</div>
                  </div>
                )}
                {device.firmwareVersion && (
                  <div>
                    <div className="info-item-label">Firmware</div>
                    <div className="info-item-value">{device.firmwareVersion}</div>
                  </div>
                )}
                <div>
                  <div className="info-item-label">Crop</div>
                  <div className="info-item-value">{device.crop?.name || "Not set"}</div>
                </div>
                <div>
                  <div className="info-item-label">Users</div>
                  <div className="info-item-value">{device.users?.length || 0}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="history-split">
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Latest Readings</span>
              {latestReadingTime && (
                <span className="muted" style={{ fontSize: 12 }}>
                  As of {latestReadingTime.toLocaleTimeString(undefined, { hour12: false })}
                </span>
              )}
            </div>
            <div className="panel-body">
              {sensors.filter((s) => s.isActive).length === 0 ? (
                <p className="muted">No active sensors on this device.</p>
              ) : (
                <div className="readout-grid">
                  {sensors
                    .filter((s) => s.isActive)
                    .map((sensor) => {
                      const reading = latestBySensor.get(sensor.id);
                      const meta = getMetricMeta(sensor.sensorLabel);
                      return (
                        <div className="readout-tile" style={{ cursor: "default" }} key={sensor.id}>
                          <div className="readout-icon">{meta.icon}</div>
                          <div className="readout-label">{meta.name}</div>
                          <div>
                            {reading ? (
                              meta.format ? (
                                <span className="readout-value" style={{ fontSize: 20 }}>
                                  {formatMetricValue(sensor.sensorLabel, reading.value)}
                                </span>
                              ) : (
                                <>
                                  <span className="readout-value">{reading.value.toFixed(2)}</span>
                                  <span className="readout-unit">{meta.unit}</span>
                                </>
                              )
                            ) : (
                              <span className="readout-value">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Historical Trend</span>
              <div className="flex-row">
                {(["daily", "weekly", "monthly"] as HistoryRange[]).map((r) => (
                  <button
                    key={r}
                    className="btn-ghost"
                    style={{ borderColor: range === r ? "var(--sky)" : undefined, color: range === r ? "var(--ink)" : undefined }}
                    onClick={() => setRange(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel-body">
              {chartData.length === 0 ? (
                <p className="muted">No readings in this range yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" />
                    <XAxis dataKey="time" stroke="var(--ink-dim)" fontSize={11} tick={{ fill: "var(--ink-dim)" }} />
                    <YAxis stroke="var(--ink-dim)" fontSize={11} tick={{ fill: "var(--ink-dim)" }} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--hairline)", fontSize: 12 }}
                      labelStyle={{ color: "var(--ink)" }}
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
      )}

      {tab === "history" && (
        <div className="panel" style={{ marginBottom: 32, padding: 0 }}>
          <div className="panel-header" style={{ padding: "16px 20px" }}>
            <span className="panel-title">Reading Log</span>
            <span className="muted" style={{ fontSize: 12 }}>
              {logRows.length} reading{logRows.length === 1 ? "" : "s"}
            </span>
          </div>
          {logRows.length === 0 ? (
            <p className="muted" style={{ padding: "0 20px 20px" }}>
              No readings in this range yet.
            </p>
          ) : (
            <div style={{ overflow: "auto", maxHeight: 420 }}>
              <table className="data-table">
                <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--card)" }}>
                  <tr>
                    <th>Status</th>
                    <th>Reading Id</th>
                    <th>D Id</th>
                    {chartLabels.map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logRows.map((row) => (
                    <tr key={row.time}>
                      <td>
                        <span className={`pill ${row.quality === "ok" ? "on" : "off"}`}>
                          {row.quality.toUpperCase()}
                        </span>
                      </td>
                      <td>{row.readingId}</td>
                      <td>{row.deviceId}</td>
                      {chartLabels.map((label) => (
                        <td key={label}>
                          {row.values[label] !== undefined ? row.values[label].toFixed(2) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "sensors" && (
        <div className="panel" style={{ marginBottom: 32 }}>
          <div className="panel-header">
            <span className="panel-title">Installed Sensors</span>
            <button className="btn-ghost" onClick={() => setShowAddSensor(true)}>
              + Install sensor
            </button>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Type</th>
                  <th>Calibration</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sensors.map((sensor) => {
                  const type = sensorTypes.find((t) => t.id === sensor.sensorTypeId);
                  return (
                    <tr key={sensor.id}>
                      <td>{sensor.sensorLabel}</td>
                      <td>{type?.name || sensor.sensorTypeId}</td>
                      <td>
                        ×{sensor.calibrationScale} +{sensor.calibrationOffset}
                      </td>
                      <td>
                        <span className={`pill ${sensor.isActive ? "on" : "off"}`}>
                          {sensor.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td>
                        <button className="btn-ghost" onClick={() => toggleSensorActive(sensor)}>
                          {sensor.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sensors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted" style={{ padding: 20 }}>
                      No sensors installed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "access" && (
        <div className="panel" style={{ marginBottom: 32 }}>
          <div className="panel-header">
            <span className="panel-title">Who Has Access</span>
          </div>
          <div className="panel-body">
            {assignMessage && (
              <div style={{ marginBottom: 14, fontSize: 13, color: "var(--brand-green-dark)" }}>{assignMessage}</div>
            )}

            <form onSubmit={handleAssign} className="flex-row" style={{ marginBottom: 20 }}>
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(parseInt(e.target.value, 10) || "")}
                style={{
                  flex: 1,
                  background: "#fff",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-sm)",
                  padding: "9px 12px",
                  fontSize: 14,
                }}
              >
                <option value="">— Select a user —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={isAssigning}>
                {isAssigning ? "Granting…" : "Grant access"}
              </button>
            </form>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.user.name}</td>
                    <td>{a.user.email}</td>
                    <td>
                      <span className={`pill ${a.isOwner ? "on" : "off"}`}>{a.isOwner ? "owner" : "viewer"}</span>
                    </td>
                    <td>
                      {!a.isOwner && (
                        <button className="btn-ghost" onClick={() => handleUnassign(a.userId)}>
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted" style={{ padding: 20 }}>
                      No users have access yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
    </div>
  );
}