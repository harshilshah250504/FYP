import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { sendSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !user.phoneNumber) {
      return NextResponse.json(
        { error: "User not found or missing phone number" },
        { status: 401 }
      );
    }

    const message = `🔔 Manual Alert: This is a test alert from your AQInsights dashboard. Everything is working correctly!`;
    
    await sendSms(user.phoneNumber, message);

    return NextResponse.json({ success: true, message: "Alert sent successfully" });
  } catch (err) {
    console.error("Manual alert error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send manual alert" },
      { status: 500 }
    );
  }
}
