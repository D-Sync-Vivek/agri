import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
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
import { getDeviceHistory } from "../api/devices";
import { listDeviceSensors } from "../api/sensors";
import { adminListDevices } from "../api/admin";
import { DeviceSensor, SensorReading } from "../types";
import { getMetricMeta, getLocalISOStringWithOffset } from "../utils/metrics";
import { RefreshCw } from "lucide-react";

const LINE_COLORS = [
  "#1F6E44", "#2F86C9", "#E0932E", "#D64545", "#9b7fc7",
  "#5F9EA0", "#CD853F", "#6A5ACD", "#20B2AA",
];

type RangeType = "daily" | "weekly" | "monthly" | "custom";

export default function CompareDetail() {
  const { sensorId } = useParams<{ sensorId: string }>();
  const [searchParams] = useSearchParams();
  const deviceIdsParam = searchParams.get("deviceIds");

  const deviceIds = useMemo(() => {
    if (!deviceIdsParam) return [];
    return deviceIdsParam
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));
  }, [deviceIdsParam]);

  const [sensorLabel, setSensorLabel] = useState<string | null>(null);
  const [deviceNames, setDeviceNames] = useState<Map<number, string>>(new Map());
  const [readingsByDevice, setReadingsByDevice] = useState<Map<number, SensorReading[]>>(new Map());
  const [devicesWithData, setDevicesWithData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiddenDeviceIds, setHiddenDeviceIds] = useState<Set<number>>(new Set());

  // Range state
  const [rangeType, setRangeType] = useState<RangeType>("daily");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [fetchTrigger, setFetchTrigger] = useState<number>(0);

  const sId = parseInt(sensorId || "0", 10);

  // Validate parameters early
  useEffect(() => {
    if (deviceIds.length === 0) {
      setError("No devices selected. Please go back and select at least one device.");
      setIsLoading(false);
    } else if (!sId || isNaN(sId)) {
      setError("Invalid sensor ID. Please go back and try again.");
      setIsLoading(false);
    }
  }, [deviceIds, sId]);

  async function loadData(range: RangeType, from?: string, to?: string) {
    if (deviceIds.length === 0 || !sId || isNaN(sId)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setHiddenDeviceIds(new Set());

    try {
      // 1. Get sensor label from the first device
      const firstDeviceId = deviceIds[0];
      const sensors = await listDeviceSensors(firstDeviceId);
      const found = sensors.find((s) => s.id === sId);
      if (!found) {
        setError(`Sensor "${sensorId}" not found on any selected device.`);
        setIsLoading(false);
        return;
      }
      const label = found.sensorLabel;
      setSensorLabel(label);

      // 2. Get device names
      const allDevices = await adminListDevices();
      const nameMap = new Map<number, string>();
      for (const dev of allDevices) {
        if (deviceIds.includes(dev.id)) {
          nameMap.set(dev.id, dev.deviceName || dev.deviceUid || `Device #${dev.id}`);
        }
      }
      setDeviceNames(nameMap);

      // 3. For each device, fetch readings with the given range
      const readingPromises = deviceIds.map(async (dId) => {
        try {
          const deviceSensors = await listDeviceSensors(dId);
          const sensorForDevice = deviceSensors.find((s) => s.sensorLabel === label && s.isActive);
          if (!sensorForDevice) {
            return { deviceId: dId, readings: [] };
          }
          let readings: SensorReading[];
          if (range === "custom" && from && to) {
            const fromISO = getLocalISOStringWithOffset(from);
            const toISO = getLocalISOStringWithOffset(to);
            readings = await getDeviceHistory(dId, "custom", fromISO, toISO);
          } else {
            readings = await getDeviceHistory(dId, range);
          }
          const filtered = readings.filter((r: SensorReading) => r.deviceSensorId === sensorForDevice.id);
          return { deviceId: dId, readings: filtered };
        } catch {
          return { deviceId: dId, readings: [] };
        }
      });
      const results = await Promise.all(readingPromises);

      const readingsMap = new Map<number, SensorReading[]>();
      const devicesWithDataList: number[] = [];
      for (const res of results) {
        readingsMap.set(res.deviceId, res.readings);
        if (res.readings.length > 0) {
          devicesWithDataList.push(res.deviceId);
        }
      }
      setReadingsByDevice(readingsMap);
      setDevicesWithData(devicesWithDataList);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not load comparison data");
    } finally {
      setIsLoading(false);
    }
  }

  // Trigger fetch when fetchTrigger or deviceIds change
  useEffect(() => {
    if (deviceIds.length > 0 && sId && !isNaN(sId) && fetchTrigger > 0) {
      if (rangeType === "custom" && customFrom && customTo) {
        loadData("custom", customFrom, customTo);
      } else {
        loadData(rangeType);
      }
    }
  }, [fetchTrigger, deviceIdsParam]);

  // Initial load
  useEffect(() => {
    if (deviceIds.length > 0 && sId && !isNaN(sId)) {
      setFetchTrigger(prev => prev + 1);
    }
  }, [sId, deviceIdsParam]);

  async function handleRefresh() {
    if (!sensorLabel) return;
    setIsRefreshing(true);
    setHiddenDeviceIds(new Set());
    try {
      if (rangeType === "custom" && customFrom && customTo) {
        const fromISO = getLocalISOStringWithOffset(customFrom);
        const toISO = getLocalISOStringWithOffset(customTo);
        const readingPromises = deviceIds.map(async (dId) => {
          try {
            const deviceSensors = await listDeviceSensors(dId);
            const sensorForDevice = deviceSensors.find((s) => s.sensorLabel === sensorLabel && s.isActive);
            if (!sensorForDevice) {
              return { deviceId: dId, readings: [] };
            }
            const readings = await getDeviceHistory(dId, "custom", fromISO, toISO);
            const filtered = readings.filter((r: SensorReading) => r.deviceSensorId === sensorForDevice.id);
            return { deviceId: dId, readings: filtered };
          } catch {
            return { deviceId: dId, readings: [] };
          }
        });
        const results = await Promise.all(readingPromises);
        const readingsMap = new Map<number, SensorReading[]>();
        const devicesWithDataList: number[] = [];
        for (const res of results) {
          readingsMap.set(res.deviceId, res.readings);
          if (res.readings.length > 0) {
            devicesWithDataList.push(res.deviceId);
          }
        }
        setReadingsByDevice(readingsMap);
        setDevicesWithData(devicesWithDataList);
      } else {
        const readingPromises = deviceIds.map(async (dId) => {
          try {
            const deviceSensors = await listDeviceSensors(dId);
            const sensorForDevice = deviceSensors.find((s) => s.sensorLabel === sensorLabel && s.isActive);
            if (!sensorForDevice) {
              return { deviceId: dId, readings: [] };
            }
            const readings = await getDeviceHistory(dId, rangeType);
            const filtered = readings.filter((r: SensorReading) => r.deviceSensorId === sensorForDevice.id);
            return { deviceId: dId, readings: filtered };
          } catch {
            return { deviceId: dId, readings: [] };
          }
        });
        const results = await Promise.all(readingPromises);
        const readingsMap = new Map<number, SensorReading[]>();
        const devicesWithDataList: number[] = [];
        for (const res of results) {
          readingsMap.set(res.deviceId, res.readings);
          if (res.readings.length > 0) {
            devicesWithDataList.push(res.deviceId);
          }
        }
        setReadingsByDevice(readingsMap);
        setDevicesWithData(devicesWithDataList);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not refresh");
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleApplyCustom() {
    if (!customFrom || !customTo) {
      setError("Please select both a start and end date/time.");
      return;
    }
    const fromDate = new Date(customFrom);
    const toDate = new Date(customTo);
    if (fromDate > toDate) {
      setError("Start date must be before end date.");
      return;
    }
    setRangeType("custom");
    setFetchTrigger(prev => prev + 1);
  }

  function handleQuickRange(type: "daily" | "weekly" | "monthly") {
    setRangeType(type);
    setCustomFrom("");
    setCustomTo("");
    setError(null);
    setFetchTrigger(prev => prev + 1);
  }

  function handleReset() {
    handleQuickRange("daily");
  }

  function toggleDeviceVisibility(deviceId: number) {
    setHiddenDeviceIds((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) next.delete(deviceId);
      else next.add(deviceId);
      return next;
    });
  }

  const meta = sensorLabel ? getMetricMeta(sensorLabel) : null;

  const chartData = useMemo(() => {
    if (readingsByDevice.size === 0 || devicesWithData.length === 0) return [];

    const timeMap = new Map<string, Record<number, number>>();
    for (const [deviceId, readings] of readingsByDevice) {
      if (!devicesWithData.includes(deviceId)) continue;
      for (const r of readings) {
        if (r.value === null || r.value === undefined) continue;
        const key = r.recordedAt;
        if (!timeMap.has(key)) {
          timeMap.set(key, {});
        }
        timeMap.get(key)![deviceId] = r.value;
      }
    }

    const sortedEntries = Array.from(timeMap.entries()).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );

    return sortedEntries.map(([time, values]) => ({
      time: new Date(time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      fullTime: time,
      ...values,
    }));
  }, [readingsByDevice, devicesWithData]);

  const statsPerDevice = useMemo(() => {
    const stats = new Map<number, { max: number | null; min: number | null; avg: number | null; count: number }>();
    for (const deviceId of deviceIds) {
      const readings = readingsByDevice.get(deviceId) || [];
      const values = readings.filter((r) => r.value !== null && r.value !== undefined).map((r) => r.value as number);
      if (values.length === 0) {
        stats.set(deviceId, { max: null, min: null, avg: null, count: 0 });
      } else {
        const sum = values.reduce((a, b) => a + b, 0);
        stats.set(deviceId, {
          max: Math.max(...values),
          min: Math.min(...values),
          avg: sum / values.length,
          count: values.length,
        });
      }
    }
    return stats;
  }, [readingsByDevice, deviceIds]);

  const deviceList = deviceIds.map((id) => [id, deviceNames.get(id) || `Device #${id}`] as [number, string]);
  const hasDataDevices = devicesWithData.length > 0;

  const rangeCaption =
    rangeType === "daily" ? "Today" :
    rangeType === "weekly" ? "Last 7 days" :
    rangeType === "monthly" ? "This month" :
    "Custom range";

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-ink-dim py-12">Loading comparison data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        <Link to="/admin/compare" className="inline-block mt-4 text-brand-600 font-semibold hover:underline">
          ← Back to Compare
        </Link>
      </div>
    );
  }

  if (!sensorLabel) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <p className="text-ink-dim">Sensor not found.</p>
          <Link to="/admin/compare" className="inline-block mt-4 text-brand-600 font-semibold hover:underline">
            ← Back to Compare
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">
            <Link to="/admin/compare" className="text-ink-dim hover:text-brand-600 transition">
              ← Back to Compare
            </Link>
          </p>
          <h1 className="text-2xl font-extrabold flex items-center gap-3">
            {meta?.icon}
            <span>{meta?.name || sensorLabel}</span>
            <span className="text-base font-normal text-ink-dim">
              — {devicesWithData.length} of {deviceIds.length} device{deviceIds.length !== 1 ? "s" : ""} with data
            </span>
          </h1>
          <p className="text-sm text-ink-dim mt-1">{rangeCaption}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-brand-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Range Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Range:</span>
          <button
            onClick={() => handleQuickRange("daily")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              rangeType === "daily" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => handleQuickRange("weekly")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              rangeType === "weekly" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => handleQuickRange("monthly")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              rangeType === "monthly" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Monthly
          </button>
          <span className="text-ink-dim text-xs">|</span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-ink-dim">From:</label>
            <input
              type="datetime-local"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
            />
            <label className="text-xs text-ink-dim">To:</label>
            <input
              type="datetime-local"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-600"
            />
            <button
              onClick={handleApplyCustom}
              className="bg-brand-600 text-white font-semibold px-4 py-1.5 rounded-lg text-sm hover:brightness-105 transition"
            >
              Apply
            </button>
            {rangeType === "custom" && (
              <button
                onClick={handleReset}
                className="bg-gray-200 text-gray-700 font-semibold px-4 py-1.5 rounded-lg text-sm hover:bg-gray-300 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats per device */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {deviceList.map(([deviceId, name]) => {
          const stat = statsPerDevice.get(deviceId);
          const hasData = stat && stat.count > 0;
          return (
            <div key={deviceId} className="bg-white rounded-xl border border-gray-200 p-4 shadow-card">
              <div className="text-xs font-semibold text-ink-dim truncate" title={name}>{name}</div>
              {hasData ? (
                <div className="mt-1 space-y-0.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-dim">Max</span>
                    <span className="font-medium">{stat!.max!.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-dim">Min</span>
                    <span className="font-medium">{stat!.min!.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-dim">Avg</span>
                    <span className="font-medium">{stat!.avg!.toFixed(1)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-dim mt-2">No readings</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Chart */}
      {!hasDataDevices ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-ink-dim">
          No data available for this sensor on any selected device in the selected range.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Trend Comparison</span>
            <span className="text-xs text-ink-dim">{rangeCaption}</span>
          </div>
          <div className="p-5">
            {chartData.length === 0 ? (
              <p className="text-ink-dim text-center py-12">No readings in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    stroke="#6b7a73"
                    fontSize={11}
                    tick={{ fill: "#6b7a73" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#6b7a73"
                    fontSize={11}
                    tick={{ fill: "#6b7a73" }}
                    unit={meta?.unit ? ` ${meta.unit}` : ""}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", fontSize: 12 }}
                    labelStyle={{ color: "#1a2421" }}
                    formatter={(value: number, name: string) => {
                      const deviceId = parseInt(name);
                      const deviceName = deviceNames.get(deviceId) || `Device #${deviceId}`;
                      return [`${value.toFixed(1)} ${meta?.unit ?? ""}`, deviceName];
                    }}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, cursor: "pointer" }}
                    onClick={(e) => {
                      const deviceId = parseInt(e.value);
                      if (!isNaN(deviceId)) {
                        toggleDeviceVisibility(deviceId);
                      }
                    }}
                    formatter={(value: string) => {
                      const deviceId = parseInt(value);
                      const name = deviceNames.get(deviceId) || `Device #${deviceId}`;
                      const isHidden = hiddenDeviceIds.has(deviceId);
                      return (
                        <span style={{ textDecoration: isHidden ? "line-through" : "none", opacity: isHidden ? 0.5 : 1 }}>
                          {name}
                        </span>
                      );
                    }}
                  />
                  {devicesWithData.map((deviceId, index) => {
                    const isHidden = hiddenDeviceIds.has(deviceId);
                    return (
                      <Line
                        key={deviceId}
                        type="monotone"
                        dataKey={String(deviceId)}
                        stroke={LINE_COLORS[index % LINE_COLORS.length]}
                        strokeWidth={isHidden ? 1 : 2}
                        strokeOpacity={isHidden ? 0.2 : 1}
                        dot={false}
                        connectNulls
                        name={String(deviceId)}
                        hide={isHidden}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

