type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  // One address, several comma-separated, or an array. Multiple addresses are
  // sent to Resend as an array so the Reply-To header carries all of them.
  replyTo?: string | string[];
  bcc?: string;
  // One or more CC addresses (e.g. merged co-applicants). Empty/blank ignored.
  cc?: string | string[];
  from?: string;
  // Extra SMTP headers (e.g. List-Unsubscribe / List-Unsubscribe-Post).
  headers?: Record<string, string>;
  // Resend attachment specs. `path` is a public URL Resend fetches at send
  // time (preferred: keeps our payloads small); `content` is base64 bytes.
  attachments?: { filename: string; path?: string; content?: string }[];
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

export async function sendMail({ to, subject, html, text, replyTo, bcc, cc, from, headers, attachments }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const defaultFrom = process.env.MAIL_FROM?.trim();
  const fromHeader = (from || defaultFrom || "").trim();
  if (!apiKey || !fromHeader) {
    console.warn("[mail] RESEND_API_KEY or MAIL_FROM not set; skipping send", { to, subject });
    return { skipped: true };
  }

  const body: Record<string, unknown> = {
    from: fromHeader,
    to: [to],
    subject,
    html,
    text: text || stripHtml(html),
  };
  const finalReplyTo = replyTo || process.env.MAIL_REPLY_TO;
  if (finalReplyTo) {
    const list = (Array.isArray(finalReplyTo) ? finalReplyTo : String(finalReplyTo).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length) body.reply_to = list.length > 1 ? list : list[0];
  }
  const ccList = (Array.isArray(cc) ? cc : (cc ? [cc] : [])).map((s) => s.trim()).filter(Boolean);
  if (ccList.length) body.cc = ccList;
  const finalBcc = bcc || process.env.MAIL_BCC;
  if (finalBcc) body.bcc = [finalBcc];
  if (headers && Object.keys(headers).length) body.headers = headers;
  const files = (attachments || []).filter((a) => a && a.filename && (a.path || a.content));
  if (files.length) body.attachments = files;

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
