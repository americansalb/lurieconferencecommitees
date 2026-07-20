import { NextResponse } from "next/server";
import { activePriceCents, oneDayVirtualPriceCents } from "@/components/landing/pricing-data";
import { computePrice, oneDayInviteBaseCents } from "@/lib/attendees";
import { prisma } from "@/lib/db";
import {
  validateAndApply, normalizeCode, describeDiscount, DISCOUNT_ERROR_MESSAGES,
} from "@/lib/discounts";
import { firstNameToCode } from "@/lib/codes";

// Public: preview a discount code for the registration funnel. Returns the
// recomputed price so the UI can show the new total before checkout. This is
// only a preview, the authoritative price is computed again at checkout.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code : "";
  const attendanceMode = body.attendanceMode === "in-person" || body.attendanceMode === "virtual"
    ? body.attendanceMode
    : null;
  const token = typeof body.token === "string" ? body.token : null;
  // One-day virtual ticket (public and invite funnels): base the preview on
  // the one-day price so the shown total matches checkout.
  const attendDay = body.attendDay === "sat" || body.attendDay === "sun" ? body.attendDay : null;

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
    // Their own first-name code is already applied through their link; tell
    // them rather than stacking it (matches the checkout cap).
    if (attendee.discountPercent > 0 && normalizeCode(code) === firstNameToCode(attendee.firstName)) {
      return NextResponse.json(
        { ok: false, error: "Your invitation already includes this discount, no code needed." },
        { status: 200 }
      );
    }
    // Invited attendees can also take the one-day virtual ticket; the code
    // preview stacks on their day-adjusted personal price.
    if (attendDay && attendanceMode === "virtual") {
      baseCents = Math.round(oneDayInviteBaseCents() * (100 - attendee.discountPercent) / 100);
    } else {
      const { finalCents } = computePrice(attendanceMode, attendee.discountPercent);
      baseCents = finalCents ?? activePriceCents(attendanceMode);
    }
  } else {
    baseCents = attendDay && attendanceMode === "virtual"
      ? oneDayVirtualPriceCents()
      : activePriceCents(attendanceMode);
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
