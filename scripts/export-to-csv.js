/**
 * Exports AirQualityRecord and LocationSearch data to CSV every 10 seconds.
 * Run: node scripts/export-to-csv.js (from project root)
 * Requires: DATABASE_URL in .env or set inline
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), "data");
const INTERVAL_MS = 10 * 1000; // 10 seconds

function escapeCsv(value) {
  if (value == null || value === "") return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsvRow(obj, headers) {
  return headers.map((h) => escapeCsv(obj[h])).join(",");
}

async function exportToCsv() {
  const timestamp = new Date().toISOString();
  try {
    const [records, searches] = await Promise.all([
      prisma.airQualityRecord.findMany({ orderBy: { timestamp: "desc" } }),
      prisma.locationSearch.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    const aqHeaders = [
      "id", "locationId", "lat", "lon", "area", "pm25", "pm10", "no2", "o3",
      "so2", "co", "nh3", "aqi", "temp", "humidity", "pressure", "windSpeed",
      "uvIndex", "source", "timestamp",
    ];
    const searchHeaders = [
      "id", "query", "displayName", "lat", "lon", "aqiData", "weatherData",
      "fireData", "trafficData", "createdAt",
    ];

    const aqCsv = [
      aqHeaders.join(","),
      ...records.map((r) =>
        toCsvRow(
          {
            id: r.id,
            locationId: r.locationId,
            lat: r.lat,
            lon: r.lon,
            area: r.area,
            pm25: r.pm25,
            pm10: r.pm10,
            no2: r.no2,
            o3: r.o3,
            so2: r.so2,
            co: r.co,
            nh3: r.nh3,
            aqi: r.aqi,
            temp: r.temp,
            humidity: r.humidity,
            pressure: r.pressure,
            windSpeed: r.windSpeed,
            uvIndex: r.uvIndex,
            source: r.source,
            timestamp: r.timestamp?.toISOString?.(),
          },
          aqHeaders
        )
      ),
    ].join("\n");

    const searchCsv = [
      searchHeaders.join(","),
      ...searches.map((s) =>
        toCsvRow(
          {
            id: s.id,
            query: s.query,
            displayName: s.displayName,
            lat: s.lat,
            lon: s.lon,
            aqiData: s.aqiData,
            weatherData: s.weatherData,
            fireData: s.fireData,
            trafficData: s.trafficData,
            createdAt: s.createdAt?.toISOString?.(),
          },
          searchHeaders
        )
      ),
    ].join("\n");

    const aqPath = path.join(DATA_DIR, "air-quality-records.csv");
    const searchPath = path.join(DATA_DIR, "location-searches.csv");
    fs.writeFileSync(aqPath, aqCsv, "utf8");
    fs.writeFileSync(searchPath, searchCsv, "utf8");

    console.log(
      `[${timestamp}] Exported ${records.length} AQ records, ${searches.length} searches → data/`
    );
  } catch (err) {
    console.error(`[${timestamp}] Export error:`, err.message);
  }
}

async function main() {
  console.log(`CSV export running every ${INTERVAL_MS / 1000} seconds. Press Ctrl+C to stop.`);
  await exportToCsv();
  setInterval(exportToCsv, INTERVAL_MS);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());