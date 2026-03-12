/**
 * Health Risk Score (0-100) based on multiple environmental factors.
 * Higher score = higher risk.
 *
 * Factors: AQI, temperature, humidity, smoke density (fires), pollutants, pollen (if available)
 * Returns risk assessments for: healthy people, children, elderly, asthma, heart disease
 */

export type HealthProfile =
  | "healthy"
  | "children"
  | "elderly"
  | "asthma"
  | "heart_disease";

export interface HealthRiskInput {
  aqi: number | null;
  temp: number | null;
  humidity: number | null;
  fireCount: number;
  /** Smoke density proxy: avg FRP or fire proximity */
  smokeDensity?: number;
  /** Individual pollutant µg/m³ */
  pm25?: number | null;
  pm10?: number | null;
  o3?: number | null;
  no2?: number | null;
  /** Pollen index 0-5 if available */
  pollen?: number | null;
  /** UV index if available */
  uvIndex?: number | null;
}

export interface RiskCategory {
  profile: HealthProfile;
  label: string;
  score: number; // 0-100
  level: "low" | "moderate" | "elevated" | "high" | "critical";
  summary: string;
  recommendations: string[];
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function aqiContribution(aqi: number | null): number {
  if (aqi == null) return 0;
  if (aqi <= 50) return aqi * 0.3;
  if (aqi <= 100) return 15 + (aqi - 50) * 0.4;
  if (aqi <= 150) return 35 + (aqi - 100) * 0.5;
  if (aqi <= 200) return 60 + (aqi - 150) * 0.6;
  if (aqi <= 300) return 90 + (aqi - 200) * 0.1;
  return Math.min(100, 100);
}

function tempContribution(temp: number | null): number {
  if (temp == null) return 0;
  if (temp >= 45) return 25;
  if (temp >= 40) return 18;
  if (temp >= 35) return 12;
  if (temp <= -10) return 15;
  if (temp <= 0) return 8;
  return 0;
}

function humidityContribution(humidity: number | null): number {
  if (humidity == null) return 0;
  if (humidity >= 90) return 8;
  if (humidity >= 80) return 4;
  return 0;
}

function fireContribution(fireCount: number, smokeDensity?: number): number {
  let c = Math.min(25, fireCount * 5);
  if (smokeDensity != null && smokeDensity > 0) {
    c += Math.min(15, smokeDensity / 2);
  }
  return c;
}

function pollutantBonus(meas: { pm25?: number | null; pm10?: number | null; o3?: number | null; no2?: number | null }): number {
  let b = 0;
  if ((meas.pm25 ?? 0) > 55) b += 8;
  else if ((meas.pm25 ?? 0) > 35) b += 4;
  if ((meas.o3 ?? 0) > 160) b += 5;
  if ((meas.no2 ?? 0) > 100) b += 4;
  return b;
}

function baseScore(input: HealthRiskInput): number {
  const aqi = aqiContribution(input.aqi);
  const temp = tempContribution(input.temp);
  const hum = humidityContribution(input.humidity);
  const fire = fireContribution(input.fireCount, input.smokeDensity);
  const poll = pollutantBonus(input);
  const uv = (input.uvIndex ?? 0) >= 8 ? 5 : 0;
  const pollen = ((input.pollen ?? 0) / 5) * 5;
  return clamp(aqi + temp + hum + fire + poll + uv + pollen, 0, 100);
}

function applyProfileMultiplier(base: number, profile: HealthProfile): number {
  const mult: Record<HealthProfile, number> = {
    healthy: 1,
    children: 1.25,
    elderly: 1.2,
    asthma: 1.4,
    heart_disease: 1.35,
  };
  return clamp(base * mult[profile], 0, 100);
}

function levelFromScore(score: number): RiskCategory["level"] {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 35) return "elevated";
  if (score >= 15) return "moderate";
  return "low";
}

function getRecommendations(profile: HealthProfile, level: RiskCategory["level"]): string[] {
  const base: string[] = [];
  if (level === "critical") {
    base.push("Stay indoors with windows closed.");
    base.push("Use air purifier with HEPA filter.");
    base.push("Avoid all outdoor exertion.");
    if (profile === "asthma" || profile === "heart_disease") {
      base.push("Keep emergency medications nearby. Seek medical help if symptoms worsen.");
    }
  } else if (level === "high") {
    base.push("Limit outdoor exposure.");
    base.push("Wear N95/FFP2 mask if going outside.");
    if (profile === "children" || profile === "elderly") base.push("Avoid prolonged outdoor play/activities.");
  } else if (level === "elevated") {
    base.push("Reduce prolonged outdoor exertion.");
    if (profile === "asthma") base.push("Keep inhaler ready.");
  } else if (level === "moderate") {
    base.push("Sensitive individuals: consider reducing outdoor activities.");
  } else {
    base.push("No special precautions needed for most people.");
  }
  return base;
}

const PROFILE_LABELS: Record<HealthProfile, string> = {
  healthy: "Healthy adults",
  children: "Children",
  elderly: "Elderly",
  asthma: "Asthma patients",
  heart_disease: "Heart disease patients",
};

export function computeHealthRiskScore(input: HealthRiskInput): RiskCategory[] {
  const base = baseScore(input);
  const profiles: HealthProfile[] = ["healthy", "children", "elderly", "asthma", "heart_disease"];
  return profiles.map((profile) => {
    const score = Math.round(applyProfileMultiplier(base, profile));
    const level = levelFromScore(score);
    const summary =
      level === "critical"
        ? `Critical risk (${score}/100). Take immediate precautions.`
        : level === "high"
          ? `High risk (${score}/100). Limit outdoor exposure.`
          : level === "elevated"
            ? `Elevated risk (${score}/100). Reduce prolonged outdoor activities.`
            : level === "moderate"
              ? `Moderate risk (${score}/100). Sensitive individuals should take care.`
              : `Low risk (${score}/100). Generally safe for outdoor activities.`;
    return {
      profile,
      label: PROFILE_LABELS[profile],
      score,
      level,
      summary,
      recommendations: getRecommendations(profile, level),
    };
  });
}
