import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await prisma.scheduleSession.findMany({ orderBy: { startTime: "asc" } });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const title = String(b?.title || "").trim();
  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
  if (!b?.startTime || !b?.endTime) return NextResponse.json({ error: "Start and end time are required." }, { status: 400 });
  const start = new Date(b.startTime);
  const end = new Date(b.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Invalid time range." }, { status: 400 });
  }

  const presenterIds = Array.isArray(b.presenterIds) ? b.presenterIds.map(String).filter(Boolean) : [];
  const created = await prisma.scheduleSession.create({
    data: {
      title,
      kind: String(b.kind || "session"),
      description: b.description ? String(b.description) : null,
      presenterName: b.presenterName ? String(b.presenterName).trim() : null,
      presenterId: b.presenterId ? String(b.presenterId) : (presenterIds[0] || null),
      presenterIds,
      startTime: start,
      endTime: end,
    },
  });
  return NextResponse.json(created);
}
