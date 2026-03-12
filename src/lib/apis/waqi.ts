/** Individual pollutant value from WAQI iaqi */
import { fetchWithRetry } from "@/lib/fetch-with-retry";

export interface WaqiIaqi {
  pm25?: number;
  pm10?: number;
  no2?: number;
  so2?: number;
  o3?: number;
  co?: number;
  /** Temperature from station */
  t?: number;
  /** Humidity */
  h?: number;
  /** Pressure */
  p?: number;
  /** Wind */
  w?: number;
}

export interface WaqiData {
  aqi: number;
  city?: string;
  dominantPol?: string;
  time?: string;
  /** Individual pollutant indices (WAQI scale) */
  iaqi?: WaqiIaqi;
}

export async function fetchWaqi(
  lat: number,
  lon: number,
  token: string
): Promise<WaqiData | null> {
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`;
  try {
    const res = await fetchWithRetry(url);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      status?: string;
      data?: {
        aqi?: number;
        city?: { name?: string };
        dominentpol?: string;
        time?: { s?: string };
        iaqi?: Record<string, { v?: number }>;
      };
    };
    if (j.status !== "ok" || !j.data) return null;
    const iaqi = j.data.iaqi;
    const mapIaqi = (key: string): number | undefined =>
      iaqi?.[key]?.v;
    return {
      aqi: j.data.aqi ?? 0,
      city: j.data.city?.name,
      dominantPol: j.data.dominentpol,
      time: j.data.time?.s,
      iaqi: iaqi
        ? {
            pm25: mapIaqi("pm25"),
            pm10: mapIaqi("pm10"),
            no2: mapIaqi("no2"),
            so2: mapIaqi("so2"),
            o3: mapIaqi("o3"),
            co: mapIaqi("co"),
            t: mapIaqi("t"),
            h: mapIaqi("h"),
            p: mapIaqi("p"),
            w: mapIaqi("w"),
          }
        : undefined,
    };
  } catch {
    return null;
  }
}
