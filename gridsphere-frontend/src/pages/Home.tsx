import { useEffect, useMemo, useState } from "react";
import { useDevices } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { listDeviceSensors, getRecentReadings } from "../api/sensors";
import { DeviceSensor, SensorReading } from "../types";
import { getMetricMeta, formatMetricValue } from "../utils/metrics";
import { Link } from "react-router-dom";
import { WifiOffIcon } from "../components/icons";
import InsightsPanel from "../components/InsightsPanel";
import ForecastPanel from "../components/ForecastPanel";
import CropSelector from "../components/CropSelector";
import AdvisoryPanel from "../components/AdvisoryPanel";
import WindAnalyticsPanel from "../components/WindAnalyticsPanel";
import RainAnalyticsPanel from "../components/RainAnalyticsPanel";
import ChatPanel from "../components/ChatPanel";

type Tab = "conditions" | "advisory" | "insights" | "forecast" | "analytics" | "chat";

const TABS: { key: Tab; label: string }[] = [
  { key: "conditions", label: "Conditions" },
  { key: "advisory", label: "Advisory" },
  { key: "insights", label: "Insights" },
  { key: "forecast", label: "Forecast" },
  { key: "analytics", label: "Analytics" },
  { key: "chat", label: "Chat" },
];

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  if (diffMs < 0) return "just now";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h ago`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
  return `${minutes}m ago`;
}

export default function Home() {
  const { selectedDevice, isLoading: devicesLoading, error: devicesError } = useDevices();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState<Tab>("conditions");
  const [sensors, setSensors] = useState<DeviceSensor[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!selectedDevice) return;
    setError(null);
    Promise.all([listDeviceSensors(selectedDevice.id), getRecentReadings(selectedDevice.id, 100)])
      .then(([s, r]) => {
        setSensors(s);
        setReadings(r);
        setUpdatedAt(new Date());
      })
      .catch((err) => setError(err?.response?.data?.detail || "Could not load field conditions"));
  }, [selectedDevice]);

  const latestBySensor = useMemo(() => {
    const map = new Map<number, SensorReading>();
    for (const r of readings) {
      const existing = map.get(r.deviceSensorId);
      if (!existing || new Date(r.recordedAt) > new Date(existing.recordedAt)) {
        map.set(r.deviceSensorId, r);
      }
    }
    return map;
  }, [readings]);

  const isNeverConnected = selectedDevice ? selectedDevice.status === "inactive" : false;
  const isOffline = selectedDevice ? selectedDevice.status === "offline" : false;
  const isActive = selectedDevice ? selectedDevice.status === "active" : false;

  if (devicesLoading) {
    return <div className="text-center text-ink-dim py-12">Loading console…</div>;
  }

  if (devicesError) {
    return (
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{devicesError}</div>
      </div>
    );
  }

  if (!selectedDevice) {
    return (
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <h3 className="text-lg font-bold mb-2">No devices yet</h3>
          {isAdmin ? (
            <>
              <p className="text-ink-dim">Register a weather station device to start seeing live field conditions.</p>
              <Link to="/devices" className="inline-block mt-4 bg-brand-50 text-brand-700 font-semibold px-4 py-2 rounded-full hover:brightness-95 transition">Go to Devices</Link>
            </>
          ) : (
            <p className="text-ink-dim">No device has been assigned to your account yet. Ask your admin to grant you access to one.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-extrabold">Device {selectedDevice.id} Overview</h1>
        {updatedAt && (
          <span className="text-sm text-ink-dim">Updated {updatedAt.toLocaleTimeString(undefined, { hour12: false })}</span>
        )}
      </div>

      {(isOffline || isNeverConnected) && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
          <WifiOffIcon size={18} />
          <span className="text-sm font-semibold">
            {isNeverConnected ? "Not yet connected" : "Inactive"}
            {selectedDevice.lastSeenAt && (
              <> • Last seen {formatRelativeTime(selectedDevice.lastSeenAt)}</>
            )}
          </span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-200">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Field Information</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-ink-dim">Device ID</div>
              <div className="font-bold">{selectedDevice.id}</div>
            </div>
            <div>
              <div className="text-xs text-ink-dim">Status</div>
              <div className={`font-bold ${isActive ? 'text-brand-600' : isOffline ? 'text-red-600' : ''}`}>
                {isActive ? "Online" : isOffline ? "Offline" : "Not yet connected"}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-dim">Location</div>
              <div className="font-bold">{selectedDevice.locationName || "Not set"}</div>
            </div>
            <div>
              <div className="text-xs text-ink-dim">Last Online</div>
              <div className="font-bold">{selectedDevice.lastSeenAt ? new Date(selectedDevice.lastSeenAt).toLocaleString() : "Never"}</div>
            </div>
            <div>
              <div className="text-xs text-ink-dim">Reporting Frequency</div>
              <div className="font-bold">Every {selectedDevice.frequency} min</div>
            </div>
            {selectedDevice.batteryLevel != null && (
              <div>
                <div className="text-xs text-ink-dim">Battery</div>
                <div className="font-bold">{selectedDevice.batteryLevel.toFixed(0)}%{selectedDevice.isSolarCharging ? " ☀️ charging" : ""}</div>
              </div>
            )}
            {selectedDevice.signalStrengthDbm != null && (
              <div>
                <div className="text-xs text-ink-dim">Signal</div>
                <div className="font-bold">{selectedDevice.signalStrengthDbm} dBm</div>
              </div>
            )}
            {selectedDevice.firmwareVersion && (
              <div>
                <div className="text-xs text-ink-dim">Firmware</div>
                <div className="font-bold">{selectedDevice.firmwareVersion}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <div className="flex gap-1 mb-4 bg-brand-50 rounded-full p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition ${
              tab === t.key ? 'bg-brand-600 text-white' : 'text-brand-700 hover:bg-brand-100'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "conditions" && (
        <>
          {sensors.length === 0 && (
            <p className="text-ink-dim mb-4">
              No sensors installed on this device yet.{" "}
              {isAdmin ? (
                <Link to={`/devices/${selectedDevice.id}`} className="text-brand-600 font-semibold">Install one</Link>
              ) : (
                "Ask your admin to install one."
              )}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
            {sensors.filter((s) => s.isActive).map((sensor) => {
              const reading = latestBySensor.get(sensor.id);
              const meta = getMetricMeta(sensor.sensorLabel);
              return (
                <Link
                  to={`/devices/${selectedDevice.id}/sensors/${sensor.id}/history`}
                  key={sensor.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-card hover:border-brand-500 hover:-translate-y-0.5 transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 mb-3">
                    {meta.icon}
                  </div>
                  <div className="text-sm text-ink-dim font-medium">{meta.name}</div>
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
                </Link>
              );
            })}
          </div>
        </>
      )}

      {tab === "advisory" && (
        <div className="pb-8">
          <CropSelector device={selectedDevice} />
          <AdvisoryPanel deviceId={selectedDevice.id} hasCrop={selectedDevice.cropId != null} />
        </div>
      )}

      {tab === "insights" && (
        <div className="pb-8">
          <InsightsPanel deviceId={selectedDevice.id} />
        </div>
      )}

      {tab === "forecast" && (
        <div className="pb-8">
          <ForecastPanel
            deviceId={selectedDevice.id}
            hasLocation={selectedDevice.latitude != null && selectedDevice.longitude != null}
          />
        </div>
      )}

      {tab === "analytics" && (
        <div className="pb-8">
          <WindAnalyticsPanel deviceId={selectedDevice.id} />
          <RainAnalyticsPanel deviceId={selectedDevice.id} />
        </div>
      )}

      {tab === "chat" && (
        <div className="pb-8">
          <ChatPanel deviceId={selectedDevice.id} />
        </div>
      )}
    </div>
  );
}