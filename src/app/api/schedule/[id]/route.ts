import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (b.title !== undefined) {
    const t = String(b.title).trim();
    if (!t) return NextResponse.json({ error: "A title is required." }, { status: 400 });
    data.title = t;
  }
  if (b.kind !== undefined) data.kind = String(b.kind);
  if (b.description !== undefined) data.description = b.description ? String(b.description) : null;
  if (b.presenterName !== undefined) data.presenterName = b.presenterName ? String(b.presenterName).trim() : null;
  if (b.presenterId !== undefined) data.presenterId = b.presenterId ? String(b.presenterId) : null;
  if (b.presenterIds !== undefined) {
    const ids = Array.isArray(b.presenterIds) ? b.presenterIds.map(String).filter(Boolean) : [];
    data.presenterIds = ids;
    if (b.presenterId === undefined) data.presenterId = ids[0] || null;
  }
  if (b.startTime !== undefined) {
    const d = new Date(b.startTime);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid start time." }, { status: 400 });
    data.startTime = d;
  }
  if (b.endTime !== undefined) {
    const d = new Date(b.endTime);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid end time." }, { status: 400 });
    data.endTime = d;
  }

  try {
    const updated = await prisma.scheduleSession.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  try {
    await prisma.scheduleSession.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
