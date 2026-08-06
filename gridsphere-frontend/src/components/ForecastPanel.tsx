import { useEffect, useState } from "react";
import { getForecast } from "../api/devices";
import { ForecastResult } from "../types";
import { Sun, Cloud, CloudRain, Droplets, Thermometer } from "lucide-react";

// Helper to get weather icon based on rain probability and temperature
function getWeatherIcon(rainProb: number, temp: number): JSX.Element {
  if (rainProb > 70) return <CloudRain className="w-8 h-8 text-blue-500" />;
  if (rainProb > 40) return <Cloud className="w-8 h-8 text-gray-500" />;
  if (temp > 25) return <Sun className="w-8 h-8 text-yellow-500" />;
  return <Sun className="w-8 h-8 text-yellow-300" />;
}

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
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {days.map((d) => {
            const avgTemp = (d.max + d.min) / 2;
            return (
              <div
                key={d.date}
                className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="text-xs font-semibold text-ink-dim mb-1">
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                </div>
                <div className="flex justify-center my-2">{getWeatherIcon(d.rainProb, avgTemp)}</div>
                <div className="flex justify-center items-baseline gap-1">
                  <span className="text-lg font-bold">{Math.round(d.max)}°</span>
                  <span className="text-sm text-ink-dim">/{Math.round(d.min)}°</span>
                </div>
                <div className="flex items-center justify-center gap-1 mt-1 text-xs text-ink-dim">
                  <Droplets className="w-3 h-3" />
                  <span>{Math.round(d.rainProb)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}