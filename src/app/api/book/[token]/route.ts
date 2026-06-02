import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { computeSlots } from "@/lib/scheduling";
import { createZoomMeeting, isZoomConfigured } from "@/lib/zoom";
import { bookingConfirmedInviteeEmail, bookingConfirmedHostEmail } from "@/lib/mail-templates";

// Public: confirm a booking for a slot. Body: { startAt (ISO), tz }.
// The slot is re-validated server-side against live availability — the client
// can't book a time that isn't actually free.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const startAt = new Date(body.startAt);
  const inviteeTz = typeof body.tz === "string" && body.tz ? body.tz : "America/Chicago";
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "Pick a time." }, { status: 400 });
  }

  const invite = await prisma.bookingInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "This booking link is not valid." }, { status: 404 });
  if (invite.status === "booked") {
    return NextResponse.json({ error: "This invitation has already been booked." }, { status: 409 });
  }
  if (invite.status === "canceled" || (invite.expiresAt && invite.expiresAt.getTime() < Date.now())) {
    return NextResponse.json({ error: "This invitation is no longer active." }, { status: 410 });
  }

  const members = await prisma.user.findMany({
    where: { id: { in: invite.memberIds } },
    select: { id: true, name: true, email: true, timezone: true },
  });
  const timeZonesByUser: Record<string, string> = {};
  for (const m of members) timeZonesByUser[m.id] = m.timezone || "America/Chicago";

  const [rules, exceptions, bookings] = await Promise.all([
    prisma.memberAvailability.findMany({ where: { userId: { in: invite.memberIds }, active: true } }),
    prisma.availabilityException.findMany({ where: { userId: { in: invite.memberIds } } }),
    prisma.booking.findMany({
      where: { assignedUserId: { in: invite.memberIds }, status: "confirmed" },
      select: { assignedUserId: true, startAt: true, endAt: true },
    }),
  ]);

  // Recompute slots and confirm the requested start is genuinely offered.
  const slots = computeSlots({
    memberIds: invite.memberIds,
    timeZonesByUser,
    rules: rules.map((r) => ({ userId: r.userId, weekday: r.weekday, startMin: r.startMin, endMin: r.endMin })),
    exceptions: exceptions.map((e) => ({ userId: e.userId, kind: e.kind as "add" | "block", startAt: e.startAt, endAt: e.endAt })),
    busy: bookings.map((b) => ({ userId: b.assignedUserId, startAt: b.startAt, endAt: b.endAt })),
    durationMin: invite.durationMin,
    from: new Date(),
    to: new Date(Date.now() + 21 * 24 * 3600 * 1000),
  });

  const match = slots.find((s) => s.startAt.getTime() === startAt.getTime());
  if (!match) {
    return NextResponse.json(
      { error: "That time was just taken or is no longer available. Please pick another." },
      { status: 409 }
    );
  }

  // Pooled first-available: assign the first free member for this slot.
  const assignedUserId = match.userIds[0];
  const host = members.find((m) => m.id === assignedUserId)!;
  const endAt = new Date(startAt.getTime() + invite.durationMin * 60000);

  // Reserve atomically: flip the invite to "booked" only if still "sent",
  // so two simultaneous bookings can't both win.
  const claim = await prisma.bookingInvite.updateMany({
    where: { id: invite.id, status: "sent" },
    data: { status: "booked" },
  });
  if (claim.count === 0) {
    return NextResponse.json({ error: "This invitation has already been booked." }, { status: 409 });
  }

  // Create the Zoom meeting (best-effort: a failure is recorded but the
  // booking still stands so the time isn't lost).
  const topic = invite.title || `Conversation with ${invite.inviteeName}`;
  let zoom: { id: string; joinUrl: string; startUrl: string } | null = null;
  let zoomError: string | null = null;
  if (isZoomConfigured()) {
    try {
      zoom = await createZoomMeeting({
        hostEmail: host.email,
        topic,
        startAt,
        durationMin: invite.durationMin,
        agenda: invite.message || undefined,
      });
    } catch (e) {
      zoomError = e instanceof Error ? e.message : String(e);
      console.error("[book] zoom create failed", zoomError);
    }
  } else {
    zoomError = "Zoom not configured";
  }

  const booking = await prisma.booking.create({
    data: {
      inviteId: invite.id,
      assignedUserId,
      startAt,
      endAt,
      inviteeTz,
      zoomMeetingId: zoom?.id || null,
      zoomJoinUrl: zoom?.joinUrl || null,
      zoomStartUrl: zoom?.startUrl || null,
      zoomError,
      status: "confirmed",
    },
  });

  // Notify both sides. Errors here don't fail the booking.
  sendMail({
    to: invite.inviteeEmail,
    subject: `Confirmed: your meeting on ${formatForSubject(startAt, inviteeTz)}`,
    html: bookingConfirmedInviteeEmail({
      inviteeName: invite.inviteeName,
      hostName: host.name,
      startAt,
      durationMin: invite.durationMin,
      tz: inviteeTz,
      joinUrl: zoom?.joinUrl || null,
      title: invite.title,
    }),
  }).catch((e) => console.error("[book] invitee mail failed", e));

  sendMail({
    to: host.email,
    subject: `New meeting booked: ${invite.inviteeName}`,
    html: bookingConfirmedHostEmail({
      hostName: host.name,
      inviteeName: invite.inviteeName,
      inviteeEmail: invite.inviteeEmail,
      startAt,
      durationMin: invite.durationMin,
      tz: host.timezone || "America/Chicago",
      joinUrl: zoom?.joinUrl || null,
      startUrl: zoom?.startUrl || null,
      title: invite.title,
    }),
  }).catch((e) => console.error("[book] host mail failed", e));

  return NextResponse.json({
    ok: true,
    booking: {
      startAt: booking.startAt.toISOString(),
      durationMin: invite.durationMin,
      hostName: host.name,
      joinUrl: zoom?.joinUrl || null,
      tz: inviteeTz,
    },
  });
}

function formatForSubject(at: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(at);
}
