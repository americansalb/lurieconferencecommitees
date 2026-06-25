import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { presenterInviteEmail } from "@/lib/mail-templates";
import { confirmationUrl } from "@/lib/presenters";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

// Accept a presenter's requested adjustments and re-open their confirmation:
// move them back to "invited" (clearing confirmedAt) so the portal shows the
// accept/confirm options again, and email them their portal link asking them to
// take another look and confirm now that the adjustment is handled. An optional
// `note` from the admin is included in the email.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const presenter = await prisma.presenter.findUnique({ where: { id: params.id } });
  if (!presenter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isMailConfigured()) {
    return NextResponse.json({ error: "Email is not configured on this service." }, { status: 503 });
  }

  const { note } = await req.json().catch(() => ({}));
  const customMessage = typeof note === "string" && note.trim()
    ? note.trim()
    : "Thank you for flagging your requested adjustments. We've reviewed them and updated your assignment where we could. Please take another look at the details below and confirm when you're ready.";

  // Re-open the confirmation. confirmedAt is cleared the same way a manual
  // status change does, so nothing is left looking confirmed.
  await prisma.presenter.update({
    where: { id: presenter.id },
    data: { status: "invited", confirmedAt: null, lastSentAt: new Date() },
  });
  await prisma.presenterEvent.create({
    data: { presenterId: presenter.id, type: "adjustments_accepted", actorEmail: session.user.email || null },
  }).catch(() => {});

  try {
    const result = await sendMail({
      to: presenter.email,
      subject: "Your requested adjustments: please take another look and confirm",
      html: presenterInviteEmail({
        name: presenter.name,
        url: confirmationUrl(presenter.token),
        customMessage,
        role: presenter.role,
        sessionFormat: presenter.sessionFormat,
      }),
    });
    if ((result as { skipped?: boolean }).skipped) {
      return NextResponse.json({ ok: true, emailed: false, error: "Mail transport reported the send was skipped." });
    }
    return NextResponse.json({ ok: true, emailed: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: true, emailed: false, error: msg });
  }
}
