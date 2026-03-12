/**
 * Real-time alert engine: triggers when environmental thresholds are crossed.
 */

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AlertThresholds {
  fireWithinKm?: number;
  aqiAbove?: number;
  heatwaveTempAbove?: number;
  floodWarning?: boolean;
  pm25Above?: number;
}

export interface AlertInput {
  fireCount: number;
  nearestFireKm?: number;
  aqi: number | null;
  temp: number | null;
  pm25: number | null;
  floodActive?: boolean;
}

const defaultThresholds: AlertThresholds = {
  fireWithinKm: 10,
  aqiAbove: 200,
  heatwaveTempAbove: 45,
  pm25Above: 150,
};

export function evaluateAlerts(
  input: AlertInput,
  thresholds: AlertThresholds = {}
): Alert[] {
  const t = { ...defaultThresholds, ...thresholds };
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  if (input.fireCount > 0 && (input.nearestFireKm ?? 50) <= (t.fireWithinKm ?? 10)) {
    alerts.push({
      id: `fire-${Date.now()}`,
      type: "wildfire",
      severity: (input.nearestFireKm ?? 0) <= 5 ? "critical" : "warning",
      title: "Wildfire detected nearby",
      message: `Fire(s) within ${input.nearestFireKm ?? "?"} km. Limit outdoor exposure.`,
      timestamp: now,
      metadata: { fireCount: input.fireCount },
    });
  }

  if (input.aqi != null && input.aqi >= (t.aqiAbove ?? 200)) {
    alerts.push({
      id: `aqi-${Date.now()}`,
      type: "air_quality",
      severity: input.aqi >= 300 ? "critical" : "warning",
      title: "High air pollution",
      message: `AQI ${input.aqi} — Unhealthy. Stay indoors.`,
      timestamp: now,
      metadata: { aqi: input.aqi },
    });
  }

  if (input.temp != null && input.temp >= (t.heatwaveTempAbove ?? 45)) {
    alerts.push({
      id: `heat-${Date.now()}`,
      type: "heatwave",
      severity: "critical",
      title: "Heatwave alert",
      message: `Temperature ${Math.round(input.temp)}°C. Extreme heat risk.`,
      timestamp: now,
      metadata: { temp: input.temp },
    });
  }

  if (input.pm25 != null && input.pm25 >= (t.pm25Above ?? 150)) {
    alerts.push({
      id: `pm25-${Date.now()}`,
      type: "pm25",
      severity: "warning",
      title: "Very high PM2.5",
      message: `PM2.5 ${Math.round(input.pm25)} µg/m³. Reduce outdoor exposure.`,
      timestamp: now,
      metadata: { pm25: input.pm25 },
    });
  }

  if (input.floodActive) {
    alerts.push({
      id: `flood-${Date.now()}`,
      type: "flood",
      severity: "critical",
      title: "Flood warning",
      message: "Active flood warning in area. Follow evacuation orders.",
      timestamp: now,
    });
  }

  return alerts;
}
