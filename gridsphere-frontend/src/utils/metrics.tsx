import {
  Thermometer,
  Droplets,
  Sun,
  Wind,
  Gauge,
  Compass,
  Leaf,
  Cloud,
  CloudRain,
  Waves,
  Zap,
} from "lucide-react";

export interface MetricMeta {
  name: string;
  icon: JSX.Element;
  unit: string;
  format?: (value: number) => string;
}

export const KNOWN_METRICS: Record<string, MetricMeta> = {
  air_temperature: { name: "Air Temperature", icon: <Thermometer size={18} />, unit: "°C" },
  humidity: { name: "Humidity", icon: <Droplets size={18} />, unit: "%" },
  light_intensity: { name: "Light Intensity", icon: <Sun size={18} />, unit: "lx" },
  wind_speed: { name: "Wind Speed", icon: <Wind size={18} />, unit: "m/s" },
  wind_direction: {
    name: "Wind Direction",
    icon: <Compass size={18} />,
    unit: "°",
    format: (v) => `${Math.round(v)}° ${degreesToCompass(v)}`,
  },
  atmospheric_pressure: { name: "Atmospheric Pressure", icon: <Gauge size={18} />, unit: "hPa" },
  rainfall: { name: "Rainfall", icon: <CloudRain size={18} />, unit: "mm" },
  soil_moisture: { name: "Soil Moisture", icon: <Waves size={18} />, unit: "%" },
  soil_temperature: { name: "Soil Temperature", icon: <Thermometer size={18} />, unit: "°C" },
  solar_radiation: { name: "Solar Radiation", icon: <Sun size={18} />, unit: "W/m²" },
  uv_index: { name: "UV Index", icon: <Sun size={18} />, unit: "" },
  leaf_wetness: { name: "Leaf Wetness", icon: <Leaf size={18} />, unit: "%" },
  pm1: { name: "PM1", icon: <Cloud size={18} />, unit: "µg/m³" },
  pm2_5: { name: "PM2.5", icon: <Cloud size={18} />, unit: "µg/m³" },
  pm10: { name: "PM10", icon: <Cloud size={18} />, unit: "µg/m³" },
  co2: { name: "CO2", icon: <Cloud size={18} />, unit: "ppm" },
  tvoc: { name: "TVOC", icon: <Cloud size={18} />, unit: "ppb" },
  bmp_temperature: { name: "BMP Temperature", icon: <Thermometer size={18} />, unit: "°C" },
  altitude: { name: "Altitude", icon: <Gauge size={18} />, unit: "m" },
  battery_voltage: { name: "Battery Voltage", icon: <Zap size={18} />, unit: "V" },
};

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
      icon: <Thermometer size={18} />,
      unit: "",
    }
  );
}

export function formatMetricValue(sensorLabel: string, value: number): string {
  const meta = getMetricMeta(sensorLabel);
  if (meta.format) return meta.format(value);
  return `${value.toFixed(1)}${meta.unit ? " " + meta.unit : ""}`;
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getLocalISOStringWithOffset(localDateTime: string): string {
  if (!localDateTime) return "";
  const withSeconds = localDateTime.length === 16 ? `${localDateTime}:00` : localDateTime;
  const offsetMinutes = new Date().getTimezoneOffset();
  const offset = -offsetMinutes;
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const hours = Math.floor(abs / 60).toString().padStart(2, "0");
  const minutes = (abs % 60).toString().padStart(2, "0");
  const offsetStr = `${sign}${hours}:${minutes}`;
  return withSeconds + offsetStr;
}