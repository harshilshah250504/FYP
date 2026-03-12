import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { geocode } from "@/lib/apis/geocoding";
import { reverseGeocode } from "@/lib/apis/reverse-geocoding";
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
import { computePollutantRisks } from "@/lib/pollutant-risk";
import { computeHealthRiskScore } from "@/lib/health-risk-analysis";
import { predictFireSpread, computeWildfireRiskHeatmapScore } from "@/lib/disaster-intelligence";
import { evaluateAlerts } from "@/lib/alert-engine";
import { explainWildfireRisk, explainAqiRisk } from "@/lib/ai-insights";
import { prisma } from "@/lib/db";
import { getCached, setCache, buildCacheKey } from "@/lib/api-cache";

export const dynamic = "force-dynamic";

export interface SearchQueryParams {
  q: string;
  ageGroup?: AgeGroup;
  healthCondition?: HealthCondition;
}

export async function GET(req: NextRequest) {
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

  const cacheKey = buildCacheKey("search", { q, ageGroup, healthCondition });
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const geo = await geocode(q, apiKey);
    if (!geo) {
      return NextResponse.json(
        { error: "Location not found. Try a different search term or coordinates (lat, lon)." },
        { status: 404 }
      );
    }

    const { lat, lon, displayName } = geo;

    const [airPoll, weather, fires, waqi, openMeteo, tomtom, reverseGeo] = await Promise.all([
      fetchAirPollution(lat, lon, apiKey),
      fetchCurrentWeather(lat, lon, apiKey),
      env.NASA_FIRMS_KEY
        ? fetchFires(lat, lon, env.NASA_FIRMS_KEY)
        : Promise.resolve({ fires: [], fireCount: 0, advisory: "No fire data", boundingBox: "" }),
      env.WAQI_TOKEN ? fetchWaqi(lat, lon, env.WAQI_TOKEN) : Promise.resolve(null),
      fetchOpenMeteoAirQuality(lat, lon),
      env.TOMTOM_KEY ? fetchTomTomTraffic(lat, lon, env.TOMTOM_KEY) : Promise.resolve(null),
      reverseGeocode(lat, lon, apiKey),
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
    const pollutantRisks = computePollutantRisks(measurements);
    const healthRiskCategories = computeHealthRiskScore({
      aqi: primaryAqi,
      temp: weather?.temp ?? null,
      humidity: weather?.humidity ?? null,
      fireCount: fires.fireCount,
      smokeDensity: fires.maxFrp,
      pm25: measurements.pm25,
      pm10: measurements.pm10,
      o3: measurements.o3,
      no2: measurements.no2,
      uvIndex: weather?.uvIndex ?? null,
    });

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

    const locationDetail = reverseGeo ?? { country: "", displayName, lat, lon };

    const result = {
      location: {
        displayName,
        lat,
        lon,
        country: locationDetail.country,
        countryCode: locationDetail.countryCode,
        state: locationDetail.state,
        district: locationDetail.district,
        city: locationDetail.city,
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
            windDeg: weather.windDeg,
            windGust: weather.windGust,
            visibility: weather.visibility,
            uvIndex: weather.uvIndex,
            rain1h: weather.rain1h,
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
        fires: fires.fires.slice(0, 50),
        boundingBox: fires.boundingBox,
        maxFrp: fires.maxFrp,
        highConfidenceCount: fires.highConfidenceCount,
      },
      pollutantRisks,
      healthRisk: healthRiskCategories,
      wildfireRisk: computeWildfireRiskHeatmapScore({
        windSpeed: weather?.windSpeed ?? 0,
        temp: weather?.temp ?? 25,
        humidity: weather?.humidity ?? 50,
        fireCount: fires.fireCount,
        maxFrp: fires.maxFrp,
      }),
      fireSpreadPrediction: weather
        ? predictFireSpread({
            windSpeed: weather.windSpeed,
            windDeg: weather.windDeg ?? 0,
            humidity: weather.humidity,
            temp: weather.temp,
            frp: fires.maxFrp ?? 1,
          })
        : [],
      aiInsights: {
        wildfire: explainWildfireRisk({
          windSpeed: weather?.windSpeed ?? 0,
          temp: weather?.temp ?? 25,
          humidity: weather?.humidity ?? 50,
          fireCount: fires.fireCount,
          maxFrp: fires.maxFrp,
        }),
        aqi: explainAqiRisk({
          aqi: primaryAqi,
          pm25: measurements.pm25,
          pm10: measurements.pm10,
          o3: measurements.o3,
          no2: measurements.no2,
        }),
      },
      alerts: evaluateAlerts({
        fireCount: fires.fireCount,
        nearestFireKm: fires.fires[0]?.distance_km,
        aqi: primaryAqi,
        temp: weather?.temp ?? null,
        pm25: measurements.pm25 ?? null,
      }),
      advisories,
      metadata: {
        ageGroup,
        healthCondition,
      },
    };

    try {
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
    } catch (dbErr) {
      console.warn("DB write failed (search result still returned):", dbErr);
    }

    setCache(cacheKey, result, 3 * 60 * 1000);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    const details = err instanceof Error ? err.stack : String(err);
    console.error("Search error:", details);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
