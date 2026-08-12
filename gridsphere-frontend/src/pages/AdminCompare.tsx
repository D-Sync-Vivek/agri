import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminListDevices, AdminDeviceResponse } from "../api/admin";
import { listDeviceSensors } from "../api/sensors";
import { getDeviceHistory } from "../api/devices";
import { getMetricMeta, formatMetricValue } from "../utils/metrics";
import { Check, RefreshCw, ChevronRight } from "lucide-react";

interface SensorData {
  sensorLabel: string;
  sensorId: number;
  meta: ReturnType<typeof getMetricMeta>;
  deviceReadings: {
    deviceId: number;
    deviceName: string;
    value: number | null;
    time: string;
  }[];
}

export default function AdminCompare() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [allDevices, setAllDevices] = useState<AdminDeviceResponse[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<number>>(new Set());
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sensorDataMap, setSensorDataMap] = useState<Map<string, SensorData>>(new Map());
  const [hasCompared, setHasCompared] = useState(false);

  // Read deviceIds from URL on mount
  useEffect(() => {
    const deviceIdsParam = searchParams.get("deviceIds");
    if (deviceIdsParam) {
      const ids = deviceIdsParam
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
      if (ids.length > 0) {
        setSelectedDeviceIds(new Set(ids));
        // Auto-compare after devices are loaded
        // We'll trigger this in a separate effect after allDevices is set
      }
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, []);

  // Auto-compare when devices are loaded and we have selected IDs from URL
  useEffect(() => {
    if (!isLoadingDevices && selectedDeviceIds.size > 0 && !hasCompared && allDevices.length > 0) {
      // Make sure all selected devices exist in allDevices
      const validIds = Array.from(selectedDeviceIds).filter((id) =>
        allDevices.some((d) => d.id === id)
      );
      if (validIds.length > 0) {
        // Update selected IDs to only valid ones
        setSelectedDeviceIds(new Set(validIds));
        // Trigger compare
        handleCompare();
      }
    }
  }, [isLoadingDevices, allDevices]);

  async function loadDevices() {
    setIsLoadingDevices(true);
    setError(null);
    try {
      const devices = await adminListDevices();
      setAllDevices(devices);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not load devices");
    } finally {
      setIsLoadingDevices(false);
    }
  }

  function toggleDevice(deviceId: number) {
    setSelectedDeviceIds((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) next.delete(deviceId);
      else next.add(deviceId);
      return next;
    });
    // Clear compare state and update URL
    if (hasCompared) {
      setHasCompared(false);
      setSensorDataMap(new Map());
    }
    updateUrlParams(selectedDeviceIds);
  }

  function updateUrlParams(ids: Set<number>) {
    const idsArray = Array.from(ids);
    if (idsArray.length > 0) {
      setSearchParams({ deviceIds: idsArray.join(",") });
    } else {
      setSearchParams({});
    }
  }

  function selectAll() {
    const allIds = allDevices.map((d) => d.id);
    setSelectedDeviceIds(new Set(allIds));
    if (hasCompared) {
      setHasCompared(false);
      setSensorDataMap(new Map());
    }
    updateUrlParams(new Set(allIds));
  }

  function deselectAll() {
    setSelectedDeviceIds(new Set());
    if (hasCompared) {
      setHasCompared(false);
      setSensorDataMap(new Map());
    }
    setSearchParams({});
  }

  async function handleCompare() {
    if (selectedDeviceIds.size === 0) {
      setError("Please select at least one device to compare.");
      return;
    }

    setIsComparing(true);
    setError(null);
    setSensorDataMap(new Map());

    const devicePromises = Array.from(selectedDeviceIds).map(async (deviceId) => {
      const device = allDevices.find((d) => d.id === deviceId)!;
      try {
        const [sensors, readings] = await Promise.all([
          listDeviceSensors(deviceId),
          getDeviceHistory(deviceId, "daily"),
        ]);
        const activeSensors = sensors.filter((s) => s.isActive);
        const sensorMap = new Map<string, number>();
        activeSensors.forEach((s) => sensorMap.set(s.sensorLabel, s.id));
        return { device, sensors: activeSensors, readings, sensorMap };
      } catch {
        return { device, sensors: [], readings: [], sensorMap: new Map() };
      }
    });

    const results = await Promise.all(devicePromises);

    // Collect all sensor labels
    const allSensorLabels = new Set<string>();
    const sensorIdByLabel = new Map<string, number>();
    for (const { sensors } of results) {
      for (const s of sensors) {
        allSensorLabels.add(s.sensorLabel);
        if (!sensorIdByLabel.has(s.sensorLabel)) {
          sensorIdByLabel.set(s.sensorLabel, s.id);
        }
      }
    }

    const sensorMap = new Map<string, SensorData>();
    for (const label of allSensorLabels) {
      const meta = getMetricMeta(label);
      const sensorId = sensorIdByLabel.get(label)!;
      const deviceReadings: { deviceId: number; deviceName: string; value: number | null; time: string }[] = [];

      for (const { device, readings, sensorMap: deviceSensorMap } of results) {
        const deviceId = device.id;
        const deviceName = device.deviceName || device.deviceUid || `Device #${deviceId}`;

        if (deviceSensorMap.has(label)) {
          const sensorIdForDevice = deviceSensorMap.get(label)!;
          const reading = readings
            .filter((r: { deviceSensorId: number; recordedAt: string }) => r.deviceSensorId === sensorIdForDevice)
            .sort(
              (a: { recordedAt: string }, b: { recordedAt: string }) =>
                new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
            )[0] || null;
          deviceReadings.push({
            deviceId,
            deviceName,
            value: reading?.value ?? null,
            time: reading?.recordedAt ? new Date(reading.recordedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "",
          });
        } else {
          deviceReadings.push({
            deviceId,
            deviceName,
            value: null,
            time: "",
          });
        }
      }

      deviceReadings.sort((a, b) => {
        if (a.value !== null && b.value === null) return -1;
        if (a.value === null && b.value !== null) return 1;
        return a.deviceName.localeCompare(b.deviceName);
      });

      sensorMap.set(label, {
        sensorLabel: label,
        sensorId,
        meta,
        deviceReadings,
      });
    }

    setSensorDataMap(sensorMap);
    setHasCompared(true);
    setIsComparing(false);
    // Update URL with device IDs (ensure they're set)
    updateUrlParams(selectedDeviceIds);
  }

  function navigateToDetail(sensorId: number) {
    const deviceIds = Array.from(selectedDeviceIds).join(",");
    navigate(`/admin/compare/sensor/${sensorId}?deviceIds=${deviceIds}`);
  }

  const selectedCount = selectedDeviceIds.size;
  const totalSensors = sensorDataMap.size;

  if (isLoadingDevices) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-ink-dim py-12">Loading devices…</div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
          <h1 className="text-3xl font-extrabold text-gray-900">Compare Devices</h1>
          <p className="text-sm text-ink-dim mt-1">
            Select multiple devices to compare their sensor readings side by side.
          </p>
        </div>
        <button
          onClick={loadDevices}
          disabled={isLoadingDevices}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-brand-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingDevices ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Device Selection */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Select devices:</span>
            <div className="flex flex-wrap gap-2">
              {allDevices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => toggleDevice(device.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    selectedDeviceIds.has(device.id)
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {selectedDeviceIds.has(device.id) && <Check className="w-3.5 h-3.5" />}
                  {device.deviceName || device.deviceUid || `Device #${device.id}`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="text-xs text-brand-600 font-semibold hover:underline">
              Select All
            </button>
            <span className="text-ink-dim text-xs">|</span>
            <button onClick={deselectAll} className="text-xs text-ink-dim font-semibold hover:text-brand-600 hover:underline">
              Deselect All
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-ink-dim">
            {selectedCount} device{selectedCount !== 1 ? "s" : ""} selected
            {hasCompared && (
              <span className="ml-2 text-brand-600 font-semibold">
                • {totalSensors} sensor{totalSensors !== 1 ? "s" : ""} loaded
              </span>
            )}
          </span>
          <button
            onClick={handleCompare}
            disabled={selectedCount === 0 || isComparing}
            className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 text-white rounded-lg font-bold text-sm hover:brightness-105 transition shadow-sm disabled:opacity-60 hover:cursor-pointer"
          >
            {isComparing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Compare"
            )}
          </button>
        </div>
      </div>

      {/* Sensor Cards */}
      {hasCompared && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from(sensorDataMap.entries()).map(([label, data]) => {
            const { sensorId, meta, deviceReadings } = data;

            return (
              <button
                key={label}
                onClick={() => navigateToDetail(sensorId)}
                className="group bg-white rounded-xl border border-gray-200 shadow-card hover:shadow-lg hover:border-brand-300 transition-all text-left p-4 flex flex-col"
              >
                {/* Sensor Header */}
                <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                    {meta.icon}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm truncate">{meta.name}</span>
                  {meta.unit && <span className="text-xs text-ink-dim ml-auto">({meta.unit})</span>}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 transition ml-1" />
                </div>

                {/* Device readings with individual update times */}
                <div className="space-y-1.5 flex-1">
                  {deviceReadings.map((dr) => (
                    <div key={dr.deviceId} className="flex justify-between items-center text-sm">
                      <span className="text-ink-dim truncate mr-2">{dr.deviceName}</span>
                      <span className="text-right">
                        <span className="font-mono font-medium text-gray-800">
                          {dr.value !== null ? formatMetricValue(label, dr.value) : "N/A"}
                        </span>
                        {dr.value !== null && dr.time && (
                          <span className="text-[10px] text-ink-dim ml-1.5">updated: {dr.time}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!hasCompared && selectedCount > 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <p className="text-ink-dim">Click <strong>Compare</strong> to load sensor data for the selected devices.</p>
        </div>
      )}

      {!hasCompared && selectedCount === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <p className="text-ink-dim">Select at least one device above and click Compare.</p>
        </div>
      )}
    </div>
  );
}