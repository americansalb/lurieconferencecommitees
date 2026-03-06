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
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + durationMins * 60 * 1000);

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
