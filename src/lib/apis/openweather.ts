const BASE = "https://api.openweathermap.org/data/2.5";

export interface WeatherData {
  temp: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  clouds?: number;
  description?: string;
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
  const res = await fetch(url);
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
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = (await res.json()) as {
    main?: { temp?: number; humidity?: number; pressure?: number };
    wind?: { speed?: number };
    clouds?: { all?: number };
    weather?: Array<{ description?: string }>;
    dt?: number;
  };
  return {
    temp: j.main?.temp ?? 0,
    humidity: j.main?.humidity ?? 0,
    pressure: j.main?.pressure ?? 0,
    windSpeed: j.wind?.speed ?? 0,
    clouds: j.clouds?.all,
    description: j.weather?.[0]?.description,
    timestamp: new Date((j.dt ?? 0) * 1000).toISOString(),
  };
}
