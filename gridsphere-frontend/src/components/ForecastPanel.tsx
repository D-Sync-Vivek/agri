import { useEffect, useState } from "react";
import { getForecast } from "../api/devices";
import { ForecastResult } from "../types";

export default function ForecastPanel({ deviceId, hasLocation }: { deviceId: number; hasLocation: boolean }) {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasLocation) return;
    getForecast(deviceId)
      .then(setForecast)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load forecast"));
  }, [deviceId, hasLocation]);

  if (!hasLocation) {
    return (
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <span className="panel-title">7-Day Forecast</span>
        </div>
        <div className="panel-body">
          <p className="muted" style={{ margin: 0 }}>
            Set a latitude/longitude on this device to see a forecast.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <span className="panel-title">7-Day Forecast</span>
        </div>
        <div className="panel-body">
          <p className="muted" style={{ margin: 0 }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return <div className="loading-text">Loading forecast…</div>;
  }

  const days = forecast.daily.time.map((date, i) => ({
    date,
    max: forecast.daily.temperature_2m_max[i],
    min: forecast.daily.temperature_2m_min[i],
    rainProb: forecast.daily.precipitation_probability_max[i],
  }));

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-header">
        <span className="panel-title">7-Day Forecast</span>
        <span className="muted" style={{ fontSize: 11 }}>
          via Open-Meteo
        </span>
      </div>
      <div className="panel-body" style={{ overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 12, minWidth: "max-content" }}>
          {days.map((d) => (
            <div
              key={d.date}
              style={{
                minWidth: 90,
                textAlign: "center",
                padding: "10px 8px",
                borderRadius: "var(--radius-sm)",
                background: "var(--brand-green-light)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--ink-dim)", marginBottom: 6 }}>
                {new Date(d.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {Math.round(d.max)}° / {Math.round(d.min)}°
              </div>
              <div style={{ fontSize: 11, color: "var(--brand-green-dark)", marginTop: 4 }}>
                💧 {Math.round(d.rainProb)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


