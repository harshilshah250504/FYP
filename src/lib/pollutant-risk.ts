/**
 * Pollutant risk levels and health impacts.
 * Uses WHO/EPA guidelines for µg/m³ and AQI thresholds.
 */

export type RiskLevel = "low" | "moderate" | "high" | "very_high" | "critical";

export interface PollutantRisk {
  pollutant: string;
  value: number;
  unit: string;
  riskLevel: RiskLevel;
  healthImpact: string;
  recommendation: string;
}

/** PM2.5 µg/m³ thresholds (WHO 2021): Good <12, Moderate 12-35, Unhealthy 35-55, Very Unhealthy 55-150, Hazardous >150 */
function pm25Risk(pm25: number): PollutantRisk {
  let risk: RiskLevel = "low";
  let impact = "Minimal health risk";
  let rec = "Normal outdoor activities are fine.";
  if (pm25 > 150) {
    risk = "critical";
    impact = "Severe respiratory and cardiovascular effects; increased mortality";
    rec = "Stay indoors with air filtration. Avoid all outdoor exertion.";
  } else if (pm25 > 55) {
    risk = "very_high";
    impact = "Increased respiratory symptoms, aggravation of heart/lung disease";
    rec = "Limit outdoor exposure. Use N95 mask if going outside.";
  } else if (pm25 > 35) {
    risk = "high";
    impact = "Sensitive groups may experience respiratory effects";
    rec = "Sensitive individuals should reduce prolonged exertion outdoors.";
  } else if (pm25 > 12) {
    risk = "moderate";
    impact = "Some health effects for sensitive individuals";
    rec = "Sensitive people: consider reducing prolonged outdoor exertion.";
  } else if (pm25 > 0) {
    impact = "Air quality satisfactory";
    rec = "No special precautions needed.";
  }
  return { pollutant: "PM2.5", value: pm25, unit: "µg/m³", riskLevel: risk, healthImpact: impact, recommendation: rec };
}

/** PM10 thresholds: Good <50, Moderate 50-100, Unhealthy 100-200, Very Unhealthy >200 */
function pm10Risk(pm10: number): PollutantRisk {
  let risk: RiskLevel = "low";
  let impact = "Minimal health risk";
  let rec = "Normal outdoor activities fine.";
  if (pm10 > 200) {
    risk = "critical";
    impact = "Serious respiratory irritation; exacerbates asthma and COPD";
    rec = "Stay indoors. Use N95 mask if outdoors.";
  } else if (pm10 > 100) {
    risk = "high";
    impact = "Respiratory irritation, reduced lung function in sensitive groups";
    rec = "Limit outdoor time. Sensitive groups stay indoors.";
  } else if (pm10 > 50) {
    risk = "moderate";
    impact = "Mild respiratory effects in sensitive individuals";
    rec = "Sensitive individuals may want to limit prolonged exertion.";
  }
  return { pollutant: "PM10", value: pm10, unit: "µg/m³", riskLevel: risk, healthImpact: impact, recommendation: rec };
}

/** NO2 µg/m³: WHO 24h mean 25; 1h mean 200 */
function no2Risk(no2: number): PollutantRisk {
  let risk: RiskLevel = "low";
  let impact = "Minimal health risk";
  let rec = "No special precautions.";
  if (no2 > 200) {
    risk = "critical";
    impact = "Severe respiratory inflammation; increased asthma attacks";
    rec = "Stay indoors. Avoid areas with heavy traffic.";
  } else if (no2 > 100) {
    risk = "high";
    impact = "Respiratory inflammation; risk to asthma patients";
    rec = "Limit time near traffic. Asthma patients: keep inhaler ready.";
  } else if (no2 > 40) {
    risk = "moderate";
    impact = "Possible respiratory effects in sensitive individuals";
    rec = "Sensitive individuals reduce outdoor exertion near roads.";
  }
  return { pollutant: "NO2", value: no2, unit: "µg/m³", riskLevel: risk, healthImpact: impact, recommendation: rec };
}

/** SO2 µg/m³: WHO 24h 40; 10min 500 */
function so2Risk(so2: number): PollutantRisk {
  let risk: RiskLevel = "low";
  let impact = "Minimal health risk";
  let rec = "No special precautions.";
  if (so2 > 500) {
    risk = "critical";
    impact = "Severe bronchoconstriction; life-threatening for asthmatics";
    rec = "Stay indoors with windows closed. Seek medical help if breathing difficulty.";
  } else if (so2 > 200) {
    risk = "high";
    impact = "Bronchoconstriction; eye irritation";
    rec = "Limit outdoor exposure. Asthma patients take extra care.";
  } else if (so2 > 40) {
    risk = "moderate";
    impact = "Respiratory irritation in sensitive individuals";
    rec = "Sensitive individuals avoid prolonged outdoor exposure.";
  }
  return { pollutant: "SO2", value: so2, unit: "µg/m³", riskLevel: risk, healthImpact: impact, recommendation: rec };
}

/** O3 µg/m³: WHO 8h mean 100; 1h 160 */
function o3Risk(o3: number): PollutantRisk {
  let risk: RiskLevel = "low";
  let impact = "Minimal health risk";
  let rec = "No special precautions.";
  if (o3 > 240) {
    risk = "critical";
    impact = "Severe lung damage; increased mortality during episodes";
    rec = "Stay indoors during peak afternoon hours. Avoid strenuous exercise.";
  } else if (o3 > 160) {
    risk = "high";
    impact = "Decreased lung function; chest tightness; exacerbates asthma";
    rec = "Limit outdoor exercise. Sensitive groups stay indoors afternoon.";
  } else if (o3 > 100) {
    risk = "moderate";
    impact = "Mild respiratory effects; throat irritation";
    rec = "Consider reducing prolonged outdoor exertion midday.";
  }
  return { pollutant: "O3", value: o3, unit: "µg/m³", riskLevel: risk, healthImpact: impact, recommendation: rec };
}

/** CO mg/m³: WHO 24h 4; 8h 10. Note: OpenWeather uses µg/m³, multiply by 1000 for mg */
function coRisk(co: number): PollutantRisk {
  const coMg = co / 1000;
  let risk: RiskLevel = "low";
  let impact = "Minimal health risk";
  let rec = "No special precautions.";
  if (coMg > 30) {
    risk = "critical";
    impact = "Headache, dizziness; dangerous for heart patients";
    rec = "Avoid high-traffic areas. Heart patients limit exertion.";
  } else if (coMg > 10) {
    risk = "high";
    impact = "Reduced oxygen delivery; affects cardiovascular system";
    rec = "Limit exposure to traffic and combustion sources.";
  } else if (coMg > 4) {
    risk = "moderate";
    impact = "Slight effects on cardiovascular and nervous system";
    rec = "Sensitive individuals avoid prolonged exposure to traffic.";
  }
  return { pollutant: "CO", value: co, unit: "µg/m³", riskLevel: risk, healthImpact: impact, recommendation: rec };
}

export interface Measurements {
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  o3?: number | null;
  co?: number | null;
}

export function computePollutantRisks(meas: Measurements): PollutantRisk[] {
  const risks: PollutantRisk[] = [];
  if (meas.pm25 != null && meas.pm25 > 0) risks.push(pm25Risk(meas.pm25));
  if (meas.pm10 != null && meas.pm10 > 0) risks.push(pm10Risk(meas.pm10));
  if (meas.no2 != null && meas.no2 > 0) risks.push(no2Risk(meas.no2));
  if (meas.so2 != null && meas.so2 > 0) risks.push(so2Risk(meas.so2));
  if (meas.o3 != null && meas.o3 > 0) risks.push(o3Risk(meas.o3));
  if (meas.co != null && meas.co > 0) risks.push(coRisk(meas.co));
  return risks;
}
