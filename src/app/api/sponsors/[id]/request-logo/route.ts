import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { sponsorLogoRequestEmail } from "@/lib/mail-templates";
import { sponsorFromHeader, sponsorReplyTo, sponsorStatusUrl } from "@/lib/sponsors";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

// Email a sponsor/exhibitor asking for a higher-resolution logo, with a direct
// link to upload it from their portal. Replaces having to write that by hand.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const actorEmail = session?.user?.email || null;

  const sponsor = await prisma.sponsor.findUnique({ where: { id: params.id } });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isMailConfigured()) {
    return NextResponse.json({ error: "Email is not configured on this service." }, { status: 503 });
  }

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject: `Could you send a higher-resolution logo for ${sponsor.companyName}?`,
      html: sponsorLogoRequestEmail({
        firstName: (sponsor.contactName || "").split(" ")[0],
        companyName: sponsor.companyName,
        statusUrl: sponsorStatusUrl(sponsor.applicationToken),
      }),
      from: sponsorFromHeader(),
      replyTo: sponsorReplyTo(),
    });
    await prisma.sponsorEvent.create({
      data: { sponsorId: sponsor.id, type: "logo_requested", actorEmail },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Send failed." }, { status: 502 });
  }
}
