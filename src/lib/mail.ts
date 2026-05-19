import nodemailer, { type Transporter } from "nodemailer";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  bcc?: string;
};

let cached: Transporter | null = null;

// Google App Passwords are displayed as "abcd efgh ijkl mnop" in the UI.
// The actual password is 16 chars, no spaces. Copy-pasting from Google with
// the spaces produces auth failures that look like "Username and Password
// not accepted". Strip whitespace defensively.
function normaliseAppPassword(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  return raw.replace(/\s+/g, "");
}

function getTransport(): Transporter | null {
  if (cached) return cached;
  const user = process.env.GMAIL_USER?.trim();
  const pass = normaliseAppPassword(process.env.GMAIL_APP_PASSWORD);
  if (!user || !pass) return null;
  // Explicit SMTP config rather than the `service: "gmail"` shortcut.
  // Some nodemailer v7 builds + Render's outbound networking trip the shortcut's
  // auto-detected port (587 STARTTLS). Pinning to 465 + secure:true is the
  // path Google documents and is the most reliable for app-password auth.
  cached = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return cached;
}

export function isMailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export function resetMailTransport() {
  cached = null;
}

export async function sendMail({ to, subject, html, text, replyTo, bcc }: SendArgs) {
  const transport = getTransport();
  if (!transport) {
    console.warn("[mail] GMAIL_USER / GMAIL_APP_PASSWORD not configured; skipping send", { to, subject });
    return { skipped: true };
  }
  const from = process.env.MAIL_FROM || `Lurie Children's & AALB Conference <${process.env.GMAIL_USER?.trim()}>`;
  const defaultBcc = process.env.MAIL_BCC || undefined;
  try {
    const info = await transport.sendMail({
      from,
      to,
      subject,
      html,
      text: text || stripHtml(html),
      replyTo: replyTo || process.env.MAIL_REPLY_TO,
      bcc: bcc || defaultBcc,
    });
    console.log("[mail] sent", { to, subject, messageId: info.messageId, response: info.response, accepted: info.accepted, rejected: info.rejected });
    return info;
  } catch (e) {
    const err = e as { message?: string; code?: string; responseCode?: number; command?: string };
    console.error("[mail] send failed", {
      to,
      subject,
      message: err?.message,
      code: err?.code,
      responseCode: err?.responseCode,
      command: err?.command,
    });
    // Bust the cached transporter so a follow-up send rebuilds it. Helps if the
    // failure was a stale connection or revoked credentials being lazily detected.
    cached = null;
    throw e;
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
