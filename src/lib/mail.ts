type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  bcc?: string;
};

export function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export function mailConfigDetail() {
  return {
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    RESEND_API_KEY_length: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0,
    RESEND_API_KEY_prefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.slice(0, 4) : null,
    MAIL_FROM: process.env.MAIL_FROM || null,
    MAIL_REPLY_TO: process.env.MAIL_REPLY_TO || null,
    MAIL_BCC: process.env.MAIL_BCC || null,
  };
}

export async function sendMail({ to, subject, html, text, replyTo, bcc }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!apiKey || !from) {
    console.warn("[mail] RESEND_API_KEY or MAIL_FROM not set; skipping send", { to, subject });
    return { skipped: true };
  }

  const body: Record<string, unknown> = {
    from,
    to: [to],
    subject,
    html,
    text: text || stripHtml(html),
  };
  const finalReplyTo = replyTo || process.env.MAIL_REPLY_TO;
  if (finalReplyTo) body.reply_to = finalReplyTo;
  const finalBcc = bcc || process.env.MAIL_BCC;
  if (finalBcc) body.bcc = [finalBcc];

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("[mail] network error reaching Resend", { to, subject, error: e instanceof Error ? e.message : String(e) });
    throw e;
  }

  const payload = await res.json().catch(() => null) as { id?: string; message?: string; name?: string } | null;

  if (!res.ok) {
    console.error("[mail] Resend rejected", {
      to,
      subject,
      status: res.status,
      message: payload?.message || null,
      name: payload?.name || null,
    });
    const err = new Error(payload?.message || `Resend returned ${res.status}`);
    (err as { status?: number }).status = res.status;
    (err as { responseBody?: unknown }).responseBody = payload;
    throw err;
  }

  console.log("[mail] sent", { to, subject, id: payload?.id || null });
  return { id: payload?.id, response: "ok" };
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
