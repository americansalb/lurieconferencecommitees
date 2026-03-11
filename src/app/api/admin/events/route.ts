import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isAdmin(role: string) {
  return role === "admin" || role === "developer";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as { role: string }).role;
  if (!isAdmin(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await prisma.event.findMany({
    include: {
      committee: { select: { id: true, name: true, slug: true, color: true } },
    },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json(events);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as { role: string }).role;
  if (!isAdmin(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId, title, description, startTime, endTime, duration, timezone, recurring, meetingUrl, committeeId } = await req.json();

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (startTime !== undefined) data.startTime = new Date(startTime);
  if (endTime !== undefined) data.endTime = new Date(endTime);
  if (duration !== undefined) data.duration = duration;
  if (timezone !== undefined) data.timezone = timezone;
  if (recurring !== undefined) data.recurring = recurring;
  if (meetingUrl !== undefined) data.meetingUrl = meetingUrl || null;
  if (committeeId !== undefined) data.committeeId = committeeId;

  const event = await prisma.event.update({
    where: { id: eventId },
    data,
    include: {
      committee: { select: { id: true, name: true, slug: true, color: true } },
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as { role: string }).role;
  if (!isAdmin(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId } = await req.json();

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  await prisma.event.delete({ where: { id: eventId } });
  return NextResponse.json({ success: true });
}
