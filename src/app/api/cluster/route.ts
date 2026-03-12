import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { kmeans } from "ml-kmeans";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await prisma.airQualityRecord.findMany({
      where: {
        pm25: { not: null },
        pm10: { not: null },
        no2: { not: null },
      },
      take: 500,
      orderBy: { timestamp: "desc" },
    });

    if (records.length < 5) {
      return NextResponse.json({
        clusters: [],
        message: "Insufficient data for clustering. Perform more searches first.",
      });
    }

    const validRecords: typeof records = [];
    const points: number[][] = [];
    for (const r of records) {
      const pm25 = r.pm25 ?? 0;
      const pm10 = r.pm10 ?? 0;
      const no2 = r.no2 ?? 0;
      if (
        isNaN(pm25) || !isFinite(pm25) ||
        isNaN(pm10) || !isFinite(pm10) ||
        isNaN(no2) || !isFinite(no2)
      )
        continue;
      validRecords.push(r);
      points.push([pm25, pm10, no2]);
    }

    if (points.length < 3) {
      return NextResponse.json({
        clusters: [],
        summary: [],
        message: "Not enough valid data points.",
      });
    }

    const k = Math.min(4, Math.max(2, Math.floor(Math.sqrt(points.length / 2))));
    const result = kmeans(points, k, { initialization: "kmeans++" });

    const clusters = result.clusters.map((clusterId, i) => {
      const r = validRecords[i];
      return {
        cluster: clusterId,
        area: r?.area ?? "Unknown",
        pm25: r?.pm25,
        pm10: r?.pm10,
        no2: r?.no2,
        lat: r?.lat,
        lon: r?.lon,
      };
    });

    const byCluster = clusters.reduce<Record<number, typeof clusters>>((acc, c) => {
      if (!acc[c.cluster]) acc[c.cluster] = [];
      acc[c.cluster].push(c);
      return acc;
    }, {});

    const summary = Object.entries(byCluster).map(([id, items]) => {
      const avgPm25 =
        items.reduce((s, x) => s + (x.pm25 ?? 0), 0) / items.filter((x) => x.pm25 != null).length;
      const avgPm10 =
        items.reduce((s, x) => s + (x.pm10 ?? 0), 0) / items.filter((x) => x.pm10 != null).length;
      return {
        clusterId: Number(id),
        count: items.length,
        avgPm25: Math.round(avgPm25 * 10) / 10,
        avgPm10: Math.round(avgPm10 * 10) / 10,
        risk:
          avgPm25 > 55
            ? "High"
            : avgPm25 > 35
              ? "Moderate"
              : avgPm25 > 12
                ? "Elevated"
                : "Low",
      };
    });

    return NextResponse.json({
      clusters: byCluster,
      summary,
      centroids: result.centroids,
    });
  } catch (err) {
    console.error("Cluster error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Clustering failed" },
      { status: 500 }
    );
  }
}
