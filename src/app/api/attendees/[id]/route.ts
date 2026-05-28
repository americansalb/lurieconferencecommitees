import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const attendee = await prisma.attendee.findUnique({
    where: { id: params.id },
    include: { events: { orderBy: { createdAt: "desc" } } },
  });
  if (!attendee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(attendee);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const allowed = ["adminNotes", "status", "discountPercent", "inviteMessage"] as const;
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  const updated = await prisma.attendee.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Also clear any pending queue entries for this attendee.
  await prisma.emailQueue.deleteMany({
    where: { recipientType: "attendee", recipientId: params.id, status: "pending" },
  });
  await prisma.attendee.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
