import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listAllCharges, retrieveSettlement, isStripeConfigured } from "@/lib/stripe";

// Income, and where it came from.
//
// This used to start from our own rows: find everyone marked paid, then ask
// Stripe about them. That is backwards, and `paid` is the reason. It is a
// boolean somebody can set from a dashboard, and the Sponsors page proved the
// point by reporting 8 paid worth $3,440 when Stripe had taken money from 4 of
// them. Starting from a flag means the report can only ever be as true as the
// flag, and it will happily omit a payment nobody remembered to record.
//
// So the direction is inverted. Stripe's charge list is the population: every
// live succeeded charge is income, full stop, whatever any row in our database
// says. The only remaining question is where each one came from, answered in
// this order:
//
//   1. metadata.attendeeId / metadata.sponsorId, written at checkout. Exact.
//   2. The payment intent, matched against a stored id. Exact.
//   3. The payer's email against an attendee or sponsor address. Good enough
//      to name, and labelled as a weaker match so nobody treats it as proof.
//   4. Nothing. Real money we cannot attribute, which is worth seeing.
//
// `paid` is not read anywhere in this file. Records are looked up regardless of
// it, so a charge still gets attributed to someone whose row was never updated.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Source = "attendee" | "sponsor" | "unattributed";

type IncomeLine = {
  chargeId: string;
  source: Source;
  /** How we know: "metadata", "payment intent", "email", or "" if we don't. */
  matchedBy: string;
  /** The attendee or sponsor id this charge belongs to, when we matched one. */
  recordId: string | null;
  name: string;
  email: string | null;
  detail: string;
  grossCents: number;
  feeCents: number;
  refundedCents: number;
  netCents: number;
  paidAt: string;
  /** True when our own row does not say this person paid. */
  flagMissing: boolean;
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

  const errors: { name: string; message: string }[] = [];

  // The population: every live charge Stripe has taken.
  let ledger: Awaited<ReturnType<typeof listAllCharges>>;
  try {
    ledger = await listAllCharges();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read charges from Stripe." },
      { status: 502 },
    );
  }

  // Everyone we could attribute a charge to. Deliberately unfiltered by `paid`:
  // a charge is income whether or not anyone remembered to tick the box, and
  // the mismatch is one of the things worth reporting.
  const [attendees, sponsors] = await Promise.all([
    prisma.attendee.findMany({
      where: { isTest: false },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        attendanceMode: true, paid: true, stripePaymentIntentId: true,
      },
    }),
    prisma.sponsor.findMany({
      select: {
        id: true, companyName: true, contactName: true, contactEmail: true,
        tier: true, paid: true, stripePaymentIntentId: true,
      },
    }),
  ]);

  type Rec = { id: string; source: Source; name: string; email: string; detail: string; paid: boolean };
  const byId = new Map<string, Rec>();
  const byIntent = new Map<string, Rec>();
  const byEmail = new Map<string, Rec>();
  const add = (key: string | null, map: Map<string, Rec>, rec: Rec) => {
    if (key && !map.has(key.toLowerCase())) map.set(key.toLowerCase(), rec);
  };
  for (const a of attendees) {
    const rec: Rec = {
      id: a.id,
      source: "attendee",
      name: [a.firstName, a.lastName].filter(Boolean).join(" ") || a.email,
      email: a.email,
      detail: a.attendanceMode || "ticket",
      paid: a.paid,
    };
    add(a.id, byId, rec);
    add(a.stripePaymentIntentId, byIntent, rec);
    add(a.email, byEmail, rec);
  }
  for (const s of sponsors) {
    const rec: Rec = {
      id: s.id,
      source: "sponsor",
      name: s.companyName || s.contactName || s.contactEmail,
      email: s.contactEmail,
      detail: s.tier || "sponsorship",
      paid: s.paid,
    };
    add(s.id, byId, rec);
    add(s.stripePaymentIntentId, byIntent, rec);
    add(s.contactEmail, byEmail, rec);
  }

  const lines: IncomeLine[] = [];
  for (const c of ledger.charges) {
    const meta = c.metadata || {};
    const metaId = meta.attendeeId || meta.sponsorId || null;

    let rec: Rec | undefined;
    let matchedBy = "";
    if (metaId && byId.has(metaId.toLowerCase())) {
      rec = byId.get(metaId.toLowerCase());
      matchedBy = "metadata";
    } else if (c.paymentIntentId && byIntent.has(c.paymentIntentId.toLowerCase())) {
      rec = byIntent.get(c.paymentIntentId.toLowerCase());
      matchedBy = "payment intent";
    } else if (c.email && byEmail.has(c.email.toLowerCase())) {
      rec = byEmail.get(c.email.toLowerCase());
      matchedBy = "email";
    }

    // Only charges with a refund need the extra lookup, and there are few of
    // them, so the exact refunded net is worth the request rather than trusting
    // amount_refunded, which is gross and ignores any fee Stripe gave back.
    let netCents = c.netCents - c.refundedCents;
    let feeCents = Math.max(0, c.grossCents - c.refundedCents - netCents);
    if (c.refundedCents > 0 && c.paymentIntentId) {
      try {
        const exact = await retrieveSettlement(c.paymentIntentId);
        if (exact && exact.chargeId === c.id) {
          netCents = exact.netCents;
          feeCents = exact.feeCents;
        }
      } catch {
        errors.push({ name: c.id, message: "Could not read the refund detail; net is approximate for this row." });
      }
    }

    // Metadata still names the source even when the record is gone, so a
    // deleted or renamed row does not turn a ticket sale into a mystery.
    const source: Source = rec?.source
      || (meta.sponsorId || meta.kind === "sponsor" ? "sponsor" : meta.attendeeId ? "attendee" : "unattributed");

    lines.push({
      chargeId: c.id,
      source,
      matchedBy,
      recordId: rec?.id || metaId || null,
      name: rec?.name || meta.sponsorEmail || meta.attendeeEmail || c.email || "Unknown payer",
      email: rec?.email || c.email || meta.attendeeEmail || meta.sponsorEmail || null,
      detail: rec?.detail || meta.tier || meta.attendanceMode || c.description || "",
      grossCents: c.grossCents,
      feeCents,
      refundedCents: c.refundedCents,
      netCents,
      paidAt: c.created.toISOString(),
      flagMissing: Boolean(rec && !rec.paid),
    });
  }

  const group = (src: Source) => {
    const rows = lines.filter((l) => l.source === src);
    return {
      payments: rows.length,
      grossCents: rows.reduce((t, l) => t + l.grossCents, 0),
      feeCents: rows.reduce((t, l) => t + l.feeCents, 0),
      refundedCents: rows.reduce((t, l) => t + l.refundedCents, 0),
      netCents: rows.reduce((t, l) => t + l.netCents, 0),
    };
  };

  // What the rest of the app would tell you, from the flag, so the two can be
  // compared instead of contradicting each other on separate screens.
  const flagged = {
    attendee: attendees.filter((a) => a.paid).length,
    sponsor: sponsors.filter((s) => s.paid).length,
  };

  const sum = (rows: IncomeLine[]) => ({
    payments: rows.length,
    grossCents: rows.reduce((t, l) => t + l.grossCents, 0),
    feeCents: rows.reduce((t, l) => t + l.feeCents, 0),
    refundedCents: rows.reduce((t, l) => t + l.refundedCents, 0),
    netCents: rows.reduce((t, l) => t + l.netCents, 0),
  });

  // Collected per record, so the Sponsors page can report what Stripe actually
  // took instead of the price we configured for the tier.
  const collected: Record<string, { grossCents: number; netCents: number; refundedCents: number; payments: number }> = {};
  for (const l of lines) {
    if (!l.recordId) continue;
    const c = collected[l.recordId] || (collected[l.recordId] = { grossCents: 0, netCents: 0, refundedCents: 0, payments: 0 });
    c.grossCents += l.grossCents;
    c.netCents += l.netCents;
    c.refundedCents += l.refundedCents;
    c.payments += 1;
  }

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    truncated: ledger.truncated,
    // Conference income only. This Stripe account takes money for other things
    // too, and every live charge on it used to be added into one headline
    // figure, so a course sale or a donation read as conference revenue. A
    // charge counts here only once it is tied to an attendee or a sponsor.
    totals: sum(lines.filter((l) => l.source !== "unattributed")),
    // Everything Stripe took, conference or not. Kept so the page can show that
    // nothing has been hidden, and so this reconciles against the Stripe
    // dashboard, which reports the whole account.
    accountTotals: sum(lines),
    attendees: group("attendee"),
    sponsors: group("sponsor"),
    unattributed: group("unattributed"),
    collected,
    // Rows marked paid in our database that no Stripe charge backs. Not income,
    // and the reason the Sponsors page and this one ever disagreed.
    flaggedPaid: flagged,
    flaggedWithoutCharge: {
      attendee: flagged.attendee - lines.filter((l) => l.source === "attendee" && l.matchedBy).length,
      sponsor: flagged.sponsor - lines.filter((l) => l.source === "sponsor" && l.matchedBy).length,
    },
    // Charges whose payer's record does not say they paid: real money against a
    // row somebody would look at and call unpaid.
    unflagged: lines.filter((l) => l.flagMissing).map((l) => ({
      name: l.name, email: l.email, detail: l.detail, netCents: l.netCents, chargeId: l.chargeId,
    })),
    errors,
    lines: lines.sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1)),
  });
}
