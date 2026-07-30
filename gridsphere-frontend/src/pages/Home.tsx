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

/** "9h 20m ago" / "3m ago" / "just now" style relative time, matching the compact station-console look. */
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

  // "inactive" (never connected) and "offline" (stopped reporting) both
  // just mean "not currently active" for the banner, but get slightly
  // different copy so a brand-new device doesn't look like it "broke".
  const isNeverConnected = selectedDevice ? selectedDevice.status === "inactive" : false;
  const isOffline = selectedDevice ? selectedDevice.status === "offline" : false;
  const isActive = selectedDevice ? selectedDevice.status === "active" : false;

  if (devicesLoading) {
    return <div className="loading-text">Loading console…</div>;
  }

  if (devicesError) {
    return (
      <div className="container">
        <div className="error-banner" style={{ marginTop: 20 }}>
          {devicesError}
        </div>
      </div>
    );
  }

  if (!selectedDevice) {
    return (
      <div className="container">
        <div className="empty-state panel" style={{ marginTop: 24 }}>
          <h3>No devices yet</h3>
          {isAdmin ? (
            <>
              <p>Register a weather station device to start seeing live field conditions.</p>
              <Link to="/devices" className="btn-ghost" style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}>
                Go to Devices
              </Link>
            </>
          ) : (
            <p>No device has been assigned to your account yet. Ask your admin to grant you access to one.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header" style={{ marginTop: 16 }}>
        <h1 className="page-title">Device {selectedDevice.id} Overview</h1>
        {updatedAt && (
          <span className="muted" style={{ fontSize: 13 }}>
            Updated {updatedAt.toLocaleTimeString(undefined, { hour12: false })}
          </span>
        )}
      </div>

      {(isOffline || isNeverConnected) && (
        <div className="offline-banner" style={{ alignItems: "center", padding: "12px 16px", margin: "12px 0 20px" }}>
          <WifiOffIcon size={18} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {isNeverConnected ? "Not yet connected" : "Inactive"}
            {selectedDevice.lastSeenAt && (
              <>
                {" "}
                • Last seen {formatRelativeTime(selectedDevice.lastSeenAt)}
              </>
            )}
          </span>
        </div>
      )}

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <span className="panel-title">Field Information</span>
        </div>
        <div className="panel-body">
          <div className="info-grid">
            <div>
              <div className="info-item-label">Device ID</div>
              <div className="info-item-value">{selectedDevice.id}</div>
            </div>
            <div>
              <div className="info-item-label">Status</div>
              <div className={`info-item-value ${isActive ? "status-ok" : isOffline ? "status-bad" : ""}`}>
                {isActive ? "Online" : isOffline ? "Offline" : "Not yet connected"}
              </div>
            </div>
            <div>
              <div className="info-item-label">Location</div>
              <div className="info-item-value">{selectedDevice.locationName || "Not set"}</div>
            </div>
            <div>
              <div className="info-item-label">Last Online</div>
              <div className="info-item-value">
                {selectedDevice.lastSeenAt ? new Date(selectedDevice.lastSeenAt).toLocaleString() : "Never"}
              </div>
            </div>
            <div>
              <div className="info-item-label">Reporting Frequency</div>
              <div className="info-item-value">Every {selectedDevice.frequency} min</div>
            </div>
            {selectedDevice.batteryLevel != null && (
              <div>
                <div className="info-item-label">Battery</div>
                <div className="info-item-value">
                  {selectedDevice.batteryLevel.toFixed(0)}%{selectedDevice.isSolarCharging ? " ☀️ charging" : ""}
                </div>
              </div>
            )}
            {selectedDevice.signalStrengthDbm != null && (
              <div>
                <div className="info-item-label">Signal</div>
                <div className="info-item-value">{selectedDevice.signalStrengthDbm} dBm</div>
              </div>
            )}
            {selectedDevice.firmwareVersion && (
              <div>
                <div className="info-item-label">Firmware</div>
                <div className="info-item-value">{selectedDevice.firmwareVersion}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "conditions" && (
        <>
          {sensors.length === 0 && (
            <p className="muted">
              No sensors installed on this device yet.{" "}
              {isAdmin ? (
                <Link to={`/devices/${selectedDevice.id}`} style={{ color: "var(--brand-green)", fontWeight: 600 }}>
                  Install one
                </Link>
              ) : (
                "Ask your admin to install one."
              )}
            </p>
          )}

          <div className="readout-grid" style={{ paddingBottom: 32 }}>
            {sensors
              .filter((s) => s.isActive)
              .map((sensor) => {
                const reading = latestBySensor.get(sensor.id);
                const meta = getMetricMeta(sensor.sensorLabel);
                return (
                  <Link
                    to={`/devices/${selectedDevice.id}/sensors/${sensor.id}/history`}
                    className="readout-tile"
                    key={sensor.id}
                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  >
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
                            <span className="readout-value">{reading.value.toFixed(1)}</span>
                            <span className="readout-unit">{meta.unit}</span>
                          </>
                        )
                      ) : (
                        <span className="readout-value">—</span>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>
        </>
      )}

      {tab === "advisory" && (
        <div style={{ paddingBottom: 32 }}>
          <CropSelector device={selectedDevice} />
          <AdvisoryPanel deviceId={selectedDevice.id} hasCrop={selectedDevice.cropId != null} />
        </div>
      )}

      {tab === "insights" && (
        <div style={{ paddingBottom: 32 }}>
          <InsightsPanel deviceId={selectedDevice.id} />
        </div>
      )}

      {tab === "forecast" && (
        <div style={{ paddingBottom: 32 }}>
          <ForecastPanel
            deviceId={selectedDevice.id}
            hasLocation={selectedDevice.latitude != null && selectedDevice.longitude != null}
          />
        </div>
      )}

      {tab === "analytics" && (
        <div style={{ paddingBottom: 32 }}>
          <WindAnalyticsPanel deviceId={selectedDevice.id} />
          <RainAnalyticsPanel deviceId={selectedDevice.id} />
        </div>
      )}

      {tab === "chat" && (
        <div style={{ paddingBottom: 32 }}>
          <ChatPanel deviceId={selectedDevice.id} />
        </div>
      )}
    </div>
  );
}