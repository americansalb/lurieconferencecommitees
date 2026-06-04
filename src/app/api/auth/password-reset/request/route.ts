import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { passwordResetEmail } from "@/lib/mail-templates";
import { newResetToken, resetUrl, RESET_TOKEN_TTL_MS } from "@/lib/password-reset";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Case-insensitive match so users who signed up with a mixed-case
    // email can still find their account when they type it differently.
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (user) {
      const token = newResetToken();
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      if (isMailConfigured()) {
        try {
          await sendMail({
            to: user.email,
            subject: "Reset your Conference Committee Hub password",
            html: passwordResetEmail({ name: user.name, url: resetUrl(token) }),
          });
        } catch (e) {
          console.error("[password-reset/request] mail error", e);
        }
      } else {
        console.warn("[password-reset/request] mail not configured; reset URL:", resetUrl(token));
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[password-reset/request] error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
