import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computePrice } from "@/lib/attendees";
import { oneDayVirtualPriceCents } from "@/components/landing/pricing-data";

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
  "attendanceMode", "attendDay", "needsParking", "accessibilityNotes", "dietary",
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
  // One-day tickets are virtual-only; anything else clears the day.
  if (data.attendDay !== undefined) {
    data.attendDay = data.attendDay === "sat" || data.attendDay === "sun" ? data.attendDay : null;
  }
  const mode = (data.attendanceMode !== undefined ? data.attendanceMode : attendee.attendanceMode) as string | null;
  if (mode !== "virtual" && data.attendDay) data.attendDay = null;
  if (data.attendanceMode !== undefined || data.attendDay !== undefined) {
    const day = (data.attendDay !== undefined ? data.attendDay : attendee.attendDay) as string | null;
    if (mode === "virtual" && (day === "sat" || day === "sun")) {
      const base = oneDayVirtualPriceCents();
      data.basePriceCents = base;
      data.finalPriceCents = Math.round(base * (100 - attendee.discountPercent) / 100);
    } else {
      const { baseCents, finalCents } = computePrice(mode, attendee.discountPercent);
      data.basePriceCents = baseCents;
      data.finalPriceCents = finalCents;
    }
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
