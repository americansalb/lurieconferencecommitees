import { prisma } from "@/lib/db";
import { buildCalendar } from "@/lib/ical";
import { getEventSettings } from "@/lib/event-settings";

const VENUE = "Ann & Robert H. Lurie Children's Hospital of Chicago, 225 E Chicago Ave, Chicago, IL 60611";

// Per-attendee conference calendar (both days), with the location set to the
// venue (in-person) or the live join link (virtual). August is month index 7;
// 9:30 AM CDT is 14:30 UTC.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const attendee = await prisma.attendee.findUnique({ where: { inviteToken: params.token } });
  if (!attendee) return new Response("Not found", { status: 404 });

  const isVirtual = attendee.attendanceMode === "virtual";
  const { joinUrl } = await getEventSettings();
  const location = isVirtual ? (joinUrl || "Virtual (join link emailed before the event)") : VENUE;
  const url = isVirtual ? joinUrl : null;

  const ics = buildCalendar("2026 Lurie Children's & AALB Conference", [
    { id: "lcc-2026-day1", title: "2026 Lurie Children's & AALB Conference (Day 1)", startTime: new Date(Date.UTC(2026, 7, 15, 14, 30, 0)), endTime: new Date(Date.UTC(2026, 7, 15, 23, 0, 0)), location, url },
    { id: "lcc-2026-day2", title: "2026 Lurie Children's & AALB Conference (Day 2)", startTime: new Date(Date.UTC(2026, 7, 16, 14, 30, 0)), endTime: new Date(Date.UTC(2026, 7, 16, 21, 0, 0)), location, url },
  ]);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=lurie-aalb-conference-2026.ics",
    },
  });
}
