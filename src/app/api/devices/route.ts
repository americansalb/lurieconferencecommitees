import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

let tableEnsured = false;

async function ensureDevicesTable() {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "lcc_devices" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "platform" TEXT NOT NULL DEFAULT 'ios',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "lcc_devices_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = (SELECT oid FROM pg_class WHERE relname = 'lcc_devices_token_key')) THEN
          CREATE UNIQUE INDEX "lcc_devices_token_key" ON "lcc_devices"("token");
        END IF;
      END $$
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lcc_devices_userId_fkey') THEN
          ALTER TABLE "lcc_devices" ADD CONSTRAINT "lcc_devices_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `);
    tableEnsured = true;
  } catch (err) {
    console.error("ensureDevicesTable error:", err);
  }
}

// Register a device token
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { token, platform } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    await ensureDevicesTable();

    // Upsert: if this token already exists, update the userId (device may have switched users)
    await prisma.device.upsert({
      where: { token },
      update: { userId },
      create: {
        userId,
        token,
        platform: platform || "ios",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/devices error:", err);
    return NextResponse.json({ error: "Failed to register device" }, { status: 500 });
  }
}

// Unregister a device token
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    await ensureDevicesTable();

    await prisma.device.deleteMany({ where: { token } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/devices error:", err);
    return NextResponse.json({ error: "Failed to unregister device" }, { status: 500 });
  }
}
