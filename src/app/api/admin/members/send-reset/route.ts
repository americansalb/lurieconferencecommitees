import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { passwordResetEmail } from "@/lib/mail-templates";
import { newResetToken, resetUrl, RESET_TOKEN_TTL_MS } from "@/lib/password-reset";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userRole = (session.user as { role?: string }).role;
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!isMailConfigured()) {
      return NextResponse.json({
        error: "Email is not configured on this service. Set RESEND_API_KEY and MAIL_FROM, then redeploy.",
      }, { status: 503 });
    }

    const token = newResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        createdBy: session.user.email || null,
      },
    });

    const result = await sendMail({
      to: user.email,
      subject: "Reset your Conference Committee Hub password",
      html: passwordResetEmail({ name: user.name, url: resetUrl(token), initiatedByAdmin: true }),
    });

    if ((result as { skipped?: boolean }).skipped) {
      return NextResponse.json({
        error: "Mail transport reported the send was skipped. Check mail env vars.",
      }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin/members/send-reset] error", e);
    const msg = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
