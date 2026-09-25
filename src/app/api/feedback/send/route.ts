import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { presenterFeedbackEmail } from "@/lib/mail-templates";
import { buildPresenterReport, displayTalkTitle } from "@/lib/feedback";
import { feedbackUrlFor } from "@/lib/feedback-links";
import { HONORARIUM_REPLY_TO } from "@/lib/presenters";

// Email presenters the link to their feedback page.
//
// Only presenters who have feedback. Each email carries their own private
// link and, when the team has picked one, the first comment they featured on
// that presenter's page. With nothing picked, the email goes without a quote.
//
// POST { ids?: string[], mode?: "initial" | "all", test?: true }
//   "initial" (default) skips anyone already sent theirs; "all" sends again.
//   `ids` limits it to the presenters ticked on the page.
//   `test` sends the first one to the signed-in admin instead, with that
//   presenter's real link and quote, and records nothing.
//
// PATCH { id, sent } marks somebody sent, or not, without emailing.

export const maxDuration = 120;

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({})) as { id?: string; sent?: boolean };
  if (!body.id || typeof body.sent !== "boolean") {
    return NextResponse.json({ error: "Send id and sent." }, { status: 400 });
  }
  await prisma.presenter.update({
    where: { id: body.id },
    data: { feedbackSentAt: body.sent ? new Date() : null },
  });
  return NextResponse.json({ ok: true });
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
  const body = await req.json().catch(() => ({})) as { ids?: unknown; mode?: unknown; test?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : null;
  const isTest = body.test === true;
  const mode = body.mode === "all" ? "all" : "initial";
  if (isTest && !adminEmail) {
    return NextResponse.json({ error: "No address on your account to send a test to." }, { status: 400 });
  }

  const presenters = await prisma.presenter.findMany({
    where: {
      status: "confirmed",
      feedback: { some: {} },
      ...(ids?.length ? { id: { in: ids } } : {}),
      ...(mode === "initial" && !isTest ? { feedbackSentAt: null } : {}),
    },
    select: { id: true, name: true, email: true, talkTitle: true },
    orderBy: { name: "asc" },
  });
  const queue = isTest ? presenters.slice(0, 1) : presenters;

  let sent = 0;
  const failures: { email: string; error: string }[] = [];
  const recipients: string[] = [];

  for (const p of queue) {
    try {
      const rows = await prisma.feedbackResponse.findMany({
        where: { presenterId: p.id },
        orderBy: [{ submittedAt: "asc" }, { importedAt: "asc" }],
        select: { id: true, ratings: true, comments: true, hiddenKeys: true, featuredKeys: true, keptKeys: true, questionOrder: true, segment: true },
      });
      const report = buildPresenterReport(rows);
      const first = (p.name || "").split(" ")[0] || "";
      await sendMail({
        to: isTest ? (adminEmail as string) : p.email,
        replyTo: HONORARIUM_REPLY_TO,
        subject: `${isTest ? `[Test, would go to ${p.email}] ` : ""}${
          first ? `${first}, your` : "Your"
        } attendee feedback from the 2026 Lurie Children's and AALB Conference`,
        html: presenterFeedbackEmail({
          name: p.name,
          talkTitle: displayTalkTitle(p.talkTitle),
          url: await feedbackUrlFor(p.id),
          quote: report.highlights[0]?.text || null,
        }),
      });
      if (!isTest) {
        await prisma.presenter.update({ where: { id: p.id }, data: { feedbackSentAt: new Date() } });
        await prisma.presenterEvent.create({
          data: { presenterId: p.id, type: "feedback_sent", actorEmail: adminEmail },
        }).catch(() => {});
      }
      recipients.push(isTest ? (adminEmail as string) : p.email);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[feedback/send] send failed", p.email, msg);
      failures.push({ email: p.email, error: msg.slice(0, 200) });
    }
  }

  return NextResponse.json({ test: isTest, sent, failed: failures.length, failures: failures.slice(0, 10), recipients });
}
