import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/presenters";
import { virtualAttendeeInfoEmail } from "@/lib/mail-templates";
import { attendeeFromHeader, attendeeReplyTo } from "@/lib/attendees";
import { zoomDaysFor } from "@/lib/virtual-event";

// The virtual counterpart of the conference guide: Zoom links for the days
// their ticket covers, sign-in times, the exhibitor lounge, CEU rules, and
// chat etiquette, with the trimmed program PDF attached. One-day virtual
// tickets (attendDay "sat"/"sun") get only their day's room.
//
// Sends immediately rather than through the Email Queue, exactly like the
// in-person guide: these are paid attendees expecting event logistics.
//
// POST { mode?: "initial" | "all", ids?: string[] }
//   "initial" (default) skips anyone already sent it; "all" re-sends.
//   `ids` restricts the run so a late registrant can be caught up alone.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const actorEmail = session.user.email || null;

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const mode = (body as { mode?: unknown }).mode === "all" ? "all" : "initial";
  const ids = Array.isArray((body as { ids?: unknown }).ids)
    ? ((body as { ids: unknown[] }).ids.filter((x) => typeof x === "string") as string[])
    : null;

  const targets = await prisma.attendee.findMany({
    where: {
      paid: true,
      isTest: false,
      unsubscribedAt: null,
      // This email carries the Zoom rooms, so it is strictly for virtual
      // attendees, even when specific ids are passed.
      attendanceMode: "virtual",
      ...(ids?.length ? { id: { in: ids } } : {}),
      ...(mode === "initial" ? { virtualInfoSentAt: null } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  if (!targets.length) return NextResponse.json({ sent: 0, failed: 0 });

  let sent = 0;
  const failures: { email: string; error: string }[] = [];
  const recipients: string[] = [];

  for (const a of targets) {
    const days = zoomDaysFor(a.attendDay);
    const subjectDays =
      days.length === 2 ? "August 15 and 16" : days[0].label;
    try {
      await sendMail({
        to: a.email,
        from: attendeeFromHeader(),
        replyTo: attendeeReplyTo(),
        subject: `Your Zoom ${days.length === 2 ? "links" : "link"} and virtual guide: ${subjectDays}`,
        html: virtualAttendeeInfoEmail({
          firstName: a.firstName,
          days,
          portalUrl: `${appUrl()}/attend/${a.inviteToken}`,
          exhibitorsUrl: `${appUrl()}/#sponsors`,
          scheduleUrl: `${appUrl()}/#program`,
          assetBase: appUrl(),
        }),
        // The program with the outdated cover page removed. Same file for
        // everyone, so it goes by URL for Resend to fetch at send time.
        attachments: [
          {
            filename: "2026-conference-program.pdf",
            path: `${appUrl()}/program-sessions.pdf`,
          },
        ],
      });

      await prisma.attendee.update({
        where: { id: a.id },
        data: { virtualInfoSentAt: new Date() },
      });
      await prisma.attendeeEvent
        .create({ data: { attendeeId: a.id, type: "virtual_info_sent", meta: actorEmail } })
        .catch(() => {});
      recipients.push(a.email);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[send-virtual-info] failed", a.email, msg);
      await prisma.attendeeEvent
        .create({ data: { attendeeId: a.id, type: "virtual_info_send_failed", meta: msg.slice(0, 300) } })
        .catch(() => {});
      failures.push({ email: a.email, error: msg.slice(0, 200) });
    }
  }

  return NextResponse.json({
    sent,
    failed: failures.length,
    failures: failures.slice(0, 10),
    recipients: recipients.slice(0, 200),
  });
}
