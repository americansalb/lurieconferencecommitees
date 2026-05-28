type InviteArgs = {
  name: string;
  url: string;
  customMessage?: string;
  role?: string | null;
  sessionFormat?: string | null;
};

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

function roleArticle(role: string) {
  return /^[aeiou]/i.test(role) ? "an" : "a";
}

export function presenterInviteEmail({ name, url, customMessage, role, sessionFormat }: InviteArgs) {
  const first = (name || "").split(" ")[0] || "there";
  const which = sessionFormat || role;
  const roleSentence = which
    ? `<p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">We have you in mind as ${roleArticle(which)} <strong>${escapeHtml(which.toLowerCase())}</strong>. Your presenter portal has the proposed details for your session, our policy, and the consents we ask presenters to grant. From there you can accept, suggest adjustments, or let us know if you cannot attend.</p>`
    : `<p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">Your presenter portal has the proposed details for your session, our policy, and the consents we ask presenters to grant. From there you can accept, suggest adjustments, or let us know if you cannot attend.</p>`;
  const extra = customMessage
    ? `<p style="font-size:15px;line-height:1.65;color:${TEXT};margin:14px 0;background:#f8fafc;border-left:3px solid ${BLUE};padding:14px 16px;border-radius:6px;">${escapeHtml(customMessage)}</p>`
    : "";
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">Hello ${escapeHtml(first)},</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      We would love to have you with us at the 2026 Lurie Children&rsquo;s and AALB Conference, August 15 and 16, 2026, at Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago.
    </p>
    ${extra}
    ${roleSentence}
    ${button(url, "Open your presenter portal")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:8px 0 0 0;">
      Or paste this link into your browser:<br/>
      <a href="${url}" style="color:${BLUE};word-break:break-all;">${url}</a>
    </p>
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      The link is unique to you. We look forward to your reply.
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

export function passwordResetEmail({
  name,
  url,
  initiatedByAdmin,
}: {
  name: string;
  url: string;
  initiatedByAdmin?: boolean;
}) {
  const first = (name || "").split(" ")[0] || "there";
  const intro = initiatedByAdmin
    ? `An administrator has started a password reset for your Conference Committee Hub account. Use the button below to choose a new password.`
    : `We received a request to reset the password for your Conference Committee Hub account. Use the button below to choose a new password.`;
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">Hello ${escapeHtml(first)},</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      ${intro}
    </p>
    ${button(url, "Reset my password")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:8px 0 0 0;">
      Or paste this link into your browser:<br/>
      <a href="${url}" style="color:${BLUE};word-break:break-all;">${url}</a>
    </p>
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      This link will expire in 24 hours. If you did not request this, you can safely ignore this email &mdash; your password will not change.
    </p>
  `);
}

type AttendeeInviteArgs = {
  firstName: string;
  url: string;
  inviteMessage?: string | null;
  discountPercent: number;
  inPersonOriginalCents: number;
  inPersonDiscountedCents: number;
};

export function attendeeInviteEmail({
  firstName,
  url,
  inviteMessage,
  discountPercent,
  inPersonOriginalCents,
  inPersonDiscountedCents,
}: AttendeeInviteArgs) {
  const first = firstName || "there";
  const originalDollars = `$${(inPersonOriginalCents / 100).toFixed(0)}`;
  const discountedDollars = `$${(inPersonDiscountedCents / 100).toFixed(2)}`;
  const extra = inviteMessage
    ? `<p style="font-size:15px;line-height:1.65;color:${TEXT};margin:14px 0;background:#f8fafc;border-left:3px solid ${BLUE};padding:14px 16px;border-radius:6px;">${escapeHtml(inviteMessage)}</p>`
    : "";
  return shell(`
    <h1 style="font-size:24px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">Hi ${escapeHtml(first)},</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      We&rsquo;d love to have you with us at the 2026 Lurie Children&rsquo;s and AALB Conference, August 15 &amp; 16, 2026, at Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago.
    </p>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 18px 0;">
      Two days of practitioners, researchers, and community working on what real language access looks like &mdash; yesterday, today, and tomorrow.
    </p>
    ${extra}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px 0;border-collapse:separate;border-spacing:0;">
      <tr>
        <td style="background:linear-gradient(135deg, ${TEAL}, ${BLUE});color:#fff;padding:18px 22px;border-radius:12px;">
          <div style="font-size:11px;letter-spacing:0.2em;font-weight:600;text-transform:uppercase;opacity:0.85;">Your personal invite</div>
          <div style="font-size:30px;font-weight:800;margin-top:6px;line-height:1;">${discountedDollars}</div>
          <div style="font-size:13px;margin-top:8px;opacity:0.92;">
            <span style="text-decoration:line-through;opacity:0.7;">${originalDollars}</span>
            <span style="margin-left:8px;background:#ffffff22;padding:2px 8px;border-radius:999px;font-weight:600;">${discountPercent}% off in-person</span>
          </div>
        </td>
      </tr>
    </table>
    ${button(url, "Reserve my spot →")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:8px 0 0 0;">
      Or paste this into your browser:<br/>
      <a href="${url}" style="color:${BLUE};word-break:break-all;">${url}</a>
    </p>
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      The link is unique to you and your discount. Virtual attendance is also available.
    </p>
  `);
}

export function attendeeConfirmedEmail({
  firstName,
  url,
  attendanceMode,
  finalPriceCents,
}: {
  firstName: string;
  url: string;
  attendanceMode: string;
  finalPriceCents: number | null;
}) {
  const first = firstName || "there";
  const modeLabel = attendanceMode === "in-person" ? "In-person attendance" : "Virtual attendance";
  const amount = finalPriceCents != null ? `$${(finalPriceCents / 100).toFixed(2)}` : null;
  return shell(`
    <h1 style="font-size:24px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.01em;">You&rsquo;re in, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      Thank you for confirming. Your spot at the 2026 Lurie Children&rsquo;s and AALB Conference is reserved.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:14px 0;border-collapse:separate;">
      <tr><td style="background:#f8fafc;border-left:3px solid ${TEAL};padding:14px 18px;border-radius:6px;">
        <div style="font-size:13px;color:${MUTED};">${escapeHtml(modeLabel)}</div>
        ${amount ? `<div style="font-size:20px;font-weight:700;color:${TEXT};margin-top:4px;">${amount} paid</div>` : ""}
        <div style="font-size:13px;color:${MUTED};margin-top:6px;">August 15 &amp; 16, 2026 &middot; Chicago</div>
      </td></tr>
    </table>
    ${button(url, "View my registration")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      We&rsquo;ll be in touch closer to the date with the full agenda and arrival details.
    </p>
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
