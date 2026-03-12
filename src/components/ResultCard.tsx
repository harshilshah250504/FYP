"use client";

import { MapPin, Thermometer, Wind, Cloud, AlertTriangle, Flame, Car, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PollutantRisk {
  pollutant: string;
  value: number;
  unit: string;
  riskLevel: string;
  healthImpact: string;
  recommendation: string;
}

interface HealthRiskCategory {
  profile: string;
  label: string;
  score: number;
  level: string;
  summary: string;
  recommendations: string[];
}

interface ResultCardProps {
  data: {
    location: {
      displayName: string;
      lat: number;
      lon: number;
      country?: string;
      state?: string;
      district?: string;
      city?: string;
    };
    aqi: { value: number | null; level: string; label: string; color: string };
    safety: "safe" | "moderate" | "unsafe";
    weather: {
      temp: number;
      humidity: number;
      windSpeed: number;
      windDeg?: number;
      visibility?: number;
      uvIndex?: number;
      rain1h?: number;
      description?: string;
    } | null;
    traffic: { level: string; source: string };
    wildfire: {
      fireCount: number;
      advisory: string;
      maxFrp?: number;
      highConfidenceCount?: number;
    };
    advisories: Array<{ severity: string; icon: string; message: string }>;
    pollutants: Record<string, number | null>;
    causes: string[];
    pollutantRisks?: PollutantRisk[];
    healthRisk?: HealthRiskCategory[];
    aiInsights?: {
      wildfire?: { totalRisk: number; contributions: Array<{ factor: string; percent: number }>; summary: string };
      aqi?: { totalAqi: number | null; contributions: Array<{ factor: string; percent: number }>; summary: string };
    };
    alerts?: Array<{ type: string; severity: string; title: string; message: string }>;
    fireSpreadPrediction?: Array<{ hours: number; radiusKm: number; confidence: number }>;
    wildfireRisk?: { totalScore: number };
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
      <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
        <MapPin className="w-5 h-5 shrink-0" />
        <span className="text-lg font-medium text-foreground">{data.location.displayName}</span>
        <span className="text-sm">
          {data.location.lat.toFixed(4)}°, {data.location.lon.toFixed(4)}°
        </span>
        {(data.location.country || data.location.state || data.location.city) && (
          <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--muted))]">
            {[data.location.city, data.location.state, data.location.country].filter(Boolean).join(" • ")}
          </span>
        )}
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
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>{data.weather.description}</p>
                <p>Humidity {data.weather.humidity}% • Wind {data.weather.windSpeed} m/s
                  {data.weather.windDeg != null && ` (${Math.round(data.weather.windDeg)}°)`}
                </p>
                {(data.weather.visibility != null || data.weather.uvIndex != null) && (
                  <p>
                    {data.weather.visibility != null && `Visibility ${(data.weather.visibility / 1000).toFixed(1)} km`}
                    {data.weather.visibility != null && data.weather.uvIndex != null && " • "}
                    {data.weather.uvIndex != null && `UV ${data.weather.uvIndex}`}
                    {data.weather.rain1h != null && data.weather.rain1h > 0 && ` • Rain ${data.weather.rain1h} mm`}
                  </p>
                )}
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
              {data.wildfire.highConfidenceCount != null && data.wildfire.highConfidenceCount > 0 && (
                <span className="ml-1 text-amber-500">({data.wildfire.highConfidenceCount} high confidence)</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">{data.wildfire.advisory}</p>
            {data.wildfire.maxFrp != null && data.wildfire.maxFrp > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">Max Fire Radiative Power: {data.wildfire.maxFrp} MW</p>
            )}
          </div>
        </div>
      </div>

      {/* Pollutants & Pollutant Risks */}
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
        {data.pollutantRisks && data.pollutantRisks.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Pollutant risk & health impact</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.pollutantRisks.slice(0, 4).map((pr, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg text-xs border ${
                    pr.riskLevel === "critical" ? "border-red-500/50 bg-red-500/10" :
                    pr.riskLevel === "high" ? "border-amber-500/50 bg-amber-500/5" :
                    pr.riskLevel === "moderate" ? "border-yellow-500/30 bg-yellow-500/5" :
                    "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50"
                  }`}
                >
                  <span className="font-medium">{pr.pollutant}</span> {pr.value} {pr.unit} • {pr.riskLevel}
                  <p className="text-muted-foreground mt-0.5">{pr.healthImpact}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.causes.length > 0 && (
          <p className="text-sm text-muted-foreground mt-3">
            Likely causes: {data.causes.join(" • ")}
          </p>
        )}
      </div>

      {/* Health Risk Score */}
      {data.healthRisk && data.healthRisk.length > 0 && (
        <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Health Risk Score (0–100)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.healthRisk.map((hr, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  hr.level === "critical" ? "border-red-500/50 bg-red-500/10" :
                  hr.level === "high" ? "border-amber-500/50 bg-amber-500/5" :
                  hr.level === "elevated" ? "border-yellow-500/50 bg-yellow-500/5" :
                  hr.level === "moderate" ? "border-blue-500/30 bg-blue-500/5" :
                  "border-emerald-500/30 bg-emerald-500/5"
                }`}
              >
                <p className="font-medium text-sm">{hr.label}</p>
                <p className="text-2xl font-bold mt-1">{hr.score}/100</p>
                <p className="text-xs text-muted-foreground mt-1">{hr.summary}</p>
                {hr.recommendations.length > 0 && (
                  <ul className="text-xs mt-2 space-y-0.5 text-muted-foreground">
                    {hr.recommendations.slice(0, 2).map((r, j) => (
                      <li key={j}>• {r}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-red-500" />
            <p className="font-medium">Active Alerts</p>
          </div>
          <ul className="space-y-2">
            {data.alerts.map((a, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2 text-sm",
                  a.severity === "critical" && "text-red-400 font-medium",
                  a.severity === "warning" && "text-amber-400"
                )}
              >
                <span>{a.severity === "critical" ? "🔴" : "🟠"}</span>
                <span><strong>{a.title}</strong> — {a.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Insights */}
      {data.aiInsights && (data.aiInsights.wildfire || data.aiInsights.aqi) && (
        <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <Brain className="w-4 h-4" />
            <p className="text-sm font-medium">AI Insights</p>
          </div>
          <div className="space-y-3">
            {data.aiInsights.wildfire && (
              <div>
                <p className="text-xs text-muted-foreground">Wildfire risk</p>
                <p className="text-sm mt-0.5">{data.aiInsights.wildfire.summary}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.aiInsights.wildfire.contributions.slice(0, 5).map((c, j) => (
                    <span key={j} className="px-2 py-0.5 rounded bg-[hsl(var(--muted))] text-xs">
                      {c.factor}: {c.percent}%
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.aiInsights.aqi && data.aiInsights.aqi.totalAqi != null && (
              <div>
                <p className="text-xs text-muted-foreground">Air quality</p>
                <p className="text-sm mt-0.5">{data.aiInsights.aqi.summary}</p>
                {data.aiInsights.aqi.contributions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.aiInsights.aqi.contributions.slice(0, 4).map((c, j) => (
                      <span key={j} className="px-2 py-0.5 rounded bg-[hsl(var(--muted))] text-xs">
                        {c.factor}: {c.percent}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fire Spread Prediction */}
      {data.fireSpreadPrediction && data.fireSpreadPrediction.length > 0 && data.wildfire?.fireCount && data.wildfire.fireCount > 0 && (
        <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">Predicted fire spread (model)</p>
          <div className="grid grid-cols-3 gap-2">
            {data.fireSpreadPrediction.map((p, i) => (
              <div key={i} className="p-2 rounded-lg bg-[hsl(var(--muted))] text-center">
                <p className="text-lg font-bold">{p.hours}h</p>
                <p className="text-xs text-muted-foreground">~{p.radiusKm} km radius</p>
                <p className="text-xs">{(p.confidence * 100).toFixed(0)}% confidence</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
