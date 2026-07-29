import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDeviceHistory, HistoryRange, downloadHistoryCsv } from "../api/devices";
import { listDeviceSensors } from "../api/sensors";
import { DeviceSensor, SensorReading } from "../types";
import { getMetricMeta } from "../utils/metrics";

const RANGE_TABS: { key: HistoryRange; label: string }[] = [
  { key: "daily", label: "Day" },
  { key: "weekly", label: "Week" },
  { key: "monthly", label: "Month" },
];

export default function SensorHistory() {
  const { deviceId, sensorId } = useParams();
  const dId = parseInt(deviceId || "0", 10);
  const sId = parseInt(sensorId || "0", 10);

  const [sensor, setSensor] = useState<DeviceSensor | null>(null);
  const [range, setRange] = useState<HistoryRange>("weekly");
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDeviceSensors(dId)
      .then((sensors) => {
        const found = sensors.find((s) => s.id === sId);
        setSensor(found || null);
        if (!found) setError("Sensor not found on this device.");
      })
      .catch((err) => setError(err?.response?.data?.detail || "Could not load sensor"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dId, sId]);

  useEffect(() => {
    setIsLoading(true);
    getDeviceHistory(dId, range)
      .then((all: SensorReading[]) => {
        // /devices/:id/history returns readings for every sensor on the
        // device - keep only this one's.
        setReadings(all.filter((r) => r.deviceSensorId === sId));
      })
      .catch((err) => setError(err?.response?.data?.detail || "Could not load history"))
      .finally(() => setIsLoading(false));
  }, [dId, sId, range]);

  const meta = sensor ? getMetricMeta(sensor.sensorLabel) : null;

  const sorted = useMemo(
    () => [...readings].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
    [readings]
  );

  const { max, min, avg } = useMemo(() => {
    if (sorted.length === 0) return { max: null as number | null, min: null as number | null, avg: null as number | null };
    const values = sorted.map((r) => r.value);
    const sum = values.reduce((a, b) => a + b, 0);
    return { max: Math.max(...values), min: Math.min(...values), avg: sum / values.length };
  }, [sorted]);

  const chartData = useMemo(
    () =>
      sorted.map((r) => ({
        time: new Date(r.recordedAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: range === "daily" ? "2-digit" : undefined,
          minute: range === "daily" ? "2-digit" : undefined,
        }),
        value: r.value,
      })),
    [sorted, range]
  );

  const rangeCaption =
    range === "daily" ? "Today" : range === "weekly" ? "Last 7 days" : "This calendar month, to date";

  async function handleExport() {
    setIsExporting(true);
    try {
      await downloadHistoryCsv(dId, range);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not export CSV");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            <Link to="/" className="muted" style={{ textDecoration: "none" }}>
              ← Field Conditions
            </Link>
          </p>
          <h1 className="page-title flex-row" style={{ gap: 10 }}>
            {meta?.icon}
            {meta?.name || "Sensor"} History
          </h1>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="tab-row">
        {RANGE_TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${range === t.key ? "active" : ""}`}
            onClick={() => setRange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="readout-grid" style={{ marginBottom: 20 }}>
        <div className="readout-tile" style={{ cursor: "default" }}>
          <div className="readout-label">Max</div>
          <div>
            <span className="readout-value">{max !== null ? max.toFixed(1) : "—"}</span>
            <span className="readout-unit">{meta?.unit}</span>
          </div>
        </div>
        <div className="readout-tile" style={{ cursor: "default" }}>
          <div className="readout-label">Min</div>
          <div>
            <span className="readout-value">{min !== null ? min.toFixed(1) : "—"}</span>
            <span className="readout-unit">{meta?.unit}</span>
          </div>
        </div>
        <div className="readout-tile" style={{ cursor: "default" }}>
          <div className="readout-label">Average</div>
          <div>
            <span className="readout-value">{avg !== null ? avg.toFixed(1) : "—"}</span>
            <span className="readout-unit">{meta?.unit}</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 32 }}>
        <div className="panel-header">
          <span className="panel-title">Trend</span>
          <div className="flex-row">
            <span className="muted" style={{ fontSize: 12 }}>
              {rangeCaption}
            </span>
            <button className="btn-ghost" onClick={handleExport} disabled={isExporting}>
              {isExporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>
        <div className="panel-body">
          {isLoading ? (
            <div className="loading-text">Loading history…</div>
          ) : chartData.length === 0 ? (
            <p className="muted">No readings in this range yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--ink-dim)" fontSize={11} tick={{ fill: "var(--ink-dim)" }} />
                <YAxis
                  stroke="var(--ink-dim)"
                  fontSize={11}
                  tick={{ fill: "var(--ink-dim)" }}
                  unit={meta?.unit}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--hairline)", fontSize: 12 }}
                  labelStyle={{ color: "var(--ink)" }}
                  formatter={(value: number) => [`${value.toFixed(1)} ${meta?.unit ?? ""}`, meta?.name ?? "value"]}
                />
                <Line type="monotone" dataKey="value" stroke="#1F6E44" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}


