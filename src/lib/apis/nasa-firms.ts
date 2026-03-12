import { fetchWithRetry } from "@/lib/fetch-with-retry";

export interface FirePoint {
  latitude: number;
  longitude: number;
  /** Detection confidence: l=low, n=nominal, h=high */
  confidence?: string | number;
  /** Brightness temperature (Kelvin) - fire intensity proxy */
  bright_ti4?: number;
  /** Fire Radiative Power in MW */
  frp?: number;
  /** Satellite acquisition date YYYY-MM-DD */
  acq_date?: string;
  /** Satellite acquisition time UTC (HHMM) */
  acq_time?: string;
  /** Satellite identifier (N20, Suomi-NPP, Terra, Aqua, etc.) */
  satellite?: string;
  /** Day/Night: D=day, N=night */
  daynight?: string;
  /** Distance from search center (km) */
  distance_km?: number;
}

export interface FireData {
  fires: FirePoint[];
  fireCount: number;
  advisory: string;
  boundingBox: string;
  /** Max Fire Radiative Power in area (MW) */
  maxFrp?: number;
  /** High-confidence fire count */
  highConfidenceCount?: number;
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
    const res = await fetchWithRetry(url);
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
    let brightIdx = headers.findIndex((h) => h.includes("bright") && h.includes("ti4"));
    if (brightIdx < 0) brightIdx = headers.findIndex((h) => h.includes("bright") && h.includes("ti5"));
    if (brightIdx < 0) brightIdx = headers.findIndex((h) => h.includes("bright"));
    const frpIdx = headers.findIndex((h) => h === "frp");
    const acqDateIdx = headers.findIndex((h) => h.includes("acq_date"));
    const acqTimeIdx = headers.findIndex((h) => h.includes("acq_time"));
    const satIdx = headers.findIndex((h) => h.includes("satellite"));
    const daynightIdx = headers.findIndex((h) => h.includes("daynight"));
    const fires: FirePoint[] = [];
    let maxFrp = 0;
    let highConfidenceCount = 0;
    const radiusDeg = 0.5;
    const kmPerDegLat = 111;
    const kmPerDegLon = 111 * Math.cos((lat * Math.PI) / 180);

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const latVal = parseFloat(cols[latIdx] ?? "0");
      const lonVal = parseFloat(cols[lonIdx] ?? "0");
      const conf = confIdx >= 0 ? (cols[confIdx] ?? "").trim().toLowerCase() : undefined;
      const frpVal = frpIdx >= 0 ? parseFloat(cols[frpIdx] ?? "0") : undefined;
      if (conf === "h") highConfidenceCount++;
      if (typeof frpVal === "number" && frpVal > maxFrp) maxFrp = frpVal;
      const dLat = Math.abs(latVal - lat);
      const dLon = Math.abs(lonVal - lon);
      const distKm = Math.sqrt((dLat * kmPerDegLat) ** 2 + (dLon * kmPerDegLon) ** 2);
      fires.push({
        latitude: latVal,
        longitude: lonVal,
        confidence: confIdx >= 0 ? cols[confIdx] : undefined,
        bright_ti4: brightIdx >= 0 ? parseFloat(cols[brightIdx] ?? "0") || undefined : undefined,
        frp: frpVal,
        acq_date: acqDateIdx >= 0 ? cols[acqDateIdx] : undefined,
        acq_time: acqTimeIdx >= 0 ? cols[acqTimeIdx] : undefined,
        satellite: satIdx >= 0 ? cols[satIdx] : undefined,
        daynight: daynightIdx >= 0 ? cols[daynightIdx] : undefined,
        distance_km: Math.round(distKm * 10) / 10,
      });
    }
    return {
      fires,
      fireCount: fires.length,
      maxFrp: maxFrp > 0 ? Math.round(maxFrp * 100) / 100 : undefined,
      highConfidenceCount: highConfidenceCount > 0 ? highConfidenceCount : undefined,
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
