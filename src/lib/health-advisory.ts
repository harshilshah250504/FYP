import type { AqiLevel } from "./utils";
import type { TrafficLevel } from "./apis/traffic";

export type AgeGroup = "children" | "adults" | "elderly" | "general";
export type HealthCondition = "asthma" | "heart" | "lung" | "pregnancy" | "none";

export interface HealthAdvisoryInput {
  aqi: number | null;
  aqiLevel: AqiLevel;
  traffic: TrafficLevel;
  fireCount: number;
  ageGroup?: AgeGroup;
  healthCondition?: HealthCondition;
}

export interface AdvisoryItem {
  severity: "info" | "warning" | "danger" | "critical";
  icon: string;
  message: string;
}

function baseAqiAdvice(aqi: number | null, level: AqiLevel): AdvisoryItem[] {
  const items: AdvisoryItem[] = [];
  if (aqi == null) {
    items.push({
      severity: "warning",
      icon: "⚠️",
      message: "AQI unknown — be cautious if you are sensitive or have a respiratory condition.",
    });
    return items;
  }
  if (level === "good") {
    items.push({ severity: "info", icon: "🟢", message: "Good — normal outdoor activities are fine." });
    return items;
  }
  if (level === "moderate") {
    items.push({
      severity: "info",
      icon: "🟡",
      message: "Moderate — sensitive individuals should reduce prolonged exertion outdoors.",
    });
    return items;
  }
  if (level === "sensitive") {
    items.push({
      severity: "warning",
      icon: "🟠",
      message:
        "Unhealthy for Sensitive Groups — children, elderly, and people with lung/heart conditions should limit outdoor time.",
    });
  }
  if (level === "unhealthy") {
    items.push({
      severity: "danger",
      icon: "🔴",
      message: "Unhealthy — everyone may experience health effects; avoid outdoor exertion.",
    });
  }
  if (level === "very" || level === "hazardous") {
    items.push({
      severity: "critical",
      icon: level === "hazardous" ? "⚫" : "🟣",
      message:
        "Very Unhealthy / Hazardous — stay indoors with air filtration; avoid exercise. Seek help if symptoms occur.",
    });
  }
  return items;
}

function ageGroupAdvice(
  ageGroup: AgeGroup | undefined,
  aqi: number | null,
  level: AqiLevel
): AdvisoryItem[] {
  const items: AdvisoryItem[] = [];
  if (!ageGroup || ageGroup === "general") return items;

  if (ageGroup === "children") {
    if (aqi != null && aqi > 100) {
      items.push({
        severity: "warning",
        icon: "👶",
        message: "Children: Avoid outdoor play when AQI > 100. Keep activities indoors.",
      });
    }
    if (level === "unhealthy" || level === "very" || level === "hazardous") {
      items.push({
        severity: "danger",
        icon: "👶",
        message: "Children: Do not take them outside. Use indoor play areas only.",
      });
    }
  }

  if (ageGroup === "elderly") {
    if (aqi != null && aqi > 100) {
      items.push({
        severity: "warning",
        icon: "👴",
        message: "Elderly: Avoid stepping out during poor AQI; keep medications handy.",
      });
    }
    if (level === "unhealthy" || level === "very" || level === "hazardous") {
      items.push({
        severity: "danger",
        icon: "👴",
        message: "Elderly: Stay indoors. Avoid physical exertion. Monitor for breathing difficulty.",
      });
    }
  }

  if (ageGroup === "adults") {
    if (level === "unhealthy" || level === "very" || level === "hazardous") {
      items.push({
        severity: "warning",
        icon: "🧑",
        message: "Adults: Limit outdoor exposure. Use N95/FFP2 masks if you must go outside.",
      });
    }
  }

  return items;
}

function healthConditionAdvice(
  condition: HealthCondition | undefined,
  level: AqiLevel
): AdvisoryItem[] {
  const items: AdvisoryItem[] = [];
  if (!condition || condition === "none") return items;

  if (condition === "asthma") {
    items.push({
      severity: level === "sensitive" || level === "unhealthy" || level === "very" || level === "hazardous" ? "danger" : "warning",
      icon: "🫁",
      message: "Asthmatic: Keep inhaler ready. Avoid known triggers. Consider staying indoors if AQI is elevated.",
    });
  }

  if (condition === "heart") {
    if (level !== "good") {
      items.push({
        severity: "warning",
        icon: "❤️",
        message: "Heart patient: Avoid exertion in poor air. Consult physician if symptoms worsen.",
      });
    }
  }

  if (condition === "lung") {
    items.push({
      severity: level === "unhealthy" || level === "very" || level === "hazardous" ? "danger" : "warning",
      icon: "🫁",
      message: "Lung condition: Use N95/FFP2 masks outdoors. Run indoor HEPA filters.",
    });
  }

  if (condition === "pregnancy") {
    if (level !== "good") {
      items.push({
        severity: "warning",
        icon: "🤰",
        message: "Pregnant: Limit outdoor exposure during poor air quality. Prefer indoor environments.",
      });
    }
  }

  return items;
}

function trafficAdvice(traffic: TrafficLevel, aqi: number | null): AdvisoryItem[] {
  const items: AdvisoryItem[] = [];
  if (traffic === "Heavy" || (aqi != null && aqi > 150)) {
    items.push({
      severity: "warning",
      icon: "🚗",
      message: "Avoid long commutes; use N95/FFP2 mask if travel is required.",
    });
  } else if (traffic === "Moderate" || (aqi != null && aqi > 100)) {
    items.push({
      severity: "info",
      icon: "🚗",
      message: "Reduce outdoor time during rush hours; prefer public transport when possible.",
    });
  }
  return items;
}

function fireAdvice(fireCount: number): AdvisoryItem[] {
  if (fireCount === 0) return [];
  return [
    {
      severity: "warning",
      icon: "🔥",
      message: `Wildfire detected nearby (${fireCount} active fire(s)). Possible pollution source. Limit outdoor exposure.`,
    },
  ];
}

export function generateHealthAdvisories(input: HealthAdvisoryInput): AdvisoryItem[] {
  const all: AdvisoryItem[] = [
    ...baseAqiAdvice(input.aqi ?? null, input.aqiLevel),
    ...ageGroupAdvice(input.ageGroup, input.aqi ?? null, input.aqiLevel),
    ...healthConditionAdvice(input.healthCondition, input.aqiLevel),
    ...trafficAdvice(input.traffic, input.aqi ?? null),
    ...fireAdvice(input.fireCount),
  ];
  const seen = new Set<string>();
  return all.filter((a) => {
    const k = a.message;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
