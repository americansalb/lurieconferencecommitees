import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";

async function getUserId(req: Request): Promise<string | null> {
  const mobile = await getMobileUserFromRequest(req);
  if (mobile) return mobile.id;
  const session = await getServerSession(authOptions);
  if (session?.user) return (session.user as { id: string }).id;
  return null;
}

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const devices = await prisma.device.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true, platform: true, deviceName: true, appVersion: true,
      locale: true, timezone: true, lastSeenAt: true, createdAt: true,
    },
  });
  return NextResponse.json(devices);
}

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { platform, pushToken, deviceName, appVersion, locale, timezone } = body;

  if (platform !== "ios" && platform !== "android") {
    return NextResponse.json({ error: "platform must be 'ios' or 'android'" }, { status: 400 });
  }
  if (!pushToken || typeof pushToken !== "string") {
    return NextResponse.json({ error: "pushToken is required" }, { status: 400 });
  }

  const existing = await prisma.device.findUnique({ where: { pushToken } });
  if (existing && existing.userId !== userId) {
    await prisma.device.delete({ where: { id: existing.id } });
  }

  const device = await prisma.device.upsert({
    where: { pushToken },
    create: {
      userId,
      platform,
      pushToken,
      deviceName: deviceName || null,
      appVersion: appVersion || null,
      locale: locale || null,
      timezone: timezone || null,
    },
    update: {
      userId,
      platform,
      deviceName: deviceName || null,
      appVersion: appVersion || null,
      locale: locale || null,
      timezone: timezone || null,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({
    id: device.id,
    platform: device.platform,
    deviceName: device.deviceName,
    lastSeenAt: device.lastSeenAt,
  }, { status: 201 });
}
