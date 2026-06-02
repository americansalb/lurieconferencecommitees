type InviteArgs = {
  name: string;
  url: string;
  customMessage?: string;
  role?: string | null;
  sessionFormat?: string | null;
};

const TEAL = "#0E5566";
const BLUE = "#0066B3";
const GOLD = "#C9A14B";
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

// A gold-underlined section heading, matching the "Conference at a Glance" /
// "Why Sponsor" style of the outreach templates (no emoji — colored labels
// carry the structure instead).
function sectionHeading(text: string) {
  return `<div style="font-size:12px;letter-spacing:0.14em;font-weight:700;color:${GOLD};text-transform:uppercase;margin:28px 0 12px 0;padding-bottom:8px;border-bottom:1px solid #eef1f4;">${text}</div>`;
}

// "Conference at a Glance" detail rows. Each label is a colored caption above
// its value, so the block reads cleanly without icons.
function glanceCard(rows: { label: string; value: string }[]) {
  const body = rows.map((r) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef1f4;vertical-align:top;">
        <div style="font-size:11px;letter-spacing:0.08em;font-weight:700;color:${TEAL};text-transform:uppercase;">${r.label}</div>
        <div style="font-size:14px;line-height:1.55;color:${TEXT};margin-top:3px;">${r.value}</div>
      </td>
    </tr>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbfcfd;border:1px solid #eef1f4;border-radius:12px;padding:6px 16px;margin:4px 0 8px 0;">${body}</table>`;
}

// A checkmark bullet list in the conference gold, used for "Why sponsor" and
// the CFP topic lists.
function bulletList(items: string[]) {
  const lis = items.map((t) => `
    <tr>
      <td style="vertical-align:top;padding:5px 10px 5px 0;width:18px;"><span style="color:${GOLD};font-weight:700;font-size:15px;">&#10003;</span></td>
      <td style="vertical-align:top;padding:5px 0;font-size:14.5px;line-height:1.6;color:${TEXT};">${t}</td>
    </tr>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 8px 0;">${lis}</table>`;
}

// Production origin for absolute asset URLs (logos). Emails render outside
// our app, so images need fully-qualified URLs. Callers on the server pass
// appUrl(); previews and clients fall back to production, where the logos
// are publicly served.
const ASSET_BASE = "https://conference.aalb.org";

// A branded hero banner that recreates the conference banner from the
// outreach drafts. Built as bulletproof HTML (solid bgcolor + gradient
// overlay) so it renders even when a client blocks remote images.
function heroBanner() {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${TEAL}" style="background:${TEAL};background:linear-gradient(135deg, #0E5566 0%, #0C3B4B 100%);border-radius:14px;overflow:hidden;margin:0 0 22px 0;">
    <tr><td align="center" style="padding:30px 26px 26px 26px;">
      <div style="font-size:11px;letter-spacing:0.18em;font-weight:700;color:${GOLD};text-transform:uppercase;">2nd Annual Joint Conference</div>
      <div style="font-size:27px;line-height:1.2;font-weight:800;color:#ffffff;margin:10px 0 0 0;letter-spacing:-0.01em;">
        2026 Lurie Children&rsquo;s<br/>&amp; <span style="color:${GOLD};">AALB</span> Conference
      </div>
      <div style="width:46px;height:3px;background:${GOLD};border-radius:2px;margin:14px auto 12px auto;"></div>
      <div style="font-size:14px;font-style:italic;color:#dbe7ea;line-height:1.5;">True Language Access:<br/>Yesterday, Today, and Tomorrow</div>
      <div style="font-size:12px;color:#aac4ca;margin-top:12px;letter-spacing:0.02em;">August 15 &amp; 16, 2026 &middot; Chicago, Illinois</div>
    </td></tr>
  </table>`;
}

// The two host logos, side by side on white, used to close the outreach
// emails the way the source documents did. AALB leads, then Lurie.
function logoLockup(assetBase: string = ASSET_BASE) {
  const base = assetBase.replace(/\/$/, "");
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 4px 0;border-top:1px solid #eef1f4;">
    <tr><td align="center" style="padding:22px 0 4px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td align="center" style="padding:0 16px;">
          <img src="${base}/logos/aalb.png" alt="Americans Against Language Barriers" height="40" style="height:40px;width:auto;display:block;" />
        </td>
        <td style="border-left:1px solid #e2e8f0;width:1px;">&nbsp;</td>
        <td align="center" style="padding:0 16px;">
          <img src="${base}/logos/lurie.png" alt="Ann &amp; Robert H. Lurie Children's Hospital of Chicago" height="34" style="height:34px;width:auto;display:block;" />
        </td>
      </tr></table>
    </td></tr>
  </table>`;
}

// Shared sign-off block: the conference planning committee with the two
// named signatories. AALB leads, then Lurie Children's.
function signOff(closing = "Warm regards,") {
  return `
    <p style="font-size:14.5px;line-height:1.7;color:${TEXT};margin:22px 0 14px 0;">${closing}</p>
    <p style="font-size:14.5px;line-height:1.6;color:${TEXT};margin:0;">
      <strong>Iris Laffitte</strong><br/>
      <span style="color:${MUTED};">Americans Against Language Barriers</span>
    </p>
    <p style="font-size:14.5px;line-height:1.6;color:${TEXT};margin:12px 0 0 0;">
      <strong>Zachary Paul Romansky</strong><br/>
      <span style="color:${MUTED};">Lurie Children&rsquo;s Language Services Department</span>
    </p>`;
}

// Conference-at-a-glance rows shared across outreach emails. Kept here so the
// dates, venue, CEUs, and format stay consistent with the landing tokens.
const GLANCE_ROWS = [
  { label: "Location", value: "Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago, 225 E. Chicago Avenue, Chicago, IL 60611" },
  { label: "Dates", value: "Saturday, August 15 &middot; 9:30 AM&ndash;6:00 PM<br/>Sunday, August 16 &middot; 9:30 AM&ndash;4:00 PM" },
  { label: "CEUs", value: "10+ accredited CEUs (CCHI, NBCMI, RID, and ATA accreditation sought)" },
  { label: "Format", value: "In person, with a virtual option for attendees" },
];

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
  assetBase?: string;
};

export function sponsorInviteEmail({
  contactFirstName, companyName, suggestedTier, inviteMessage, landingUrl, assetBase,
}: SponsorInviteArgs) {
  const first = contactFirstName || "there";
  const tierLine = suggestedTier
    ? `We thought the <strong>${escapeHtml(suggestedTier.name)}</strong> level (${escapeHtml(suggestedTier.amountLabel)}, ${suggestedTier.ticketsIncluded} ticket${suggestedTier.ticketsIncluded === 1 ? "" : "s"} included) might be a natural fit, but please choose whichever level works best for ${escapeHtml(companyName)}.`
    : `On the invitation page you&rsquo;ll find every sponsorship level we offer, from Exhibitor Tables to Diamond, and you can choose whichever one is the right fit for ${escapeHtml(companyName)}.`;
  return shell(`
    ${heroBanner()}
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">Hi ${escapeHtml(first)},</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      We would love for <strong>${escapeHtml(companyName)}</strong> to become a sponsor or exhibitor at the 2nd Annual Joint Conference of Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers (AALB), taking place August 15 and 16, 2026, in Chicago.
    </p>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 4px 0;">
      This year&rsquo;s theme, <em>True Language Access: Yesterday, Today, and Tomorrow</em>, brings together healthcare professionals, medical interpreters, language service providers, advocates, and policymakers from across the country for two days of learning, networking, and dialogue on equitable healthcare communication.
    </p>
    ${inviteMessage ? `<div style="font-size:14px;line-height:1.6;color:${TEXT};background:#f8fafc;border-left:3px solid ${BLUE};padding:14px 16px;border-radius:6px;margin:18px 0 0 0;">${escapeHtml(inviteMessage).replace(/\n/g, "<br>")}</div>` : ""}

    ${button(landingUrl, "Browse levels and apply")}

    ${sectionHeading("Conference at a Glance")}
    ${glanceCard(GLANCE_ROWS)}

    ${sectionHeading("Why Sponsor?")}
    <p style="font-size:14.5px;line-height:1.6;color:${TEXT};margin:0 0 6px 0;">Sponsoring the Lurie Children&rsquo;s &amp; AALB Conference is a meaningful opportunity to:</p>
    ${bulletList([
      "Gain visibility with a highly engaged audience of healthcare and language access professionals",
      "Demonstrate your organization&rsquo;s commitment to health equity and language access",
      "Connect directly with decision-makers, interpreters, educators, and advocates",
      "Showcase your products, services, or programs as an exhibitor",
      "Align your brand with two nationally recognized institutions: Lurie Children&rsquo;s and Americans Against Language Barriers",
    ])}

    ${sectionHeading("About Our Hosts")}
    <p style="font-size:14.5px;line-height:1.7;color:${TEXT};margin:0 0 12px 0;">
      <strong>Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago</strong> is one of the nation&rsquo;s top-ranked pediatric healthcare institutions, with a nationally recognized Language Services Department committed to compassionate, inclusive care.
    </p>
    <p style="font-size:14.5px;line-height:1.7;color:${TEXT};margin:0 0 4px 0;">
      <strong>Americans Against Language Barriers (AALB)</strong> is an Illinois-based 501(c)(3) nonprofit dedicated to improving the quality of life and healthcare outcomes of patients with limited English proficiency.
    </p>

    ${sectionHeading("Get Involved")}
    <p style="font-size:14.5px;line-height:1.7;color:${TEXT};margin:0 0 4px 0;">
      ${tierLine} Sponsorship opportunities are limited, so we encourage you to reach out at your earliest convenience.
    </p>
    ${button(landingUrl, "Browse levels and apply")}

    ${signOff()}

    ${logoLockup(assetBase)}

    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;padding-top:14px;border-top:1px solid #eef1f4;">
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

// ---- Call for Proposals -------------------------------------------------
// One template, two audiences. "general" speaks to the whole field;
// "healthcare" speaks to clinicians. Both replace the dead "Submit your
// proposal" button from the source documents with a real link to /proposal.
type ProposalCallVariant = "general" | "healthcare";

type ProposalCallArgs = {
  variant: ProposalCallVariant;
  submitUrl: string;
  recipientFirstName?: string | null;
  customMessage?: string | null;
  assetBase?: string;
};

const PROPOSAL_COPY: Record<ProposalCallVariant, {
  headline: string;
  intro: string;
  body: string;
  topics: string[];
  why: string;
}> = {
  general: {
    headline: "Call for Proposals: Share Your Perspective on Language Access.",
    intro:
      "We are excited to announce the Call for Proposals for the 2nd Joint Lurie Children&rsquo;s &amp; Americans Against Language Barriers (AALB) Conference on Language Access in Healthcare, taking place August 15 and 16, 2026, at Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago.",
    body:
      "This year&rsquo;s conference explores the full arc of language access in healthcare: the pioneers who laid the groundwork, the practices and innovations shaping today&rsquo;s landscape, and the technologies and standards that will define tomorrow. We invite practitioners, researchers, educators, advocates, and thought leaders to share their voices and perspectives.",
    topics: [
      "History and foundations of language access and medical interpretation",
      "Current best practices, innovations, and challenges in language services",
      "Emerging technologies and the future of healthcare communication",
      "Policy reform and advocacy for patients with limited English proficiency",
      "Training, certification, and professional development for interpreters",
      "Case studies and lessons from the field",
    ],
    why:
      "This is a unique opportunity to connect with healthcare professionals, medical interpreters, language service providers, and advocates from across the country. Accepted presenters will contribute to a growing national conversation on equitable healthcare communication.",
  },
  healthcare: {
    headline: "Call for Proposals: Share Your Clinical Perspective on Language Access.",
    intro:
      "We are pleased to announce the Call for Proposals for the 2nd Joint Lurie Children&rsquo;s &amp; Americans Against Language Barriers (AALB) Conference, taking place August 15 and 16, 2026, at Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago. As a healthcare professional, you witness firsthand the impacts, as well as the gaps, of language access in clinical care. We want to hear from you.",
    body:
      "This conference explores the full arc of language access in healthcare: from the pioneers who fought for equitable communication to the technologies and policies shaping care today and tomorrow. We welcome proposals from physicians, nurses, social workers, care coordinators, and other clinical professionals who have stories, research, or insights to share.",
    topics: [
      "The clinical impact of language barriers on patient outcomes and safety",
      "Best practices for working effectively with medical interpreters",
      "Case studies illustrating language access successes or challenges",
      "Innovations in multilingual patient education and informed consent",
      "Pediatric and family-centered care for patients with limited English proficiency",
      "Interdisciplinary approaches to improving language services at the bedside",
    ],
    why:
      "Your clinical perspective is essential to advancing this field. We hope you will consider sharing your voice at this important gathering. Accepted presenters will contribute to a growing national conversation on equitable healthcare communication.",
  },
};

export function proposalCallEmail({
  variant, submitUrl, recipientFirstName, customMessage, assetBase,
}: ProposalCallArgs) {
  const c = PROPOSAL_COPY[variant];
  const greeting = recipientFirstName?.trim()
    ? `Dear ${escapeHtml(recipientFirstName.trim())},`
    : "Dear Colleague,";
  return shell(`
    ${heroBanner()}
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;line-height:1.25;color:${TEAL};">${c.headline}</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">${greeting}</p>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">${c.intro}</p>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 6px 0;">${c.body}</p>
    ${customMessage ? `<div style="font-size:14px;line-height:1.6;color:${TEXT};background:#f8fafc;border-left:3px solid ${BLUE};padding:14px 16px;border-radius:6px;margin:18px 0 0 0;">${escapeHtml(customMessage).replace(/\n/g, "<br>")}</div>` : ""}

    ${button(submitUrl, "Submit your proposal")}

    ${sectionHeading("Topics We&rsquo;re Especially Interested In")}
    ${bulletList(c.topics)}

    ${sectionHeading("Presentation Details")}
    ${glanceCard([
      { label: "Presentation Length", value: "45 minutes or 60 minutes" },
      { label: "Submission Deadline", value: "June 30, 2026" },
    ])}

    ${button(submitUrl, "Submit your proposal")}

    ${sectionHeading("Conference at a Glance")}
    ${glanceCard(GLANCE_ROWS)}

    ${sectionHeading("Why Present?")}
    <p style="font-size:14.5px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">${c.why}</p>
    <p style="font-size:14.5px;line-height:1.7;color:${TEXT};margin:0 0 4px 0;">
      Questions? Please reach out to us at <a href="mailto:contact@aalb.org" style="color:${BLUE};">contact@aalb.org</a>. We look forward to reviewing your proposal and hope to see you in Chicago this August.
    </p>

    ${signOff()}

    ${logoLockup(assetBase)}
  `);
}

// ---- Meeting booking emails --------------------------------------------

function formatMeetingWhen(at: Date, tz: string): string {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "long", month: "long", day: "numeric",
  }).format(at);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short",
  }).format(at);
  return `${date} at ${time}`;
}

// Sent to a proposal submitter inviting them to book a meeting.
export function bookingInviteEmail({
  inviteeName, title, message, durationMin, bookUrl,
}: {
  inviteeName: string;
  title: string | null;
  message: string | null;
  durationMin: number;
  bookUrl: string;
}) {
  const first = (inviteeName || "there").split(" ")[0];
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">Hi ${escapeHtml(first)},</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      Thank you for your proposal for the 2026 Lurie Children&rsquo;s and AALB Conference. We&rsquo;d love to set up a short conversation to learn more about your session before we finalize the program.
    </p>
    ${message ? `<div style="font-size:14px;line-height:1.6;color:${TEXT};background:#f8fafc;border-left:3px solid ${BLUE};padding:14px 16px;border-radius:6px;margin:0 0 16px 0;">${escapeHtml(message).replace(/\n/g, "<br>")}</div>` : ""}
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 4px 0;">
      Pick whatever time works best for you and we&rsquo;ll send a Zoom link. The conversation will take about <strong>${durationMin} minutes</strong>.
    </p>
    ${button(bookUrl, "Choose a time")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      Or paste this link into your browser:<br/>
      <a href="${bookUrl}" style="color:${BLUE};word-break:break-all;">${bookUrl}</a>
    </p>
  `);
}

// Sent to the invitee once they've booked.
export function bookingConfirmedInviteeEmail({
  inviteeName, hostName, startAt, durationMin, tz, joinUrl, title,
}: {
  inviteeName: string;
  hostName: string;
  startAt: Date;
  durationMin: number;
  tz: string;
  joinUrl: string | null;
  title: string | null;
}) {
  const first = (inviteeName || "there").split(" ")[0];
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">You&rsquo;re booked, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      Your ${durationMin}-minute conversation${title ? ` &mdash; ${escapeHtml(title)}` : ""} with <strong>${escapeHtml(hostName)}</strong> is confirmed.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px 0;"><tr><td style="background:#f8fafc;border-left:3px solid ${TEAL};padding:14px 18px;border-radius:6px;">
      <div style="font-size:11px;letter-spacing:0.08em;font-weight:700;color:${TEAL};text-transform:uppercase;">When</div>
      <div style="font-size:16px;font-weight:700;color:${TEXT};margin-top:4px;">${formatMeetingWhen(startAt, tz)}</div>
    </td></tr></table>
    ${joinUrl ? button(joinUrl, "Join the Zoom meeting") : `<p style="font-size:14px;color:${MUTED};margin:16px 0 0 0;">We&rsquo;ll follow up with the Zoom link shortly.</p>`}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      Need to reschedule? Just reply to this email and we&rsquo;ll sort it out.
    </p>
  `);
}

// Sent to the team member who was assigned the booking.
export function bookingConfirmedHostEmail({
  hostName, inviteeName, inviteeEmail, startAt, durationMin, tz, joinUrl, startUrl, title,
}: {
  hostName: string;
  inviteeName: string;
  inviteeEmail: string;
  startAt: Date;
  durationMin: number;
  tz: string;
  joinUrl: string | null;
  startUrl: string | null;
  title: string | null;
}) {
  const first = (hostName || "there").split(" ")[0];
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">New meeting booked, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      <strong>${escapeHtml(inviteeName)}</strong> (<a href="mailto:${escapeHtml(inviteeEmail)}" style="color:${BLUE};">${escapeHtml(inviteeEmail)}</a>) booked a ${durationMin}-minute conversation${title ? ` &mdash; ${escapeHtml(title)}` : ""} with you.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px 0;"><tr><td style="background:#f8fafc;border-left:3px solid ${TEAL};padding:14px 18px;border-radius:6px;">
      <div style="font-size:11px;letter-spacing:0.08em;font-weight:700;color:${TEAL};text-transform:uppercase;">When (your time)</div>
      <div style="font-size:16px;font-weight:700;color:${TEXT};margin-top:4px;">${formatMeetingWhen(startAt, tz)}</div>
    </td></tr></table>
    ${startUrl ? button(startUrl, "Start the Zoom meeting") : joinUrl ? button(joinUrl, "Join the Zoom meeting") : `<p style="font-size:14px;color:${MUTED};margin:16px 0 0 0;">Zoom link wasn&rsquo;t created automatically &mdash; set one up and share it with the invitee.</p>`}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      It&rsquo;s on your meetings list in the planning portal too.
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
