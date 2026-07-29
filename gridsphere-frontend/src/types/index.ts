export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
  role: string;
  is_active?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface Device {
  id: number;
  deviceUid: string;
  deviceName?: string | null;
  description?: string | null;
  frequency: number;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  lastSeenAt?: string | null;
  batteryLevel?: number | null;
  isSolarCharging?: boolean | null;
  signalStrengthDbm?: number | null;
  firmwareVersion?: string | null;
  cropId?: number | null;
  createdAt: string;
}

export interface Crop {
  id: number;
  name: string;
  code: string;
}

export interface AiRisk {
  name: string;
  level: "low" | "medium" | "high";
  reason: string;
}

export interface AiAdvisory {
  summary: string;
  precautions: string[];
  risks: AiRisk[];
  cropName: string;
  generatedAt: string;
  fromCache: boolean;
}

export interface ForecastResult {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

export interface DerivedMetrics {
  dewPointC: number | null;
  heatIndexC: number | null;
  vpdKPa: number | null;
  et0MmPerDay: number | null;
}

export interface Advisory {
  severity: "info" | "warning";
  message: string;
}

export interface Insights {
  derivedMetrics: DerivedMetrics;
  advisories: Advisory[];
}

export interface SensorType {
  id: number;
  name: string;
  code: string;
  unit?: string | null;
  dataType?: string | null;
  category?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
}

export interface DeviceSensor {
  id: number;
  deviceId: number;
  sensorTypeId: number;
  sensorLabel: string;
  hardwarePort?: string | null;
  calibrationOffset: number;
  calibrationScale: number;
  isActive: boolean;
  sensorType?: SensorType;
}

export interface SensorReading {
  id: number;
  deviceSensorId: number;
  value: number;
  qualityFlag?: string | null;
  recordedAt: string;
}

export interface SubscriptionPlan {
  id: number;
  planName?: string | null;
  planCode?: string | null;
  priceMonthly?: number | null;
  priceYearly?: number | null;
  maxDevices?: number | null;
  maxSensorsPerDevice?: number | null;
  dataRetentionDays?: number | null;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface WindRoseSector {
  direction: string;
  centerDeg: number;
  count: number;
}

export interface WindAnalytics {
  averageSpeedMs: number | null;
  maxGustMs: number | null;
  dominantDirection: string | null; 
  windRose: { direction: string; count: number; avgSpeedMs: number }[];
}

export interface RainDailyTotal {
  date: string;
  totalMm: number;
}

export interface RainAnalytics {
  todayMm: number | null;
  weeklyMm: number | null;
  monthlyMm: number | null;
  maxIntensityMmPerHour: number | null;
  rainDurationHours: number | null;
  cumulativeSeries: { date: string; mm: number }[];
}