import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeSlots, groupSlotsByDay, formatSlotTime } from "@/lib/scheduling";

// Public: the bookable slots for an invite, in the invitee's timezone. No
// auth — the unguessable token is the credential. Query: ?tz=America/New_York
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const url = new URL(req.url);
  const tz = url.searchParams.get("tz") || "America/Chicago";

  const invite = await prisma.bookingInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "This booking link is not valid." }, { status: 404 });
  if (invite.status === "booked") {
    return NextResponse.json({ error: "already_booked", booked: true }, { status: 409 });
  }
  if (invite.status === "canceled") {
    return NextResponse.json({ error: "This invitation was canceled." }, { status: 410 });
  }
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This invitation has expired." }, { status: 410 });
  }

  const members = await prisma.user.findMany({
    where: { id: { in: invite.memberIds } },
    select: { id: true, timezone: true },
  });
  const timeZonesByUser: Record<string, string> = {};
  for (const m of members) timeZonesByUser[m.id] = m.timezone || "America/Chicago";

  const [rules, exceptions, bookings] = await Promise.all([
    prisma.memberAvailability.findMany({ where: { userId: { in: invite.memberIds }, active: true } }),
    prisma.availabilityException.findMany({ where: { userId: { in: invite.memberIds } } }),
    // Existing confirmed bookings for these members become busy times.
    prisma.booking.findMany({
      where: { assignedUserId: { in: invite.memberIds }, status: "confirmed" },
      select: { assignedUserId: true, startAt: true, endAt: true },
    }),
  ]);

  const from = new Date();
  const to = new Date(Date.now() + 21 * 24 * 3600 * 1000); // next 21 days

  const slots = computeSlots({
    memberIds: invite.memberIds,
    timeZonesByUser,
    rules: rules.map((r) => ({ userId: r.userId, weekday: r.weekday, startMin: r.startMin, endMin: r.endMin })),
    exceptions: exceptions.map((e) => ({ userId: e.userId, kind: e.kind as "add" | "block", startAt: e.startAt, endAt: e.endAt })),
    busy: bookings.map((b) => ({ userId: b.assignedUserId, startAt: b.startAt, endAt: b.endAt })),
    durationMin: invite.durationMin,
    from,
    to,
  });

  const days = groupSlotsByDay(slots, tz).map((d) => ({
    dayKey: d.dayKey,
    label: d.label,
    slots: d.slots.map((s) => ({
      startAt: s.startAt.toISOString(),
      label: formatSlotTime(s.startAt, tz),
    })),
  }));

  return NextResponse.json({
    ok: true,
    invite: {
      inviteeName: invite.inviteeName,
      title: invite.title,
      message: invite.message,
      durationMin: invite.durationMin,
    },
    tz,
    days,
  });
}
