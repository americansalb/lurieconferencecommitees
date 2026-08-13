import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/presenters";
import { attendeeFromHeader, attendeeReplyTo } from "@/lib/attendees";
import { tourReminderEmail, tourReminderSubject, type TourDayKey } from "@/lib/mail-templates";

// The hospital tour reminder. RSVPs live in a Google Form, not in this
// database, so the team pastes the names (or emails) from the form and this
// endpoint resolves them to attendees. Two phases behind one route:
//
//   POST { day, dryRun: true, list: string[] }  -> who each line matches,
//     with ambiguous and unmatched lines called out, so a human confirms
//     the exact recipients before anything sends.
//   POST { day, ids: string[] }                 -> send to those attendees.
//
// Matching is case- and accent-insensitive ("Gerardo Calderón" finds
// "Gerardo Calderon"). Unsubscribed people are skipped and reported.

export const dynamic = "force-dynamic";

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const actorEmail = session.user.email || null;

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const day: TourDayKey = body?.day === "sun" ? "sun" : "sat";

  if (body?.dryRun) {
    const lines = (Array.isArray(body?.list) ? body.list : [])
      .map((l: unknown) => String(l).trim())
      .filter(Boolean)
      .slice(0, 100);
    if (!lines.length) return NextResponse.json({ error: "Paste at least one name or email." }, { status: 400 });

    const candidates = await prisma.attendee.findMany({
      where: { isTest: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        paid: true,
        attendanceMode: true,
        unsubscribedAt: true,
      },
    });

    const matches: { id: string; name: string; email: string; note: string | null }[] = [];
    const unmatched: string[] = [];
    const ambiguous: { query: string; options: string[] }[] = [];

    for (const line of lines) {
      const q = norm(line);
      let found;
      if (line.includes("@")) {
        found = candidates.filter((c) => norm(c.email) === q);
      } else {
        found = candidates.filter((c) => {
          const full = norm(`${c.firstName} ${c.lastName}`);
          return full === q || full.includes(q) || q.includes(full);
        });
      }
      if (found.length === 1) {
        const c = found[0];
        const notes = [
          c.unsubscribedAt ? "unsubscribed, will be skipped" : null,
          !c.paid ? "not paid" : null,
          c.attendanceMode === "virtual" ? "registered virtual" : null,
        ].filter(Boolean);
        matches.push({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          note: notes.length ? notes.join(" · ") : null,
        });
      } else if (found.length > 1) {
        ambiguous.push({
          query: line,
          options: found.slice(0, 5).map((c) => `${c.firstName} ${c.lastName} <${c.email}>`),
        });
      } else {
        unmatched.push(line);
      }
    }
    return NextResponse.json({ matches, unmatched, ambiguous });
  }

  const ids = Array.isArray(body?.ids)
    ? (body.ids as unknown[]).filter((x) => typeof x === "string").slice(0, 100)
    : [];
  if (!ids.length) return NextResponse.json({ error: "No recipients selected." }, { status: 400 });

  const targets = await prisma.attendee.findMany({
    where: { id: { in: ids as string[] }, isTest: false },
  });

  let sent = 0;
  const failures: { email: string; error: string }[] = [];
  const recipients: string[] = [];
  const skipped: string[] = [];

  for (const a of targets) {
    if (a.unsubscribedAt) {
      skipped.push(a.email);
      continue;
    }
    try {
      await sendMail({
        to: a.email,
        from: attendeeFromHeader(),
        replyTo: attendeeReplyTo(),
        subject: tourReminderSubject(a.firstName, day),
        html: tourReminderEmail({ firstName: a.firstName, day, assetBase: appUrl() }),
      });
      await prisma.attendeeEvent
        .create({
          data: { attendeeId: a.id, type: "tour_reminder_sent", meta: JSON.stringify({ day, actor: actorEmail }).slice(0, 480) },
        })
        .catch(() => {});
      recipients.push(a.email);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[send-tour-reminder] failed", a.email, msg);
      failures.push({ email: a.email, error: msg.slice(0, 200) });
    }
  }

  return NextResponse.json({ sent, failed: failures.length, failures, recipients, skipped });
}
