import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newAttendeeToken } from "@/lib/attendees";
import { activePriceCents } from "@/components/landing/pricing-data";
import { validateAndApply, DISCOUNT_ERROR_MESSAGES, normalizeCode } from "@/lib/discounts";
import { confirmFreeAttendee, sendPortalLinkTo } from "@/lib/attendee-mail";

// Complimentary guest registration, behind /invited/[code]. The code in the
// link must be a full-comp guest code (percent, 100 off both modes); pricing
// still runs through validateAndApply so expiry and capacity limits apply,
// and every guest lands as a normal paid-$0 attendee with a redemption row —
// the Discounts dashboard shows exactly who came in through which link.

function isGuestCode(c: { kind: string; virtualValue: number | null; inPersonValue: number | null; active: boolean }) {
  return c.active && c.kind === "percent" && c.virtualValue === 100 && c.inPersonValue === 100;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const code = typeof body.code === "string" ? normalizeCode(body.code) : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const affiliation = typeof body.affiliation === "string" ? body.affiliation.trim() : "";
  const attendanceMode = body.attendanceMode === "in-person" ? "in-person" : body.attendanceMode === "virtual" ? "virtual" : null;

  if (!firstName || !lastName) return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  if (!attendanceMode) return NextResponse.json({ error: "Please choose in-person or virtual attendance." }, { status: 400 });

  const guestCode = code ? await prisma.discountCode.findUnique({ where: { code } }) : null;
  if (!guestCode || !isGuestCode(guestCode)) {
    return NextResponse.json({ error: "This invitation link is no longer active." }, { status: 403 });
  }

  const priceCents = activePriceCents(attendanceMode);
  // validateAndApply enforces expiry and capacity with friendly messages,
  // and guarantees the ticket really is fully covered.
  const outcome = await validateAndApply(code, priceCents, attendanceMode);
  if (!outcome.ok) {
    return NextResponse.json({ error: DISCOUNT_ERROR_MESSAGES[outcome.error] }, { status: 400 });
  }
  if (outcome.result.finalCents !== 0) {
    return NextResponse.json({ error: "This invitation link is no longer active." }, { status: 403 });
  }

  const existing = await prisma.attendee.findUnique({ where: { email } });
  if (existing?.paid) {
    // Already coming — quietly re-send their portal link instead of erroring.
    await sendPortalLinkTo([existing.id]).catch(() => {});
    return NextResponse.json({ ok: true, already: true });
  }

  const data = {
    firstName,
    lastName,
    affiliation: affiliation || null,
    attendanceMode,
    attendDay: null as string | null,
    basePriceCents: priceCents,
    finalPriceCents: 0,
    discountCodeId: guestCode.id,
    discountCode: guestCode.code,
    discountCodeCents: priceCents,
    status: "registered",
  };
  const attendee = existing
    ? await prisma.attendee.update({ where: { id: existing.id }, data })
    : await prisma.attendee.create({
        data: { ...data, email, discountPercent: 0, inviteToken: newAttendeeToken() },
      });

  await prisma.discountRedemption.deleteMany({ where: { attendeeId: attendee.id, status: "applied" } });
  await prisma.discountRedemption.create({
    data: {
      codeId: guestCode.id,
      code: guestCode.code,
      attendeeId: attendee.id,
      attendeeEmail: attendee.email,
      attendanceMode,
      basePriceCents: priceCents,
      discountCents: priceCents,
      finalPriceCents: 0,
      status: "applied",
    },
  });

  await confirmFreeAttendee(attendee.id);
  await prisma.attendeeEvent.create({
    data: { attendeeId: attendee.id, type: "guest_invite_completed", meta: guestCode.code },
  }).catch(() => {});

  return NextResponse.json({ ok: true, token: attendee.inviteToken });
}
