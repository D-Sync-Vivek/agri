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

  // Check if we have any wind data
  const hasData = data && (data.windRose?.length > 0 || data.averageSpeedMs !== null);

  // For wind rose: compute max count for scaling
  const maxCount = data?.windRose?.length ? Math.max(1, ...data.windRose.map((r) => r.count)) : 1;

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-header">
        <span className="panel-title">Wind Analytics</span>
        <div className="flex-row">
          {RANGE_TABS.map((t) => (
            <button
              key={t.key}
              className="btn-ghost"
              style={{
                borderColor: range === t.key ? "var(--brand-green)" : undefined,
                background: range === t.key ? "var(--brand-green)" : undefined,
                color: range === t.key ? "#fff" : undefined,
              }}
              onClick={() => setRange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="panel-body">
        {error && <div className="error-banner">{error}</div>}
        {isLoading && <div className="loading-text">Loading…</div>}

        {!isLoading && data && !hasData && (
          <p className="muted" style={{ margin: 0 }}>
            No wind_speed or wind_direction sensor data in this range yet.
          </p>
        )}

        {!isLoading && hasData && (
          <>
            <div className="readout-grid" style={{ marginBottom: 18 }}>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Average Speed</div>
                <div>
                  <span className="readout-value">{data.averageSpeedMs ?? "—"}</span>
                  <span className="readout-unit">m/s</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Gust (max)</div>
                <div>
                  <span className="readout-value">{data.maxGustMs ?? "—"}</span>
                  <span className="readout-unit">m/s</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Dominant Direction</div>
                <div>
                  <span className="readout-value" style={{ fontSize: 20 }}>
                    {data.dominantDirection ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Wind Rose Chart */}
            {data.windRose && data.windRose.length > 0 && (
              <>
                <p className="section-title">Wind Rose</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                  {data.windRose.map((sector) => (
                    <div key={sector.direction} style={{ flex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          height: `${Math.max(4, (sector.count / maxCount) * 100)}px`,
                          background: sector.count > 0 ? "var(--brand-green)" : "var(--hairline)",
                          borderRadius: 4,
                          marginBottom: 6,
                        }}
                      />
                      <div style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 600 }}>{sector.direction}</div>
                      <div style={{ fontSize: 10, color: "var(--ink-dim)" }}>{sector.count}</div>
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