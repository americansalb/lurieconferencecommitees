import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password, name, timezone } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Normalize to lowercase so future lookups are exact and we can't
    // accidentally store two accounts that differ only in casing.
    const emailLower = email.toLowerCase();
    const existing = await prisma.user.findFirst({
      where: { email: { equals: emailLower, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const devEmail = process.env.DEVELOPER_EMAIL;
    const adminEmail = process.env.ADMIN_EMAIL;
    let role = "member";
    if (devEmail && emailLower === devEmail.toLowerCase()) {
      role = "developer";
    } else if (adminEmail && emailLower === adminEmail.toLowerCase()) {
      role = "admin";
    }

    const user = await prisma.user.create({
      data: { email: emailLower, passwordHash, name, role, timezone: timezone || "America/Chicago" },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
