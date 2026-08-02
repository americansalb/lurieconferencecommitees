import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/presenters";
import { attendeeGuideEmail } from "@/lib/mail-templates";
import { buildAttendeeGuide, guideFilename } from "@/lib/guide-pdf";

// Send each confirmed attendee their own guide, with their personal page built
// from what we currently hold.
//
// Sends immediately rather than through the Email Queue: the queue paces cold
// outreach so a few thousand invitations don't wreck the sending domain, and
// this goes to a few dozen people who have already paid and are expecting it.
//
// POST { mode?: "initial" | "all", ids?: string[] }
//   "initial" (default) skips anyone already sent one; "all" re-sends.
//   `ids` restricts the run to specific attendees, so a late registrant can be
//   caught up without mailing everybody again.
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
      // The guide is the in-person document: getting to the hospital, where to
      // check in, parking, what to bring. A blanket run only reaches in-person
      // attendees. An explicit selection is honoured as chosen, so a virtual
      // attendee who asks for it can still be sent one deliberately.
      ...(ids?.length ? { id: { in: ids } } : { attendanceMode: { not: "virtual" } }),
      ...(mode === "initial" ? { guideSentAt: null } : {}),
    },
    include: { sponsor: { select: { companyName: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (!targets.length) return NextResponse.json({ sent: 0, failed: 0 });

  let sent = 0;
  const failures: { email: string; error: string }[] = [];

  for (const a of targets) {
    const name = `${a.firstName} ${a.lastName}`.trim();
    try {
      const pdf = await buildAttendeeGuide({
        firstName: a.firstName,
        lastName: a.lastName,
        affiliation: a.affiliation,
        attendanceMode: a.attendanceMode,
        attendDay: a.attendDay,
        portalUrl: `${appUrl()}/attend/${a.inviteToken}`,
        dietary: a.dietary,
        accessibilityNotes: a.accessibilityNotes,
        primaryLanguages: a.primaryLanguages,
        needsParking: a.needsParking,
        sponsorName: a.sponsor?.companyName ?? null,
      });

      await sendMail({
        to: a.email,
        subject: "Your guide to the conference",
        html: attendeeGuideEmail({
          firstName: a.firstName,
          portalUrl: `${appUrl()}/attend/${a.inviteToken}`,
          attendanceMode: a.attendanceMode,
          hasNeeds: !!((a.dietary || "").trim() || (a.accessibilityNotes || "").trim()),
          assetBase: appUrl(),
        }),
        attachments: [{
          filename: guideFilename("attendee", name),
          content: Buffer.from(pdf).toString("base64"),
        }],
      });

      await prisma.attendee.update({
        where: { id: a.id },
        data: { guideSentAt: new Date() },
      });
      await prisma.attendeeEvent
        .create({ data: { attendeeId: a.id, type: "guide_sent", meta: actorEmail } })
        .catch(() => {});
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[send-guide] failed", a.email, msg);
      failures.push({ email: a.email, error: msg.slice(0, 200) });
    }
  }

  return NextResponse.json({ sent, failed: failures.length, failures: failures.slice(0, 10) });
}
