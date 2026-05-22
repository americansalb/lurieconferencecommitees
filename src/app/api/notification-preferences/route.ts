import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import { DEFAULT_SETTINGS, parseSettings } from "@/lib/notification-prefs";
import { rebuildScheduleForUser } from "@/lib/schedule-builder";

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
  const row = await prisma.notificationPreference.findUnique({ where: { userId } });
  return NextResponse.json({
    settings: parseSettings(row?.settings),
    defaults: DEFAULT_SETTINGS,
    updatedAt: row?.updatedAt || null,
  });
}

export async function PUT(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const merged = parseSettings(JSON.stringify(body));
  const row = await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, settings: JSON.stringify(merged) },
    update: { settings: JSON.stringify(merged) },
  });
  rebuildScheduleForUser(userId).catch((e) => console.error("[prefs] rebuild", e));
  return NextResponse.json({ settings: parseSettings(row.settings), updatedAt: row.updatedAt });
}
