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
      <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-200">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">7-Day Forecast</span>
        </div>
        <div className="p-5">
          <p className="text-ink-dim">Set a latitude/longitude on this device to see a forecast.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-200">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">7-Day Forecast</span>
        </div>
        <div className="p-5">
          <p className="text-ink-dim">{error}</p>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return <div className="text-center text-ink-dim py-6">Loading forecast…</div>;
  }

  const days = forecast.daily.time.map((date, i) => ({
    date,
    max: forecast.daily.temperature_2m_max[i],
    min: forecast.daily.temperature_2m_min[i],
    rainProb: forecast.daily.precipitation_probability_max[i],
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">7-Day Forecast</span>
        <span className="text-xs text-ink-dim">via Open-Meteo</span>
      </div>
      <div className="p-5 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {days.map((d) => (
            <div key={d.date} className="min-w-[90px] text-center p-2.5 rounded-lg bg-brand-50">
              <div className="text-xs text-ink-dim mb-1.5">
                {new Date(d.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
              </div>
              <div className="font-bold text-sm">
                {Math.round(d.max)}° / {Math.round(d.min)}°
              </div>
              <div className="text-xs text-brand-700 mt-1">💧 {Math.round(d.rainProb)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}