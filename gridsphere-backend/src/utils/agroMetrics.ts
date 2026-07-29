/**
 * Derived metrics computed purely from temperature + humidity readings
 * you already collect. No external calls, no invented data - if a device
 * hasn't reported temp/humidity, these simply return null.
 *
 * Formulas used (all standard, widely-cited meteorological approximations):
 *  - Dew Point: Magnus-Tetens approximation
 *  - Heat Index: NOAA/Rothfusz regression (valid above ~27°C / 40% RH;
 *    below that range it isn't meaningful, so we just return the air
 *    temperature - "feels like" only diverges from actual temp in heat)
 *  - VPD (Vapor Pressure Deficit): saturation vapor pressure minus actual
 *    vapor pressure, in kPa - the standard agronomy figure for irrigation/
 *    disease-risk decisions
 */

export interface DerivedMetrics {
  dewPointC: number | null;
  heatIndexC: number | null;
  vpdKPa: number | null;
  /** Reference evapotranspiration, mm/day - null if today's min/max temp or the device's latitude aren't available yet. */
  et0MmPerDay: number | null;
  /** "station" if computed from the device's own sensor readings, "forecast" if it fell back to Open-Meteo's daily min/max, null if not computed. */
  et0Source: "station" | "forecast" | null;
}

/** Saturation vapor pressure (kPa) at a given temperature (°C), Tetens formula. */
function saturationVaporPressureKPa(tempC: number): number {
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

export function calculateDewPointC(tempC: number, humidityPct: number): number {
  const a = 17.27;
  const b = 237.3;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidityPct / 100);
  return (b * alpha) / (a - alpha);
}

export function calculateHeatIndexC(tempC: number, humidityPct: number): number {
  // Rothfusz regression is defined in Fahrenheit.
  const tempF = tempC * (9 / 5) + 32;
  if (tempF < 80) {
    // Below this range the "feels like" effect is negligible - return actual temp.
    return tempC;
  }
  const T = tempF;
  const R = humidityPct;
  const hiF =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;
  return ((hiF - 32) * 5) / 9;
}

export function calculateVpdKPa(tempC: number, humidityPct: number): number {
  const svp = saturationVaporPressureKPa(tempC);
  const avp = svp * (humidityPct / 100);
  return svp - avp;
}

/**
 * Reference evapotranspiration (ET0, mm/day) via the Hargreaves-Samani
 * (1985) equation, as codified in FAO Irrigation and Drainage Paper 56.
 * Chosen specifically because it only needs daily min/max temperature and
 * the station's latitude/date - no solar radiation, humidity, or wind
 * sensor required (unlike the fuller Penman-Monteith method), so it works
 * for every device regardless of which sensors are installed.
 *
 * Steps: solar declination + sunset hour angle -> extraterrestrial
 * radiation (Ra) for the given latitude and day-of-year -> Hargreaves
 * formula using Ra and the day's temperature range.
 */
export function calculateReferenceET0(params: {
  tMaxC: number;
  tMinC: number;
  tMeanC: number;
  latitudeDeg: number;
  date: Date;
}): number {
  const { tMaxC, tMinC, tMeanC, latitudeDeg, date } = params;

  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - startOfYear) / 86400000) + 1;

  const latRad = (latitudeDeg * Math.PI) / 180;
  const solarConstant = 0.0820; // MJ m-2 min-1

  const inverseRelDistance = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const solarDeclination = 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);

  // Sunset hour angle - clamp the acos argument to [-1, 1] to guard
  // against floating-point edge cases at extreme latitudes/dates.
  const acosArg = Math.max(-1, Math.min(1, -Math.tan(latRad) * Math.tan(solarDeclination)));
  const sunsetHourAngle = Math.acos(acosArg);

  const extraterrestrialRadiationMJ =
    ((24 * 60) / Math.PI) *
    solarConstant *
    inverseRelDistance *
    (sunsetHourAngle * Math.sin(latRad) * Math.sin(solarDeclination) +
      Math.cos(latRad) * Math.cos(solarDeclination) * Math.sin(sunsetHourAngle));

  // Convert Ra from MJ/m2/day to "equivalent evaporation" mm/day.
  const raMmPerDay = 0.408 * extraterrestrialRadiationMJ;

  const tempRange = Math.max(0, tMaxC - tMinC); // guard against bad/missing data giving a negative sqrt
  const et0 = 0.0023 * (tMeanC + 17.8) * Math.sqrt(tempRange) * raMmPerDay;

  return Math.max(0, et0);
}

export function calculateDerivedMetrics(tempC: number | null, humidityPct: number | null): DerivedMetrics {
  if (tempC === null || humidityPct === null) {
    return { dewPointC: null, heatIndexC: null, vpdKPa: null, et0MmPerDay: null, et0Source: null };
  }
  return {
    dewPointC: Math.round(calculateDewPointC(tempC, humidityPct) * 10) / 10,
    heatIndexC: Math.round(calculateHeatIndexC(tempC, humidityPct) * 10) / 10,
    vpdKPa: Math.round(calculateVpdKPa(tempC, humidityPct) * 100) / 100,
    et0MmPerDay: null, // populated by the caller, which has today's min/max temp + device latitude
    et0Source: null, // populated by the caller alongside et0MmPerDay
  };
}
