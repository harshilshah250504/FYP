import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pm25ToAqi(pm25: number | null | undefined): number | null {
  if (pm25 == null) return null;
  const C = Number(pm25);
  const bp: [number, number, number, number][] = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500],
  ];
  for (const [lo, hi, ilo, ihi] of bp) {
    if (C >= lo && C <= hi) {
      return Math.round(((ihi - ilo) / (hi - lo)) * (C - lo) + ilo);
    }
  }
  return C > 500.4 ? 500 : null;
}

export type AqiLevel =
  | "good"
  | "moderate"
  | "sensitive"
  | "unhealthy"
  | "very"
  | "hazardous";

export function interpretAqi(aqi: number | null | undefined): {
  label: string;
  level: AqiLevel;
  color: string;
} {
  if (aqi == null)
    return { label: "Unknown", level: "moderate", color: "#9ca3af" };
  const a = Math.round(aqi);
  if (a <= 50)
    return {
      label: "Good (0–50)",
      level: "good",
      color: "#00e400",
    };
  if (a <= 100)
    return {
      label: "Moderate (51–100)",
      level: "moderate",
      color: "#ffff00",
    };
  if (a <= 150)
    return {
      label: "Unhealthy for Sensitive Groups (101–150)",
      level: "sensitive",
      color: "#ff7e00",
    };
  if (a <= 200)
    return {
      label: "Unhealthy (151–200)",
      level: "unhealthy",
      color: "#ff0000",
    };
  if (a <= 300)
    return {
      label: "Very Unhealthy (201–300)",
      level: "very",
      color: "#8f3f97",
    };
  return {
    label: "Hazardous (301+)",
    level: "hazardous",
    color: "#7e0023",
  };
}

export function getSafetyClassification(aqi: number | null): "safe" | "moderate" | "unsafe" {
  if (aqi == null) return "moderate";
  if (aqi <= 50) return "safe";
  if (aqi <= 150) return "moderate";
  return "unsafe";
}
