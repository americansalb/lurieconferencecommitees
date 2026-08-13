import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/presenters";
import { ZOOM_DAYS } from "@/lib/virtual-event";

// Personal Zoom hand-off links: /z/<inviteToken>/<sat|sun>. The virtual info
// email and the attendee portal link here instead of to Zoom directly, so
// every click is recorded on the attendee's timeline (day, IP, browser)
// before the redirect. If a link is forwarded or leaked, the clicks pile up
// under the attendee it was issued to, which is the whole point.
//
// A bad token or a day the ticket does not cover never reveals the Zoom
// room: bad tokens go to the conference site, and out-of-ticket or unpaid
// clicks go to the attendee's own portal, with the attempt logged.

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { token: string; day: string } }) {
  const attendee = await prisma.attendee.findUnique({
    where: { inviteToken: params.token },
    select: { id: true, paid: true, attendDay: true },
  });
  if (!attendee) {
    return NextResponse.redirect(new URL("/", appUrl()), 302);
  }

  const day = ZOOM_DAYS.find((d) => d.key === params.day) || null;
  const allowed =
    !!day && attendee.paid && (attendee.attendDay == null || attendee.attendDay === day.key);

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
  const ua = (req.headers.get("user-agent") || "").slice(0, 160) || null;
  await prisma.attendeeEvent
    .create({
      data: {
        attendeeId: attendee.id,
        type: "zoom_click",
        meta: JSON.stringify({ day: day?.key || params.day, allowed, ip, ua }).slice(0, 480),
      },
    })
    .catch(() => {});

  if (!allowed) {
    return NextResponse.redirect(new URL(`/attend/${params.token}`, appUrl()), 302);
  }
  return NextResponse.redirect(day!.url, 302);
}
