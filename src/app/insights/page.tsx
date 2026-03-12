"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Wind, BarChart3, ArrowLeft, TrendingUp } from "lucide-react";

export default function InsightsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["cluster"],
    queryFn: async () => {
      const res = await fetch("/api/cluster");
      if (!res.ok) throw new Error("Failed to fetch clusters");
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
              href="/analytics"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
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
        <div className="flex items-center gap-2 mb-8">
          <BarChart3 className="w-8 h-8 text-[hsl(var(--primary))]" />
          <h1 className="text-2xl font-bold">Pollution clusters</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          K-Means clustering on stored air quality data. Perform more searches to build richer insights.
        </p>

        {isLoading && (
          <div className="py-16 text-center text-muted-foreground">
            Loading clusters...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            {error instanceof Error ? error.message : "Failed to load clusters"}
          </div>
        )}

        {data?.message && !data.clusters?.length && (
          <div className="p-6 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            {data.message}
          </div>
        )}

        {data?.summary && data.summary.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.summary.map((s: { clusterId: number; count: number; avgPm25: number; avgPm10: number; risk: string }) => (
                <div
                  key={s.clusterId}
                  className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
                >
                  <p className="text-sm text-muted-foreground">Cluster {s.clusterId}</p>
                  <p className="text-2xl font-bold mt-1">{s.count} points</p>
                  <p className="text-sm mt-2">
                    Avg PM2.5: {s.avgPm25} • PM10: {s.avgPm10}
                  </p>
                  <span
                    className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                      s.risk === "High"
                        ? "bg-red-500/20 text-red-400"
                        : s.risk === "Moderate"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {s.risk} risk
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
