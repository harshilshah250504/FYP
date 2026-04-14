import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import Groq from "groq-sdk";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", advisory: null }, { status: 401 });
  }

  const groqKey = env.GROQ_API_KEY;
  if (!groqKey || groqKey.includes("placeholder")) {
    return NextResponse.json({
      advisory: null,
      message: "GROQ API key not configured. Add your key to .env to enable AI advisories.",
    });
  }

  try {
    const body = await req.json();
    const {
      location,
      aqi,
      safety,
      pollutants,
      traffic,
      fireCount,
      ageGroup = "general",
      healthCondition = "none",
    } = body;

    const groq = new Groq({ apiKey: groqKey });

    const prompt = `You are an air quality health advisor. Based on the following data for ${location || "a location"}:
- AQI: ${aqi ?? "unknown"}
- Safety classification: ${safety ?? "unknown"}
- Pollutants (µg/m³): PM2.5=${pollutants?.pm25 ?? "?"}, PM10=${pollutants?.pm10 ?? "?"}, NO2=${pollutants?.no2 ?? "?"}
- Traffic: ${traffic ?? "unknown"}
- Active wildfires nearby: ${fireCount ?? 0}
- User age group: ${ageGroup}
- Health condition: ${healthCondition}

Provide a brief, actionable 2-3 sentence health advisory. Be concise and practical. Focus on what the user should do.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.3,
    });

    const advisory = completion.choices[0]?.message?.content?.trim() ?? null;

    return NextResponse.json({ advisory });
  } catch (err) {
    console.error("LLM advisory error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "LLM advisory failed", advisory: null },
      { status: 500 }
    );
  }
}
