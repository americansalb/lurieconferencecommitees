import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { newMobileToken, MOBILE_SESSION_TTL_DAYS } from "@/lib/mobile-auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = newMobileToken();
    const expiresAt = new Date(Date.now() + MOBILE_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    const userAgent = req.headers.get("user-agent") || null;

    await prisma.mobileSession.create({
      data: { userId: user.id, token, expiresAt, userAgent },
    });

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        timezone: user.timezone,
      },
    });
  } catch (e) {
    console.error("[mobile/login] error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
