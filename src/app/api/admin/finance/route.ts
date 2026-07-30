import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { retrieveSettlement, listAllCharges, isStripeConfigured, type Settlement } from "@/lib/stripe";

// Money actually received, per payer, straight from Stripe.
//
// This exists because every other revenue figure in the app is a figure we
// wrote down ourselves. The sponsors dashboard sums `amountCents` and labels it
// "Revenue actually collected"; that is the agreed tier price, before Stripe's
// cut, and it has no idea whether anything was refunded. The attendee side sums
// `finalPriceCents`, which is what checkout intended to charge. Both are
// intentions. Neither is income.
//
// So nothing here is computed from our own price columns. Every number comes
// from the balance transaction Stripe attached to the charge, and refunds are
// summed from their own balance transactions. See retrieveSettlement.
//
// Three groups come back separately, because collapsing them is how a number
// stops being trustworthy:
//
//   settled    A Stripe payment we could reconcile. Net is real money.
//   offStripe  Marked paid in our database with no Stripe payment intent:
//              cheques, wires, invoices, or a row someone flipped by hand.
//              Real income, very likely, but we cannot prove the amount or the
//              fee from here, so it is never added to the Stripe totals.
//   unresolved A stored payment intent Stripe would not return, or returned
//              without a charge. Needs a human; counted nowhere.
//
// Test-mode payments are excluded from every total and reported on their own.
// GET is read-only and hits the Stripe API once per payment, so it is slow by
// design rather than cached into something that can go stale.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Line = {
  kind: "attendee" | "sponsor";
  id: string;
  name: string;
  email: string;
  /** Sponsor tier, or the attendee's attendance mode. Context for the row. */
  detail: string;
  /** What our own database believes the price was. Shown to expose drift. */
  expectedCents: number | null;
  paidAt: string | null;
  settlement: Settlement | null;
  /** Set when the row is real income we cannot reconcile through Stripe. */
  offStripeReason?: string;
};

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured on this deployment." }, { status: 503 });
  }

  const [attendees, sponsors] = await Promise.all([
    prisma.attendee.findMany({
      where: { paid: true, isTest: false },
      orderBy: { paidAt: "asc" },
      select: {
        id: true, firstName: true, lastName: true, email: true, attendanceMode: true,
        finalPriceCents: true, paidAt: true, stripePaymentIntentId: true, stripeSessionId: true,
      },
    }),
    prisma.sponsor.findMany({
      where: { paid: true },
      orderBy: { paidAt: "asc" },
      select: {
        id: true, companyName: true, contactName: true, contactEmail: true, tier: true,
        amountCents: true, paidAt: true, stripePaymentIntentId: true, stripeSessionId: true,
      },
    }),
  ]);

  const pending: { line: Omit<Line, "settlement">; pi: string | null }[] = [
    ...attendees.map((a) => ({
      pi: a.stripePaymentIntentId,
      line: {
        kind: "attendee" as const,
        id: a.id,
        name: [a.firstName, a.lastName].filter(Boolean).join(" ") || a.email,
        email: a.email,
        detail: a.attendanceMode || "unspecified",
        expectedCents: a.finalPriceCents ?? null,
        paidAt: a.paidAt ? a.paidAt.toISOString() : null,
        ...(a.stripePaymentIntentId
          ? {}
          : {
              offStripeReason: a.stripeSessionId
                ? "Reached Stripe checkout but no payment intent was ever stored. Run the attendee payment reconcile."
                : "Marked paid with no Stripe payment at all: a comp, a guest seat, or a payment taken outside the site.",
            }),
      },
    })),
    ...sponsors.map((s) => ({
      pi: s.stripePaymentIntentId,
      line: {
        kind: "sponsor" as const,
        id: s.id,
        name: s.companyName || s.contactName || s.contactEmail,
        email: s.contactEmail,
        detail: s.tier || "sponsor",
        expectedCents: s.amountCents ?? null,
        paidAt: s.paidAt ? s.paidAt.toISOString() : null,
        ...(s.stripePaymentIntentId
          ? {}
          : {
              offStripeReason: s.stripeSessionId
                ? "Reached Stripe checkout but no payment intent was ever stored. Use Confirm payment on the sponsor."
                : "Marked paid by hand, with no Stripe payment: cheque, wire, invoice, or in-kind recorded as paid.",
            }),
      },
    })),
  ];

  // Sequential on purpose. This is an admin report over a few hundred rows at
  // most, and a burst of parallel requests is the fastest way to be rate
  // limited into a partial answer that still looks complete.
  const lines: Line[] = [];
  const errors: { name: string; message: string }[] = [];
  for (const { line, pi } of pending) {
    if (!pi) {
      lines.push({ ...line, settlement: null });
      continue;
    }
    try {
      const settlement = await retrieveSettlement(pi);
      lines.push({
        ...line,
        settlement,
        ...(settlement ? {} : { offStripeReason: `Stripe has no record of payment intent ${pi}.` }),
      });
    } catch (err) {
      errors.push({ name: line.name, message: err instanceof Error ? err.message : "Stripe request failed" });
      lines.push({ ...line, settlement: null, offStripeReason: "Stripe request failed for this row." });
    }
  }

  // The audit that makes the rest of this trustworthy.
  //
  // Everything above walks OUR records outwards. That can only ever describe
  // money we already have an id for, and it will look complete while missing a
  // payment nobody linked to a row. So now walk Stripe's own charge list
  // inwards and subtract what we matched. Anything left is income this report
  // would otherwise have hidden.
  let ledger: Awaited<ReturnType<typeof listAllCharges>> | null = null;
  try {
    ledger = await listAllCharges();
  } catch (err) {
    errors.push({ name: "Stripe ledger", message: err instanceof Error ? err.message : "Could not list charges" });
  }

  const settled = lines.filter((l) => l.settlement?.livemode && l.settlement.chargeId);
  const testMode = lines.filter((l) => l.settlement && !l.settlement.livemode);
  const offStripe = lines.filter((l) => !l.settlement && l.offStripeReason);
  const unresolved = lines.filter((l) => l.settlement && l.settlement.livemode && !l.settlement.chargeId);

  const sum = (rows: Line[], pick: (s: Settlement) => number) =>
    rows.reduce((t, r) => t + (r.settlement ? pick(r.settlement) : 0), 0);

  const totals = {
    grossCents: sum(settled, (s) => s.grossCents),
    feeCents: sum(settled, (s) => s.feeCents),
    refundedCents: sum(settled, (s) => s.refundedCents),
    // The only number on this page that is money in the bank.
    netCents: sum(settled, (s) => s.netCents),
    payments: settled.length,
  };

  const byKind = (kind: "attendee" | "sponsor") => {
    const rows = settled.filter((l) => l.kind === kind);
    return {
      payments: rows.length,
      grossCents: sum(rows, (s) => s.grossCents),
      feeCents: sum(rows, (s) => s.feeCents),
      refundedCents: sum(rows, (s) => s.refundedCents),
      netCents: sum(rows, (s) => s.netCents),
    };
  };

  // What the rest of the app claims, counted the same way those pages count it,
  // so the two can be put side by side instead of contradicting each other on
  // separate screens. The Sponsors page shows "Paid 8 / $3,440" from these same
  // rows; if Stripe only backs four of them, that is worth saying out loud
  // rather than leaving someone to notice the numbers disagree.
  const claimed = {
    attendee: {
      records: attendees.length,
      expectedCents: attendees.reduce((t, a) => t + (a.finalPriceCents || 0), 0),
    },
    sponsor: {
      records: sponsors.length,
      expectedCents: sponsors.reduce((t, x) => t + (x.amountCents || 0), 0),
    },
  };

  const matchedChargeIds = new Set(settled.map((l) => l.settlement!.chargeId!));
  const unmatched = (ledger?.charges || []).filter((c) => !matchedChargeIds.has(c.id));
  const ledgerNetCents = (ledger?.charges || []).reduce((t, c) => t + c.netCents - c.refundedCents, 0);
  const unmatchedNetCents = unmatched.reduce((t, c) => t + c.netCents - c.refundedCents, 0);

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    // Read straight off Stripe with no reference to our database. If
    // `ledger.netCents` exceeds `totals.netCents`, the difference is money we
    // took that no record in our database is linked to.
    ledger: ledger
      ? {
          charges: ledger.charges.length,
          netCents: ledgerNetCents,
          truncated: ledger.truncated,
          unmatchedCount: unmatched.length,
          unmatchedNetCents,
          unmatched: unmatched.slice(0, 200).map((c) => ({
            id: c.id,
            email: c.email,
            description: c.description,
            grossCents: c.grossCents,
            netCents: c.netCents - c.refundedCents,
            created: c.created.toISOString(),
          })),
        }
      : null,
    totals,
    attendees: byKind("attendee"),
    sponsors: byKind("sponsor"),
    // What our own database thinks it collected, for the same settled rows.
    // Published beside the Stripe total so the gap is visible rather than
    // argued about: the difference is Stripe's fees plus any refund.
    expectedCentsForSettled: settled.reduce((t, r) => t + (r.expectedCents || 0), 0),
    claimed,
    // Split by kind as well as by whether money was expected. Four sponsors
    // with no payment behind them is a different order of problem from forty
    // attendee comps, and burying the first inside a list of the second is how
    // it goes unnoticed.
    offStripeByKind: {
      attendee: {
        records: offStripe.filter((l) => l.kind === "attendee" && (l.expectedCents || 0) > 0).length,
        expectedCents: offStripe.filter((l) => l.kind === "attendee").reduce((t, l) => t + (l.expectedCents || 0), 0),
      },
      sponsor: {
        records: offStripe.filter((l) => l.kind === "sponsor" && (l.expectedCents || 0) > 0).length,
        expectedCents: offStripe.filter((l) => l.kind === "sponsor").reduce((t, l) => t + (l.expectedCents || 0), 0),
      },
    },
    // Split, because these two are completely different problems wearing the
    // same label. A row expecting $0 is a comp or a guest seat and is supposed
    // to have no payment. A row expecting $195 means somebody believed money
    // was owed, and either it arrived somewhere we cannot see or it never
    // arrived at all. Only the second kind is a hole.
    offStripe: offStripe.filter((l) => (l.expectedCents || 0) > 0).map((l) => ({
      kind: l.kind, name: l.name, email: l.email, detail: l.detail,
      expectedCents: l.expectedCents, paidAt: l.paidAt, reason: l.offStripeReason,
    })),
    offStripeExpectedCents: offStripe.reduce((t, l) => t + (l.expectedCents || 0), 0),
    comps: offStripe.filter((l) => !(l.expectedCents || 0)).map((l) => ({
      kind: l.kind, name: l.name, email: l.email, detail: l.detail, paidAt: l.paidAt,
    })),
    testModeCount: testMode.length,
    unresolved: unresolved.map((l) => ({ kind: l.kind, name: l.name, email: l.email })),
    errors,
    lines: settled.map((l) => ({
      kind: l.kind, name: l.name, email: l.email, detail: l.detail,
      expectedCents: l.expectedCents, paidAt: l.paidAt,
      grossCents: l.settlement!.grossCents,
      feeCents: l.settlement!.feeCents,
      refundedCents: l.settlement!.refundedCents,
      netCents: l.settlement!.netCents,
      currency: l.settlement!.currency,
      availableOn: l.settlement!.availableOn ? l.settlement!.availableOn.toISOString() : null,
    })),
  });
}
