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
  }, [dId, sId]);

  useEffect(() => {
    setIsLoading(true);
    getDeviceHistory(dId, range)
      .then((all: SensorReading[]) => {
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
    if (sorted.length === 0) return { max: null, min: null, avg: null };
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
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">
            <Link to="/" className="text-ink-dim hover:text-brand-600 transition">← Field Conditions</Link>
          </p>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            {meta?.icon}
            {meta?.name || "Sensor"} History
          </h1>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <div className="flex gap-1 mb-4 bg-brand-50 rounded-full p-1 overflow-x-auto">
        {RANGE_TABS.map((t) => (
          <button
            key={t.key}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition ${
              range === t.key ? 'bg-brand-600 text-white' : 'text-brand-700 hover:bg-brand-100'
            }`}
            onClick={() => setRange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
          <div className="text-sm text-ink-dim font-medium">Max</div>
          <div>
            <span className="text-2xl font-extrabold">{max !== null ? max.toFixed(1) : "—"}</span>
            <span className="text-sm font-semibold text-ink-dim ml-1">{meta?.unit}</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
          <div className="text-sm text-ink-dim font-medium">Min</div>
          <div>
            <span className="text-2xl font-extrabold">{min !== null ? min.toFixed(1) : "—"}</span>
            <span className="text-sm font-semibold text-ink-dim ml-1">{meta?.unit}</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
          <div className="text-sm text-ink-dim font-medium">Average</div>
          <div>
            <span className="text-2xl font-extrabold">{avg !== null ? avg.toFixed(1) : "—"}</span>
            <span className="text-sm font-semibold text-ink-dim ml-1">{meta?.unit}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Trend</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-dim">{rangeCaption}</span>
            <button onClick={handleExport} disabled={isExporting} className="bg-brand-50 text-brand-700 font-semibold px-4 py-2 rounded-full text-sm hover:brightness-95 transition disabled:opacity-50">
              {isExporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="text-center text-ink-dim py-12">Loading history…</div>
          ) : chartData.length === 0 ? (
            <p className="text-ink-dim">No readings in this range yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#6b7a73" fontSize={11} tick={{ fill: "#6b7a73" }} />
                <YAxis stroke="#6b7a73" fontSize={11} tick={{ fill: "#6b7a73" }} unit={meta?.unit} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", fontSize: 12 }}
                  labelStyle={{ color: "#1a2421" }}
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