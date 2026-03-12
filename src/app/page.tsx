"use client";

import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ResultCard } from "@/components/ResultCard";
import MapView from "@/components/MapView";
import { Wind, BarChart3, Layers, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (
    q: string,
    ageGroup: string,
    healthCondition: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q,
        ageGroup,
        healthCondition,
      });
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Search failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const loc = result?.location as { displayName?: string; lat?: number; lon?: number } | undefined;
  const aqiData = result?.aqi as { value?: number } | undefined;
  const wildfireData = result?.wildfire as { fires?: Array<{ latitude: number; longitude: number }> } | undefined;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center">
              <Wind className="w-6 h-6 text-[hsl(var(--primary-foreground))]" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight">
              AQInsights
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/analytics"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </Link>
            <Link
              href="/insights"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Clusters
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero + Search */}
      <section className="py-12 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 font-display">
          Air Quality Intelligence
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Search AQI, traffic, wildfires, and pollution for any place. Get personalized health advisories by age group and health condition.
        </p>
        <SearchBar onSearch={handleSearch} isLoading={loading} />
      </section>

      {/* Results */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pb-16">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {result && loc && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <ResultCard data={result as Parameters<typeof ResultCard>[0]["data"]} />
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Location map
                </h3>
                <MapView
                  lat={loc.lat ?? 0}
                  lon={loc.lon ?? 0}
                  displayName={loc.displayName ?? ""}
                  aqi={aqiData?.value ?? null}
                  fires={wildfireData?.fires ?? []}
                />
              </div>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-16 text-muted-foreground">
            <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Enter a city, locality, or coordinates (lat, lon) to get started.</p>
            <p className="text-sm mt-2">
              Try: Mumbai, Delhi, Bengaluru, 19.0760, 72.8777
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-[hsl(var(--border))] py-6 px-6 text-center text-sm text-muted-foreground">
        AQInsights — Open source AQI monitoring. Data: OpenWeather, Open-Meteo, NASA FIRMS, WAQI.
      </footer>
    </div>
  );
}
