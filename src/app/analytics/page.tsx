"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Wind,
  BarChart3,
  ArrowLeft,
  TrendingUp,
  Thermometer,
  Droplets,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const [days, setDays] = useState(14);
  const [area, setArea] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics-history", days, area],
    queryFn: async () => {
      const params = new URLSearchParams({ days: String(days) });
      if (area) params.set("area", area);
      const res = await fetch(`/api/analytics/history?${params}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-[hsl(var(--border))] py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center">
              <Wind className="w-6 h-6 text-[hsl(var(--primary-foreground))]" />
            </div>
            <span className="text-xl font-bold font-display">AQInsights</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/insights"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clusters
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-8 h-8 text-[hsl(var(--primary))]" />
          <h1 className="text-2xl font-bold">Environmental Analytics</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Historical trends: pollution, temperature, humidity from stored air
          quality data. Perform searches to build the dataset.
        </p>

        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Days</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))]"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">
              Filter by area
            </label>
            <input
              type="text"
              placeholder="e.g. Mumbai, Delhi"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] w-48"
            />
          </div>
        </div>

        {isLoading && (
          <div className="py-16 text-center text-muted-foreground">
            Loading analytics...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-6">
            {error instanceof Error ? error.message : "Failed to load"}
          </div>
        )}

        {data?.series && data.series.length === 0 && (
          <div className="p-8 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center text-muted-foreground">
            No historical data yet. Perform searches from the home page to build
            the dataset.
          </div>
        )}

        {data?.series && data.series.length > 0 && (
          <div className="space-y-8">
            {data.globalStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                  <p className="text-sm text-muted-foreground">Avg PM2.5</p>
                  <p className="text-2xl font-bold">
                    {data.globalStats.avgPm25 != null
                      ? data.globalStats.avgPm25.toFixed(1)
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">µg/m³</p>
                </div>
                <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                  <p className="text-sm text-muted-foreground">Avg PM10</p>
                  <p className="text-2xl font-bold">
                    {data.globalStats.avgPm10 != null
                      ? data.globalStats.avgPm10.toFixed(1)
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">µg/m³</p>
                </div>
                <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                  <p className="text-sm text-muted-foreground">Avg Temp</p>
                  <p className="text-2xl font-bold">
                    {data.globalStats.avgTemp != null
                      ? `${data.globalStats.avgTemp.toFixed(1)}°C`
                      : "—"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                  <p className="text-sm text-muted-foreground">Records</p>
                  <p className="text-2xl font-bold">
                    {data.globalStats.totalRecords ?? 0}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4">
              <h3 className="flex items-center gap-2 font-medium mb-4">
                <BarChart3 className="w-5 h-5" />
                Pollution trends
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="pm25"
                      name="PM2.5 (µg/m³)"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="pm10"
                      name="PM10 (µg/m³)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4">
              <h3 className="flex items-center gap-2 font-medium mb-4">
                <Thermometer className="w-5 h-5" />
                Temperature & humidity
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="temp"
                      name="Temp (°C)"
                      stroke="#eab308"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="humidity"
                      name="Humidity (%)"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
