import {
  ThermometerIcon,
  DropletIcon,
  SunIcon,
  WindIcon,
  GaugeIcon,
  CompassIcon,
  LeafIcon,
  CloudIcon,
  RainIcon,
} from "../components/icons";

export interface MetricMeta {
  name: string;
  icon: JSX.Element;
  unit: string;
  /** Optional custom value formatter - e.g. wind direction shows a compass label alongside the degree value. */
  format?: (value: number) => string;
}

// Maps every sensor label this app knows how to display nicely to a
// display name + icon + unit. Any other label the user has installed
// still works fine - it just falls back to a generic look (see
// getMetricMeta below). Ingestion itself (readingController.addReading)
// is fully dynamic and doesn't care about this list at all - this is
// purely a presentation layer.
export const KNOWN_METRICS: Record<string, MetricMeta> = {
  air_temperature: { name: "Air Temperature", icon: <ThermometerIcon />, unit: "°C" },
  humidity: { name: "Humidity", icon: <DropletIcon />, unit: "%" },
  light_intensity: { name: "Light Intensity", icon: <SunIcon />, unit: "lx" },
  wind_speed: { name: "Wind Speed", icon: <WindIcon />, unit: "m/s" },
  wind_direction: { name: "Wind Direction", icon: <CompassIcon />, unit: "°",
    format: (v) => `${Math.round(v)}° ${degreesToCompass(v)}`,
  },
  atmospheric_pressure: { name: "Atmospheric Pressure", icon: <GaugeIcon />, unit: "hPa" },
  rainfall: { name: "Rainfall", icon: <RainIcon />, unit: "mm" },
  soil_moisture: { name: "Soil Moisture", icon: <DropletIcon />, unit: "%" },
  soil_temperature: { name: "Soil Temperature", icon: <ThermometerIcon />, unit: "°C" },
  solar_radiation: { name: "Solar Radiation", icon: <SunIcon />, unit: "W/m²" },
  uv_index: { name: "UV Index", icon: <SunIcon />, unit: "" },
  leaf_wetness: { name: "Leaf Wetness", icon: <LeafIcon />, unit: "%" },
  pm1: { name: "PM1", icon: <CloudIcon />, unit: "µg/m³" },
  pm2_5: { name: "PM2.5", icon: <CloudIcon />, unit: "µg/m³" },
  pm10: { name: "PM10", icon: <CloudIcon />, unit: "µg/m³" },
  co2: { name: "CO2", icon: <CloudIcon />, unit: "ppm" },
  tvoc: { name: "TVOC", icon: <CloudIcon />, unit: "ppb" },
  bmp_temperature: { name: "BMP Temperature", icon: <ThermometerIcon />, unit: "°C" },
  altitude: { name: "Altitude", icon: <GaugeIcon />, unit: "m" },
};

/** 16-point compass rose from a wind direction in degrees (0 = North). */
export function degreesToCompass(deg: number): string {
  const directions = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index < 0 ? index + 16 : index];
}

export function getMetricMeta(sensorLabel: string): MetricMeta {
  return (
    KNOWN_METRICS[sensorLabel.toLowerCase()] ?? {
      name: sensorLabel,
      icon: <ThermometerIcon />,
      unit: "",
    }
  );
}

/** Formats a reading's value using the metric's custom formatter if it has one, otherwise a plain decimal + unit. */
export function formatMetricValue(sensorLabel: string, value: number): string {
  const meta = getMetricMeta(sensorLabel);
  if (meta.format) return meta.format(value);
  return `${value.toFixed(1)}${meta.unit ? " " + meta.unit : ""}`;
}

