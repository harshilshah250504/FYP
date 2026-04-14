export interface OpenMeteoAirQuality {
  pm2_5?: number;
  pm10?: number;
  no2?: number;
  so2?: number;
  o3?: number;
  co?: number;
  time?: string;
}

export async function fetchOpenMeteoAirQuality(
  lat: number,
  lon: number
): Promise<OpenMeteoAirQuality | null> {
  const url = `https://air-quality.api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10,no2,so2,o3,co&timezone=auto`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      hourly?: { time?: string[]; pm2_5?: number[]; pm10?: number[]; no2?: number[]; so2?: number[]; o3?: number[]; co?: number[] };
    };
    const h = j.hourly;
    if (!h?.time?.length) return null;
    const idx = h.time.length - 1;
    return {
      pm2_5: h.pm2_5?.[idx],
      pm10: h.pm10?.[idx],
      no2: h.no2?.[idx],
      so2: h.so2?.[idx],
      o3: h.o3?.[idx],
      co: h.co?.[idx],
      time: h.time[idx],
    };
  } catch {
    return null;
  }
}
