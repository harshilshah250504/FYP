"use client";

import { useEffect, useState } from "react";
import { Cpu, RefreshCw, AlertCircle } from "lucide-react";

const DEFAULT_SENSOR_URL = "http://172.20.10.2";

export function SensorDataSection() {
  const [sensorUrl, setSensorUrl] = useState(DEFAULT_SENSOR_URL);
  const [data, setData] = useState<{
    sensor: { pm25: number | null; temperature: number | null; humidity: number | null; gas: number | null; lat: number | null; lon: number | null; timestamp: string };
    aqi: { value: number | null; level: string; label: string; color: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSensor = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/sensor?url=${encodeURIComponent(sensorUrl)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Sensor unavailable");
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not fetch sensor");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensor();
    const id = setInterval(fetchSensor, 10000);
    return () => clearInterval(id);
  }, [sensorUrl]);

  if (loading) {
    return (
      <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4 animate-pulse">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Cpu className="w-5 h-5" />
          <span className="font-medium">Live Sensor Data (Present Location)</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Live Sensor Data</span>
          </div>
          <button
            type="button"
            onClick={fetchSensor}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
        <p className="text-xs text-muted-foreground mt-2">Try: 127.0.0.1 or localhost if sensor is on this PC</p>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={sensorUrl}
            onChange={(e) => setSensorUrl(e.target.value)}
            placeholder="http://172.20.10.2"
            className="flex-1 px-2 py-1.5 text-sm rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))]"
          />
          <button
            type="button"
            onClick={fetchSensor}
            className="px-3 py-1.5 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { sensor, aqi } = data;

  return (
    <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-500" />
          <span className="font-medium">Live Sensor Data (Present Location)</span>
        </div>
        <button
          type="button"
          onClick={fetchSensor}
          className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-3 rounded-lg border-2"
          style={{ borderColor: `${aqi.color}50`, backgroundColor: `${aqi.color}15` }}
        >
          <p className="text-xs text-muted-foreground">AQI (from PM2.5)</p>
          <p className="text-2xl font-bold" style={{ color: aqi.color }}>
            {aqi.value ?? "—"}
          </p>
          <p className="text-xs mt-0.5">{aqi.label}</p>
        </div>
        <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
          <p className="text-xs text-muted-foreground">PM2.5</p>
          <p className="text-xl font-bold">{sensor.pm25 ?? "—"} µg/m³</p>
        </div>
        <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
          <p className="text-xs text-muted-foreground">Temperature</p>
          <p className="text-xl font-bold">{sensor.temperature != null ? `${sensor.temperature}°C` : "—"}</p>
        </div>
        <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
          <p className="text-xs text-muted-foreground">Humidity</p>
          <p className="text-xl font-bold">{sensor.humidity != null ? `${sensor.humidity}%` : "—"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
        {sensor.gas != null && <span>Gas: {sensor.gas}</span>}
        {sensor.lat != null && sensor.lon != null && (
          <span>Location: {sensor.lat.toFixed(4)}°, {sensor.lon.toFixed(4)}°</span>
        )}
        <span>Updated: {new Date(sensor.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
