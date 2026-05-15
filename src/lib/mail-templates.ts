type InviteArgs = {
  name: string;
  url: string;
  customMessage?: string;
};

const SHELL_BG = "#f1f5f9";
const CARD_BG = "#ffffff";
const ACCENT = "#2563eb";
const ACCENT_DARK = "#1e40af";
const TEXT = "#0f172a";
const MUTED = "#475569";

function shell(inner: string) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:${SHELL_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${TEXT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SHELL_BG};padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${CARD_BG};border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06);">
          <tr><td style="background:linear-gradient(135deg,${ACCENT} 0%,${ACCENT_DARK} 100%);padding:32px 32px 28px 32px;">
            <div style="font-size:11px;letter-spacing:0.18em;font-weight:600;color:rgba(255,255,255,0.85);text-transform:uppercase;">2026 Lurie Children&rsquo;s &amp; AALB Conference</div>
            <div style="font-size:24px;font-weight:800;color:#fff;margin-top:6px;letter-spacing:-0.01em;">Presenter Portal</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px;">True Language Access: Yesterday, Today, and Tomorrow</div>
          </td></tr>
          <tr><td style="padding:32px;">
            ${inner}
          </td></tr>
          <tr><td style="padding:20px 32px 28px 32px;border-top:1px solid #e2e8f0;color:${MUTED};font-size:12px;line-height:1.6;">
            You're receiving this because you were invited to present at the Lurie Children&rsquo;s &amp; AALB Conference. If this wasn't you, you can ignore this email.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:10px;background:${ACCENT};">
    <a href="${href}" style="display:inline-block;padding:14px 24px;color:#fff;text-decoration:none;font-weight:600;font-size:15px;border-radius:10px;">${label}</a>
  </td></tr></table>`;
}

export function presenterInviteEmail({ name, url, customMessage }: InviteArgs) {
  const first = (name || "").split(" ")[0] || "there";
  const extra = customMessage
    ? `<p style="font-size:15px;line-height:1.65;color:${TEXT};margin:16px 0;background:#f8fafc;border-left:3px solid ${ACCENT};padding:14px 16px;border-radius:6px;">${escapeHtml(customMessage)}</p>`
    : "";
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.01em;">Hi ${escapeHtml(first)},</h1>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      You've been invited to present at the <strong>Lurie Children&rsquo;s &amp; AALB Conference</strong>. We're thrilled to have you. To lock in your slot, we need a few details from you.
    </p>
    ${extra}
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 4px 0;">
      The link below opens your personal presenter portal. It takes about 5 minutes to complete and you can save and come back any time.
    </p>
    ${button(url, "Open your presenter portal")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:8px 0 0 0;">
      Or paste this link in your browser:<br/>
      <a href="${url}" style="color:${ACCENT};word-break:break-all;">${url}</a>
    </p>
  `);
}

export function presenterConfirmedEmail({ name, url }: { name: string; url: string }) {
  const first = (name || "").split(" ")[0] || "there";
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.01em;">Thank you, ${escapeHtml(first)}! 🎉</h1>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      Your presenter confirmation for the <strong>Lurie Children&rsquo;s &amp; AALB Conference</strong> has been received. Our program team has been notified and will be in touch with next steps.
    </p>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      Need to update anything? Your portal link is below and stays live up to the conference.
    </p>
    ${button(url, "Update my details")}
  `);
}

export function presenterDeclinedEmail({ name }: { name: string }) {
  const first = (name || "").split(" ")[0] || "there";
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.01em;">Thanks for letting us know, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      We've recorded that you're unable to present at the Lurie Children&rsquo;s &amp; AALB Conference this year. We appreciate the response and hope to work with you on a future event.
    </p>
  `);
}

export function adminNotificationEmail({
  presenterName,
  presenterEmail,
  status,
  reviewUrl,
}: {
  presenterName: string;
  presenterEmail: string;
  status: string;
  reviewUrl: string;
}) {
  const verb = status === "confirmed" ? "confirmed" : status === "declined" ? "declined" : "updated their";
  return shell(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 10px 0;">${escapeHtml(presenterName)} just ${verb} their presenter status</h1>
    <p style="font-size:14px;color:${MUTED};margin:0 0 14px 0;">${escapeHtml(presenterEmail)}</p>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      Status: <strong>${escapeHtml(status)}</strong>
    </p>
    ${button(reviewUrl, "Review in the Committee Hub")}
  `);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
