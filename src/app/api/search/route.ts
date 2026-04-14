import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { geocode } from "@/lib/apis/geocoding";
import { fetchAirPollution, fetchCurrentWeather } from "@/lib/apis/openweather";
import { fetchFires } from "@/lib/apis/nasa-firms";
import { fetchWaqi } from "@/lib/apis/waqi";
import { fetchOpenMeteoAirQuality } from "@/lib/apis/openmeteo";
import {
  fetchTomTomTraffic,
  heuristicTraffic,
  type TrafficLevel,
} from "@/lib/apis/traffic";
import { pm25ToAqi, interpretAqi, getSafetyClassification } from "@/lib/utils";
import { generateHealthAdvisories, type AgeGroup, type HealthCondition } from "@/lib/health-advisory";
import { classifyPollutionCause } from "@/lib/pollution-causes";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export interface SearchQueryParams {
  q: string;
  ageGroup?: AgeGroup;
  healthCondition?: HealthCondition;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const ageGroup = (req.nextUrl.searchParams.get("ageGroup") ?? "general") as AgeGroup;
  const healthCondition = (req.nextUrl.searchParams.get("healthCondition") ?? "none") as HealthCondition;

  if (!q) {
    return NextResponse.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 }
    );
  }

  const apiKey = env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenWeather API key not configured" },
      { status: 500 }
    );
  }

  try {
    const geo = await geocode(q, apiKey);
    if (!geo) {
      return NextResponse.json(
        { error: "Location not found. Try a different search term or coordinates (lat, lon)." },
        { status: 404 }
      );
    }

    const { lat, lon, displayName } = geo;

    const [airPoll, weather, fires, waqi, openMeteo, tomtom] = await Promise.all([
      fetchAirPollution(lat, lon, apiKey),
      fetchCurrentWeather(lat, lon, apiKey),
      env.NASA_FIRMS_KEY
        ? fetchFires(lat, lon, env.NASA_FIRMS_KEY)
        : Promise.resolve({ fires: [], fireCount: 0, advisory: "No fire data", boundingBox: "" }),
      env.WAQI_TOKEN ? fetchWaqi(lat, lon, env.WAQI_TOKEN) : Promise.resolve(null),
      fetchOpenMeteoAirQuality(lat, lon),
      env.TOMTOM_KEY ? fetchTomTomTraffic(lat, lon, env.TOMTOM_KEY) : Promise.resolve(null),
    ]);

    let primaryAqi: number | null = null;
    let primarySource = "Open-Meteo (fallback)";

    if (waqi?.aqi != null) {
      primaryAqi = waqi.aqi;
      primarySource = waqi.city ? `WAQI (${waqi.city})` : "WAQI";
    } else if (airPoll?.pm2_5 != null) {
      primaryAqi = pm25ToAqi(airPoll.pm2_5) ?? airPoll.aqi ?? null;
      primarySource = "OpenWeather Air Pollution";
    } else if (openMeteo?.pm2_5 != null) {
      primaryAqi = pm25ToAqi(openMeteo.pm2_5);
      primarySource = "Open-Meteo Air Quality";
    }

    const traffic = tomtom ?? heuristicTraffic(displayName, airPoll?.no2 ?? openMeteo?.no2);

    const measurements = {
      pm25: airPoll?.pm2_5 ?? openMeteo?.pm2_5 ?? null,
      pm10: airPoll?.pm10 ?? openMeteo?.pm10 ?? null,
      no2: airPoll?.no2 ?? openMeteo?.no2 ?? null,
      so2: airPoll?.so2 ?? openMeteo?.so2 ?? null,
      o3: airPoll?.o3 ?? openMeteo?.o3 ?? null,
      co: airPoll?.co ?? openMeteo?.co ?? null,
    };

    const causes = classifyPollutionCause(measurements, waqi?.dominantPol);

    const aqiInfo = interpretAqi(primaryAqi);
    const safety = getSafetyClassification(primaryAqi);

    const advisories = generateHealthAdvisories({
      aqi: primaryAqi,
      aqiLevel: aqiInfo.level,
      traffic: traffic.level,
      fireCount: fires.fireCount,
      ageGroup,
      healthCondition,
    });

    const result = {
      location: {
        displayName,
        lat,
        lon,
      },
      aqi: {
        value: primaryAqi,
        level: aqiInfo.level,
        label: aqiInfo.label,
        color: aqiInfo.color,
        source: primarySource,
      },
      safety: safety,
      weather: weather
        ? {
            temp: weather.temp,
            humidity: weather.humidity,
            pressure: weather.pressure,
            windSpeed: weather.windSpeed,
            description: weather.description,
            clouds: weather.clouds,
          }
        : null,
      pollutants: measurements,
      causes,
      traffic: {
        level: traffic.level,
        source: traffic.source,
        currentSpeed: traffic.currentSpeed,
        freeFlowSpeed: traffic.freeFlowSpeed,
      },
      wildfire: {
        fireCount: fires.fireCount,
        advisory: fires.advisory,
        fires: fires.fires.slice(0, 20),
        boundingBox: fires.boundingBox,
      },
      advisories,
      metadata: {
        ageGroup,
        healthCondition,
      },
    };

    await prisma.locationSearch.create({
      data: {
        query: q,
        displayName,
        lat,
        lon,
        aqiData: JSON.stringify({
          value: primaryAqi,
          level: aqiInfo.level,
          source: primarySource,
        }),
        weatherData: weather ? JSON.stringify(weather) : null,
        fireData: JSON.stringify(fires),
        trafficData: JSON.stringify(traffic),
      },
    });

    await prisma.airQualityRecord.create({
      data: {
        lat,
        lon,
        area: displayName,
        pm25: measurements.pm25 ?? undefined,
        pm10: measurements.pm10 ?? undefined,
        no2: measurements.no2 ?? undefined,
        o3: measurements.o3 ?? undefined,
        so2: measurements.so2 ?? undefined,
        co: measurements.co ?? undefined,
        aqi: primaryAqi ?? undefined,
        temp: weather?.temp,
        humidity: weather?.humidity,
        pressure: weather?.pressure,
        windSpeed: weather?.windSpeed,
        source: primarySource,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
