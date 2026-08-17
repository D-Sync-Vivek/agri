import { useEffect, useState } from "react";
import { getAdvisory } from "../api/devices";
import { AiAdvisory, AiRisk } from "../types";
import { RiskGauge } from "./RiskGuage";
import { getDiseaseIcon, getPrecautionIcon } from "./RiskIcons";

const LEVEL_COLOR: Record<string, string> = {
  low: "#339e5d",
  medium: "#e0932e",
  high: "#d64545",
};

const LEVEL_PCT: Record<string, number> = { low: 20, medium: 55, high: 85 };
const LEVEL_RANK: Record<string, number> = { low: 0, medium: 1, high: 2 };

// Map level to Tailwind text color class
const LEVEL_TEXT_CLASS: Record<string, string> = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-red-600",
};

function overallRisk(risks: AiRisk[]): { level: "low" | "medium" | "high"; pct: number } {
  if (risks.length === 0) return { level: "low", pct: 0 };
  const worst = risks.reduce((a, b) => (LEVEL_RANK[b.level] > LEVEL_RANK[a.level] ? b : a));
  return { level: worst.level, pct: LEVEL_PCT[worst.level] };
}

export default function AdvisoryPanel({ deviceId, hasCrop }: { deviceId: number; hasCrop: boolean }) {
  const [advisory, setAdvisory] = useState<AiAdvisory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load(refresh = false) {
    setIsLoading(true);
    setError(null);
    getAdvisory(deviceId, refresh)
      .then(setAdvisory)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load AI advisory"))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    if (hasCrop) load();
  }, [deviceId, hasCrop]);

  if (!hasCrop) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-200">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">AI Advisory</span>
        </div>
        <div className="p-5">
          <p className="text-ink-dim">Select a crop above to get an AI-generated advisory and pest/fungal risk assessment.</p>
        </div>
      </div>
    );
  }

  const overall = advisory ? overallRisk(advisory.risks) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">AI Advisory</span>
        <button onClick={() => load(true)} disabled={isLoading} className="bg-brand-50 text-brand-700 font-semibold px-4 py-2 rounded-full text-sm hover:brightness-95 transition disabled:opacity-50">
          {isLoading ? "Thinking…" : "Refresh"}
        </button>
      </div>
      <div className="p-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        {isLoading && !advisory && <div className="text-center text-ink-dim py-6">Generating advisory…</div>}

        {advisory && overall && (
          <>
            <div className="flex flex-col items-center py-4 mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-ink-dim">Overall Risk</div>
              <div className="text-sm font-bold mt-1 mb-2">{advisory.cropName} Pest &amp; Disease</div>
              <RiskGauge pct={overall.pct} level={overall.level} size={160} />
            </div>

            <p className="text-sm mb-4">{advisory.summary}</p>

            {advisory.precautions.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">Precautions</p>
                <ul className="list-none m-0 p-0 mb-4">
                  {advisory.precautions.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm mb-2 text-ink">
                      <span className="shrink-0 mt-0.5 text-brand-700">{getPrecautionIcon(p)}</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {advisory.risks.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">Specific Disease Risks</p>
                {advisory.risks.map((r, i) => {
                  const pct = LEVEL_PCT[r.level];
                  const color = LEVEL_COLOR[r.level];
                  const textClass = LEVEL_TEXT_CLASS[r.level];
                  return (
                    <div key={i} className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-ink-dim">{getDiseaseIcon(r.name)}</span>
                          <span className="font-semibold text-sm">{r.name}</span>
                        </div>
                        <span className={`text-xs font-bold capitalize ${textClass}`}>{r.level}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div className="text-xs text-ink-dim mt-1">{r.reason}</div>
                    </div>
                  );
                })}
              </>
            )}

            <p className="text-xs text-ink-dim mt-3">
              Generated {new Date(advisory.generatedAt).toLocaleString()}
              {advisory.fromCache ? " (cached)" : ""} · AI-generated, not a substitute for agronomist advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

