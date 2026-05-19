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

    const { customMessage } = await req.json().catch(() => ({}));

    if (!isMailConfigured()) {
      return NextResponse.json({
        error: "Email is not configured on this service. Set GMAIL_USER and GMAIL_APP_PASSWORD in Render's environment, then redeploy.",
      }, { status: 503 });
    }

    const result = await sendMail({
      to: presenter.email,
      subject: `Reminder: your presenter portal for the Lurie Children's & AALB Conference`,
      html: presenterInviteEmail({
        name: presenter.name,
        url: confirmationUrl(presenter.token),
        customMessage,
        role: presenter.role,
        sessionFormat: presenter.sessionFormat,
      }),
    });

    if ((result as { skipped?: boolean }).skipped) {
      return NextResponse.json({
        error: "Mail transport reported the send was skipped. Check Render env vars.",
      }, { status: 503 });
    }

    await prisma.presenter.update({ where: { id: presenter.id }, data: { lastSentAt: new Date() } });
    await prisma.presenterEvent.create({
      data: {
        presenterId: presenter.id,
        type: "reminded",
        actorEmail: session.user.email || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[presenters/:id/resend] error", e);
    const msg = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
