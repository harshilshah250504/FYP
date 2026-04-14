import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createPasswordHash,
  newSessionToken,
  sessionExpiryDate,
} from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const username = (body?.username ?? "").toString().trim();
    const password = (body?.password ?? "").toString();

    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username already exists." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: createPasswordHash(password),
      },
      select: { id: true, username: true, createdAt: true },
    });

    const token = newSessionToken();
    const expiresAt = sessionExpiryDate();
    await prisma.session.create({
      data: { token, userId: user.id, expiresAt },
    });

    const res = NextResponse.json({ user });
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
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Signup failed" },
      { status: 500 }
    );
  }
}

