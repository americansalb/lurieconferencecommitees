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
      This link will expire in 24 hours. If you did not request this, you can safely ignore this email. Your password will not change.
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
      I&rsquo;m writing to invite you to the 2026 Lurie Children&rsquo;s and AALB Conference, August 15 and 16, 2026. The conference is held in person at Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago, with full virtual attendance also available.
    </p>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      Two days of sessions on language access in healthcare: current practice and what is shifting in standards, technology, and policy.
    </p>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 18px 0;">
      Continuing education credit is submitted through CCHI, NBCMI, RID, and ATA.
    </p>
    ${extra}
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 10px 0;">
      In appreciation of your work in the field, your registration is held at a personal rate:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;border-collapse:separate;">
      <tr><td style="border:1px solid #e2e8f0;border-left:3px solid ${TEAL};padding:16px 20px;border-radius:8px;background:#ffffff;">
        <div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;color:${TEAL};">
          ${discountPercent}% off &middot; in-person registration
        </div>
        <div style="font-size:24px;font-weight:700;color:${TEXT};margin-top:6px;line-height:1.1;">
          ${discountedDollars} <span style="font-size:14px;font-weight:500;color:${MUTED};margin-left:6px;text-decoration:line-through;">${originalDollars}</span>
        </div>
        <div style="font-size:13px;color:${MUTED};margin-top:6px;">
          Virtual attendance is also available at the standard $105.
        </div>
      </td></tr>
    </table>
    ${button(url, "Reserve my spot")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:8px 0 0 0;">
      Or paste this into your browser:<br/>
      <a href="${url}" style="color:${BLUE};word-break:break-all;">${url}</a>
    </p>
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      The link and rate are personal to you. If a colleague should also be invited, please reply and let me know.
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

type SponsorInviteArgs = {
  contactFirstName: string;
  companyName: string;
  suggestedTier: { name: string; amountLabel: string; ticketsIncluded: number; tagline: string } | null;
  inviteMessage: string | null;
  landingUrl: string;
};

export function sponsorInviteEmail({
  contactFirstName, companyName, suggestedTier, inviteMessage, landingUrl,
}: SponsorInviteArgs) {
  const first = contactFirstName || "there";
  const tierLine = suggestedTier
    ? `We thought the <strong>${escapeHtml(suggestedTier.name)}</strong> level (${escapeHtml(suggestedTier.amountLabel)}, ${suggestedTier.ticketsIncluded} ticket${suggestedTier.ticketsIncluded === 1 ? "" : "s"} included) might be a natural fit, but please pick whichever level works best for ${escapeHtml(companyName)} on the invitation page.`
    : `On the invitation page you&rsquo;ll find every sponsorship level we offer, from Exhibitor Tables to Diamond, and you can pick whichever one is the right fit for ${escapeHtml(companyName)}.`;
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">Hi ${escapeHtml(first)},</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      We would love for <strong>${escapeHtml(companyName)}</strong> to partner with us on the 2nd Annual Joint Conference of Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers, August 15 and 16, 2026, in Chicago.
    </p>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 16px 0;">
      ${tierLine}
    </p>
    ${inviteMessage ? `<div style="font-size:14px;line-height:1.6;color:${TEXT};background:#f8fafc;border-left:3px solid ${BLUE};padding:14px 16px;border-radius:6px;margin:0 0 18px 0;">${escapeHtml(inviteMessage).replace(/\n/g, "<br>")}</div>` : ""}
    ${button(landingUrl, "View the invitation")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      All sponsorships are tax-deductible to the fullest extent allowed by law under IRS code 501(c)(3). EINs: 83-3016421 and 36-2170833. If this is the wrong contact at ${escapeHtml(companyName)}, please forward this along or simply reply.
    </p>
  `);
}

type SponsorApplicationArgs = {
  firstName: string;
  companyName: string;
  tier: { name: string; amountLabel: string; ticketsIncluded: number };
  statusUrl: string;
  donatesFoodInstead: boolean;
};

export function sponsorApplicationReceivedEmail({
  firstName, companyName, tier, statusUrl, donatesFoodInstead,
}: SponsorApplicationArgs) {
  const first = firstName || "there";
  const amountLine = donatesFoodInstead
    ? "You indicated you would like to donate food in kind rather than make a cash sponsorship. We will be in touch shortly to coordinate menu, quantities, and logistics."
    : `Your selected level is the <strong>${escapeHtml(tier.name)}</strong> at ${escapeHtml(tier.amountLabel)}, which includes ${tier.ticketsIncluded} conference ticket${tier.ticketsIncluded === 1 ? "" : "s"}.`;
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">Thank you, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      We have received ${escapeHtml(companyName)}&rsquo;s application to sponsor the 2026 Lurie Children&rsquo;s and AALB Conference, August 15 and 16, 2026, at Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago.
    </p>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      ${amountLine}
    </p>
    ${donatesFoodInstead ? "" : `${button(statusUrl, "Review and complete payment")}`}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      All sponsorship payments are tax-deductible to the fullest extent allowed by law under IRS code 501(c)(3). EINs: 83-3016421 and 36-2170833.
    </p>
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:8px 0 0 0;">
      If you have any questions, simply reply to this email.
    </p>
  `);
}

type SponsorPaidArgs = {
  firstName: string;
  companyName: string;
  tierName: string;
  amountCents: number;
  statusUrl: string;
};

export function sponsorPaidEmail({
  firstName, companyName, tierName, amountCents, statusUrl,
}: SponsorPaidArgs) {
  const first = firstName || "there";
  const amount = `$${(amountCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">Thank you for your sponsorship, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      ${escapeHtml(companyName)} is confirmed as a sponsor of the 2026 Lurie Children&rsquo;s and AALB Conference at the ${escapeHtml(tierName)} level. Your payment of ${escapeHtml(amount)} has been received.
    </p>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      Our team will follow up shortly with logo and material specifications, ticket allocation, and any tier-specific details we need to coordinate.
    </p>
    ${button(statusUrl, "View your sponsorship")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      Your payment is tax-deductible to the fullest extent allowed by law under IRS code 501(c)(3). EINs: 83-3016421 and 36-2170833. Keep this email as your receipt.
    </p>
  `);
}

type SponsorAdminNotifyArgs = {
  sponsor: {
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string | null;
    website: string | null;
    message: string | null;
    tierName: string;
    amountLabel: string;
  };
};

export function sponsorAdminNotificationEmail({ sponsor }: SponsorAdminNotifyArgs) {
  return shell(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px 0;">New sponsorship application</h1>
    <p style="font-size:14px;color:${MUTED};margin:0 0 18px 0;">${escapeHtml(sponsor.tierName)} &middot; ${escapeHtml(sponsor.amountLabel)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:${MUTED};width:140px;">Company</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:${TEXT};font-weight:600;">${escapeHtml(sponsor.companyName)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:${MUTED};">Contact</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:${TEXT};">${escapeHtml(sponsor.contactName)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:${MUTED};">Email</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:${TEXT};">${escapeHtml(sponsor.contactEmail)}</td></tr>
      ${sponsor.contactPhone ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:${MUTED};">Phone</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:${TEXT};">${escapeHtml(sponsor.contactPhone)}</td></tr>` : ""}
      ${sponsor.website ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:${MUTED};">Website</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:${BLUE};"><a style="color:${BLUE};" href="${escapeHtml(sponsor.website)}">${escapeHtml(sponsor.website)}</a></td></tr>` : ""}
    </table>
    ${sponsor.message ? `<p style="font-size:14px;line-height:1.6;color:${TEXT};margin:18px 0 0 0;background:#f8fafc;border-left:3px solid ${BLUE};padding:12px 14px;border-radius:6px;">${escapeHtml(sponsor.message)}</p>` : ""}
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
