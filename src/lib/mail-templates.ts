type AssignmentDetails = {
  role?: string | null;
  talkTitle?: string | null;
  sessionFormat?: string | null;
  sessionLength?: string | null;
  qaLength?: string | null;
  preferredDay?: string | null;
  sessionTrack?: string | null;
  honorariumAmount?: number | null;
  travelReimbursement?: number | null;
};

type InviteArgs = {
  name: string;
  url: string;
  customMessage?: string;
} & AssignmentDetails;

const TEAL = "#0E5566";
const BLUE = "#0066B3";
const SHELL_BG = "#f6f8fa";
const CARD_BG = "#ffffff";
const TEXT = "#0f172a";
const MUTED = "#475569";

function shell(inner: string) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:${SHELL_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${TEXT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SHELL_BG};padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${CARD_BG};border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td style="padding:0;height:6px;background:linear-gradient(to right, ${TEAL} 0%, ${TEAL} 50%, ${BLUE} 50%, ${BLUE} 100%);">&nbsp;</td></tr>
          <tr><td style="padding:32px 32px 24px 32px;">
            <div style="font-size:11px;letter-spacing:0.2em;font-weight:600;color:${TEAL};text-transform:uppercase;">2026 Lurie Children&rsquo;s and AALB Conference</div>
            <div style="font-size:13px;color:${MUTED};margin-top:6px;">True Language Access: Yesterday, Today, and Tomorrow</div>
          </td></tr>
          <tr><td style="padding:0 32px 32px 32px;">
            ${inner}
          </td></tr>
          <tr><td style="padding:18px 32px 24px 32px;border-top:1px solid #e2e8f0;color:${MUTED};font-size:12px;line-height:1.6;">
            You are receiving this because you were invited to participate in the 2026 Lurie Children&rsquo;s and AALB Conference. If this was sent in error, please disregard.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:10px;background:${TEAL};">
    <a href="${href}" style="display:inline-block;padding:14px 26px;color:#fff;text-decoration:none;font-weight:600;font-size:15px;border-radius:10px;">${label}</a>
  </td></tr></table>`;
}

function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;width:38%;color:${MUTED};font-size:13px;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:${TEXT};font-size:14px;">${escapeHtml(value)}</td>
  </tr>`;
}

function assignmentBlock(a: AssignmentDetails) {
  const rows: string[] = [];
  const headline = [a.sessionLength, a.sessionFormat || a.role].filter(Boolean).join(" ");
  if (a.talkTitle) rows.push(detailRow("Working title", a.talkTitle));
  if (a.role && a.sessionFormat) rows.push(detailRow("Role", a.role));
  if (a.qaLength) rows.push(detailRow("Q and A", a.qaLength));
  if (a.sessionTrack) rows.push(detailRow("Track", a.sessionTrack));
  if (a.preferredDay) rows.push(detailRow("Day", a.preferredDay));
  if (a.honorariumAmount) rows.push(detailRow("Honorarium", `$${a.honorariumAmount.toLocaleString("en-US")}`));
  if (a.travelReimbursement) rows.push(detailRow("Travel reimbursement", `up to $${a.travelReimbursement.toLocaleString("en-US")}`));
  rows.push(detailRow("Conference dates", "August 15 and 16, 2026"));
  rows.push(detailRow("Venue", "Lurie Children’s, Chicago"));
  return `
    <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:18px 0 8px 0;">
      <div style="padding:14px 18px;background:linear-gradient(to right, ${TEAL}, ${BLUE});color:#fff;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.9;">You are invited as</div>
        <div style="font-size:18px;font-weight:700;margin-top:4px;">${escapeHtml(headline || a.role || "A presenter")}</div>
      </div>
      <table cellpadding="0" cellspacing="0" style="width:100%;padding:0 18px 8px 18px;">
        ${rows.join("")}
      </table>
    </div>`;
}

export function presenterInviteEmail({ name, url, customMessage, ...a }: InviteArgs) {
  const first = (name || "").split(" ")[0] || "there";
  const extra = customMessage
    ? `<p style="font-size:15px;line-height:1.65;color:${TEXT};margin:14px 0;background:#f8fafc;border-left:3px solid ${BLUE};padding:14px 16px;border-radius:6px;">${escapeHtml(customMessage)}</p>`
    : "";
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.01em;">Hello ${escapeHtml(first)},</h1>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      We would like to invite you to participate in the 2026 Lurie Children&rsquo;s and AALB Conference.
    </p>
    ${extra}
    ${assignmentBlock(a)}
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:18px 0 0 0;">
      Use the link below to confirm your participation, request adjustments, or let us know if you cannot attend. The link is unique to you.
    </p>
    ${button(url, "Open your presenter portal")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:8px 0 0 0;">
      Or paste this link into your browser:<br/>
      <a href="${url}" style="color:${BLUE};word-break:break-all;">${url}</a>
    </p>
  `);
}

export function presenterConfirmedEmail({ name, url }: { name: string; url: string }) {
  const first = (name || "").split(" ")[0] || "there";
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.01em;">Thank you, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      Your participation in the 2026 Lurie Children&rsquo;s and AALB Conference is confirmed. Our program team will be in touch with next steps.
    </p>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      You can update your details at any time using the link below. The link is unique to you.
    </p>
    ${button(url, "Update my details")}
  `);
}

export function presenterTentativeEmail({ name, url }: { name: string; url: string }) {
  const first = (name || "").split(" ")[0] || "there";
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.01em;">Tentative confirmation received, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      We have noted your tentative confirmation and the questions you raised. Our program team will follow up directly to discuss before final confirmation.
    </p>
    ${button(url, "Open my portal")}
  `);
}

export function presenterChangesRequestedEmail({ name }: { name: string }) {
  const first = (name || "").split(" ")[0] || "there";
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.01em;">Got it, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      Your request has been sent to the program team. We will be in touch directly to discuss adjustments to your invitation.
    </p>
  `);
}

export function presenterDeclinedEmail({ name }: { name: string }) {
  const first = (name || "").split(" ")[0] || "there";
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.01em;">Thanks for letting us know, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      We have recorded that you are unable to participate in the 2026 Lurie Children&rsquo;s and AALB Conference. We hope to work with you on a future event.
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
  return shell(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px 0;">${escapeHtml(presenterName)} updated their status</h1>
    <p style="font-size:14px;color:${MUTED};margin:0 0 14px 0;">${escapeHtml(presenterEmail)}</p>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      Status: <strong>${escapeHtml(status)}</strong>
    </p>
    ${button(reviewUrl, "Review in the conference hub")}
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
