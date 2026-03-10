export type TrafficLevel = "Light" | "Moderate" | "Heavy";

export interface TrafficData {
  level: TrafficLevel;
  currentSpeed?: number;
  freeFlowSpeed?: number;
  source: "TomTom" | "heuristic";
}

function isRushHour(): boolean {
  const h = new Date().getHours();
  return (h >= 7 && h <= 11) || (h >= 17 && h <= 21);
}

function isLargeMetro(displayName: string): boolean {
  const n = displayName.toLowerCase();
  const metros = [
    "mumbai",
    "delhi",
    "bangalore",
    "bengaluru",
    "chennai",
    "kolkata",
    "hyderabad",
    "pune",
    "ahmedabad",
  ];
  return metros.some((m) => n.includes(m));
}

export async function fetchTomTomTraffic(
  lat: number,
  lon: number,
  apiKey: string
): Promise<TrafficData | null> {
  if (!apiKey) return null;
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      flowSegmentData?: { currentSpeed?: number; freeFlowSpeed?: number };
    };
    const fs = j.flowSegmentData;
    if (!fs?.currentSpeed || !fs?.freeFlowSpeed) return null;
    const ratio = fs.currentSpeed / fs.freeFlowSpeed;
    let level: TrafficLevel = "Light";
    if (ratio < 0.5) level = "Heavy";
    else if (ratio < 0.8) level = "Moderate";
    return {
      level,
      currentSpeed: fs.currentSpeed,
      freeFlowSpeed: fs.freeFlowSpeed,
      source: "TomTom",
    };
  } catch {
    return null;
  }
}

export function heuristicTraffic(displayName: string, no2: number | undefined): TrafficData {
  const large = isLargeMetro(displayName);
  const rush = isRushHour() ? 1 : 0;
  const no2High = (no2 ?? 0) > 60 ? 1 : 0;
  const score = (large ? 2 : 0) + rush * 2 + no2High;
  let level: TrafficLevel = "Light";
  if (score >= 4) level = "Heavy";
  else if (score >= 2) level = "Moderate";
  return { level, source: "heuristic" };
}
