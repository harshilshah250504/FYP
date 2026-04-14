import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.delete({ where: { token } }).catch(() => undefined);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return res;
}

