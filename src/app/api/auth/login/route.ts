import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  newSessionToken,
  sessionExpiryDate,
  verifyPassword,
} from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const username = (body?.username ?? "").toString().trim();
    const password = (body?.password ?? "").toString();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const token = newSessionToken();
    const expiresAt = sessionExpiryDate();
    await prisma.session.create({
      data: { token, userId: user.id, expiresAt },
    });

    const res = NextResponse.json({
      user: { id: user.id, username: user.username, createdAt: user.createdAt },
    });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Login failed" },
      { status: 500 }
    );
  }
}

