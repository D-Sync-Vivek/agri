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
  const [data, setData] = useState<RainAnalytics | null | undefined>(undefined);
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
    <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Rain Analysis</span>
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

        {data === undefined && !error && <div className="text-center text-ink-dim py-6">Loading…</div>}

        {data === null && (
          <p className="text-ink-dim">No rainfall sensor installed on this device yet.</p>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Today</div>
                <div>
                  <span className="text-2xl font-extrabold">{data.todayMm ?? "—"}</span>
                  <span className="text-sm font-semibold text-ink-dim ml-1">mm</span>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">This Week</div>
                <div>
                  <span className="text-2xl font-extrabold">{data.weeklyMm ?? "—"}</span>
                  <span className="text-sm font-semibold text-ink-dim ml-1">mm</span>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">This Month</div>
                <div>
                  <span className="text-2xl font-extrabold">{data.monthlyMm ?? "—"}</span>
                  <span className="text-sm font-semibold text-ink-dim ml-1">mm</span>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
                <div className="text-sm text-ink-dim font-medium">Heaviest Reading</div>
                <div>
                  <span className="text-2xl font-extrabold">{data.maxIntensityMmPerHour ?? "—"}</span>
                  <span className="text-sm font-semibold text-ink-dim ml-1">mm</span>
                </div>
              </div>
            </div>

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#6b7a73" fontSize={11} tick={{ fill: "#6b7a73" }} />
                  <YAxis stroke="#6b7a73" fontSize={11} tick={{ fill: "#6b7a73" }} unit="mm" />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", fontSize: 12 }}
                    labelStyle={{ color: "#1a2421" }}
                    formatter={(value: number) => [`${value} mm`, "Rainfall"]}
                  />
                  <Bar dataKey="mm" fill="#2F86C9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-ink-dim">No rainfall recorded in this range yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

