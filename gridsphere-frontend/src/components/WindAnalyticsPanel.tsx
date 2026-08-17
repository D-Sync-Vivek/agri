import { useEffect, useState } from "react";
import { getWindAnalytics, HistoryRange } from "../api/devices";
import { WindAnalytics } from "../types";

const RANGE_TABS: { key: HistoryRange; label: string }[] = [
  { key: "daily", label: "Day" },
  { key: "weekly", label: "Week" },
  { key: "monthly", label: "Month" },
];

export default function WindAnalyticsPanel({ deviceId }: { deviceId: number }) {
  const [range, setRange] = useState<HistoryRange>("weekly");
  const [data, setData] = useState<WindAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getWindAnalytics(deviceId, range)
      .then(setData)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load wind analytics"))
      .finally(() => setIsLoading(false));
  }, [deviceId, range]);

  const hasData = data && (data.windRose?.length > 0 || data.averageSpeedMs !== null);
  const maxCount = data?.windRose?.length ? Math.max(1, ...data.windRose.map((r) => r.count)) : 1;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Wind Analytics</span>
        <div className="flex gap-1">
          {RANGE_TABS.map((t) => (
            <button
              key={t.key}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                range === t.key ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
              onClick={() => setRange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        {isLoading && <div className="text-center text-ink-dim py-6">Loading…</div>}

        {!isLoading && data && !hasData && (
          <p className="text-ink-dim">No wind_speed or wind_direction sensor data in this range yet.</p>
        )}

        {!isLoading && hasData && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Average Speed</div>
                <div>
                  <span className="text-2xl font-extrabold">{data.averageSpeedMs ?? "—"}</span>
                  <span className="text-sm font-semibold text-ink-dim ml-1">m/s</span>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Gust (max)</div>
                <div>
                  <span className="text-2xl font-extrabold">{data.maxGustMs ?? "—"}</span>
                  <span className="text-sm font-semibold text-ink-dim ml-1">m/s</span>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Dominant Direction</div>
                <div className="text-2xl font-extrabold">{data.dominantDirection ?? "—"}</div>
              </div>
            </div>

            {data.windRose && data.windRose.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">Wind Rose</p>
                <div className="flex items-end gap-2 h-36">
                  {data.windRose.map((sector) => (
                    <div key={sector.direction} className="flex-1 text-center">
                      <div
                        className={`rounded-t-sm transition-all ${sector.count > 0 ? 'bg-brand-600' : 'bg-gray-200'}`}
                        style={{ height: `${Math.max(4, (sector.count / maxCount) * 100)}px` }}
                      />
                      <div className="text-xs font-semibold text-ink-dim mt-1.5">{sector.direction}</div>
                      <div className="text-[10px] text-ink-dim">{sector.count}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

