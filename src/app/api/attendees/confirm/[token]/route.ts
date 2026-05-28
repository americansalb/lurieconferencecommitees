import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computePrice } from "@/lib/attendees";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const attendee = await prisma.attendee.findUnique({
    where: { inviteToken: params.token },
  });
  if (!attendee) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });

  // Mark first view if we haven't yet.
  if (!attendee.viewedAt) {
    await prisma.attendee.update({
      where: { id: attendee.id },
      data: { viewedAt: new Date(), status: attendee.status === "invited" ? "viewed" : attendee.status },
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "viewed_invite" },
    });
  }

  return NextResponse.json({
    firstName: attendee.firstName,
    lastName: attendee.lastName,
    email: attendee.email,
    phone: attendee.phone,
    affiliation: attendee.affiliation,
    primaryLanguages: attendee.primaryLanguages,
    attendanceMode: attendee.attendanceMode,
    needsParking: attendee.needsParking,
    accessibilityNotes: attendee.accessibilityNotes,
    dietary: attendee.dietary,
    discountPercent: attendee.discountPercent,
    status: attendee.status,
    paid: attendee.paid,
    inviteMessage: attendee.inviteMessage,
  });
}

const ALLOWED_FIELDS = [
  "firstName", "lastName", "phone", "affiliation", "primaryLanguages",
  "attendanceMode", "needsParking", "accessibilityNotes", "dietary",
] as const;

export async function PATCH(req: Request, { params }: { params: { token: string } }) {
  const attendee = await prisma.attendee.findUnique({
    where: { inviteToken: params.token },
  });
  if (!attendee) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of ALLOWED_FIELDS) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (data.attendanceMode !== undefined) {
    const { baseCents, finalCents } = computePrice(data.attendanceMode as string, attendee.discountPercent);
    data.basePriceCents = baseCents;
    data.finalPriceCents = finalCents;
  }
  // Mark progress through funnel.
  if (attendee.status === "invited" || attendee.status === "viewed" || attendee.status === "queued") {
    data.status = "rsvp_pending";
  }

  const updated = await prisma.attendee.update({
    where: { id: attendee.id },
    data,
  });
  return NextResponse.json({
    ok: true,
    finalPriceCents: updated.finalPriceCents,
    basePriceCents: updated.basePriceCents,
    status: updated.status,
  });
}
