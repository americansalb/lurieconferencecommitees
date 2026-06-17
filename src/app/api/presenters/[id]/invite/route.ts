import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { presenterInviteEmail } from "@/lib/mail-templates";
import { confirmationUrl, appUrl } from "@/lib/presenters";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

// Assignment fields an admin may adjust while accepting an applicant.
const ASSIGNMENT_FIELDS = [
  "name", "affiliation", "role", "talkTitle", "talkAbstract",
  "sessionFormat", "sessionTrack", "sessionLength", "qaLength",
  "preferredDay", "learningObjectives", "honorariumAmount", "travelReimbursement",
];

// Accept a submitted proposal into the confirmation flow: apply any edits,
// mark the presenter "invited", and email their personal portal link so they
// can confirm participation, request changes, or decline. This is the bridge
// between the open Call for Proposals (status "proposed") and a confirmed
// speaker.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userRole = (session.user as { role?: string }).role;
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const presenter = await prisma.presenter.findUnique({ where: { id: params.id } });
    if (!presenter) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { customMessage } = body || {};

    const data: Record<string, unknown> = { status: "invited", invitedAt: new Date() };
    for (const f of ASSIGNMENT_FIELDS) {
      const v = body[f];
      if (v !== undefined && v !== "" && v !== null) {
        if (f === "honorariumAmount" || f === "travelReimbursement") {
          const n = Number(v);
          if (!Number.isNaN(n) && n >= 0) data[f] = Math.round(n);
        } else {
          data[f] = v;
        }
      }
    }

    const updated = await prisma.presenter.update({ where: { id: presenter.id }, data });
    const url = confirmationUrl(updated.token);

    let mailStatus: "sent" | "skipped" | "failed" | "not_requested" = "not_requested";
    let mailError: string | undefined;

    if (!isMailConfigured()) {
      mailStatus = "skipped";
      mailError = "GMAIL_USER or GMAIL_APP_PASSWORD env var is not set on this service.";
      console.warn("[presenters/:id/invite] mail not configured; status set but no email sent", { presenterId: updated.id });
    } else {
      try {
        const result = await sendMail({
          to: updated.email,
          subject: `Invitation to join the 2026 Lurie Children's and AALB Conference`,
          html: presenterInviteEmail({
            name: updated.name,
            url,
            customMessage,
            role: updated.role,
            sessionFormat: updated.sessionFormat,
          }),
        });
        if ((result as { skipped?: boolean }).skipped) {
          mailStatus = "skipped";
          mailError = "Mail transport returned skipped — env vars likely missing.";
        } else {
          mailStatus = "sent";
          await prisma.presenter.update({ where: { id: updated.id }, data: { lastSentAt: new Date() } });
        }
      } catch (e) {
        mailStatus = "failed";
        mailError = e instanceof Error ? e.message : String(e);
        console.error("[presenters/:id/invite] send failed", e);
      }
    }

    await prisma.presenterEvent.create({
      data: {
        presenterId: updated.id,
        type: "invited",
        actorEmail: session.user.email || null,
        meta: JSON.stringify({ acceptedProposal: true, ...(customMessage ? { customMessage } : {}) }),
      },
    });

    return NextResponse.json({ id: updated.id, token: updated.token, url, appUrl: appUrl(), mailStatus, mailError });
  } catch (e) {
    console.error("[presenters/:id/invite] error", e);
    const msg = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
