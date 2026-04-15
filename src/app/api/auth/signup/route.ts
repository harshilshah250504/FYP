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
    const phoneNumber = (body?.phoneNumber ?? "").toString().trim();

    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
      return NextResponse.json({ error: "Invalid phone number format. Use E.164 (e.g. +1234567890)" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username already exists." }, { status: 409 });
    }

    if (phoneNumber) {
      const existingPhone = await prisma.user.findUnique({ where: { phoneNumber } });
      if (existingPhone) {
        return NextResponse.json({ error: "Phone number already in use." }, { status: 409 });
      }
    }

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: createPasswordHash(password),
        phoneNumber: phoneNumber || null,
      },
      select: { id: true, username: true, createdAt: true, phoneNumber: true },
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

