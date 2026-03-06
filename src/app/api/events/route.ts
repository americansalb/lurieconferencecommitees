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

/**
 * Parse a naive datetime string (e.g. "2026-03-06T09:00") as if it were in
 * the given IANA timezone, returning a proper UTC Date.
 *
 * Without this, `new Date("2026-03-06T09:00")` is interpreted in the server's
 * local time (often UTC), which silently shifts the event by several hours.
 */
function parseInTimezone(naiveDatetime: string, tz: string): Date {
  // Treat the naive string as UTC temporarily
  const asUtc = new Date(
    naiveDatetime.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(naiveDatetime)
      ? naiveDatetime                 // already has offset — use as-is
      : naiveDatetime + "Z",         // force UTC interpretation
  );

  // Render that UTC instant in both UTC and the target timezone
  const utcRepr = asUtc.toLocaleString("en-US", { timeZone: "UTC" });
  const tzRepr = asUtc.toLocaleString("en-US", { timeZone: tz });

  // The difference tells us the UTC offset for this timezone at this moment
  const offsetMs = new Date(utcRepr).getTime() - new Date(tzRepr).getTime();

  // Shift so the original wall-clock time is preserved in the target timezone
  return new Date(asUtc.getTime() + offsetMs);
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
    const start = parseInTimezone(startTime, tz);
    const end = endTime ? parseInTimezone(endTime, tz) : new Date(start.getTime() + durationMins * 60 * 1000);

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
