import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { presenterSlidesRequestEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

// Ask confirmed presenters for their slide decks (due Saturday, August 8).
// Two modes:
//   { mode: "initial" }  -> every confirmed presenter we have NOT yet asked
//   { mode: "remind" }   -> everyone asked before who still has no deck
// Presenter emails go out immediately (this list is dozens, not thousands).
// Each send stamps slidesRequestedAt / bumps slidesRemindCount and logs a
// PresenterEvent, which is what the dashboard chips read.

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isMailConfigured()) {
    return NextResponse.json({ error: "Mail is not configured." }, { status: 503 });
  }
  const adminEmail = session?.user?.email || null;
  const body = await req.json().catch(() => ({} as { mode?: unknown }));
  const mode = (body as { mode?: unknown }).mode === "remind" ? "remind" : "initial";

  const targets = await prisma.presenter.findMany({
    where: {
      status: "confirmed",
      ...(mode === "initial"
        ? { slidesRequestedAt: null }
        : { slidesRequestedAt: { not: null }, slide: { is: null } }),
    },
    select: { id: true, name: true, email: true, token: true, slidesRemindCount: true },
    orderBy: { confirmedAt: "asc" },
  });
  if (!targets.length) return NextResponse.json({ sent: 0, failed: 0 });

  let sent = 0;
  let failed = 0;
  for (const p of targets) {
    const url = `${appUrl()}/presenters/confirm/${p.token}`;
    try {
      await sendMail({
        to: p.email,
        subject: mode === "remind"
          ? "Reminder: your conference presentation by August 8"
          : "Your conference presentation: please upload by August 8",
        html: presenterSlidesRequestEmail({ name: p.name, url, reminder: mode === "remind" }),
      });
      await prisma.presenter.update({
        where: { id: p.id },
        data: mode === "remind"
          ? { slidesRemindCount: { increment: 1 }, lastSentAt: new Date() }
          : { slidesRequestedAt: new Date(), lastSentAt: new Date() },
      });
      await prisma.presenterEvent.create({
        data: { presenterId: p.id, type: mode === "remind" ? "slides_reminder_sent" : "slides_request_sent", actorEmail: adminEmail },
      }).catch(() => {});
      sent++;
    } catch (e) {
      console.error("[request-slides] send failed", p.email, e);
      failed++;
    }
  }
  return NextResponse.json({ sent, failed });
}
