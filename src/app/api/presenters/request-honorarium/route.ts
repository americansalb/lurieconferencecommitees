import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { presenterHonorariumRequestEmail } from "@/lib/mail-templates";
import { INVOICE_EMAIL, HONORARIUM_REPLY_TO } from "@/lib/presenters";

// Ask presenters where to send their honorarium, now that the conference is
// over. Thanks first, then the two ways to be paid: reply with a mailing
// address for a check, or invoice us instead.
//
// Every confirmed presenter. The email names no figure, so there is nothing to
// get wrong for somebody whose amount was never recorded, and no reason to
// leave them out of a thank-you and a question about where to send a check.
// What they are owed gets settled in the reply.
//
// POST { mode?: "initial" | "all", ids?: string[], test?: true }
//   "initial" (default) skips anyone already asked; "all" asks again.
//   `ids` restricts the run to specific presenters, which is how the page
//   sends these one at a time rather than to the whole roster at once.
//   `test` sends the email to the signed-in admin instead of the presenter,
//   with that presenter's real amounts, and stamps nothing. It is how you
//   see the thing before a presenter does.

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
  const isTest = (body as { test?: unknown }).test === true;
  if (isTest && !adminEmail) {
    return NextResponse.json({ error: "No address on your account to send a test to." }, { status: 400 });
  }

  const confirmed = await prisma.presenter.findMany({
    where: {
      status: "confirmed",
      ...(ids?.length ? { id: { in: ids } } : {}),
      ...(mode === "initial" && !isTest ? { honorariumAskedAt: null } : {}),
    },
    select: {
      id: true, name: true, email: true,
      honorariumAmount: true, travelReimbursement: true,
    },
    orderBy: { confirmedAt: "asc" },
  });

  if (!confirmed.length) {
    return NextResponse.json({ sent: 0, failed: 0, recipients: [] });
  }

  let sent = 0;
  const failures: { email: string; error: string }[] = [];
  const recipients: string[] = [];

  // A test goes to whoever is signed in, one copy, using a real presenter's
  // figures so the amounts are the ones that would actually go out.
  const queue = isTest ? confirmed.slice(0, 1) : confirmed;

  for (const p of queue) {
    const first = (p.name || "").split(" ")[0] || "";
    // Match the email: never say "honorarium" to somebody we are only
    // reimbursing for travel.
    const owedLabel = p.honorariumAmount ? "honorarium" : "travel reimbursement";
    try {
      await sendMail({
        to: isTest ? (adminEmail as string) : p.email,
        replyTo: HONORARIUM_REPLY_TO,
        // Short, and the thanks lead. The old subject was two sentences with
        // the money question in front, which is the wrong first thing a
        // presenter reads from us.
        subject: `${isTest ? `[Test, would go to ${p.email}] ` : ""}${
          first ? `${first}, thank you` : "Thank you"
        } for presenting at the 2026 Lurie Children's and AALB Conference`,
        html: presenterHonorariumRequestEmail({
          name: p.name,
          honorariumAmount: p.honorariumAmount,
          travelReimbursement: p.travelReimbursement,
          invoiceEmail: INVOICE_EMAIL,
          replyToEmail: HONORARIUM_REPLY_TO,
        }),
      });
      if (!isTest) {
        await prisma.presenter.update({
          where: { id: p.id },
          data: { honorariumAskedAt: new Date(), lastSentAt: new Date() },
        });
        await prisma.presenterEvent.create({
          data: { presenterId: p.id, type: "honorarium_request_sent", actorEmail: adminEmail },
        }).catch(() => {});
      }
      recipients.push(isTest ? (adminEmail as string) : p.email);
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
    test: isTest,
    sent,
    failed: failures.length,
    failures: failures.slice(0, 10),
    recipients: recipients.slice(0, 200),
  });
}
