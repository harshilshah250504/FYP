import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyEmergencyServices } from "@/lib/apis/overpass";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") ?? "");
  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { error: "Missing or invalid lat/lon parameters" },
      { status: 400 }
    );
  }
  const radius = parseInt(req.nextUrl.searchParams.get("radius") ?? "25", 10) || 25;
  try {
    const { hospitals, fireStations } = await fetchNearbyEmergencyServices(
      lat,
      lon,
      Math.min(50, radius)
    );
    return NextResponse.json({
      hospitals,
      fireStations,
    });
  } catch (err) {
    console.error("Emergency services error:", err);
    return NextResponse.json(
      { error: "Failed to fetch emergency services" },
      { status: 500 }
    );
  }
}
