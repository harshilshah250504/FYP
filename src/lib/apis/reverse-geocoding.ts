/**
 * Reverse geocoding: convert lat/lon to hierarchical location (country, state, city, etc.)
 */

export interface ReverseGeoResult {
  country: string;
  countryCode?: string;
  state?: string;
  district?: string;
  city?: string;
  locality?: string;
  displayName: string;
  lat: number;
  lon: number;
}

const OPENWEATHER_REVERSE = "https://api.openweathermap.org/geo/1.0/reverse";
const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";

export async function reverseGeocodeOpenWeather(
  lat: number,
  lon: number,
  apiKey: string
): Promise<ReverseGeoResult | null> {
  const url = `${OPENWEATHER_REVERSE}?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      name?: string;
      lat?: number;
      lon?: number;
      country?: string;
      state?: string;
      local_names?: Record<string, string>;
    }>;
    if (!data?.length) return null;
    const r = data[0];
    return {
      country: r.country ?? "",
      state: r.state,
      city: r.name,
      displayName: [r.name, r.state, r.country].filter(Boolean).join(", "),
      lat: r.lat ?? lat,
      lon: r.lon ?? lon,
    };
  } catch {
    return null;
  }
}

export async function reverseGeocodeNominatim(
  lat: number,
  lon: number
): Promise<ReverseGeoResult | null> {
  const url = `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AQInsights/1.0 (research)" },
    });
    if (!res.ok) return null;
    const r = (await res.json()) as {
      address?: {
        country?: string;
        country_code?: string;
        state?: string;
        state_district?: string;
        county?: string;
        city?: string;
        town?: string;
        village?: string;
        locality?: string;
      };
      lat?: string;
      lon?: string;
      display_name?: string;
    };
    const addr = r.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.locality;
    const district = addr.state_district ?? addr.county;
    return {
      country: addr.country ?? "",
      countryCode: addr.country_code?.toUpperCase(),
      state: addr.state,
      district,
      city,
      locality: addr.locality,
      displayName: r.display_name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      lat: parseFloat(r.lat ?? String(lat)),
      lon: parseFloat(r.lon ?? String(lon)),
    };
  } catch {
    return null;
  }
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  openWeatherApiKey?: string
): Promise<ReverseGeoResult | null> {
  if (openWeatherApiKey) {
    const ow = await reverseGeocodeOpenWeather(lat, lon, openWeatherApiKey);
    if (ow) return ow;
  }
  return reverseGeocodeNominatim(lat, lon);
}
