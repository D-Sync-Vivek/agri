import { useEffect, useState } from "react";
import { getAdvisory } from "../api/devices";
import { AiAdvisory, AiRisk } from "../types";
import { RiskGauge } from "./RiskGuage";
import { getDiseaseIcon, getPrecautionIcon } from "./RiskIcons";

const LEVEL_COLOR: Record<string, string> = {
  low: "var(--brand-green-dark)",
  medium: "var(--amber)",
  high: "var(--red)",
};

// The backend only classifies risk as low/medium/high (see AiRisk type) -
// it never emits a real probability. These are representative visual
// bands, not measured percentages; kept conservative so we don't imply
// false precision the model didn't actually generate.
const LEVEL_PCT: Record<string, number> = {
  low: 20,
  medium: 55,
  high: 85,
};

const LEVEL_RANK: Record<string, number> = { low: 0, medium: 1, high: 2 };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, hasCrop]);

  if (!hasCrop) {
    return (
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <span className="panel-title">AI Advisory</span>
        </div>
        <div className="panel-body">
          <p className="muted" style={{ margin: 0 }}>
            Select a crop above to get an AI-generated advisory and pest/fungal risk assessment.
          </p>
        </div>
      </div>
    );
  }

  const overall = advisory ? overallRisk(advisory.risks) : null;

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-header">
        <span className="panel-title">AI Advisory</span>
        <button className="btn-ghost" onClick={() => load(true)} disabled={isLoading}>
          {isLoading ? "Thinking…" : "Refresh"}
        </button>
      </div>
      <div className="panel-body">
        {error && <div className="error-banner">{error}</div>}
        {isLoading && !advisory && <div className="loading-text">Generating advisory…</div>}

        {advisory && overall && (
          <>
            {/* Overall risk gauge - mirrors the "Fungal Infection / Overall Risk" card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px 12px",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, color: "var(--ink-dim)", textTransform: "uppercase" }}>
                Overall Risk
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, marginBottom: 8 }}>{advisory.cropName} Pest &amp; Disease</div>
              <RiskGauge pct={overall.pct} level={overall.level} size={160} />
            </div>

            <p style={{ fontSize: 14, marginBottom: 16 }}>{advisory.summary}</p>

            {advisory.precautions.length > 0 && (
              <>
                <p className="section-title">Precautions</p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, marginBottom: 16 }}>
                  {advisory.precautions.map((p, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        fontSize: 13,
                        marginBottom: 8,
                        color: "var(--ink)",
                      }}
                    >
                      <span style={{ flexShrink: 0, marginTop: 1, color: "var(--brand-green-dark)" }}>{getPrecautionIcon(p)}</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {advisory.risks.length > 0 && (
              <>
                <p className="section-title">Specific Disease Risks</p>
                {advisory.risks.map((r, i) => {
                  const pct = LEVEL_PCT[r.level];
                  const color = LEVEL_COLOR[r.level];
                  return (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: "var(--ink-dim)" }}>{getDiseaseIcon(r.name)}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: "capitalize" }}>{r.level}</span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 999,
                          background: "var(--hairline, #eee)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: color,
                            borderRadius: 999,
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 3 }}>{r.reason}</div>
                    </div>
                  );
                })}
              </>
            )}

            <p className="muted" style={{ fontSize: 11, marginTop: 12, marginBottom: 0 }}>
              Generated {new Date(advisory.generatedAt).toLocaleString()}
              {advisory.fromCache ? " (cached)" : ""} · AI-generated, not a substitute for agronomist advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

