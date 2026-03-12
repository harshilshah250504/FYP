import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

const ALLOWED = ["sensor_data", "air-quality-records", "location-searches"] as const;

export const dynamic = "force-dynamic";

function escapeCsv(v: unknown): string {
  if (v == null || v === "") return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

function pm25ToAqi(pm25: number | null): number | null {
  if (pm25 == null || !Number.isFinite(pm25)) return null;
  const C = Number(pm25);
  const bp: [number, number, number, number][] = [
    [0, 12, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200], [150.5, 250.4, 201, 300], [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500],
  ];
  for (const [lo, hi, ilo, ihi] of bp) {
    if (C >= lo && C <= hi) return Math.round(((ihi - ilo) / (hi - lo)) * (C - lo) + ilo);
  }
  return C > 500.4 ? 500 : null;
}

async function generateSensorCsv(): Promise<string> {
  const apiKey = env.OPENWEATHER_API_KEY;
  const location = process.env.API_LOCATION ?? "Mumbai";
  const headers = "timestamp,location,lat,lon,aqi,pm25,pm10,no2,o3,so2,co,temp,humidity,wind_speed\n";
  if (!apiKey) {
    return headers + new Date().toISOString() + "," + escapeCsv(location) + ",,,,,,,,,,\n";
  }
  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const geo = await geoRes.json();
    if (!geo?.[0]) return headers;

    const { lat, lon } = geo[0];
    const [pollRes, weatherRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`, { signal: AbortSignal.timeout(8000) }),
    ]);
    const poll = await pollRes.json();
    const weather = await weatherRes.json();
    const comp = poll?.list?.[0]?.components ?? {};
    const pm25 = comp.pm2_5 ?? null;
    const aqi = pm25ToAqi(pm25) ?? poll?.list?.[0]?.main?.aqi ?? null;
    const row = [
      new Date().toISOString(),
      location,
      lat,
      lon,
      aqi,
      pm25,
      comp.pm10 ?? null,
      comp.no2 ?? null,
      comp.o3 ?? null,
      comp.so2 ?? null,
      comp.co ?? null,
      weather?.main?.temp ?? null,
      weather?.main?.humidity ?? null,
      weather?.wind?.speed ?? null,
    ].map(escapeCsv).join(",") + "\n";
    return headers + row;
  } catch {
    return headers;
  }
}

async function generateAirQualityRecordsCsv(): Promise<string> {
  const records = await prisma.airQualityRecord.findMany({
    orderBy: { timestamp: "desc" },
    take: 5000,
  });
  const headers = "id,lat,lon,area,pm25,pm10,no2,o3,so2,co,nh3,aqi,temp,humidity,pressure,windSpeed,uvIndex,source,timestamp\n";
  const rows = records.map((r) =>
    [
      r.id,
      r.lat,
      r.lon,
      r.area,
      r.pm25,
      r.pm10,
      r.no2,
      r.o3,
      r.so2,
      r.co,
      r.nh3,
      r.aqi,
      r.temp,
      r.humidity,
      r.pressure,
      r.windSpeed,
      r.uvIndex,
      r.source,
      r.timestamp?.toISOString?.(),
    ].map(escapeCsv).join(",")
  );
  return headers + rows.join("\n") + (rows.length ? "\n" : "");
}

async function generateLocationSearchesCsv(): Promise<string> {
  const searches = await prisma.locationSearch.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const headers = "id,query,displayName,lat,lon,aqiData,weatherData,fireData,trafficData,createdAt\n";
  const rows = searches.map((s) =>
    [
      s.id,
      s.query,
      s.displayName,
      s.lat,
      s.lon,
      s.aqiData,
      s.weatherData,
      s.fireData,
      s.trafficData,
      s.createdAt?.toISOString?.(),
    ].map(escapeCsv).join(",")
  );
  return headers + rows.join("\n") + (rows.length ? "\n" : "");
}

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file") ?? "";
  if (!ALLOWED.includes(file as (typeof ALLOWED)[number])) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  let content: string;
  if (file === "sensor_data") {
    content = await generateSensorCsv();
  } else if (file === "air-quality-records") {
    content = await generateAirQualityRecordsCsv();
  } else {
    content = await generateLocationSearchesCsv();
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${file}.csv"`,
    },
  });
}
