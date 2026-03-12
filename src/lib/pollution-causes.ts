export interface Measurements {
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  o3?: number | null;
  co?: number | null;
}

export function classifyPollutionCause(meas: Measurements, dominantPol?: string): string[] {
  const causes: string[] = [];
  const pm25 = meas.pm25 ?? 0;
  const pm10 = meas.pm10 ?? 0;
  const no2 = meas.no2 ?? 0;
  const so2 = meas.so2 ?? 0;
  const o3 = meas.o3 ?? 0;
  const co = meas.co ?? 0;

  if (pm25 > 60) causes.push("High PM2.5 — vehicles, biomass burning, or secondary aerosols");
  else if (pm25 > 35) causes.push("Elevated PM2.5 — vehicular emissions & combustion");

  if (pm10 > 100) causes.push("High PM10 — road dust or construction");
  if (no2 > 80) causes.push("High NO₂ — vehicle emissions");
  if (so2 > 80) causes.push("High SO₂ — industrial or coal combustion");
  if (o3 > 100) causes.push("High O₃ — photochemical smog");
  if (co > 5) causes.push("High CO — incomplete combustion");

  if (causes.length === 0) causes.push("Mixed urban sources (traffic + dust)");
  if (dominantPol) causes.push(`Dominant pollutant: ${dominantPol.toUpperCase()}`);

  return causes;
}
