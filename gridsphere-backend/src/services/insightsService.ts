/**
 * Rule-based agronomy advisories.
 *
 * IMPORTANT: these are simple, fixed threshold rules over real sensor
 * readings (and, where available, forecast data) - NOT a machine-learning
 * model. They're deliberately conservative and explainable so a farmer can
 * see exactly why an advisory fired. Presented in the API/UI as
 * "Rule-Based Insights", not "AI", to avoid overstating what this does.
 * A real disease-prediction or crop-advisor model (per the product doc)
 * would need labeled agronomy data and is a separate, larger effort.
 */

export interface Advisory {
  severity: "info" | "warning";
  message: string;
}

export interface InsightInputs {
  temperatureC?: number | null;
  humidityPct?: number | null;
  windSpeedMs?: number | null;
  heatIndexC?: number | null;
  /** Precipitation probability (%) in the next ~12h from the forecast, if available. */
  precipitationProbabilityNext12h?: number | null;
}

export function generateAdvisories(inputs: InsightInputs): Advisory[] {
  const advisories: Advisory[] = [];

  const { temperatureC, humidityPct, windSpeedMs, heatIndexC, precipitationProbabilityNext12h } = inputs;

  // Fungal disease risk: high humidity + still air is the classic combination.
  if (humidityPct !== null && humidityPct !== undefined && humidityPct >= 85 && windSpeedMs !== null && windSpeedMs !== undefined && windSpeedMs < 1.5) {
    advisories.push({
      severity: "warning",
      message: "High humidity combined with low wind speed may increase fungal disease risk.",
    });
  }

  // Irrigation timing vs. expected rainfall.
  if (precipitationProbabilityNext12h !== null && precipitationProbabilityNext12h !== undefined && precipitationProbabilityNext12h >= 50) {
    advisories.push({
      severity: "info",
      message: "Irrigation is not recommended in the next 12 hours due to expected rainfall.",
    });
  }

  // Spray window: high wind makes spraying ineffective/prone to drift.
  if (windSpeedMs !== null && windSpeedMs !== undefined && windSpeedMs >= 4) {
    advisories.push({
      severity: "warning",
      message: "Wind speed is too high for effective, drift-free spraying right now.",
    });
  }

  // Heat stress.
  if (heatIndexC !== null && heatIndexC !== undefined && heatIndexC >= 35) {
    advisories.push({
      severity: "warning",
      message: "Heat stress risk for crops - consider shading or additional irrigation.",
    });
  }

  // Frost risk.
  if (temperatureC !== null && temperatureC !== undefined && temperatureC <= 2) {
    advisories.push({
      severity: "warning",
      message: "Near-freezing temperature - frost risk overnight.",
    });
  }

  return advisories;
}


