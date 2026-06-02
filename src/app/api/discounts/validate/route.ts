import { NextResponse } from "next/server";
import { activePriceCents } from "@/components/landing/pricing-data";
import { computePrice } from "@/lib/attendees";
import { prisma } from "@/lib/db";
import {
  validateAndApply, describeDiscount, DISCOUNT_ERROR_MESSAGES,
} from "@/lib/discounts";

// Public: preview a discount code for the registration funnel. Returns the
// recomputed price so the UI can show the new total before checkout. This is
// only a preview — the authoritative price is computed again at checkout.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code : "";
  const attendanceMode = body.attendanceMode === "in-person" || body.attendanceMode === "virtual"
    ? body.attendanceMode
    : null;
  const token = typeof body.token === "string" ? body.token : null;

  if (!attendanceMode) {
    return NextResponse.json({ ok: false, error: "Choose in-person or virtual first." }, { status: 400 });
  }

  // Base price: invited attendees carry their own (post personal-invite)
  // price; public registrations use today's active tier. A shared code
  // applies on top of whatever the base is.
  let baseCents: number;
  if (token) {
    const attendee = await prisma.attendee.findUnique({ where: { inviteToken: token } });
    if (!attendee) {
      return NextResponse.json({ ok: false, error: "Invalid registration link." }, { status: 404 });
    }
    const { finalCents } = computePrice(attendanceMode, attendee.discountPercent);
    baseCents = finalCents ?? activePriceCents(attendanceMode);
  } else {
    baseCents = activePriceCents(attendanceMode);
  }

  const outcome = await validateAndApply(code, baseCents, attendanceMode);
  if (!outcome.ok) {
    return NextResponse.json(
      { ok: false, error: DISCOUNT_ERROR_MESSAGES[outcome.error] },
      { status: 200 } // 200 so the funnel can show the message inline
    );
  }

  const { result } = outcome;
  return NextResponse.json({
    ok: true,
    code: result.code.code,
    label: describeDiscount(result.code),
    baseCents: result.baseCents,
    discountCents: result.discountCents,
    finalCents: result.finalCents,
  });
}
