const LEVEL_COLOR: Record<string, string> = {
  low: "#339e5d",   // brand-500
  medium: "#e0932e", // amber
  high: "#d64545",   // red
};

interface RiskGaugeProps {
  pct: number; // 0-100
  level: "low" | "medium" | "high";
  size?: number;
}

export function RiskGauge({ pct, level, size = 140 }: RiskGaugeProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  const strokeWidth = 12;
  const r = size / 2 - strokeWidth;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  const color = LEVEL_COLOR[level] || LEVEL_COLOR.low;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${clamped} percent, ${level} risk`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - clamped / 100)}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * 0.2} fontWeight={700} fill="#103621">
        {clamped}%
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize={size * 0.08} fill="#5b7568" style={{ textTransform: "capitalize" }}>
        {level} risk
      </text>
    </svg>
  );
}

