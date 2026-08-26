import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { presenterHonorariumRequestEmail } from "@/lib/mail-templates";
import { INVOICE_EMAIL, HONORARIUM_REPLY_TO } from "@/lib/presenters";

// Ask presenters where to send their honorarium, now that the conference is
// over. Thanks first, then the two ways to be paid: reply with a mailing
// address for a cheque, or invoice us instead.
//
// Only confirmed presenters, and only ones we actually owe something. Mailing
// somebody about "your honorarium" when no amount is on file for them would be
// a promise we have not made, so they are skipped and counted separately
// rather than quietly included.
//
// POST { mode?: "initial" | "all", ids?: string[] }
//   "initial" (default) skips anyone already asked; "all" asks again.
//   `ids` restricts the run to specific presenters.

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isMailConfigured()) {
    return NextResponse.json({ error: "Mail is not configured." }, { status: 503 });
  }
  const adminEmail = session?.user?.email || null;

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const mode = (body as { mode?: unknown }).mode === "all" ? "all" : "initial";
  const ids = Array.isArray((body as { ids?: unknown }).ids)
    ? ((body as { ids: unknown[] }).ids.filter((x) => typeof x === "string") as string[])
    : null;

  const confirmed = await prisma.presenter.findMany({
    where: {
      status: "confirmed",
      ...(ids?.length ? { id: { in: ids } } : {}),
      ...(mode === "initial" ? { honorariumAskedAt: null } : {}),
    },
    select: {
      id: true, name: true, email: true,
      honorariumAmount: true, travelReimbursement: true,
    },
    orderBy: { confirmedAt: "asc" },
  });

  // Someone with nothing owed is not a failure, and not a recipient either.
  const payable = confirmed.filter((p) => (p.honorariumAmount || 0) > 0 || (p.travelReimbursement || 0) > 0);
  const skippedNoAmount = confirmed.length - payable.length;
  if (!payable.length) {
    return NextResponse.json({ sent: 0, failed: 0, skippedNoAmount, recipients: [] });
  }

  let sent = 0;
  const failures: { email: string; error: string }[] = [];
  const recipients: string[] = [];

  for (const p of payable) {
    const first = (p.name || "").split(" ")[0] || "";
    // Match the email: never say "honorarium" to somebody we are only
    // reimbursing for travel.
    const owedLabel = p.honorariumAmount ? "honorarium" : "travel reimbursement";
    try {
      await sendMail({
        to: p.email,
        replyTo: HONORARIUM_REPLY_TO,
        subject: first
          ? `Thank you, ${first}. Where should we send your ${owedLabel}?`
          : `Thank you. Where should we send your ${owedLabel}?`,
        html: presenterHonorariumRequestEmail({
          name: p.name,
          honorariumAmount: p.honorariumAmount,
          travelReimbursement: p.travelReimbursement,
          invoiceEmail: INVOICE_EMAIL,
          replyToEmail: HONORARIUM_REPLY_TO,
        }),
      });
      await prisma.presenter.update({
        where: { id: p.id },
        data: { honorariumAskedAt: new Date(), lastSentAt: new Date() },
      });
      await prisma.presenterEvent.create({
        data: { presenterId: p.id, type: "honorarium_request_sent", actorEmail: adminEmail },
      }).catch(() => {});
      recipients.push(p.email);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[request-honorarium] send failed", p.email, msg);
      await prisma.presenterEvent.create({
        data: { presenterId: p.id, type: "honorarium_request_failed", meta: msg.slice(0, 300) },
      }).catch(() => {});
      failures.push({ email: p.email, error: msg.slice(0, 200) });
    }
  }

  return NextResponse.json({
    sent,
    failed: failures.length,
    failures: failures.slice(0, 10),
    skippedNoAmount,
    recipients: recipients.slice(0, 200),
  });
}
