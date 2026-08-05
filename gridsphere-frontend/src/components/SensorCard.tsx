import { Activity } from "lucide-react";
import { DeviceSensor, SensorReading } from "../types";
import { getMetricMeta, formatMetricValue } from "../utils/metrics";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface Props {
  sensor: DeviceSensor;
  reading?: SensorReading;
  historyData?: SensorReading[];
  deviceId: number;
  statusLabel: string;
  statusClass: string;
  className?: string;
}

// A palette of 12 harmonious colors (not too bright, not too dark)
const SPARKLINE_COLORS = [
  "#339e5d", // green
  "#2F86C9", // blue
  "#E0932E", // amber
  "#9b7fc7", // purple
  "#D64545", // red
  "#5F9EA0", // cadet blue
  "#CD853F", // peru
  "#6A5ACD", // slate blue
  "#20B2AA", // light sea green
  "#DAA520", // goldenrod
  "#8FBC8F", // dark sea green
  "#B8860B", // dark goldenrod
];

// Deterministic hash for consistent color per sensor
function getColorForSensor(sensor: DeviceSensor): string {
  const str = `${sensor.sensorLabel}-${sensor.id}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % SPARKLINE_COLORS.length;
  return SPARKLINE_COLORS[index];
}

export default function SensorCard({
  sensor,
  reading,
  historyData = [],
  deviceId,
  statusLabel,
  statusClass,
  className = "",
}: Props) {
  const meta = getMetricMeta(sensor.sensorLabel);
  const value = reading ? reading.value : null;

  // Prepare sparkline data
  const sparkData = historyData
    .filter((r) => r.value !== null && r.value !== undefined)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-24)
    .map((r) => ({
      value: r.value,
    }));

  // Get consistent color for this sensor
  const lineColor = getColorForSensor(sensor);

  return (
    <Link
      to={`/devices/${deviceId}/sensors/${sensor.id}/history`}
      className={`min-w-0 overflow-hidden bg-white rounded-2xl border border-gray-200 p-4 shadow-card flex flex-col hover:border-brand-500 hover:-translate-y-0.5 transition ${className}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-full bg-brand-50 flex items-center justify-center text-brand-700">
            {meta.icon}
          </div>
          <span className="text-sm text-gray-600 font-medium truncate">{meta.name}</span>
        </div>
        {statusLabel && (
          <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusClass}`}>
            {statusLabel}
          </span>
        )}
      </div>
      <div className="my-2 truncate">
        {value !== null ? (
          <div className="text-2xl font-extrabold text-ink truncate">
            {formatMetricValue(sensor.sensorLabel, value)}
          </div>
        ) : (
          <div className="text-2xl font-extrabold text-gray-400">—</div>
        )}
      </div>

      {/* Sparkline */}
      {sparkData.length > 1 && (
        <div className="w-full h-11.5 -mt-1 -mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`sparkGrad-${sensor.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                fill={`url(#sparkGrad-${sensor.id})`}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex justify-between items-end mt-1">
        <span className="text-[10px] text-gray-400 truncate">
          Updated {reading ? new Date(reading.recordedAt).toLocaleTimeString() : "never"}
        </span>
        <Activity className="w-4 h-4 text-gray-300 shrink-0" />
      </div>
    </Link>
  );
}