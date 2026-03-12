/**
 * Explainable AI insights: attribute risk to contributing factors.
 */

export interface RiskContribution {
  factor: string;
  percent: number;
  description: string;
}

export interface WildfireRiskInsight {
  totalRisk: number;
  contributions: RiskContribution[];
  summary: string;
}

export function explainWildfireRisk(params: {
  windSpeed: number;
  temp: number;
  humidity: number;
  vegetationDryness?: number;
  fireCount: number;
  maxFrp?: number;
}): WildfireRiskInsight {
  const w = Math.min(35, params.windSpeed * 5);
  const t = params.temp >= 40 ? 28 : params.temp >= 35 ? 22 : params.temp >= 30 ? 16 : params.temp >= 25 ? 10 : 5;
  const h = params.humidity <= 30 ? 22 : params.humidity <= 50 ? 14 : params.humidity <= 70 ? 8 : 4;
  const d = ((params.vegetationDryness ?? 0.6) * 15) + 5;
  const f = Math.min(25, params.fireCount * 3 + (params.maxFrp ?? 0) * 0.5);
  const total = w + t + h + d + f;
  const scale = total > 0 ? 100 / total : 1;
  const contribs: RiskContribution[] = [
    { factor: "Wind speed", percent: Math.round(w * scale), description: `${params.windSpeed} m/s` },
    { factor: "Temperature", percent: Math.round(t * scale), description: `${params.temp}°C` },
    { factor: "Low humidity", percent: Math.round(h * scale), description: `${params.humidity}%` },
    { factor: "Vegetation dryness", percent: Math.round(d * scale), description: `${((params.vegetationDryness ?? 0.6) * 100).toFixed(0)}%` },
    { factor: "Active fires", percent: Math.round(f * scale), description: `${params.fireCount} fires` },
  ].filter((c) => c.percent > 0);
  const totalPct = contribs.reduce((s, c) => s + c.percent, 0);
  if (totalPct !== 100 && contribs.length > 0) {
    contribs[0].percent += 100 - totalPct;
  }
  const top = contribs.slice(0, 4);
  const summary =
    total >= 60
      ? `Wildfire risk is high primarily due to: ${top.map((c) => `${c.factor} (${c.percent}%)`).join(", ")}.`
      : total >= 30
        ? `Moderate wildfire risk. Main contributors: ${top.map((c) => c.factor).join(", ")}.`
        : "Wildfire risk is currently low.";
  return {
    totalRisk: Math.round(Math.min(100, total)),
    contributions: contribs,
    summary,
  };
}

export interface AqiRiskInsight {
  totalAqi: number | null;
  contributions: RiskContribution[];
  summary: string;
}

export function explainAqiRisk(params: {
  aqi: number | null;
  pm25?: number | null;
  pm10?: number | null;
  o3?: number | null;
  no2?: number | null;
}): AqiRiskInsight {
  const aqi = params.aqi ?? 0;
  if (aqi <= 0) {
    return { totalAqi: null, contributions: [], summary: "Insufficient data for AQI breakdown." };
  }
  const pm25 = params.pm25 ?? 0;
  const pm10 = params.pm10 ?? 0;
  const o3 = params.o3 ?? 0;
  const no2 = params.no2 ?? 0;
  const pm25Contrib = Math.min(45, (pm25 / 50) * 30);
  const pm10Contrib = Math.min(25, (pm10 / 100) * 20);
  const o3Contrib = Math.min(25, (o3 / 100) * 20);
  const no2Contrib = Math.min(20, (no2 / 50) * 15);
  const other = Math.max(5, 100 - pm25Contrib - pm10Contrib - o3Contrib - no2Contrib);
  const total = pm25Contrib + pm10Contrib + o3Contrib + no2Contrib + other;
  const scale = total > 0 ? 100 / total : 1;
  const contribs: RiskContribution[] = [];
  if (pm25 > 0) contribs.push({ factor: "PM2.5", percent: Math.round(pm25Contrib * scale), description: `${pm25} µg/m³` });
  if (pm10 > 0) contribs.push({ factor: "PM10", percent: Math.round(pm10Contrib * scale), description: `${pm10} µg/m³` });
  if (o3 > 0) contribs.push({ factor: "O₃", percent: Math.round(o3Contrib * scale), description: `${o3} µg/m³` });
  if (no2 > 0) contribs.push({ factor: "NO₂", percent: Math.round(no2Contrib * scale), description: `${no2} µg/m³` });
  if (contribs.length === 0) contribs.push({ factor: "Overall AQI", percent: 100, description: `${aqi}` });
  const top = contribs.slice(0, 4);
  const summary =
    aqi >= 151
      ? `Air quality is unhealthy. Primary drivers: ${top.map((c) => `${c.factor} (${c.percent}%)`).join(", ")}.`
      : aqi >= 101
        ? `Unhealthy for sensitive groups. Contributors: ${top.map((c) => c.factor).join(", ")}.`
        : `Air quality is acceptable. Main components: ${top.map((c) => c.factor).join(", ")}.`;
  return { totalAqi: aqi, contributions: contribs, summary };
}
