import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { sponsorFromHeader, sponsorReplyTo } from "@/lib/sponsors";
import { appUrl } from "@/lib/presenters";
import { proposalCallEmail } from "@/lib/mail-templates";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

type Variant = "general" | "healthcare";
function normalizeVariant(v: unknown): Variant {
  return v === "healthcare" ? "healthcare" : "general";
}

// GET: list every Call-for-Proposals recipient we've emailed, newest first,
// so the team can see who's been contacted and resend.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const invites = await prisma.proposalInvite.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ invites });
}

// POST: send the open Call for Proposals to one recipient (or several at
// once). Each recipient is logged in ProposalInvite, keyed by email+variant,
// so re-sending the same variant updates the existing row rather than
// duplicating it. Any authenticated team member can send.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const invitedById = (session.user as { id?: string }).id || null;
  const actorEmail = session.user.email || null;

  const body = await req.json();
  const variant = normalizeVariant(body.variant);
  const customMessage =
    typeof body.customMessage === "string" && body.customMessage.trim()
      ? body.customMessage.trim()
      : null;

  // Accept either a single { email, name } or a list of recipients.
  type Recipient = { email: string; name?: string | null };
  const rawList: Recipient[] = Array.isArray(body.recipients)
    ? body.recipients
    : [{ email: body.email, name: body.name }];

  const recipients = rawList
    .map((r) => ({ email: String(r?.email || "").trim().toLowerCase(), name: (r?.name || "").toString().trim() || null }))
    .filter((r) => r.email);

  if (recipients.length === 0) {
    return NextResponse.json({ error: "At least one recipient email is required." }, { status: 400 });
  }
  const invalid = recipients.find((r) => !isEmail(r.email));
  if (invalid) {
    return NextResponse.json({ error: `"${invalid.email}" is not a valid email.` }, { status: 400 });
  }

  if (!isMailConfigured()) {
    return NextResponse.json(
      { error: "Email is not configured on this server (RESEND_API_KEY / MAIL_FROM)." },
      { status: 503 }
    );
  }

  const submitUrl = `${appUrl()}/proposal`;
  const assetBase = appUrl();

  const results: { email: string; ok: boolean; error?: string }[] = [];

  for (const r of recipients) {
    const html = proposalCallEmail({
      variant,
      submitUrl,
      recipientFirstName: r.name ? r.name.split(" ")[0] : null,
      customMessage,
      assetBase,
    });

    let sent = false;
    let sendError: string | null = null;
    try {
      const result = await sendMail({
        to: r.email,
        subject:
          variant === "healthcare"
            ? "Call for Proposals: Share Your Clinical Perspective — 2026 Lurie Children's & AALB Conference"
            : "Call for Proposals — 2026 Lurie Children's & AALB Conference",
        html,
        from: sponsorFromHeader(),
        replyTo: sponsorReplyTo(),
      });
      sent = !(result as { skipped?: boolean }).skipped;
      if (!sent) sendError = "Mail transport skipped the send (env vars likely missing).";
    } catch (e) {
      sendError = e instanceof Error ? e.message : String(e);
    }

    // Upsert the log row, keyed by (email, variant).
    try {
      await prisma.proposalInvite.upsert({
        where: { email_variant: { email: r.email, variant } },
        create: {
          email: r.email,
          name: r.name,
          variant,
          customMessage,
          status: sent ? "sent" : "failed",
          sendError,
          sentCount: sent ? 1 : 0,
          invitedById,
          invitedByEmail: actorEmail,
          lastSentAt: sent ? new Date() : null,
        },
        update: {
          name: r.name ?? undefined,
          customMessage,
          status: sent ? "sent" : "failed",
          sendError,
          sentCount: sent ? { increment: 1 } : undefined,
          invitedByEmail: actorEmail,
          lastSentAt: sent ? new Date() : undefined,
        },
      });
    } catch (e) {
      // Logging failure shouldn't mask a successful send; surface it though.
      console.error("[proposals/invite] log upsert failed", e);
      if (sent && !sendError) sendError = "Sent, but could not be recorded.";
    }

    results.push({ email: r.email, ok: sent, error: sendError || undefined });
  }

  const sentCount = results.filter((r) => r.ok).length;
  const failedCount = results.length - sentCount;
  return NextResponse.json({
    ok: failedCount === 0,
    sent: sentCount,
    failed: failedCount,
    results,
  });
}
