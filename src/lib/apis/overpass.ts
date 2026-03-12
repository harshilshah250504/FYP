/**
 * Overpass API (OpenStreetMap) for emergency assistance: hospitals, fire stations, shelters.
 */

export interface OsmPlace {
  id: number;
  lat: number;
  lon: number;
  name: string;
  type: string;
  distanceKm: number;
  tags?: Record<string, string>;
}

const OVERPASS = "https://overpass-api.de/api/interpreter";

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function fetchNearbyEmergencyServices(
  lat: number,
  lon: number,
  radiusKm = 25
): Promise<{
  hospitals: OsmPlace[];
  fireStations: OsmPlace[];
}> {
  const radiusM = radiusKm * 1000;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radiusM},${lat},${lon});
      node["emergency"="hospital"](around:${radiusM},${lat},${lon});
      way["amenity"="hospital"](around:${radiusM},${lat},${lon});
      node["amenity"="fire_station"](around:${radiusM},${lat},${lon});
      way["amenity"="fire_station"](around:${radiusM},${lat},${lon});
    );
    out center 20;
  `;
  try {
    const res = await fetch(OVERPASS, {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
    });
    if (!res.ok) return { hospitals: [], fireStations: [] };
    const data = (await res.json()) as {
      elements?: Array<{
        type: string;
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };
    const elements = data.elements ?? [];
    const hospitals: OsmPlace[] = [];
    const fireStations: OsmPlace[] = [];
    for (const el of elements) {
      const plat = el.lat ?? el.center?.lat;
      const plon = el.lon ?? el.center?.lon;
      if (plat == null || plon == null) continue;
      const name = el.tags?.name ?? "Unnamed";
      const dist = Math.round(haversineKm(lat, lon, plat, plon) * 10) / 10;
      const place: OsmPlace = {
        id: el.id,
        lat: plat,
        lon: plon,
        name,
        type: el.tags?.amenity ?? "place",
        distanceKm: dist,
        tags: el.tags,
      };
      if (el.tags?.amenity === "hospital" || el.tags?.emergency === "hospital") {
        hospitals.push(place);
      } else if (el.tags?.amenity === "fire_station") {
        fireStations.push(place);
      }
    }
    hospitals.sort((a, b) => a.distanceKm - b.distanceKm);
    fireStations.sort((a, b) => a.distanceKm - b.distanceKm);
    return {
      hospitals: hospitals.slice(0, 10),
      fireStations: fireStations.slice(0, 10),
    };
  } catch {
    return { hospitals: [], fireStations: [] };
  }
}
