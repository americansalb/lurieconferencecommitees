import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { aslPaymentRequestEmail } from "@/lib/mail-templates";
import { INVOICE_EMAIL, HONORARIUM_REPLY_TO } from "@/lib/presenters";

// Ask the accepted ASL interpreters where to send their payment, mirroring
// the presenters' honorarium ask: reply with an address for a check, or
// invoice us. The page sends these one at a time from a ticked list, so `ids`
// is how the picker reaches this; `test` sends the letter to the signed-in
// admin instead and stamps nobody.
//
// POST { mode?: "initial" | "all", ids?: string[], test?: true }

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
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

  const accepted = await prisma.aslInterpreter.findMany({
    where: {
      status: "accepted",
      ...(ids?.length ? { id: { in: ids } } : {}),
      ...(mode === "initial" && !isTest ? { paymentAskedAt: null } : {}),
    },
    select: { id: true, fullName: true, email: true },
    orderBy: { acceptedAt: "asc" },
  });
  if (!accepted.length) return NextResponse.json({ sent: 0, failed: 0, recipients: [] });

  const queue = isTest ? accepted.slice(0, 1) : accepted;
  let sent = 0;
  const failures: { email: string; error: string }[] = [];
  const recipients: string[] = [];

  for (const p of queue) {
    const first = (p.fullName || "").split(" ")[0] || "";
    try {
      await sendMail({
        to: isTest ? (adminEmail as string) : p.email,
        replyTo: HONORARIUM_REPLY_TO,
        subject: `${isTest ? `[Test, would go to ${p.email}] ` : ""}${
          first ? `${first}, thank you` : "Thank you"
        } for interpreting at the 2026 Lurie Children's and AALB Conference`,
        html: aslPaymentRequestEmail({
          fullName: p.fullName,
          invoiceEmail: INVOICE_EMAIL,
          replyToEmail: HONORARIUM_REPLY_TO,
        }),
      });
      if (!isTest) {
        await prisma.aslInterpreter.update({
          where: { id: p.id },
          data: { paymentAskedAt: new Date() },
        });
      }
      recipients.push(isTest ? (adminEmail as string) : p.email);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[asl/request-payment] send failed", p.email, msg);
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
