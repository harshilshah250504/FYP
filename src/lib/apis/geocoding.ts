const OPEN_METEO_GEO = "https://geocoding-api.open-meteo.com/v1/search";
const OPENWEATHER_GEO = "https://api.openweathermap.org/geo/1.0/direct";

export interface GeoResult {
  lat: number;
  lon: number;
  name: string;
  admin1?: string;
  country?: string;
  displayName: string;
}

export async function geocodeOpenMeteo(
  query: string,
  country = "IN"
): Promise<GeoResult | null> {
  const url = `${OPEN_METEO_GEO}?name=${encodeURIComponent(query)}&count=10&language=en&country=${country}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string; country?: string }> };
  const results = data.results ?? [];
  if (results.length === 0) return null;
  const r = results[0];
  return {
    lat: r.latitude,
    lon: r.longitude,
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    displayName: [r.name, r.admin1].filter(Boolean).join(", "),
  };
}

export async function geocodeOpenWeather(
  query: string,
  apiKey: string
): Promise<GeoResult | null> {
  const url = `${OPENWEATHER_GEO}?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: number; lon: number; name: string; state?: string; country?: string }>;
  if (!data?.length) return null;
  const r = data[0];
  return {
    lat: r.lat,
    lon: r.lon,
    name: r.name,
    admin1: r.state,
    country: r.country,
    displayName: [r.name, r.state, r.country].filter(Boolean).join(", "),
  };
}

export async function geocode(
  query: string,
  apiKey: string
): Promise<GeoResult | null> {
  const trimmed = query.trim();
  const coordMatch = /^\s*([-+]?\d+(\.\d+)?)[,\s]+([-+]?\d+(\.\d+)?)\s*$/.exec(trimmed);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[3]);
    return { lat, lon, name: "Coordinates", displayName: `Coordinates ${lat.toFixed(4)}, ${lon.toFixed(4)}` };
  }
  const om = await geocodeOpenMeteo(trimmed);
  if (om) return om;
  return geocodeOpenWeather(trimmed, apiKey);
}
