import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subDays, format, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

/** Aggregate AirQualityRecord by day for pollution/temp/humidity trends */
export async function GET(req: NextRequest) {
  const area = req.nextUrl.searchParams.get("area")?.trim();
  const daysParam = req.nextUrl.searchParams.get("days");
  const days = Math.min(90, Math.max(7, parseInt(daysParam ?? "14", 10) || 14));
  const since = subDays(new Date(), days);

  try {
    const where = area?.trim()
      ? { area: { contains: area.trim() } }
      : {};

    const records = await prisma.airQualityRecord.findMany({
      where: { ...where, timestamp: { gte: since } },
      orderBy: { timestamp: "asc" },
      take: 2000,
    });

    const byDay = new Map<
      string,
      { pm25: number[]; pm10: number[]; temp: number[]; humidity: number[]; count: number }
    >();

    for (const r of records) {
      const day = format(startOfDay(r.timestamp), "yyyy-MM-dd");
      if (!byDay.has(day)) {
        byDay.set(day, { pm25: [], pm10: [], temp: [], humidity: [], count: 0 });
      }
      const bucket = byDay.get(day)!;
      if (r.pm25 != null && !isNaN(r.pm25)) bucket.pm25.push(r.pm25);
      if (r.pm10 != null && !isNaN(r.pm10)) bucket.pm10.push(r.pm10);
      if (r.temp != null && !isNaN(r.temp)) bucket.temp.push(r.temp);
      if (r.humidity != null && !isNaN(r.humidity)) bucket.humidity.push(r.humidity);
      bucket.count++;
    }

    const series = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bucket]) => {
        const avg = (arr: number[]) =>
          arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
        return {
          date,
          pm25: avg(bucket.pm25),
          pm10: avg(bucket.pm10),
          temp: avg(bucket.temp),
          humidity: avg(bucket.humidity),
          count: bucket.count,
        };
      });

    const globalStats = {
      avgPm25: series.filter((s) => s.pm25 != null).length
        ? series.reduce((s, x) => s + (x.pm25 ?? 0), 0) /
          series.filter((s) => s.pm25 != null).length
        : null,
      avgPm10: series.filter((s) => s.pm10 != null).length
        ? series.reduce((s, x) => s + (x.pm10 ?? 0), 0) /
          series.filter((s) => s.pm10 != null).length
        : null,
      avgTemp: series.filter((s) => s.temp != null).length
        ? series.reduce((s, x) => s + (x.temp ?? 0), 0) /
          series.filter((s) => s.temp != null).length
        : null,
      totalRecords: records.length,
    };

    return NextResponse.json({
      series,
      globalStats,
      days,
    });
  } catch (err) {
    console.error("Analytics history error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analytics failed" },
      { status: 500 }
    );
  }
}
