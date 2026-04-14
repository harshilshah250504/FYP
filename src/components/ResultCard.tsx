"use client";

import { MapPin, Thermometer, Wind, Cloud, AlertTriangle, Flame, Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  data: {
    location: { displayName: string; lat: number; lon: number };
    aqi: { value: number | null; level: string; label: string; color: string };
    safety: "safe" | "moderate" | "unsafe";
    weather: {
      temp: number;
      humidity: number;
      windSpeed: number;
      description?: string;
    } | null;
    traffic: { level: string; source: string };
    wildfire: { fireCount: number; advisory: string };
    advisories: Array<{ severity: string; icon: string; message: string }>;
    pollutants: Record<string, number | null>;
    causes: string[];
  };
}

export function ResultCard({ data }: ResultCardProps) {
  const safetyColors = {
    safe: "border-emerald-500/50 bg-emerald-500/5",
    moderate: "border-amber-500/50 bg-amber-500/5",
    unsafe: "border-red-500/50 bg-red-500/10",
  };

  const safetyLabels = {
    safe: "Safe",
    moderate: "Moderate Risk",
    unsafe: "Unsafe",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Location */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <MapPin className="w-5 h-5" />
        <span className="text-lg font-medium text-foreground">{data.location.displayName}</span>
        <span className="text-sm">
          {data.location.lat.toFixed(4)}°, {data.location.lon.toFixed(4)}°
        </span>
      </div>

      {/* AQI & Safety */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={cn(
            "p-5 rounded-xl border-2",
            safetyColors[data.safety]
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Air Quality Index</span>
            <span
              className="px-2 py-1 rounded-md text-xs font-medium"
              style={{ backgroundColor: `${data.aqi.color}30`, color: data.aqi.color }}
            >
              {safetyLabels[data.safety]}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-bold"
              style={{ color: data.aqi.color }}
            >
              {data.aqi.value ?? "—"}
            </span>
            <span className="text-muted-foreground">{data.aqi.label}</span>
          </div>
        </div>

        {data.weather && (
          <div className="p-5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Thermometer className="w-4 h-4" />
              <span className="text-sm">Weather</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold">{Math.round(data.weather.temp)}°C</span>
              <div className="text-sm text-muted-foreground">
                <p>{data.weather.description}</p>
                <p>Humidity {data.weather.humidity}% • Wind {data.weather.windSpeed} m/s</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Traffic & Wildfire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <Car className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="font-medium">Traffic: {data.traffic.level}</p>
            <p className="text-sm text-muted-foreground">Source: {data.traffic.source}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="font-medium">
              Wildfires: {data.wildfire.fireCount} active
            </p>
            <p className="text-sm text-muted-foreground">{data.wildfire.advisory}</p>
          </div>
        </div>
      </div>

      {/* Pollutants */}
      <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">Pollutant levels (µg/m³)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {["pm25", "pm10", "no2", "o3", "so2", "co"].map((k) => (
            <div key={k} className="text-center p-2 rounded-lg bg-[hsl(var(--muted))]">
              <p className="text-xs text-muted-foreground uppercase">{k.replace("25", "2.5")}</p>
              <p className="font-mono font-medium">
                {data.pollutants[k as keyof typeof data.pollutants] ?? "—"}
              </p>
            </div>
          ))}
        </div>
        {data.causes.length > 0 && (
          <p className="text-sm text-muted-foreground mt-3">
            Likely causes: {data.causes.join(" • ")}
          </p>
        )}
      </div>

      {/* Advisories */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <p className="font-medium">Health advisories</p>
        </div>
        <ul className="space-y-2">
          {data.advisories.map((a, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2 text-sm",
                a.severity === "critical" && "text-red-400",
                a.severity === "danger" && "text-red-300",
                a.severity === "warning" && "text-amber-400",
                a.severity === "info" && "text-muted-foreground"
              )}
            >
              <span>{a.icon}</span>
              <span>{a.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
