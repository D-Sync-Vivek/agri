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

  if (error) return null; // don't clutter Home with a hard error for an optional panel
  if (!insights) return <div className="loading-text">Loading insights…</div>;

  const { derivedMetrics, advisories } = insights;
  const hasAnyDerived =
    derivedMetrics.dewPointC !== null ||
    derivedMetrics.heatIndexC !== null ||
    derivedMetrics.vpdKPa !== null ||
    derivedMetrics.et0MmPerDay !== null;

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-header">
        <span className="panel-title">Rule-Based Insights</span>
        <span className="muted" style={{ fontSize: 11 }}>
          not AI/ML
        </span>
      </div>
      <div className="panel-body">
        {hasAnyDerived && (
          <div className="readout-grid" style={{ marginBottom: advisories.length > 0 ? 16 : 0 }}>
            {derivedMetrics.dewPointC !== null && (
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Dew Point</div>
                <div>
                  <span className="readout-value">{derivedMetrics.dewPointC}</span>
                  <span className="readout-unit">°C</span>
                </div>
              </div>
            )}
            {derivedMetrics.heatIndexC !== null && (
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Feels Like</div>
                <div>
                  <span className="readout-value">{derivedMetrics.heatIndexC}</span>
                  <span className="readout-unit">°C</span>
                </div>
              </div>
            )}
            {derivedMetrics.vpdKPa !== null && (
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">VPD</div>
                <div>
                  <span className="readout-value">{derivedMetrics.vpdKPa}</span>
                  <span className="readout-unit">kPa</span>
                </div>
              </div>
            )}
            {derivedMetrics.et0MmPerDay !== null && (
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Evapotranspiration</div>
                <div>
                  <span className="readout-value">{derivedMetrics.et0MmPerDay}</span>
                  <span className="readout-unit">mm/day</span>
                </div>
              </div>
            )}
          </div>
        )}

        {advisories.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No advisories right now.
          </p>
        ) : (
          advisories.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "10px 0",
                borderTop: i > 0 ? "1px solid var(--hairline)" : "none",
              }}
            >
              <span>{a.severity === "warning" ? "⚠️" : "ℹ️"}</span>
              <span style={{ fontSize: 13 }}>{a.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


