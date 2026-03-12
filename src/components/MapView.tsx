"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Layers, Flame, MapPin, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
);

export type MapLayer = "location" | "fire" | "aqi";

interface FirePoint {
  latitude: number;
  longitude: number;
  confidence?: string | number;
  frp?: number;
  distance_km?: number;
  satellite?: string;
}

export default function MapView({
  lat,
  lon,
  displayName,
  aqi,
  fires = [],
  layers: initialLayers = ["location", "fire"],
}: {
  lat: number;
  lon: number;
  displayName: string;
  aqi: number | null;
  fires?: Array<FirePoint | { latitude: number; longitude: number }>;
  layers?: MapLayer[];
}) {
  const [showLocation, setShowLocation] = useState(initialLayers.includes("location"));
  const [showFire, setShowFire] = useState(initialLayers.includes("fire"));
  const [showAqi, setShowAqi] = useState(initialLayers.includes("aqi") ?? true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    import("leaflet/dist/leaflet.css").then(() => {
      import("leaflet").then((L) => {
        delete (L.default.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
      });
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[320px] rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center text-muted-foreground">
        Loading map...
      </div>
    );
  }

  return (
    <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-[hsl(var(--border))]">
      <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-1 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-1.5 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground px-1 flex items-center gap-1">
          <Layers className="w-3 h-3" /> Layers
        </p>
        <button
          type="button"
          onClick={() => setShowLocation(!showLocation)}
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors",
            showLocation ? "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]" : "hover:bg-[hsl(var(--muted))]"
          )}
        >
          <MapPin className="w-3 h-3" /> Location
        </button>
        <button
          type="button"
          onClick={() => setShowFire(!showFire)}
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors",
            showFire ? "bg-orange-500/20 text-orange-400" : "hover:bg-[hsl(var(--muted))]"
          )}
        >
          <Flame className="w-3 h-3" /> Fire
        </button>
        <button
          type="button"
          onClick={() => setShowAqi(!showAqi)}
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors",
            showAqi ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-[hsl(var(--muted))]"
          )}
        >
          <Wind className="w-3 h-3" /> AQI
        </button>
      </div>
      <MapContainer
        center={[lat, lon]}
        zoom={10}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {showLocation && (
          <Marker position={[lat, lon]}>
            <Popup>
              {displayName} {showAqi && `— AQI: ${aqi ?? "—"}`}
            </Popup>
          </Marker>
        )}
        {showFire && fires.map((f, i) => (
          <CircleMarker
            key={i}
            center={[f.latitude, f.longitude]}
            radius={"frp" in f && typeof f.frp === "number" && f.frp > 5 ? 8 : 6}
            pathOptions={{ color: "#f97316", fillColor: "#f97316", fillOpacity: 0.8, weight: 1 }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-medium">Active fire</p>
                {"frp" in f && f.frp != null && <p>FRP: {f.frp} MW</p>}
                {"confidence" in f && f.confidence != null && <p>Confidence: {String(f.confidence)}</p>}
                {"distance_km" in f && f.distance_km != null && <p>Distance: {f.distance_km} km</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
