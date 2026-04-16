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
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide&timezone=auto`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      current?: { 
        time?: string; 
        pm2_5?: number; 
        pm10?: number; 
        nitrogen_dioxide?: number; 
        sulphur_dioxide?: number; 
        ozone?: number; 
        carbon_monoxide?: number 
      };
    };
    const c = j.current;
    if (!c) return null;
    return {
      pm2_5: c.pm2_5,
      pm10: c.pm10,
      no2: c.nitrogen_dioxide,
      so2: c.sulphur_dioxide,
      o3: c.ozone,
      co: c.carbon_monoxide,
      time: c.time,
    };
  } catch {
    return null;
  }
}
