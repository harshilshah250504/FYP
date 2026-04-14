export interface WaqiData {
  aqi: number;
  city?: string;
  dominantPol?: string;
  time?: string;
}

export async function fetchWaqi(
  lat: number,
  lon: number,
  token: string
): Promise<WaqiData | null> {
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      status?: string;
      data?: { aqi?: number; city?: { name?: string }; dominentpol?: string; time?: { s?: string } };
    };
    if (j.status !== "ok" || !j.data) return null;
    return {
      aqi: j.data.aqi ?? 0,
      city: j.data.city?.name,
      dominantPol: j.data.dominentpol,
      time: j.data.time?.s,
    };
  } catch {
    return null;
  }
}
