import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/presenters";
import { chicagoGuideEmail } from "@/lib/mail-templates";
import { attendeeFromHeader, attendeeReplyTo } from "@/lib/attendees";

// The Welcome to Chicago letter: the hospital, the city, and the sign-up form
// for the optional tour and the Saturday evening social.
//
// In-person only, and tracked on its own column, so sending this never marks
// the attendee guide as sent or the other way round. Sent directly rather than
// through the Email Queue for the same reason the attendee guide is: these
// people have paid and are expecting to hear from us.
//
// POST { mode?: "initial" | "all", ids?: string[] }

// Where people put their name down for the tour and the social.
const SIGNUP_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSer1Ry7AEBrk9yLpcG3bEgpivA9xAgsQOk_Zl__PT39mpF35g/viewform";

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
      // Everything in this letter is about being in the building and in the
      // city: the whales in the lobby, the walk to Michigan Avenue, an evening
      // social in Chicago. None of it applies to somebody joining online, and a
      // sign-up form for a tour they cannot attend is worse than no letter.
      ...(ids?.length ? { id: { in: ids } } : { attendanceMode: { not: "virtual" } }),
      ...(mode === "initial" ? { chicagoGuideSentAt: null } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  if (!targets.length) return NextResponse.json({ sent: 0, failed: 0, recipients: [] });

  let sent = 0;
  const failures: { email: string; error: string }[] = [];
  const recipients: string[] = [];

  for (const a of targets) {
    try {
      await sendMail({
        to: a.email,
        from: attendeeFromHeader(),
        replyTo: attendeeReplyTo(),
        subject: "Welcome to Chicago",
        html: chicagoGuideEmail({
          firstName: a.firstName,
          signupUrl: SIGNUP_FORM,
          screenReaderUrl: `${appUrl()}/guides/welcome-to-chicago-screen-reader.pdf`,
          assetBase: appUrl(),
        }),
        // The designed guide travels as the attachment; the screen-reader
        // version is a link rather than a second file, so nobody receives an
        // eight-megabyte email with two copies of the same document.
        attachments: [{
          filename: "welcome-to-chicago.pdf",
          path: `${appUrl()}/guides/welcome-to-chicago.pdf`,
        }],
      });

      await prisma.attendee.update({
        where: { id: a.id },
        data: { chicagoGuideSentAt: new Date() },
      });
      await prisma.attendeeEvent
        .create({ data: { attendeeId: a.id, type: "chicago_guide_sent", meta: actorEmail } })
        .catch(() => {});
      recipients.push(a.email);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[send-chicago-guide] failed", a.email, msg);
      await prisma.attendeeEvent
        .create({ data: { attendeeId: a.id, type: "chicago_guide_send_failed", meta: msg.slice(0, 300) } })
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
