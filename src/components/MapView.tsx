"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

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

export default function MapView({
  lat,
  lon,
  displayName,
  aqi,
  fires = [],
}: {
  lat: number;
  lon: number;
  displayName: string;
  aqi: number | null;
  fires?: Array<{ latitude: number; longitude: number }>;
}) {
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
    <div className="w-full h-[320px] rounded-xl overflow-hidden border border-[hsl(var(--border))]">
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
        <Marker position={[lat, lon]}>
          <Popup>{displayName} — AQI: {aqi ?? "—"}</Popup>
        </Marker>
        {fires.map((f, i) => (
          <CircleMarker
            key={i}
            center={[f.latitude, f.longitude]}
            radius={6}
            pathOptions={{ color: "#f97316", fillColor: "#f97316", fillOpacity: 0.8, weight: 1 }}
          >
            <Popup>Active fire</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
