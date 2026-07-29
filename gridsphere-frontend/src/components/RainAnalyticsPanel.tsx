import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getRainAnalytics, HistoryRange } from "../api/devices";
import { RainAnalytics } from "../types";

const RANGE_TABS: { key: HistoryRange; label: string }[] = [
  { key: "daily", label: "Day" },
  { key: "weekly", label: "Week" },
  { key: "monthly", label: "Month" },
];

export default function RainAnalyticsPanel({ deviceId }: { deviceId: number }) {
  const [range, setRange] = useState<HistoryRange>("weekly");
  const [data, setData] = useState<RainAnalytics | null | undefined>(undefined); // undefined = loading, null = no rain sensor
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(undefined);
    getRainAnalytics(deviceId, range)
      .then(setData)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load rain analysis"));
  }, [deviceId, range]);

 const chartData = data?.cumulativeSeries?.map((d) => ({
  date: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  mm: d.mm,
})) ?? [];

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-header">
        <span className="panel-title">Rain Analysis</span>
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

        {data === undefined && !error && <div className="loading-text">Loading…</div>}

        {data === null && (
          <p className="muted" style={{ margin: 0 }}>
            No rainfall sensor installed on this device yet.
          </p>
        )}

        {data && (
          <>
            <div className="readout-grid" style={{ marginBottom: 18 }}>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Today</div>
                <div>
                  <span className="readout-value">{data.todayMm ?? "—"}</span>
                  <span className="readout-unit">mm</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">This Week</div>
                <div>
                  <span className="readout-value">{data.weeklyMm ?? "—"}</span>
                  <span className="readout-unit">mm</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">This Month</div>
                <div>
                  <span className="readout-value">{data.monthlyMm ?? "—"}</span>
                  <span className="readout-unit">mm</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Heaviest Reading</div>
                <div>
                  <span className="readout-value">{data.maxIntensityMmPerHour ?? "—"}</span>
                  <span className="readout-unit">mm</span>
                </div>
              </div>
            </div>

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="var(--ink-dim)" fontSize={11} tick={{ fill: "var(--ink-dim)" }} />
                  <YAxis stroke="var(--ink-dim)" fontSize={11} tick={{ fill: "var(--ink-dim)" }} unit="mm" />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--hairline)", fontSize: 12 }}
                    labelStyle={{ color: "var(--ink)" }}
                    formatter={(value: number) => [`${value} mm`, "Rainfall"]}
                  />
                  <Bar dataKey="mm" fill="#2F86C9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                No rainfall recorded in this range yet.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}