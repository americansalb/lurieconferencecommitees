import { prisma } from "@/lib/db";
import { buildCalendar } from "@/lib/ical";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return new Response("Missing token", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { icalToken: token },
    select: {
      id: true,
      name: true,
      committees: { select: { committeeId: true } },
    },
  });
  if (!user) {
    return new Response("Invalid token", { status: 401 });
  }

  const committeeIds = user.committees.map((c) => c.committeeId);
  const events = committeeIds.length
    ? await prisma.event.findMany({
        where: { committeeId: { in: committeeIds } },
        include: { committee: { select: { name: true } } },
        orderBy: { startTime: "asc" },
      })
    : [];

  const ics = buildCalendar(
    `Conference 2026 — ${user.name}`,
    events.map((e) => ({
      id: e.id,
      title: `${e.committee.name}: ${e.title}`,
      description: e.description || null,
      startTime: e.startTime,
      endTime: e.endTime,
      location: null,
      url: e.meetingUrl || null,
      updatedAt: null,
    }))
  );

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="conference-2026.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
