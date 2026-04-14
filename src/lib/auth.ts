import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

const SESSION_TTL_DAYS = 30;

export function createPasswordHash(password: string) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compareSync(password, passwordHash);
}

export function newSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function sessionExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_TTL_DAYS);
  return d;
}

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    // Best-effort cleanup
    await prisma.session.delete({ where: { token } }).catch(() => undefined);
    return null;
  }

  return session.user;
}

