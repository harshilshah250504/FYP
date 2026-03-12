/**
 * Fetch sensor data from local IoT device (e.g. ESP32 air quality sensor).
 * Supports JSON response with PM2.5, Temperature, Humidity, Gas, etc.
 */

const SENSOR_BASE = process.env.SENSOR_URL ?? "http://172.20.10.2";

export interface SensorData {
  pm25: number | null;
  temperature: number | null;
  humidity: number | null;
  gas: number | null;
  lat: number | null;
  lon: number | null;
  raw: Record<string, unknown>;
  timestamp: string;
}

function extractNumber(val: unknown): number | null {
  if (val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function extractPm25(obj: Record<string, unknown>): number | null {
  return (
    extractNumber(obj.pm25) ??
    extractNumber(obj.pm2_5) ??
    extractNumber(obj.PM2_5) ??
    extractNumber(obj.pm2)
  );
}

function extractTemp(obj: Record<string, unknown>): number | null {
  return (
    extractNumber(obj.temperature) ??
    extractNumber(obj.temp) ??
    extractNumber(obj.Temperature) ??
    extractNumber(obj.Temp)
  );
}

function extractHumidity(obj: Record<string, unknown>): number | null {
  return (
    extractNumber(obj.humidity) ??
    extractNumber(obj.Humidity) ??
    extractNumber(obj.h)
  );
}

function scrapeFromHtml(html: string): SensorData | null {
  const num = (pattern: string): number | null => {
    const re = new RegExp(pattern + "\\s*[:=]\\s*([0-9.]+)", "i");
    const m = html.match(re);
    if (!m) return null;
    const n = parseFloat(m[1]);
    return Number.isFinite(n) ? n : null;
  };
  const pm25 = num("(?:pm2\\.?5|pm25|PM2_5)") ?? num("PM2.5");
  const temp = num("(?:temp(?:erature)?)");
  const hum = num("humidity");
  if (pm25 == null && temp == null && hum == null) return null;
  return {
    pm25,
    temperature: temp,
    humidity: hum,
    gas: num("gas"),
    lat: null,
    lon: null,
    raw: {},
    timestamp: new Date().toISOString(),
  };
}

function extractGas(obj: Record<string, unknown>): number | null {
  return (
    extractNumber(obj.gas) ??
    extractNumber(obj.Gas) ??
    extractNumber(obj.co2)
  );
}

const FALLBACK_BASES = ["http://127.0.0.1", "http://localhost"];
const PATHS = ["/", "/json", "/data", "/sensor"];

export async function fetchSensorData(
  baseUrl: string = SENSOR_BASE
): Promise<SensorData | null> {
  const bases = [
    baseUrl.replace(/\/+$/, ""),
    ...FALLBACK_BASES,
  ];
  for (const base of bases) {
    for (const path of PATHS) {
      const url = `${base}${path}`;
      const result = await tryFetch(url);
      if (result) return result;
    }
  }
  return null;
}

async function tryFetch(url: string): Promise<SensorData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();

    if (contentType.includes("application/json")) {
      const obj = JSON.parse(text) as Record<string, unknown>;
      const pm25 = extractPm25(obj);
      return {
        pm25,
        temperature: extractTemp(obj),
        humidity: extractHumidity(obj),
        gas: extractGas(obj),
        lat: extractNumber(obj.lat) ?? extractNumber(obj.latitude),
        lon: extractNumber(obj.lon) ?? extractNumber(obj.longitude),
        raw: obj,
        timestamp: new Date().toISOString(),
      };
    }

    // Try parsing as JSON anyway (some sensors don't set Content-Type)
    try {
      const obj = JSON.parse(text) as Record<string, unknown>;
      return {
        pm25: extractPm25(obj),
        temperature: extractTemp(obj),
        humidity: extractHumidity(obj),
        gas: extractGas(obj),
        lat: extractNumber(obj.lat) ?? extractNumber(obj.latitude),
        lon: extractNumber(obj.lon) ?? extractNumber(obj.longitude),
        raw: obj,
        timestamp: new Date().toISOString(),
      };
    } catch {
      // Try scraping from HTML (common for ESP32/Arduino)
      const scraped = scrapeFromHtml(text);
      if (scraped) return scraped;
      return null;
    }
  } catch {
    return null;
  }
}
