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

function getTransport(): Transporter | null {
  if (cached) return cached;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  cached = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return cached;
}

export function isMailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendMail({ to, subject, html, text, replyTo, bcc }: SendArgs) {
  const transport = getTransport();
  if (!transport) {
    console.warn("[mail] GMAIL_USER / GMAIL_APP_PASSWORD not configured; skipping send", { to, subject });
    return { skipped: true };
  }
  const from = process.env.MAIL_FROM || `AALB Conference at Lurie Children's <${process.env.GMAIL_USER}>`;
  const defaultBcc = process.env.MAIL_BCC || undefined;
  return transport.sendMail({
    from,
    to,
    subject,
    html,
    text: text || stripHtml(html),
    replyTo: replyTo || process.env.MAIL_REPLY_TO,
    bcc: bcc || defaultBcc,
  });
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
