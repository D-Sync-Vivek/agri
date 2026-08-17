import { useEffect, useState } from "react";
import { getInsights } from "../api/devices";
import { Insights } from "../types";

export default function InsightsPanel({ deviceId }: { deviceId: number }) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInsights(deviceId)
      .then(setInsights)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load insights"));
  }, [deviceId]);

  if (error) return null; // hide on error
  if (!insights) return <div className="text-center text-ink-dim py-6">Loading insights…</div>;

  const { derivedMetrics, advisories } = insights;
  const hasAnyDerived =
    derivedMetrics.dewPointC !== null ||
    derivedMetrics.heatIndexC !== null ||
    derivedMetrics.vpdKPa !== null ||
    derivedMetrics.et0MmPerDay !== null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Rule-Based Insights</span>
        <span className="text-xs text-ink-dim">not AI/ML</span>
      </div>
      <div className="p-5">
        {hasAnyDerived && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {derivedMetrics.dewPointC !== null && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Dew Point</div>
                <div>
                  <span className="text-2xl font-extrabold">{derivedMetrics.dewPointC}</span>
                  <span className="text-sm font-semibold text-ink-dim ml-1">°C</span>
                </div>
              </div>
            )}
            {derivedMetrics.heatIndexC !== null && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Feels Like</div>
                <div>
                  <span className="text-2xl font-extrabold">{derivedMetrics.heatIndexC}</span>
                  <span className="text-sm font-semibold text-ink-dim ml-1">°C</span>
                </div>
              </div>
            )}
            {derivedMetrics.vpdKPa !== null && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">VPD</div>
                <div>
                  <span className="text-2xl font-extrabold">{derivedMetrics.vpdKPa}</span>
                  <span className="text-sm font-semibold text-ink-dim ml-1">kPa</span>
                </div>
              </div>
            )}
            {derivedMetrics.et0MmPerDay !== null && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Evapotranspiration</div>
                <div>
                  <span className="text-2xl font-extrabold">{derivedMetrics.et0MmPerDay}</span>
                  <span className="text-sm font-semibold text-ink-dim ml-1">mm/day</span>
                </div>
              </div>
            )}
          </div>
        )}

        {advisories.length === 0 ? (
          <p className="text-ink-dim">No advisories right now.</p>
        ) : (
          advisories.map((a, i) => (
            <div
              key={i}
              className={`flex gap-2.5 items-start py-2.5 ${i > 0 ? 'border-t border-gray-200' : ''}`}
            >
              <span>{a.severity === "warning" ? "⚠️" : "ℹ️"}</span>
              <span className="text-sm">{a.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

