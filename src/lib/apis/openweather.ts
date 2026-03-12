import { fetchWithRetry } from "@/lib/fetch-with-retry";

const BASE = "https://api.openweathermap.org/data/2.5";

export interface WeatherData {
  temp: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  /** Wind direction in degrees (0-360, from which wind blows) */
  windDeg?: number;
  /** Wind gust speed m/s */
  windGust?: number;
  visibility?: number; // meters
  clouds?: number;
  description?: string;
  /** UV index (from separate API if available) */
  uvIndex?: number;
  /** Rainfall 1h (mm) if available */
  rain1h?: number;
  timestamp: string;
}

export interface AirPollutionData {
  co?: number;
  no?: number;
  no2?: number;
  o3?: number;
  so2?: number;
  pm2_5?: number;
  pm10?: number;
  nh3?: number;
  aqi?: number;
  timestamp: string;
}

export async function fetchAirPollution(
  lat: number,
  lon: number,
  apiKey: string
): Promise<AirPollutionData | null> {
  const url = `${BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) return null;
  const j = (await res.json()) as { list?: Array<{ dt: number; main?: { aqi?: number }; components?: Record<string, number> }> };
  const item = j.list?.[0];
  if (!item) return null;
  const comp = item.components ?? {};
  return {
    co: comp.co,
    no: comp.no,
    no2: comp.no2,
    o3: comp.o3,
    so2: comp.so2,
    pm2_5: comp.pm2_5,
    pm10: comp.pm10,
    nh3: comp.nh3,
    aqi: item.main?.aqi,
    timestamp: new Date(item.dt * 1000).toISOString(),
  };
}

export async function fetchCurrentWeather(
  lat: number,
  lon: number,
  apiKey: string
): Promise<WeatherData | null> {
  const url = `${BASE}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const res = await fetchWithRetry(url);
  if (!res.ok) return null;
  const j = (await res.json()) as {
    main?: { temp?: number; humidity?: number; pressure?: number };
    wind?: { speed?: number; deg?: number; gust?: number };
    visibility?: number;
    clouds?: { all?: number };
    weather?: Array<{ description?: string }>;
    rain?: { "1h"?: number };
    dt?: number;
  };
  const base: WeatherData = {
    temp: j.main?.temp ?? 0,
    humidity: j.main?.humidity ?? 0,
    pressure: j.main?.pressure ?? 0,
    windSpeed: j.wind?.speed ?? 0,
    windDeg: j.wind?.deg,
    windGust: j.wind?.gust,
    visibility: j.visibility,
    clouds: j.clouds?.all,
    description: j.weather?.[0]?.description,
    rain1h: j.rain?.["1h"],
    timestamp: new Date((j.dt ?? 0) * 1000).toISOString(),
  };
  try {
    const uvRes = await fetchWithRetry(
      `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    if (uvRes.ok) {
      const uvJ = (await uvRes.json()) as { value?: number };
      base.uvIndex = uvJ.value;
    }
  } catch {
    /* UV optional */
  }
  return base;
}
