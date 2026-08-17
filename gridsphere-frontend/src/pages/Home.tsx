import { useEffect, useMemo, useState } from "react";
import { useDevices } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { listDeviceSensors, getRecentReadings } from "../api/sensors";
import { DeviceSensor, SensorReading } from "../types";
import { getMetricMeta } from "../utils/metrics";
import { Link } from "react-router-dom";
import { WifiOffIcon } from "../components/icons";
import DeviceVitalsBanner from "../components/DeviceVitalsBanner";
import SensorCard from "../components/SensorCard";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { getDeviceSubscription } from "../api/subscriptions";

function getReadingStatus(sensorLabel: string, value: number): { label: string; className: string } {
  const label = sensorLabel.toLowerCase();
  const optimal = { label: "Optimal", className: "bg-green-100 text-green-800" };
  const warning = { label: "Warning", className: "bg-yellow-100 text-yellow-800" };
  const stable = { label: "Stable", className: "bg-gray-100 text-gray-600" };

  if (label.includes("humidity") && (value < 30 || value > 80)) return warning;
  if (label.includes("leaf_wetness") && value > 60) return warning;
  if (label.includes("soil_moisture") && (value < 15 || value > 70)) return warning;
  if (["wind_direction", "atmospheric_pressure"].some((k) => label.includes(k))) return stable;
  return optimal;
}

export default function Home() {
  const { selectedDevice, isLoading: devicesLoading, error: devicesError } = useDevices();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [sensors, setSensors] = useState<DeviceSensor[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  // Check subscription – admins have automatic access
  useEffect(() => {
    if (!selectedDevice) return;

    if (isAdmin) {
      setHasAccess(true);
      return;
    }

    getDeviceSubscription(selectedDevice.id)
      .then((sub) => setHasAccess(!!sub))
      .catch(() => setHasAccess(false));
  }, [selectedDevice, isAdmin]);

  // Load sensors and readings (only if access is granted)
  useEffect(() => {
    if (!selectedDevice || hasAccess !== true) return;
    setError(null);
    Promise.all([listDeviceSensors(selectedDevice.id), getRecentReadings(selectedDevice.id, 100)])
      .then(([s, r]) => {
        setSensors(s);
        setReadings(r);
      })
      .catch((err) => setError(err?.response?.data?.detail || "Could not load field conditions"));
  }, [selectedDevice, hasAccess]);

  // Latest reading per sensor
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

  // Group all readings by sensor for sparklines
  const readingsBySensor = useMemo(() => {
    const map = new Map<number, SensorReading[]>();
    for (const r of readings) {
      if (!map.has(r.deviceSensorId)) {
        map.set(r.deviceSensorId, []);
      }
      map.get(r.deviceSensorId)!.push(r);
    }
    return map;
  }, [readings]);

  // Humidity sensor for the large card
  const humiditySensor = sensors.find((s) => s.sensorLabel.toLowerCase() === "humidity" && s.isActive);
  const humidityReadings = useMemo(() => {
    if (!humiditySensor) return [];
    return readings
      .filter((r) => r.deviceSensorId === humiditySensor.id)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-24);
  }, [readings, humiditySensor]);

  const isNeverConnected = selectedDevice ? selectedDevice.status === "inactive" : false;
  const isOffline = selectedDevice ? selectedDevice.status === "offline" : false;

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

  // Subscription loading state
  if (hasAccess === null) {
    return <div className="text-center text-ink-dim py-12">Verifying access…</div>;
  }

  // Access denied – no active subscription
  if (hasAccess === false) {
    return (
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <h3 className="text-lg font-bold mb-2">Subscription required</h3>
          <p className="text-ink-dim mb-4">
            You need an active subscription to view data for this device.
          </p>
          <Link to="/my-devices" className="inline-block bg-brand-600 text-white font-semibold px-4 py-2 rounded-full hover:brightness-95 transition">
            Subscribe now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-extrabold">Device {selectedDevice.id} Overview</h1>
        <span className="text-sm text-ink-dim">
          Updated {new Date().toLocaleTimeString(undefined, { hour12: false })}
        </span>
      </div>

      {(isOffline || isNeverConnected) && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
          <WifiOffIcon size={18} />
          <span className="text-sm font-semibold">
            {isNeverConnected ? "Not yet connected" : "Inactive"}
            {selectedDevice.lastSeenAt && (
              <> • Last seen {new Date(selectedDevice.lastSeenAt).toLocaleString()}</>
            )}
          </span>
        </div>
      )}

      <DeviceVitalsBanner device={selectedDevice} />

      {sensors.filter((s) => s.isActive).length === 0 && (
        <p className="text-ink-dim my-4">
          No sensors installed on this device yet.{" "}
          {isAdmin ? (
            <Link to={`/devices/${selectedDevice.id}`} className="text-brand-600 font-semibold">Install one</Link>
          ) : (
            "Ask your admin to install one."
          )}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4 w-full overflow-hidden">
        {sensors
          .filter((s) => s.isActive)
          .map((sensor) => {
            const reading = latestBySensor.get(sensor.id);
            const status = reading ? getReadingStatus(sensor.sensorLabel, reading.value) : null;
            const isHumidity = sensor.sensorLabel.toLowerCase() === "humidity";
            const historyForSensor = readingsBySensor.get(sensor.id) || [];

            if (isHumidity && humidityReadings.length > 1) {
              return (
                <div
                  key={sensor.id}
                  className="col-span-1 sm:col-span-2 row-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-card flex flex-col min-w-0 overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 shrink-0">
                        {getMetricMeta(sensor.sensorLabel).icon}
                      </div>
                      <h3 className="text-lg font-semibold truncate">Humidity</h3>
                    </div>
                    {status && (
                      <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${status.className}`}>
                        {status.label}
                      </span>
                    )}
                  </div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold">
                      {reading ? reading.value.toFixed(1) : "—"}
                    </span>
                    <span className="text-xl text-gray-500">%</span>
                  </div>
                  <div className="grow w-full h-40 min-h-0 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={humidityReadings.map((r) => ({ time: new Date(r.recordedAt).toLocaleTimeString(), value: r.value }))}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={["auto", "auto"]} hide />
                        <Tooltip
                          contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", fontSize: 12 }}
                          labelStyle={{ color: "#1a2421" }}
                          formatter={(value: number) => [`${value.toFixed(1)} %`, "Humidity"]}
                        />
                        <Line type="monotone" dataKey="value" stroke="#16A34A" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 text-right">
                    Last {humidityReadings.length} readings
                  </div>
                </div>
              );
            }

            return (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                reading={reading || undefined}
                historyData={historyForSensor}
                deviceId={selectedDevice.id}
                statusLabel={status?.label || ""}
                statusClass={status?.className || "bg-gray-100 text-gray-600"}
              />
            );
          })}
      </div>
    </div>
  );
}

