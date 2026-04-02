import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const committeeId = searchParams.get("committeeId");

  const where = committeeId ? { committeeId } : {};

  const events = await prisma.event.findMany({
    where,
    include: { committee: { select: { id: true, name: true, slug: true, color: true } } },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, committeeId, startTime, duration, timezone, recurring, endTime, meetingUrl } = await req.json();

    if (!title || !committeeId || !startTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const durationMins = duration || 60;
    const tz = timezone || "America/Chicago";
    // Client sends a proper UTC ISO string, so new Date() parses it correctly
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + durationMins * 60 * 1000);

    // "all" broadcasts the event to every committee simultaneously
    if (committeeId === "all") {
      const allCommittees = await prisma.committee.findMany({ select: { id: true } });
      const created = await prisma.$transaction(
        allCommittees.map((c: { id: string }) =>
          prisma.event.create({
            data: {
              title,
              description: description || "",
              committeeId: c.id,
              startTime: start,
              endTime: end,
              duration: durationMins,
              timezone: tz,
              recurring: recurring || false,
              meetingUrl: meetingUrl || null,
            },
          })
        )
      );
      return NextResponse.json(created, { status: 201 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || "",
        committeeId,
        startTime: start,
        endTime: end,
        duration: durationMins,
        timezone: tz,
        recurring: recurring || false,
        meetingUrl: meetingUrl || null,
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, description, startTime, duration, timezone, recurring, meetingUrl } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Event id is required" }, { status: 400 });
    }

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const durationMins = duration || existing.duration;
    const start = startTime ? new Date(startTime) : existing.startTime;
    const end = new Date(start.getTime() + durationMins * 60 * 1000);

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        startTime: start,
        endTime: end,
        duration: durationMins,
        ...(timezone !== undefined && { timezone }),
        ...(recurring !== undefined && { recurring }),
        ...(meetingUrl !== undefined && { meetingUrl: meetingUrl || null }),
      },
    });
    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Event id is required" }, { status: 400 });
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
