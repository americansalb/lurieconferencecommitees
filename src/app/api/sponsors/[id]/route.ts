import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { tierById, fullBenefits, sponsorStatusUrl, sponsorFromHeader, sponsorReplyTo, sponsorFirstName } from "@/lib/sponsors";
import { sponsorAcceptedEmail } from "@/lib/mail-templates";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sponsor = await prisma.sponsor.findUnique({
    where: { id: params.id },
    include: { events: { orderBy: { createdAt: "desc" } } },
  });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sponsor);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const allowed = ["adminNotes", "status", "ticketsIncluded"] as const;
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
  }

  const existing = await prisma.sponsor.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Manually moving a sponsor to "paid" should also set the paid flag, so they
  // count as revenue and can be sent a confirmation. (Stripe-confirmed payments
  // set this via the webhook / confirm-payment flow.)
  if (data.status === "paid" && !existing.paid) {
    data.paid = true;
    data.paidAt = new Date();
  }

  const updated = await prisma.sponsor.update({ where: { id: params.id }, data });

  // Accepting an applicant = moving them to "Awaiting payment". On that
  // transition, email the contact a fresh acceptance + complete-payment note.
  // Fires once per transition, and only when a payment is actually due.
  if (
    data.status === "awaiting_payment" &&
    existing.status !== "awaiting_payment" &&
    !updated.paid &&
    !updated.donateFoodInstead &&
    updated.amountCents > 0
  ) {
    if (updated.unsubscribedAt) {
      // Honor the opt-out here too — the dashboard still shows the status
      // change, but no email goes out to an unsubscribed contact.
      await prisma.sponsorEvent.create({
        data: { sponsorId: updated.id, type: "acceptance_email_suppressed", meta: "unsubscribed" },
      }).catch(() => {});
      return NextResponse.json(updated);
    }
    const t = tierById(updated.tier);
    // Quote what checkout will actually charge: sponsors sent the 20%-courtesy
    // letter must not be asked for the list price in their acceptance email.
    const pct = updated.discountPercent || 0;
    const listCents = t?.amountCents ?? updated.amountCents;
    const dueCents = pct > 0 && listCents > 0 ? Math.round((listCents * (100 - pct)) / 100) : updated.amountCents;
    const amountLabel =
      pct > 0 && listCents > 0
        ? `$${Math.round(dueCents / 100).toLocaleString("en-US")} (${pct}% partner courtesy applied)`
        : t?.amountLabel || `$${(updated.amountCents / 100).toFixed(0)}`;
    try {
      await sendMail({
        to: updated.contactEmail,
        subject: `You're confirmed: complete your ${t?.name || "sponsorship"} payment`,
        html: sponsorAcceptedEmail({
          firstName: sponsorFirstName(updated.contactName, updated.companyName),
          companyName: updated.companyName,
          tier: { name: t?.name || updated.tier, amountLabel, ticketsIncluded: t?.ticketsIncluded ?? 0 },
          statusUrl: sponsorStatusUrl(updated.applicationToken),
          donatesFoodInstead: updated.donateFoodInstead,
          isExhibitor: updated.tier === "exhibitor",
          benefits: fullBenefits(updated.tier),
        }),
        from: sponsorFromHeader(),
        replyTo: sponsorReplyTo(),
        cc: updated.additionalEmails,
      });
      await prisma.sponsorEvent.create({ data: { sponsorId: updated.id, type: "acceptance_emailed" } }).catch(() => {});
    } catch (e) {
      console.error("[sponsors] acceptance email failed", e);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.sponsor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
