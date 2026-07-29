import { ApiError } from "../utils/ApiError";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

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

export interface CurrentConditions {
  dewPointC: number | null;
  feelsLikeC: number | null;
}

/**
 * Fetches a forecast for a device's coordinates from Open-Meteo
 * (https://open-meteo.com) - a free weather API that requires no API key.
 * Only usable for devices that have latitude/longitude set (see
 * DeviceCreateSchema); if not set, callers should surface that instead of
 * guessing a location.
 *
 * NOTE: requires outbound network access to api.open-meteo.com. If your
 * deployment environment blocks external HTTP calls, this will fail -
 * that's expected, not a bug in this code.
 */
export async function getForecastForCoordinates(latitude: number, longitude: number): Promise<ForecastResult> {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,wind_speed_10m");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    throw new ApiError(502, "Could not reach the weather forecast service");
  }

  if (!response.ok) {
    throw new ApiError(502, "Weather forecast service returned an error");
  }

  const data = (await response.json()) as ForecastResult;
  return data;
}

export async function getCurrentConditionsForCoordinates(
  latitude: number,
  longitude: number
): Promise<CurrentConditions> {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("hourly", "dew_point_2m,apparent_temperature");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("past_days", "1"); // covers "now" even near local midnight

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return { dewPointC: null, feelsLikeC: null };

    const data = (await response.json()) as {
      hourly: { time: string[]; dew_point_2m: number[]; apparent_temperature: number[] };
    };

    const now = Date.now();
    let closestIdx = -1;
    let closestDiff = Infinity;
    data.hourly.time.forEach((t, i) => {
      const diff = Math.abs(new Date(t).getTime() - now);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = i;
      }
    });

    if (closestIdx === -1) return { dewPointC: null, feelsLikeC: null };

    return {
      dewPointC: data.hourly.dew_point_2m[closestIdx] ?? null,
      feelsLikeC: data.hourly.apparent_temperature[closestIdx] ?? null,
    };
  } catch {
    return { dewPointC: null, feelsLikeC: null };
  }
}
