import { NextRequest, NextResponse } from "next/server";
import { fetchSensorData } from "@/lib/apis/sensor";
import { pm25ToAqi, interpretAqi } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sensorUrl = req.nextUrl.searchParams.get("url") ?? process.env.SENSOR_URL ?? "http://172.20.10.2";
  try {
    const data = await fetchSensorData(sensorUrl);
    if (!data) {
      return NextResponse.json(
        { error: "Could not fetch sensor data. Ensure sensor is reachable at " + sensorUrl },
        { status: 503 }
      );
    }
    const aqi = pm25ToAqi(data.pm25);
    const aqiInfo = interpretAqi(aqi);
    return NextResponse.json({
      sensor: data,
      aqi: {
        value: aqi,
        level: aqiInfo.level,
        label: aqiInfo.label,
        color: aqiInfo.color,
      },
    });
  } catch (err) {
    console.error("Sensor API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sensor fetch failed" },
      { status: 500 }
    );
  }
}
