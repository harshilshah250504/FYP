/**
 * Records sensor data and API data to separate CSV files every 5 seconds.
 * Run: npm run record:sensor
 * Loads .env for OPENWEATHER_API_KEY, SENSOR_URL, API_LOCATION
 */

const fs = require("fs");
const path = require("path");

// Load .env
try {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
} catch {}

const SENSOR_URL = process.env.SENSOR_URL || "http://172.20.10.2";
const API_LOCATION = process.env.API_LOCATION || "Mumbai";
const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY || "";
const INTERVAL_MS = 5 * 1000;
const DATA_DIR = path.join(process.cwd(), "data");
const SENSOR_CSV = path.join(DATA_DIR, "sensor_data.csv");
const API_CSV = path.join(DATA_DIR, "api_data.csv");

const SENSOR_HEADERS = "timestamp,pm25,temperature,humidity,gas,lat,lon\n";
const API_HEADERS = "timestamp,location,lat,lon,aqi,pm25,pm10,no2,o3,so2,co,temp,humidity,wind_speed\n";

function escape(val) {
  if (val == null || val === "") return "";
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

function pm25ToAqi(pm25) {
  if (pm25 == null || isNaN(pm25)) return null;
  const C = Number(pm25);
  const bp = [[0, 12, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 150.4, 151, 200], [150.5, 250.4, 201, 300], [250.5, 350.4, 301, 400], [350.5, 500.4, 401, 500]];
  for (const [lo, hi, ilo, ihi] of bp) {
    if (C >= lo && C <= hi) return Math.round(((ihi - ilo) / (hi - lo)) * (C - lo) + ilo);
  }
  return C > 500.4 ? 500 : null;
}

async function fetchSensor() {
  try {
    const res = await fetch(SENSOR_URL + (SENSOR_URL.endsWith("/") ? "" : "/"), {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    let obj;
    try {
      obj = JSON.parse(text);
    } catch {
      return null;
    }
    const get = (v) => (v != null && !isNaN(Number(v)) ? Number(v) : null);
    const pm25 = get(obj.pm25 ?? obj.pm2_5 ?? obj.PM2_5 ?? obj.pm2);
    return {
      timestamp: new Date().toISOString(),
      pm25,
      temperature: get(obj.temperature ?? obj.temp ?? obj.Temperature),
      humidity: get(obj.humidity ?? obj.Humidity ?? obj.h),
      gas: get(obj.gas ?? obj.Gas ?? obj.co2),
      lat: get(obj.lat ?? obj.latitude),
      lon: get(obj.lon ?? obj.longitude),
    };
  } catch (e) {
    console.warn("Sensor fetch failed:", e.message);
    return null;
  }
}

async function fetchApiData() {
  if (!OPENWEATHER_KEY) {
    console.warn("OPENWEATHER_API_KEY not set, skipping API fetch");
    return null;
  }
  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(API_LOCATION)}&limit=1&appid=${OPENWEATHER_KEY}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const geoData = await geoRes.json();
    if (!geoData?.[0]) return null;
    const { lat, lon } = geoData[0];

    const [pollRes, weatherRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`, { signal: AbortSignal.timeout(8000) }),
    ]);

    const poll = await pollRes.json();
    const weather = await weatherRes.json();
    const comp = poll?.list?.[0]?.components || {};
    const pm25 = comp.pm2_5 ?? null;
    const aqi = pm25ToAqi(pm25) ?? poll?.list?.[0]?.main?.aqi ?? null;

    return {
      timestamp: new Date().toISOString(),
      location: API_LOCATION,
      lat,
      lon,
      aqi,
      pm25,
      pm10: comp.pm10 ?? null,
      no2: comp.no2 ?? null,
      o3: comp.o3 ?? null,
      so2: comp.so2 ?? null,
      co: comp.co ?? null,
      temp: weather?.main?.temp ?? null,
      humidity: weather?.main?.humidity ?? null,
      wind_speed: weather?.wind?.speed ?? null,
    };
  } catch (e) {
    console.warn("API fetch failed:", e.message);
    return null;
  }
}

function ensureCsv(file, headers) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, headers, "utf8");
}

function appendSensorRow(row) {
  ensureCsv(SENSOR_CSV, SENSOR_HEADERS);
  const line = [row.timestamp, row.pm25, row.temperature, row.humidity, row.gas, row.lat, row.lon].map(escape).join(",") + "\n";
  fs.appendFileSync(SENSOR_CSV, line);
}

function appendApiRow(row) {
  ensureCsv(API_CSV, API_HEADERS);
  const line = [row.timestamp, row.location, row.lat, row.lon, row.aqi, row.pm25, row.pm10, row.no2, row.o3, row.so2, row.co, row.temp, row.humidity, row.wind_speed].map(escape).join(",") + "\n";
  fs.appendFileSync(API_CSV, line);
}

async function record() {
  const [sensor, api] = await Promise.all([fetchSensor(), fetchApiData()]);
  if (sensor) {
    appendSensorRow(sensor);
    console.log(`[${new Date().toISOString()}] Sensor: PM2.5=${sensor.pm25 ?? "—"} AQI=${pm25ToAqi(sensor.pm25) ?? "—"}`);
  } else {
    console.log(`[${new Date().toISOString()}] Sensor: no data`);
  }
  if (api) {
    appendApiRow(api);
    console.log(`[${new Date().toISOString()}] API (${API_LOCATION}): AQI=${api.aqi ?? "—"}`);
  }
}

async function main() {
  console.log(`Recording every ${INTERVAL_MS / 1000}s → data/sensor_data.csv, data/api_data.csv`);
  console.log(`Sensor: ${SENSOR_URL} | API location: ${API_LOCATION}`);
  await record();
  setInterval(record, INTERVAL_MS);
}

main().catch(console.error);
