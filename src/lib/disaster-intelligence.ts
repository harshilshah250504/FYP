/**
 * Disaster intelligence: wildfire spread prediction and risk heatmap computation.
 * Uses simplified empirical model based on wind, humidity, temperature, vegetation dryness proxy.
 */

export interface FireSpreadInput {
  windSpeed: number;  // m/s
  windDeg: number;    // degrees
  humidity: number;   // %
  temp: number;       // °C
  /** Vegetation dryness proxy 0-1 (from soil moisture / drought index if available) */
  vegetationDryness?: number;
  /** Fire Radiative Power at fire point (MW) */
  frp?: number;
}

export interface SpreadPrediction {
  hours: number;
  /** Estimated spread radius in km */
  radiusKm: number;
  /** Confidence 0-1 */
  confidence: number;
  /** Dominant spread direction in degrees */
  directionDeg: number;
}

/** Simple empirical wildfire spread model.
 * Based on: spread rate ∝ wind × (1 - humidity/100) × temp factor × dryness
 */
export function predictFireSpread(input: FireSpreadInput): SpreadPrediction[] {
  const { windSpeed, windDeg, humidity, temp, vegetationDryness = 0.6, frp = 1 } = input;
  const humidityFactor = Math.max(0.1, 1 - humidity / 100);
  const tempFactor = temp > 35 ? 1.4 : temp > 25 ? 1.2 : temp > 15 ? 1 : 0.8;
  const drynessFactor = 0.5 + (vegetationDryness ?? 0.6);
  const baseRate = (windSpeed * 0.5 + 0.2) * humidityFactor * tempFactor * drynessFactor * Math.log1p(frp);
  const periods = [3, 6, 12];
  return periods.map((hours) => {
    const radiusKm = Math.min(50, baseRate * hours * 0.3);
    const confidence = Math.min(0.85, 0.4 + hours * 0.02 + (windSpeed > 5 ? 0.1 : 0));
    return {
      hours,
      radiusKm: Math.round(radiusKm * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      directionDeg: windDeg,
    };
  });
}

export interface WildfireRiskFactors {
  windSpeed: number;
  windContribution: number;   // 0-100
  temperature: number;
  tempContribution: number;
  humidity: number;
  humidityContribution: number;
  vegetationDryness: number;
  drynessContribution: number;
  firePresence: number;       // 0-100
  totalScore: number;         // 0-100
}

export function computeWildfireRiskHeatmapScore(input: {
  windSpeed: number;
  temp: number;
  humidity: number;
  vegetationDryness?: number;
  fireCount: number;
  maxFrp?: number;
}): WildfireRiskFactors {
  const windContrib = Math.min(40, input.windSpeed * 4);
  const tempContrib = input.temp >= 40 ? 30 : input.temp >= 35 ? 25 : input.temp >= 30 ? 18 : input.temp >= 25 ? 12 : 5;
  const humContrib = input.humidity <= 20 ? 25 : input.humidity <= 40 ? 15 : input.humidity <= 60 ? 8 : 2;
  const dry = input.vegetationDryness ?? 0.6;
  const dryContrib = dry >= 0.8 ? 20 : dry >= 0.6 ? 14 : dry >= 0.4 ? 8 : 4;
  const fireContrib = Math.min(40, input.fireCount * 8 + (input.maxFrp ?? 0) * 2);
  const total = Math.min(100, windContrib + tempContrib + humContrib + dryContrib + fireContrib);
  return {
    windSpeed: input.windSpeed,
    windContribution: Math.round(windContrib),
    temperature: input.temp,
    tempContribution: tempContrib,
    humidity: input.humidity,
    humidityContribution: humContrib,
    vegetationDryness: dry,
    drynessContribution: Math.round(dryContrib),
    firePresence: Math.round(fireContrib),
    totalScore: Math.round(total),
  };
}
