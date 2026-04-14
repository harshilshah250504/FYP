export interface FirePoint {
  latitude: number;
  longitude: number;
  confidence?: string | number;
  bright_ti4?: number;
  distance_km?: number;
}

export interface FireData {
  fires: FirePoint[];
  fireCount: number;
  advisory: string;
  boundingBox: string;
}

function parseAreaBox(lat: number, lon: number, radiusDeg = 0.5): string {
  const latMin = Math.max(-90, lat - radiusDeg);
  const latMax = Math.min(90, lat + radiusDeg);
  const lonMin = Math.max(-180, lon - radiusDeg);
  const lonMax = Math.min(180, lon + radiusDeg);
  return `${lonMin.toFixed(2)},${latMin.toFixed(2)},${lonMax.toFixed(2)},${latMax.toFixed(2)}`;
}

export async function fetchFires(
  lat: number,
  lon: number,
  apiKey: string,
  days = 1
): Promise<FireData> {
  const areaBox = parseAreaBox(lat, lon);
  const SENSOR = "VIIRS_SNPP_NRT";
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/${SENSOR}/${areaBox}/${days}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        fires: [],
        fireCount: 0,
        advisory: "No fire data available (API limit or error)",
        boundingBox: areaBox,
      };
    }
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      return {
        fires: [],
        fireCount: 0,
        advisory: "No fires detected in the area",
        boundingBox: areaBox,
      };
    }
    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const latIdx = headers.findIndex((h) => h.includes("lat"));
    const lonIdx = headers.findIndex((h) => h.includes("lon"));
    const confIdx = headers.findIndex((h) => h.includes("confidence"));
    const brightIdx = headers.findIndex((h) => h.includes("bright"));
    const fires: FirePoint[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const latVal = parseFloat(cols[latIdx] ?? "0");
      const lonVal = parseFloat(cols[lonIdx] ?? "0");
      fires.push({
        latitude: latVal,
        longitude: lonVal,
        confidence: confIdx >= 0 ? cols[confIdx] : undefined,
        bright_ti4: brightIdx >= 0 ? parseFloat(cols[brightIdx] ?? "0") || undefined : undefined,
      });
    }
    return {
      fires,
      fireCount: fires.length,
      advisory:
        fires.length > 0
          ? "Fire detected in the area – possible pollution source. Consider limiting outdoor exposure."
          : "No fires detected in the area",
      boundingBox: areaBox,
    };
  } catch {
    return {
      fires: [],
      fireCount: 0,
      advisory: "Unable to fetch fire data",
      boundingBox: areaBox,
    };
  }
}
