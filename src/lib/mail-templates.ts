import { SPEAKERS } from "@/components/landing/speakers-data";
import { sponsorFirstName } from "@/lib/sponsors";

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

function shell(inner: string, preheader?: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
  </head>
  <body style="margin:0;padding:0;background:${SHELL_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${TEXT};">
    ${preheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SHELL_BG};padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${CARD_BG};border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td bgcolor="${TEAL}" style="padding:0;height:6px;background-color:${TEAL};background:linear-gradient(to right, ${TEAL} 0%, ${TEAL} 50%, ${BLUE} 50%, ${BLUE} 100%);">&nbsp;</td></tr>
          <tr><td style="padding:32px 32px 24px 32px;">
            <div style="font-size:11px;letter-spacing:0.2em;font-weight:600;color:${TEAL};text-transform:uppercase;">2026 Lurie Children&rsquo;s and AALB Conference</div>
            <div style="font-size:13px;color:${MUTED};margin-top:6px;">True Language Access: Yesterday, Today, and Tomorrow</div>
          </td></tr>
          <tr><td style="padding:0 32px 32px 32px;">
            ${inner}
          </td></tr>
          <tr><td style="padding:18px 32px 24px 32px;border-top:1px solid #e2e8f0;color:${MUTED};font-size:12px;line-height:1.6;">
            You are receiving this because you were invited to participate in the 2026 Lurie Children&rsquo;s and AALB Conference. If this was sent in error, please disregard.
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid #eef1f4;font-size:11px;line-height:1.7;color:#94a3b8;">
              Presented jointly by Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers<br/>
              <span style="white-space:nowrap;">501(c)(3) &middot; EINs 83-3016421 and 36-2170833</span>
            </div>
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
// "Why Sponsor" style of the outreach templates (no emoji; colored labels
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
      <div style="font-size:11px;letter-spacing:0.18em;font-weight:700;color:${GOLD};text-transform:uppercase;">2nd Joint Conference</div>
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
  { label: "Dates", value: "Saturday, August 15 &middot; 9:30 AM&ndash;6:30 PM<br/>Sunday, August 16 &middot; 9:00 AM&ndash;4:00 PM" },
  { label: "CEUs", value: "10+ CEU hours, will be accredited by NBCMI and CCHI" },
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
  virtualOriginalCents: number;
  virtualDiscountedCents: number;
  // One-day virtual ticket at the invitee's held Standard-tier base. Optional
  // so older callers and previews without it still render (the one-day line
  // is simply omitted).
  oneDayOriginalCents?: number;
  oneDayDiscountedCents?: number;
  personalCode: string;
  mainSiteUrl: string;
  // Relationship framing for the gold letter: "alumnus" (trained and certified),
  // "student" (currently or recently training), or "former-student" (trained
  // with us, no certificate). Defaults to alumnus. Only changes two lines of
  // copy, never implies anyone is lesser for not holding a certificate.
  relationship?: "alumnus" | "student" | "former-student";
  // Used by the engraved alumni letter: the conference home (second button),
  // a pre-formatted date for the letterhead, and the absolute asset origin for
  // signature and logo images.
  learnMoreUrl?: string;
  dateLabel?: string;
  assetBase?: string;
  // One-click unsubscribe URL (CAN-SPAM footer link; pairs with the
  // List-Unsubscribe header).
  unsubscribeUrl?: string;
};

// A note explaining the recipient's personal code: it's already baked into
// their link, and they can also use it on the public site. Only shown when
// there's actually a discount to give.
function attendeeCodeNote(personalCode: string, discountPercent: number, mainSiteUrl: string) {
  if (!personalCode || discountPercent <= 0) return "";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0 0 0;border-collapse:separate;">
      <tr><td style="background:#fbfcfd;border:1px solid #eef1f4;border-radius:10px;padding:14px 16px;">
        <div style="font-size:11px;letter-spacing:0.12em;font-weight:700;color:${GOLD};text-transform:uppercase;">Your personal code</div>
        <div style="font-size:20px;font-weight:800;color:${TEXT};letter-spacing:0.04em;margin:4px 0 6px 0;">${escapeHtml(personalCode)}</div>
        <div style="font-size:13.5px;line-height:1.6;color:${MUTED};">
          It&rsquo;s already applied through your button above, so there&rsquo;s nothing to enter. Prefer to look around first? You can register on <a href="${mainSiteUrl}" style="color:${BLUE};font-weight:600;">our main site</a> anytime using code <strong style="color:${TEXT};">${escapeHtml(personalCode)}</strong> for the same ${discountPercent}% off. This code is personal to you, so please don&rsquo;t share it.
        </div>
      </td></tr>
    </table>`;
}

// The personal-rate card, showing the discounted in-person AND virtual prices
// side by side. Shared by the standard and alumni attendee invites so they
// always price both options the same way.
function attendeeRateCard({
  discountPercent, inPersonOriginalCents, inPersonDiscountedCents, virtualOriginalCents, virtualDiscountedCents,
}: {
  discountPercent: number;
  inPersonOriginalCents: number;
  inPersonDiscountedCents: number;
  virtualOriginalCents: number;
  virtualDiscountedCents: number;
}) {
  const d2 = (c: number) => `$${(c / 100).toFixed(2)}`;
  const d0 = (c: number) => `$${(c / 100).toFixed(0)}`;
  const hasDiscount = discountPercent > 0;
  const col = (label: string, disc: number, orig: number) => `
    <td width="50%" style="vertical-align:top;padding:0 8px;">
      <div style="font-size:11px;letter-spacing:0.08em;font-weight:700;color:${TEAL};text-transform:uppercase;">${label}</div>
      <div style="font-size:22px;font-weight:700;color:${TEXT};margin-top:3px;line-height:1.1;">
        ${d2(disc)}${hasDiscount && disc < orig ? ` <span style="font-size:13px;font-weight:500;color:${MUTED};text-decoration:line-through;">${d0(orig)}</span>` : ""}
      </div>
    </td>`;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px 0;border-collapse:separate;">
      <tr><td style="border:1px solid #e2e8f0;border-left:3px solid ${TEAL};padding:16px 14px;border-radius:8px;background:#ffffff;">
        ${hasDiscount ? `<div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;color:${TEAL};padding:0 8px 10px 8px;">${discountPercent}% off &middot; your personal rate</div>` : ""}
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
          ${col("In-person", inPersonDiscountedCents, inPersonOriginalCents)}
          ${col("Virtual", virtualDiscountedCents, virtualOriginalCents)}
        </tr></table>
        <div style="font-size:12px;color:${MUTED};margin-top:12px;padding:0 8px;">Applied automatically at checkout, for whichever option you choose.</div>
      </td></tr>
    </table>`;
}

// Featured-speaker cards (headshot + concise bio), shared by both attendee
// invites so the standard and alumni emails show the same lineup. Photos are
// email-safe JPGs served from the conference site.
function attendeeSpeakerCards() {
  const speakers = [
    {
      slug: "yuliya-speroff", name: "Yuliya Speroff, CoreCHI-P",
      role: "AALB Trainer of the Year (2024); VP, National Council on Interpreting in Health Care",
      bio: "A Russian-English certified interpreter and Medical Interpreter Supervisor at Harborview Medical Center who trains interpreters nationally and writes medicalinterpreterblog.com. Named CHIA&rsquo;s Interpreter of the Year in 2021.",
    },
    {
      slug: "yuri-takabatake", name: "Yuri Takabatake, MD",
      role: "Attending Physician, Lurie Children&rsquo;s Hospital of Chicago",
      bio: "A hospital-medicine physician and language-equity researcher who has published on interpreter partnership during family-centered rounds, and co-founded Lurie Children&rsquo;s Language Access and Care Committee.",
    },
    {
      slug: "wilma-alvarado-little", name: "Wilma Alvarado-Little",
      role: "Associate Commissioner, New York State Department of Health",
      bio: "Leads health literacy and language access at the NY State Department of Health. A former NCIHC board co-chair, she helped create the first national certification, standards of practice, and code of ethics for healthcare interpreters across 40+ years in the field.",
    },
    {
      slug: "patricia-alonzo", name: "Patricia A. Alonzo, EdD",
      role: "Director of Strategic Partnerships, Equiti Health",
      bio: "A CMI-certified trilingual interpreter (English, Spanish, and ASL) with an EdD focused on outcomes for patients with limited English proficiency, and a national voice on access, cultural competency, and legislation.",
    },
  ];
  return speakers.map((s) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px 0;">
      <tr>
        <td width="76" valign="top" style="padding-right:14px;">
          <img src="${ASSET_BASE}/speakers/${s.slug}.jpg" width="64" height="64" alt="${escapeHtml(s.name)}" style="display:block;width:64px;height:64px;border-radius:10px;object-fit:cover;border:1px solid #eef1f4;" />
        </td>
        <td valign="top">
          <div style="font-size:15px;font-weight:700;color:${TEXT};line-height:1.25;">${s.name}</div>
          <div style="font-size:12.5px;font-weight:600;color:${TEAL};margin-top:2px;line-height:1.35;">${s.role}</div>
          <div style="font-size:12.5px;color:${MUTED};margin-top:5px;line-height:1.5;">${s.bio}</div>
        </td>
      </tr>
    </table>`).join("") +
    `<p style="font-size:13px;line-height:1.6;color:${MUTED};margin:6px 0 0 0;">With more speakers to be announced.</p>`;
}

// Two designed images for the sign-up emails. The Joint Commission keynote is
// the single strongest reason to attend, so we lead with the spotlight graphic;
// the group photo from a past convening is social proof of the community. Both
// link to registration; the alt text carries the full message for clients that
// block images, and assetBase lets previews override the host.
function keynoteSpotlight(href: string, assetBase = ASSET_BASE) {
  const b = assetBase.replace(/\/$/, "");
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 2px 0;"><tr><td align="center" style="text-align:center;">
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.24em;font-weight:bold;color:${GOLD};text-transform:uppercase;">&#10022;&nbsp;Keynote Announcement&nbsp;&#10022;</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;font-weight:bold;color:${TEAL};padding:10px 0 14px 0;">The people who write the standards &mdash;<br>and the people who enforce them.</div>
  </td></tr></table>
  <a href="${href}" style="text-decoration:none;display:block;margin:0 0 10px 0;">
    <img src="${b}/email/keynote-even.jpg" width="600" alt="Keynote Announcement — The Standards That Protect Patients: A Joint Commission View on Language Access, with Elizabeth Even, Senior Director of Field Operations at The Joint Commission. The 2026 Lurie Children&rsquo;s &amp; AALB Conference, August 15 and 16, 2026, in Chicago and virtual, 10+ CEU hours." style="display:block;width:100%;max-width:600px;height:auto;border-radius:12px;border:1px solid ${GOLD};" />
  </a>
  <p style="font-family:Georgia,'Times New Roman',serif;font-size:14.5px;line-height:1.7;color:#26363B;margin:0 0 24px 0;text-align:center;">The <strong>Joint Commission</strong> &mdash; whose standards nearly every hospital in America must meet &mdash; takes the keynote stage on language access. So does <strong>Michael Mul&eacute;</strong>, who led language-access enforcement at the U.S. Department of Justice. The people who set the standard and the people who enforce it, together at Lurie Children&rsquo;s, one of the nation&rsquo;s leading children&rsquo;s hospitals.</p>`;
}

function communityPhoto(href: string, assetBase = ASSET_BASE) {
  const b = assetBase.replace(/\/$/, "");
  return `
  <a href="${href}" style="text-decoration:none;display:block;margin:0 0 8px 0;">
    <img src="${b}/email/community.jpg" width="600" alt="Attendees of a past AALB conference gathered together in Chicago." style="display:block;width:100%;max-width:600px;height:auto;border-radius:12px;border:1px solid #E4DAC4;" />
  </a>
  <p style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:13px;line-height:1.6;color:${MUTED};margin:0 0 22px 0;text-align:center;">Colleagues from a past AALB convening in Chicago.</p>`;
}

export function attendeeInviteEmail({
  firstName,
  url,
  inviteMessage,
  discountPercent,
  inPersonOriginalCents,
  inPersonDiscountedCents,
  virtualOriginalCents,
  virtualDiscountedCents,
  personalCode,
  mainSiteUrl,
  unsubscribeUrl,
}: AttendeeInviteArgs) {
  const first = firstName || "there";
  const extra = inviteMessage
    ? `<p style="font-size:15px;line-height:1.65;color:${TEXT};margin:14px 0;background:#f8fafc;border-left:3px solid ${BLUE};padding:14px 16px;border-radius:6px;">${escapeHtml(inviteMessage)}</p>`
    : "";
  return shell(`
    ${heroBanner()}
    <h1 style="font-size:24px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">Hi ${escapeHtml(first)},</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      I hope this finds you well. I&rsquo;m writing to invite you to the <strong>2026 Lurie Children&rsquo;s &amp; AALB Conference</strong>, August 15 and 16, 2026, held in person at Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago, with full virtual attendance also available.
    </p>

    ${keynoteSpotlight(url)}

    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      This year&rsquo;s theme, <em>True Language Access: Yesterday, Today, and Tomorrow</em>, brings together interpreters, clinicians, language service providers, advocates, and policymakers for two days of sessions on where the field stands and where it&rsquo;s headed. Across three lenses, <strong>Yesterday</strong> honors the work that built language access as a civil right, <strong>Today</strong> confronts the gap between policy and practice at the bedside, and <strong>Tomorrow</strong> imagines the systems, training, and technology that make it the default for every patient.
    </p>
    ${extra}

    ${sectionHeading("Conference at a Glance")}
    ${glanceCard(GLANCE_ROWS)}

    ${sectionHeading("A Few of This Year&rsquo;s Voices")}
    ${attendeeSpeakerCards()}

    ${communityPhoto(url)}

    ${sectionHeading("Why Attend")}
    ${bulletList([
      "Keynotes from The Joint Commission and a former U.S. Department of Justice language-access leader &mdash; the people who set the standards and the people who enforce them",
      "Practice-focused sessions on the standards, technology, and policy reshaping language access",
      "10+ hours of CEUs, will be accredited by NBCMI and CCHI",
      "A national gathering of interpreters, clinicians, language service providers, advocates, and policymakers",
      "A front-row seat to the conversations shaping the next decade of the field",
    ])}

    ${sectionHeading("Your Personal Rate")}
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 12px 0;">
      In appreciation of your work in the field, your registration is held at a personal rate, whether you join us in Chicago or online:
    </p>
    ${attendeeRateCard({ discountPercent, inPersonOriginalCents, inPersonDiscountedCents, virtualOriginalCents, virtualDiscountedCents })}
    ${button(url, "Reserve my spot")}
    ${attendeeCodeNote(personalCode, discountPercent, mainSiteUrl)}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      Or paste this into your browser:<br/>
      <a href="${url}" style="color:${BLUE};word-break:break-all;">${url}</a>
    </p>
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      This link and rate are personal to you. If a colleague should also be invited, just reply and let me know.
    </p>

    ${signOff()}
    ${logoLockup()}
    ${unsubscribeUrl ? `<p style="font-size:11px;line-height:1.6;color:${MUTED};margin:16px 0 0 0;text-align:center;">Don&rsquo;t want these invitations? <a href="${unsubscribeUrl}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>.</p>` : ""}
  `, "The Joint Commission and a former U.S. DOJ language-access leader are keynoting. August 15 and 16, in Chicago and online.");
}

// A warm, personal letter to the AALB alumni community, set as the same
// engraved gold-foil invitation we send marquee sponsors: deep-teal letterhead
// with a gold "2026" seal, an engraved drop cap, a gold-ruled pull-quote for
// the personal note, the alumni rate in a cream-and-gold panel, and real
// ink-cursive signatures from Kevin, Iris, and Zachary. Written as if from
// people the alumni already know, inviting them to reunite in Chicago (or join
// the live virtual stream). Self-contained and responsive, with solid colors
// under every gradient and a VML seal so it degrades gracefully in Outlook.
export function attendeeAlumniInviteEmail({
  firstName,
  url,
  inviteMessage,
  discountPercent,
  personalCode,
  mainSiteUrl,
  learnMoreUrl,
  dateLabel,
  assetBase,
  unsubscribeUrl,
  relationship,
}: AttendeeInviteArgs) {
  const TEAL_DEEP = "#0C3B4B", INK = "#0B1F25", SOFT = "#5A6E76", GOLD_SOFT = "#F4E9CD", LINK = "#1E6FA2";
  const base = (assetBase || ASSET_BASE).replace(/\/$/, "");
  const site = learnMoreUrl || base;
  const first = (firstName || "there").trim();
  const today = dateLabel || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const hasDiscount = discountPercent > 0;

  // Relationship framing. Alumni (certificate holders) keep the formal
  // reconnection letter. Students and former students get a career-first
  // rework: the formal version earned ~2% clicks from them, because it never
  // answered what the conference does for someone turning training into paid
  // work. Same engraved shell, different spine.
  const rel = relationship || "alumnus";
  const isStudentLetter = rel !== "alumnus";
  // Full opening paragraph; the first letter renders as the drop cap.
  const opening =
    rel === "student"
      ? `You are training for a profession that gathers in one room this August &mdash; and you belong in it. <strong>The Joint Commission</strong>, whose standards nearly every American hospital answers to, delivers the keynote on language access at Lurie Children&rsquo;s, and the employers who hire interpreters will be steps away on the exhibit floor. You could be in that room the same year you enter the field${hasDiscount ? ` &mdash; and as an AALB student, your seat comes with a personal ${discountPercent}% off` : ""}.`
      : rel === "former-student"
      ? `You did the forty hours. Now the profession you trained for is gathering in one room: this August, <strong>The Joint Commission</strong> takes the stage on language access at Lurie Children&rsquo;s, alongside the man who led its enforcement at the U.S. Department of Justice &mdash; and the employers who hire interpreters will be there in person.${hasDiscount ? ` Your AALB training earned you a personal ${discountPercent}% off the door.` : ""}`
      : "You trained with us, you earned your certificate with us, and you have stayed part of this community ever since. As we plan our next conference, you are exactly the person we hoped would be in the room, so we wanted to write to you directly.";
  const courtesyLabel = rel === "alumnus" ? "Your alumni courtesy" : "Your AALB student courtesy";

  // Students act from the first screen: one primary button directly under the
  // opening paragraph, above every photo and spotlight. On a phone the old
  // letter's first button sat several screens down. Alumni keep the original
  // single CTA row lower in the letter.
  const earlyCta = isStudentLetter ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 24px 0;">
        <tr><td align="center">
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:4px;"><tr>
            <td align="center" bgcolor="${TEAL}" style="background-color:${TEAL};border-radius:9px;">
              <a href="${url}" style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:9px;">Claim my seat${hasDiscount ? ` &mdash; ${discountPercent}% off` : ""} &nbsp;&rarr;</a>
            </td>
          </tr></table>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6;color:#5A6E76;padding:8px 4px 0 4px;">${hasDiscount ? "Your personal code is applied automatically &mdash; " : ""}August 15&ndash;16, in person in Chicago or live online.</div>
        </td></tr>
      </table>` : "";

  // The recipient's personal note, shown as a gold-ruled pull-quote when present.
  const noteParas = (inviteMessage || "").trim()
    ? (inviteMessage as string).trim().split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
    : [];
  const noteBlock = noteParas.length ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px 0;">
        <tr>
          <td style="width:3px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td>
          <td style="padding:2px 0 2px 20px;">
            ${noteParas.map((para, i) => `<p style="margin:0 0 ${i === noteParas.length - 1 ? 0 : 12}px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15.5px;line-height:1.8;color:#284752;">${escapeHtml(para)}</p>`).join("")}
          </td>
        </tr>
      </table>` : "";

  // The alumni courtesy, in the cream-and-gold panel. We state the discount
  // only, never a dollar figure: the underlying rate can change (the Standard
  // window closes, Late pricing applies), so a price printed here could be out of date by the
  // time they register. The percentage off always holds.
  const ratePanel = hasDiscount ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px 0;">
        <tr><td bgcolor="#FBF4E2" style="background-color:#FBF4E2;border:1px solid #EAD9AE;border-radius:10px;padding:20px 18px;text-align:center;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;padding-bottom:8px;">${courtesyLabel}</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.25;color:#3C2E10;">${discountPercent}% off your registration</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13.5px;line-height:1.6;color:#6B5A33;padding:8px 6px 0 6px;">Good for an in-person seat in Chicago or live online attendance alike, applied automatically at checkout.</div>
        </td></tr>
      </table>` : "";

  const codeBlock = (personalCode && hasDiscount) ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
        <tr><td style="border:1px dashed #D9C690;border-radius:10px;padding:14px 18px;background-color:#FCFAF4;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:bold;">Your personal code</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:1px;color:${INK};font-weight:bold;padding:3px 0 5px 0;">${escapeHtml(personalCode)}</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6;color:${SOFT};">It is already built into your button above, so there is nothing to enter. Prefer to look around first? Register anytime on <a href="${mainSiteUrl}" style="color:${LINK};text-decoration:none;">our main site</a> with this code for the same ${discountPercent}% off. It is personal to you, so please keep it to yourself.</div>
        </td></tr>
      </table>` : "";

  const sig = (img: string, name: string, title: string) => `
        <img src="${base}/sig/${img}" alt="${escapeHtml(name)}" height="40" style="height:40px;width:auto;display:block;margin:0 0 4px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:140px;height:1px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${INK};font-weight:bold;padding-top:8px;">${escapeHtml(name)}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${SOFT};padding-top:2px;">${escapeHtml(title)}</div>`;

  const p = (html: string, mb = 18) =>
    `<p style="margin:0 0 ${mb}px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">${html}</p>`;

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>An Invitation &middot; 2026 Lurie Children&rsquo;s &amp; AALB Conference</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;}
  a{color:${LINK};}
  @media only screen and (max-width:600px){
    .sl-card{width:100%!important;}
    .sl-body{padding:32px 24px 30px 24px!important;}
    .sl-head{padding:36px 22px 30px 22px!important;}
    .sl-foot{padding:24px 22px!important;}
    .sl-display{font-size:25px!important;line-height:31px!important;}
    .sl-seal{width:96px!important;height:96px!important;}
    .sl-dropcap{font-size:46px!important;line-height:36px!important;}
    .sl-cta{display:block!important;width:100%!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#ECE6D7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ECE6D7;">${isStudentLetter ? "The Joint Commission is keynoting, the employers who hire interpreters are at the tables, and your personal code is inside. Chicago or live online, August 15 and 16." : "The Joint Commission and a former U.S. DOJ language-access leader are keynoting. Come reconnect in Chicago or online, August 15 and 16, 2026."}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ECE6D7;background-image:linear-gradient(180deg,#F0EBDD 0%,#E6DECB 100%);">
<tr><td align="center" style="padding:34px 14px 44px 14px;">

  <table role="presentation" class="sl-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#FBF8F1;border:1px solid #E4DAC4;box-shadow:0 18px 48px rgba(12,59,75,0.18);">

    <tr><td align="center" bgcolor="${TEAL_DEEP}" class="sl-head" style="background-color:${TEAL_DEEP};background-image:linear-gradient(160deg,${TEAL} 0%,${TEAL_DEEP} 100%);padding:44px 40px 34px 40px;">
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;letter-spacing:4px;text-transform:uppercase;color:${GOLD_SOFT};font-weight:bold;">Lurie Children&rsquo;s &middot; AALB</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding-top:6px;">${rel === "alumnus" ? "An Invitation to Our Alumni" : "An Invitation to Our Community"}</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:8px;line-height:10px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};font-weight:bold;padding:22px 0 8px 0;">&middot;&nbsp;Second Joint Conference&nbsp;&middot;</div>

      <!--[if !mso]><!-->
      <div class="sl-seal" style="width:116px;height:116px;border-radius:50%;background-color:${GOLD};background-image:linear-gradient(135deg,#F4E9CD 0%,#D9B863 28%,#C9A14B 52%,#9C7A2E 78%,#E7D5A4 100%);border:2px solid #F4E9CD;box-shadow:0 6px 16px rgba(0,0,0,0.30),inset 0 1px 2px rgba(255,255,255,0.55);display:inline-block;">
        <table role="presentation" width="116" height="116" cellpadding="0" cellspacing="0" border="0" style="width:116px;height:116px;"><tr><td align="center" valign="middle" style="text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:30px;color:#3C2E10;font-weight:bold;letter-spacing:1px;">2026</div>
        </td></tr></table>
      </div>
      <!--<![endif]-->
      <!--[if mso]>
      <v:oval fill="true" stroke="true" strokecolor="#F4E9CD" strokeweight="2px" style="width:116px;height:116px;">
        <v:fill type="solid" color="#C9A14B"/>
        <v:textbox inset="0,0,0,0"><center><div style="font-family:Georgia,serif;font-size:30px;color:#3C2E10;font-weight:bold;">2026</div></center></v:textbox>
      </v:oval>
      <![endif]-->

      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:13px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};padding:10px 0 0 0;">True Language Access</div>
      <div class="sl-display" style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:38px;color:#FFFFFF;padding:18px 0 0 0;">The Second Joint Conference</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;line-height:22px;color:#A9C6CD;padding:7px 0 0 0;">on Language Access in American Healthcare</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding:14px 0 0 0;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
    </td></tr>

    <tr><td style="height:3px;line-height:3px;font-size:0;background-color:${GOLD};background-image:linear-gradient(90deg,#9C7A2E 0%,#F4E9CD 50%,#9C7A2E 100%);">&nbsp;</td></tr>

    <tr><td class="sl-body" style="padding:40px 52px 36px 52px;background-color:#FBF8F1;">
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${SOFT};">${escapeHtml(today)}</div>
      <div style="height:18px;line-height:18px;font-size:0;">&nbsp;</div>

      ${p(`Dear ${escapeHtml(first)},`)}

      <p style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">
        <span class="sl-dropcap" style="float:left;font-family:Georgia,'Times New Roman',serif;font-size:54px;line-height:42px;color:${TEAL};padding:6px 11px 0 0;">${opening.charAt(0)}</span>${opening.slice(1)}
      </p>

      ${earlyCta}

      ${isStudentLetter ? `
      ${p(`Look at who is in this room. <strong>Elizabeth Even</strong> of <strong>The Joint Commission</strong> &mdash; the body that writes the standards nearly every U.S. hospital must meet &mdash; gives the keynote, joined by <strong>Michael Mul&eacute;</strong>, who led language-access enforcement at the U.S. Department of Justice. At the exhibitor tables: <strong>Martti</strong> and <strong>LanguageLine</strong>, employers who staff hospitals nationwide, alongside hospital language-access directors who hire people with your exact training. For someone turning training into paid work, there is no shorter path than this room.`)}

      ${communityPhoto(url, base)}

      ${p(`The craft sessions are taught by people who do the job. Staff interpreters from major hospitals teach <em>Beyond Accuracy: The Invisible Skills in Healthcare Interpreting</em>; the interpreter supervisor at <strong>Harborview Medical Center</strong> presents a health-equity case study; and the chair of the <strong>NCIHC</strong> ethics workgroup runs a hands-on workshop on the newly revised National Code of Ethics &mdash; plus a session on building a career that doesn&rsquo;t burn you out. Over ten hours of continuing-education content across two days, or every minute of it streamed live, wherever you are. This year&rsquo;s theme: <span style="font-style:italic;color:${TEAL};">True Language Access: Yesterday, Today, and Tomorrow.</span>`)}` : `
      ${p(`We would love for you to join us at the <strong>2026 Lurie Children&rsquo;s &amp; AALB Conference</strong> in Chicago on August 15 and 16. More than the sessions, what we are really after is the chance to be together again, to put faces to names and reconnect with the people you came up alongside.`)}

      ${p(`We have gathered like this twice before, and both times the very best part was watching colleagues who had only ever met on a screen finally shake hands in person, interpreters and trainers and friends from every corner of the country, all under one roof.`)}

      ${communityPhoto(url, base)}

      ${p(`And if Chicago is too far this year, you can still be with us. The whole conference streams <strong>live</strong>, in real time, not recordings after the fact, so you can take part in the sessions and the conversation from wherever you are. This year&rsquo;s theme is <span style="font-style:italic;color:${TEAL};">True Language Access: Yesterday, Today, and Tomorrow.</span>`)}`}

      ${noteBlock}

      ${keynoteSpotlight(url, base)}

      ${ratePanel}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 22px 0;">
        <tr><td align="center">
          <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="${TEAL}" style="background-color:${TEAL};border-radius:9px;">
              <a href="${url}" style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:9px;">Reserve my seat &nbsp;&rarr;</a>
            </td>
          </tr></table>
          <!--[if mso]></td><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="#FBF8F1" style="background-color:#FBF8F1;border:1.5px solid ${GOLD};border-radius:9px;">
              <a href="${site}" style="display:inline-block;padding:13.5px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:${TEAL};text-decoration:none;border-radius:9px;">See the full program</a>
            </td>
          </tr></table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td></tr>
      </table>

      ${codeBlock}

      ${isStudentLetter
        ? p(`${rel === "student"
            ? "You are doing the hard part right now &mdash; this is the room where it starts to pay off"
            : "You did the hard part when you finished the training &mdash; this is the room where it pays off"}${hasDiscount ? ", and your discount is already waiting" : ""}. Reply to this letter and it reaches real people at <a href="mailto:kevin@aalb.org" style="color:${LINK};text-decoration:none;">kevin@aalb.org</a>. And if there is someone from your cohort who should be on this list, send us their name.`, 22)
        : p(`Whichever way you join us, it would mean a great deal to have you there. If you have any questions, just reply to this note and it comes straight to us at <a href="mailto:kevin@aalb.org" style="color:${LINK};text-decoration:none;">kevin@aalb.org</a>. And if there is someone from your cohort who should be on this list, send us their name.`, 22)}

      <div style="font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};padding-bottom:16px;">Warmly, and hoping to see you in Chicago,</div>

      ${sig("kevin.png", "Kevin Thakkar", "Founder & Executive Director, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("iris.png", "Iris Laffitte", "Operations Manager, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("zachary.png", "Zachary Paul Romansky", "Lurie Children’s Language Services Department")}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0 0;border-top:1px solid #ECE3D0;">
        <tr><td align="center" style="padding:24px 0 4px 0;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#9A8B6A;padding-bottom:16px;">Presented Jointly By</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/aalb.png" alt="Americans Against Language Barriers" height="40" style="height:40px;width:auto;display:block;"></td>
            <td style="border-left:1px solid #E0D5BD;width:1px;font-size:0;">&nbsp;</td>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/lurie.png" alt="Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago" height="34" style="height:34px;width:auto;display:block;"></td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td class="sl-foot" align="center" bgcolor="${TEAL_DEEP}" style="background-color:${TEAL_DEEP};background-image:linear-gradient(180deg,${TEAL_DEEP} 0%,#0A3340 100%);padding:26px 40px 28px 40px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.5px;color:${GOLD_SOFT};">2026 Lurie Children&rsquo;s &amp; AALB Conference</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;padding-top:8px;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;">conference.aalb.org &middot; contact@aalb.org</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:0.5px;color:#5F7E86;padding-top:8px;">501(c)(3) &middot; EINs 83-3016421 and 36-2170833</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:10px;">You are receiving this because you trained with AALB. ${unsubscribeUrl ? `Prefer not to hear from us? <a href="${unsubscribeUrl}" style="color:#9FB6BC;text-decoration:underline;">Unsubscribe</a>.` : "If you would rather not hear from us, just reply and let us know."}</div>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

// The REUNION letter for the 2024 conference roster: same engraved gold shell
// as the alumni letter, but every opening is written to the person's actual
// 2024 relationship — paid & in the room, paid & on the livestream, started a
// checkout (never shamed, never mentioned), or signed the interest form — and
// weaves in their language pair when we know it. "We remember you" is the
// whole point of this template.
type AttendeeReturningArgs = AttendeeInviteArgs & {
  returning2024: "paid" | "attempted" | "lead";
  attended2024Mode?: "in-person" | "virtual" | null;
  primaryLanguages?: string | null;
};

// True when a languages string says more than just "English" — the language
// line should only appear when it can name a real pair.
function languagesWorthNaming(s: string | null | undefined): boolean {
  const t = (s || "").trim();
  if (!t) return false;
  const tokens = t.split(/[\s,\/&+-]+/).filter(Boolean);
  if (!tokens.length) return false;
  return !tokens.every((w) => /^(english|and|eng)$/i.test(w));
}

export function attendeeReturningInviteEmail({
  firstName,
  url,
  inviteMessage,
  discountPercent,
  personalCode,
  mainSiteUrl,
  learnMoreUrl,
  dateLabel,
  assetBase,
  unsubscribeUrl,
  returning2024,
  attended2024Mode,
  primaryLanguages,
}: AttendeeReturningArgs) {
  const TEAL_DEEP = "#0C3B4B", INK = "#0B1F25", SOFT = "#5A6E76", GOLD_SOFT = "#F4E9CD", LINK = "#1E6FA2";
  const base = (assetBase || ASSET_BASE).replace(/\/$/, "");
  const site = learnMoreUrl || base;
  const first = (firstName || "there").trim();
  const today = dateLabel || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const hasDiscount = discountPercent > 0;
  const paid = returning2024 === "paid";
  const inPerson = attended2024Mode === "in-person";

  // Segment-specific pieces. Every opening starts with a "T"-less remainder —
  // the engraved drop cap letter is computed per segment below.
  const eyebrowLine = paid ? "An Invitation to Return" : "An Invitation, Renewed";
  const preheader = paid
    ? "The second joint Lurie Children&rsquo;s &amp; AALB conference &mdash; August 15 and 16, 2026, keynoted by The Joint Commission. Welcome back."
    : "The conference you signed up to hear about in 2024 returns &mdash; with The Joint Commission and the DOJ on stage. In person or live online.";
  // Each opening does genuinely different work per segment, in the same
  // formal-invitation register as the alumni letter: institutions, dates,
  // dignity. No slogans, no "your seat is waiting" salesmanship. Drop cap =
  // first letter.
  const opening = paid
    ? (inPerson
      ? `Two summers ago in Chicago, you took a seat in the room where Lurie Children&rsquo;s and Americans Against Language Barriers held their first joint conference. The second is set for August 15 and 16, in the same city, and we wanted your invitation to be among the first to go out.`
      : `In the summer of 2024, you joined the live stream of the first joint conference &mdash; present in every way that mattered. The second gathering is set for August 15 and 16, and we are beginning our invitations with the people who were there for the first.`)
    : returning2024 === "attempted"
    ? `In 2024, you began a registration for the first joint conference, and your name has been on our list since. The second conference is set for August 15 and 16, and this letter is your invitation to complete what you started.`
    : `In 2024, you registered for the first joint conference, though your registration was never completed. The second conference is set for August 15 and 16, and this letter is your invitation to finish what you began.`;
  const dropCap = opening.charAt(0);
  const openingRest = opening.slice(1);
  const memoryLine = paid
    ? (inPerson
      ? `It was the handshakes and the hallway conversations, as much as the sessions, that made the first one what it was.`
      : `You were with us through the screen last time; we would be glad to finally shake your hand in Chicago &mdash; and the live stream will be there for you either way.`)
    : "";
  const languagesLine = languagesWorthNaming(primaryLanguages)
    ? `The work you carry between your languages &mdash; ${escapeHtml((primaryLanguages || "").trim())} &mdash; is precisely the work those standards were written to protect.`
    : "";

  const notePersonal = (inviteMessage || "").trim();
  const noteBlock = notePersonal ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px 0;">
        <tr>
          <td style="width:3px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td>
          <td style="padding:2px 0 2px 20px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15.5px;line-height:1.8;color:#284752;">${escapeHtml(notePersonal)}</p>
          </td>
        </tr>
      </table>` : "";

  const ratePanel = hasDiscount ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px 0;">
        <tr><td bgcolor="#FBF4E2" style="background-color:#FBF4E2;border:1px solid #EAD9AE;border-radius:10px;padding:20px 18px;text-align:center;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;padding-bottom:8px;">Your reunion rate</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.25;color:#3C2E10;">${discountPercent}% off your registration</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13.5px;line-height:1.6;color:#6B5A33;padding:8px 6px 0 6px;">In the room in Chicago or on the live stream &mdash; because your name was on the 2024 list. Applied automatically at checkout.</div>
        </td></tr>
      </table>` : "";

  const codeBlock = (personalCode && hasDiscount) ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
        <tr><td style="border:1px dashed #D9C690;border-radius:10px;padding:14px 18px;background-color:#FCFAF4;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:bold;">Your personal code</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:1px;color:${INK};font-weight:bold;padding:3px 0 5px 0;">${escapeHtml(personalCode)}</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6;color:${SOFT};">It is already built into your button above, so there is nothing to enter. Prefer to look around first? Register anytime on <a href="${mainSiteUrl}" style="color:${LINK};text-decoration:none;">our main site</a> with this code for the same ${discountPercent}% off. It is personal to you, so please keep it to yourself.</div>
        </td></tr>
      </table>` : "";

  const sig = (img: string, name: string, title: string) => `
        <img src="${base}/sig/${img}" alt="${escapeHtml(name)}" height="40" style="height:40px;width:auto;display:block;margin:0 0 4px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:140px;height:1px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${INK};font-weight:bold;padding-top:8px;">${escapeHtml(name)}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${SOFT};padding-top:2px;">${escapeHtml(title)}</div>`;

  const p = (html: string, mb = 18) =>
    `<p style="margin:0 0 ${mb}px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">${html}</p>`;

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>An Invitation to Return &middot; 2026 Lurie Children&rsquo;s &amp; AALB Conference</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;}
  a{color:${LINK};}
  @media only screen and (max-width:600px){
    .sl-card{width:100%!important;}
    .sl-body{padding:32px 24px 30px 24px!important;}
    .sl-head{padding:36px 22px 30px 22px!important;}
    .sl-foot{padding:24px 22px!important;}
    .sl-display{font-size:25px!important;line-height:31px!important;}
    .sl-seal{width:96px!important;height:96px!important;}
    .sl-dropcap{font-size:46px!important;line-height:36px!important;}
    .sl-cta{display:block!important;width:100%!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#ECE6D7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ECE6D7;">${preheader}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ECE6D7;background-image:linear-gradient(180deg,#F0EBDD 0%,#E6DECB 100%);">
<tr><td align="center" style="padding:34px 14px 44px 14px;">

  <table role="presentation" class="sl-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#FBF8F1;border:1px solid #E4DAC4;box-shadow:0 18px 48px rgba(12,59,75,0.18);">

    <tr><td align="center" bgcolor="${TEAL_DEEP}" class="sl-head" style="background-color:${TEAL_DEEP};background-image:linear-gradient(160deg,${TEAL} 0%,${TEAL_DEEP} 100%);padding:22px 40px 20px 40px;">
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;letter-spacing:4px;text-transform:uppercase;color:${GOLD_SOFT};font-weight:bold;">Lurie Children&rsquo;s &middot; AALB</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding-top:6px;">${eyebrowLine} &middot; August 15&ndash;16, 2026 &middot; Chicago</div>
    </td></tr>

    <tr><td style="height:3px;line-height:3px;font-size:0;background-color:${GOLD};background-image:linear-gradient(90deg,#9C7A2E 0%,#F4E9CD 50%,#9C7A2E 100%);">&nbsp;</td></tr>

    <tr><td class="sl-body" style="padding:34px 52px 36px 52px;background-color:#FBF8F1;">
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${SOFT};">${escapeHtml(today)}</div>
      <div style="height:18px;line-height:18px;font-size:0;">&nbsp;</div>

      ${p(`Dear ${escapeHtml(first)},`)}

      <p style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">
        <span class="sl-dropcap" style="float:left;font-family:Georgia,'Times New Roman',serif;font-size:54px;line-height:42px;color:${TEAL};padding:6px 11px 0 0;">${escapeHtml(dropCap)}</span>${openingRest}
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 24px 0;">
        <tr><td align="center">
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:4px;"><tr>
            <td align="center" bgcolor="${TEAL}" style="background-color:${TEAL};border-radius:9px;">
              <a href="${url}" style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:9px;">${paid ? "Reserve my seat again" : "Claim my seat"} &nbsp;&rarr;</a>
            </td>
          </tr></table>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6;color:${SOFT};padding:8px 4px 0 4px;">${hasDiscount ? `Your ${discountPercent}% rate is applied automatically &mdash; ` : ""}in person in Chicago or live online.</div>
        </td></tr>
      </table>

      ${memoryLine ? p(memoryLine) : ""}

      ${communityPhoto(url, base)}

      ${p(`On <strong>August 15 and 16, 2026</strong>, Lurie Children&rsquo;s and AALB convene their second joint conference &mdash; at the hospital in downtown Chicago, with a full live virtual stream. <strong>Elizabeth Even of The Joint Commission</strong>, whose standards nearly every hospital in America must meet, gives the keynote; <strong>Michael Mul&eacute;</strong>, who led language-access enforcement at the U.S. Department of Justice, speaks alongside her. <em>The people who write the standards, and the people who enforce them.</em> This year&rsquo;s theme: <span style="font-style:italic;color:${TEAL};">True Language Access: Yesterday, Today, and Tomorrow.</span>`)}

      ${languagesLine ? p(languagesLine) : ""}

      ${noteBlock}

      ${keynoteSpotlight(url, base)}

      ${ratePanel}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 22px 0;">
        <tr><td align="center">
          <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="${TEAL}" style="background-color:${TEAL};border-radius:9px;">
              <a href="${url}" style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:9px;">${paid ? "Reserve my seat again" : "Claim my seat"} &nbsp;&rarr;</a>
            </td>
          </tr></table>
          <!--[if mso]></td><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="#FBF8F1" style="background-color:#FBF8F1;border:1.5px solid ${GOLD};border-radius:9px;">
              <a href="${site}" style="display:inline-block;padding:13.5px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:${TEAL};text-decoration:none;border-radius:9px;">See the full program</a>
            </td>
          </tr></table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td></tr>
      </table>

      ${codeBlock}

      ${p(paid
        ? `We would be glad to have you with us again. If any question stands between you and August, reply to this letter; it reaches the three of us, not a machine.`
        : `The program, your rate, and your personal code are ready whenever you are. If any question stands between you and August, reply to this letter; it reaches the three of us, not a machine.`, 22)}

      <div style="font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};padding-bottom:16px;">Until August,</div>

      ${sig("kevin.png", "Kevin Thakkar", "Founder & Executive Director, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("iris.png", "Iris Laffitte", "Operations Manager, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("zachary.png", "Zachary Paul Romansky", "Lurie Children’s Language Services Department")}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0 0;border-top:1px solid #ECE3D0;">
        <tr><td align="center" style="padding:24px 0 4px 0;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#9A8B6A;padding-bottom:16px;">Presented Jointly By</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/aalb.png" alt="Americans Against Language Barriers" height="40" style="height:40px;width:auto;display:block;"></td>
            <td style="border-left:1px solid #E0D5BD;width:1px;font-size:0;">&nbsp;</td>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/lurie.png" alt="Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago" height="34" style="height:34px;width:auto;display:block;"></td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td class="sl-foot" align="center" bgcolor="${TEAL_DEEP}" style="background-color:${TEAL_DEEP};background-image:linear-gradient(180deg,${TEAL_DEEP} 0%,#0A3340 100%);padding:26px 40px 28px 40px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.5px;color:${GOLD_SOFT};">2026 Lurie Children&rsquo;s &amp; AALB Conference</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;padding-top:8px;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;">conference.aalb.org &middot; contact@aalb.org</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:0.5px;color:#5F7E86;padding-top:8px;">501(c)(3) &middot; EINs 83-3016421 and 36-2170833</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:10px;">You are receiving this because you registered your interest in the 2024 conference. ${unsubscribeUrl ? `Prefer not to hear from us? <a href="${unsubscribeUrl}" style="color:#9FB6BC;text-decoration:underline;">Unsubscribe</a>.` : "If you would rather not hear from us, just reply and let us know."}</div>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
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
  const amountLine = finalPriceCents == null
    ? null
    : finalPriceCents === 0
    ? "Complimentary"
    : `$${(finalPriceCents / 100).toFixed(2)} paid`;
  return shell(`
    <h1 style="font-size:24px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.01em;">You&rsquo;re in, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.65;color:${TEXT};margin:0 0 14px 0;">
      Thank you for confirming. Your spot at the 2026 Lurie Children&rsquo;s and AALB Conference is reserved.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:14px 0;border-collapse:separate;">
      <tr><td style="background:#f8fafc;border-left:3px solid ${TEAL};padding:14px 18px;border-radius:6px;">
        <div style="font-size:13px;color:${MUTED};">${escapeHtml(modeLabel)}</div>
        ${amountLine ? `<div style="font-size:20px;font-weight:700;color:${TEXT};margin-top:4px;">${amountLine}</div>` : ""}
        <div style="font-size:13px;color:${MUTED};margin-top:6px;">August 15 &amp; 16, 2026 &middot; Chicago</div>
      </td></tr>
    </table>
    ${button(url, "View my registration")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      We&rsquo;ll be in touch closer to the date with the full agenda and arrival details.
    </p>
  `);
}

// Sends an attendee their personal portal link (where they find their
// registration, and for virtual attendees their join link closer to the date).
export function attendeePortalLinkEmail({
  firstName, portalUrl, attendanceMode, assetBase,
}: {
  firstName: string;
  portalUrl: string;
  attendanceMode: string | null;
  assetBase?: string;
}) {
  const first = firstName || "there";
  const isVirtual = attendanceMode === "virtual";
  return shell(`
    ${heroBanner()}
    <h1 style="font-size:23px;font-weight:700;margin:0 0 14px 0;letter-spacing:-0.01em;">Your conference portal, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      Here&rsquo;s your personal link for the 2026 Lurie Children&rsquo;s &amp; AALB Conference. Bookmark it: it&rsquo;s where you&rsquo;ll find your registration, add the dates to your calendar${isVirtual ? ", and get your live join link closer to the event" : ", and see arrival details"}.
    </p>
    ${button(portalUrl, "Open my portal")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      Questions? Just reply to this email and we&rsquo;ll help.
    </p>
    ${signOff()}
    ${logoLockup(assetBase)}
  `);
}

// A general broadcast to attendees. The admin writes the body (plain text); the
// caller escapes it and converts newlines, then passes it as bodyHtml here.
export function attendeeBroadcastEmail({
  firstName, bodyHtml, ctaUrl, ctaLabel, assetBase,
}: {
  firstName: string;
  bodyHtml: string;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  assetBase?: string;
}) {
  const first = firstName || "there";
  return shell(`
    ${heroBanner()}
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">Hi ${escapeHtml(first)},</p>
    <div style="font-size:15px;line-height:1.7;color:${TEXT};">${bodyHtml}</div>
    ${ctaUrl ? button(ctaUrl, ctaLabel || "Open") : ""}
    ${signOff()}
    ${logoLockup(assetBase)}
  `);
}

type SponsorInviteArgs = {
  contactFirstName: string;
  companyName: string;
  suggestedTier: { name: string; amountLabel: string; ticketsIncluded: number; tagline: string } | null;
  inviteMessage: string | null;
  landingUrl: string;
  assetBase?: string;
  compExhibitor?: boolean;
  isPartner?: boolean;
  // The tier was agreed over email beforehand (invite-only tiers like the
  // Welcome Kit options): frame the email as confirming the arrangement, not
  // pitching levels. Requires suggestedTier.
  arranged?: boolean;
  // One-click unsubscribe URL for this recipient (CAN-SPAM footer link).
  unsubscribeUrl?: string;
};

export function sponsorInviteEmail({
  contactFirstName, companyName, suggestedTier, inviteMessage, landingUrl, assetBase, compExhibitor = false, isPartner = false, arranged = false, unsubscribeUrl,
}: SponsorInviteArgs) {
  const postalAddress = process.env.MAIL_POSTAL_ADDRESS?.trim() || "Americans Against Language Barriers, Chicago, IL";
  const first = contactFirstName || "there";
  const site = assetBase || "https://conference.aalb.org";
  const ctaLabel = compExhibitor ? "Claim your table" : arranged ? "Confirm &amp; complete payment" : "See sponsorship levels";
  const ticketsClause = (n: number) => (n > 0 ? `, ${n} ticket${n === 1 ? "" : "s"} included` : "");
  const tierLine = compExhibitor
    ? `Your exhibitor table is on us, there is nothing to pay. Just confirm a couple of details and you&rsquo;re all set.`
    : arranged && suggestedTier
    ? `As we discussed, we have set aside the <strong>${escapeHtml(suggestedTier.name)}</strong> option (${escapeHtml(suggestedTier.amountLabel)}) for ${escapeHtml(companyName)}. The button below takes you straight to it to confirm and complete payment, and our team will coordinate the details with you from there.`
    : suggestedTier
    ? `We thought the <strong>${escapeHtml(suggestedTier.name)}</strong> level (${escapeHtml(suggestedTier.amountLabel)}${ticketsClause(suggestedTier.ticketsIncluded)}) might be a natural fit, but please choose whichever works best for ${escapeHtml(companyName)}.`
    : "";
  const compCallout = compExhibitor
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0 0;"><tr><td style="background:#f7f3ea;border-left:3px solid ${GOLD};padding:16px 18px;border-radius:6px;">
        <div style="font-size:11px;letter-spacing:0.14em;font-weight:700;color:${GOLD};text-transform:uppercase;">Our gift to you</div>
        <div style="font-size:15px;line-height:1.6;color:${TEXT};margin-top:5px;">We&rsquo;d like to offer <strong>${escapeHtml(companyName)}</strong> a <strong>complimentary exhibitor table</strong>, at no charge. Claim it below and tell us who will staff it.</div>
      </td></tr></table>`
    : "";
  const speakerCells = SPEAKERS.map((s) => `<td width="50%" style="vertical-align:top;padding:7px 10px 7px 0;">
        <div style="border-left:2px solid ${GOLD};padding-left:11px;">
          <div style="font-size:14px;font-weight:700;color:${TEXT};line-height:1.3;">${escapeHtml(s.name)}${s.credentials ? `<span style="color:${MUTED};font-weight:600;">, ${escapeHtml(s.credentials)}</span>` : ""}</div>
          <div style="font-size:12.5px;font-weight:600;color:${TEAL};line-height:1.4;margin-top:2px;">${escapeHtml(s.title)}</div>
          <div style="font-size:12.5px;color:${MUTED};line-height:1.4;">${escapeHtml(s.org)}</div>
        </div>
      </td>`);
  let speakerRows = "";
  for (let i = 0; i < speakerCells.length; i += 2) {
    speakerRows += `<tr>${speakerCells[i]}${speakerCells[i + 1] || `<td width="50%"></td>`}</tr>`;
  }
  const preheader = compExhibitor
    ? `A complimentary exhibitor table for ${escapeHtml(companyName)} at the 2026 Lurie Children's & AALB Conference, August 15 and 16 in Chicago.`
    : arranged && suggestedTier
    ? `Confirming ${escapeHtml(companyName)}'s ${escapeHtml(suggestedTier.name)} sponsorship of the 2026 Lurie Children's & AALB Conference, as discussed.`
    : `An invitation for ${escapeHtml(companyName)} to sponsor the 2026 Lurie Children's & AALB Conference, August 15 and 16 in Chicago.`;
  return shell(`
    ${heroBanner()}
    <h1 style="font-size:22px;font-weight:700;margin:0 0 14px 0;letter-spacing:-0.01em;">Hi ${escapeHtml(first)},</h1>
    ${isPartner ? `<div style="display:inline-block;font-size:11px;letter-spacing:0.12em;font-weight:700;color:${TEAL};background:#e6eef0;border:1px solid #cfe0e4;border-radius:999px;padding:5px 13px;margin:0 0 14px 0;text-transform:uppercase;">Official AALB Partner</div><br>` : ""}
    ${inviteMessage
      ? `<p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">${escapeHtml(inviteMessage).replace(/\n/g, "<br>")}</p>`
      : `<p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">We would be honored to have <strong>${escapeHtml(companyName)}</strong> stand with us as a sponsor or exhibitor at the 2nd Joint Conference of Lurie Children&rsquo;s and AALB, two days devoted to language access in American healthcare.</p>`}
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 16px 0;">
      The conference is <strong>August 15 and 16, 2026</strong> in Chicago. This year&rsquo;s theme is <em>True Language Access: Yesterday, Today, and Tomorrow</em>. You can see the full program, venue, and details at <a href="${site}" style="color:${BLUE};font-weight:600;text-decoration:none;">conference.aalb.org</a>.
    </p>
    ${compCallout}

    ${keynoteSpotlight(site, site)}

    ${sectionHeading("Featured Speakers")}
    <p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 12px 0;">You&rsquo;d be joining a program that already features:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${speakerRows}</table>
    <p style="font-size:13.5px;line-height:1.6;margin:14px 0 0 0;"><a href="${site}/#speakers" style="color:${BLUE};font-weight:600;text-decoration:none;">See the full lineup at conference.aalb.org &rarr;</a></p>

    ${sectionHeading("The Room Your Brand Reaches")}
    ${communityPhoto(site, site)}

    ${tierLine ? `<p style="font-size:14.5px;line-height:1.7;color:${TEXT};margin:20px 0 0 0;">${tierLine}</p>` : `<div style="height:8px;line-height:8px;">&nbsp;</div>`}

    ${button(landingUrl, ctaLabel)}

    <p style="font-size:14.5px;line-height:1.7;color:${TEXT};margin:16px 0 0 0;">
      If you have any questions or want to talk it through, just reply to this email and it reaches our team directly. We&rsquo;d be glad to find a fit that works for ${escapeHtml(companyName)}.
    </p>

    ${signOff()}

    ${logoLockup(assetBase)}

    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;padding-top:14px;border-top:1px solid #eef1f4;">
      Sponsorships may be tax-deductible depending on the benefits received, so please consult your tax advisor. If this is the wrong contact at ${escapeHtml(companyName)}, please forward this along or simply reply.
    </p>
    <p style="font-size:12px;line-height:1.6;color:${MUTED};margin:10px 0 0 0;">
      ${escapeHtml(postalAddress)}.${unsubscribeUrl ? ` You received this invitation to sponsor the conference. <a href="${unsubscribeUrl}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>.` : ""}
    </p>
  `, preheader);
}

type SponsorLetterArgs = {
  contactName: string;
  // A formal address line, e.g. "Mr. Vargas". Falls back to the first name.
  salutation?: string | null;
  recipientTitle?: string | null;
  companyName: string;
  // The personalized paragraph(s), shown as a gold-ruled pull-quote. Blank
  // lines split into separate paragraphs. This is the per-org inviteMessage;
  // without one, a sincere sponsor-appropriate default is used.
  reason?: string | null;
  // Sponsor funnel link (the "Become a Sponsor" button).
  landingUrl: string;
  // Conference home (the "Explore the Conference" button). Defaults to the root.
  learnMoreUrl?: string;
  // When set, renders the "personal courtesy" discount panel (e.g. 20).
  discountPercent?: number | null;
  // Acknowledge an existing official AALB partner (e.g. AMN) with a partner mark.
  isPartner?: boolean;
  // One-click unsubscribe URL for this recipient. Renders the footer
  // unsubscribe link required for CAN-SPAM and good deliverability.
  unsubscribeUrl?: string;
  // Pre-formatted date string (e.g. "June 27, 2026"); computed by the caller.
  dateLabel: string;
  assetBase?: string;
};

// A formal, founder-signed letter for marquee sponsor prospects, set like an
// engraved invitation: deep-teal letterhead with a gold "2026" seal, an
// engraved drop cap, a gold-ruled pull-quote for the personal paragraph, and
// real ink-cursive signatures (rendered as images in /public/sig so the script
// shows in every client, with the printed name + title beneath as the fallback
// when images are blocked). Self-contained and responsive, with solid colors
// under every gradient and a VML seal so it degrades gracefully in Outlook.
// Use for the handful of strategic targets; use sponsorInviteEmail() for bulk.
export function sponsorLetterEmail({
  contactName, salutation, recipientTitle, companyName, reason, landingUrl, learnMoreUrl, discountPercent, isPartner = false, unsubscribeUrl, dateLabel, assetBase,
}: SponsorLetterArgs) {
  const postalAddress = process.env.MAIL_POSTAL_ADDRESS?.trim() || "Americans Against Language Barriers, Chicago, IL";
  const TEAL_DEEP = "#0C3B4B", INK = "#0B1F25", SOFT = "#5A6E76", GOLD_SOFT = "#F4E9CD", LINK = "#1E6FA2";
  const base = (assetBase || ASSET_BASE).replace(/\/$/, "");
  const site = learnMoreUrl || base;
  // Greeting: a person's first name when we have one, otherwise the full
  // organization name (sans a trailing "(ABBR)"), so org-only sends read
  // "Dear American Society for Deaf Children:" and never "Dear American:".
  const cn = (contactName || "").trim();
  const isPerson = !!cn && cn.toLowerCase() !== companyName.trim().toLowerCase();
  const honorific = /^(dr|mr|mrs|ms|prof|rev|hon|sr|fr)\.?$/i;
  const firstNameOf = (n: string) => {
    // "Dr. Fornessa T. Randal, Executive Director" -> "Fornessa";
    // "John Quattrocchi, President & Co-Owner" -> "John".
    const toks = n.replace(/,.*$/, "").trim().split(/\s+/);
    return honorific.test(toks[0]) ? (toks[1] || toks[0]) : toks[0];
  };
  const greeting = (salutation || "").trim()
    || (isPerson ? firstNameOf(cn) : companyName.replace(/\s*\([^)]*\)\s*$/, "").trim())
    || "there";
  // Drop a note's trailing "We'd love to have you…" sentence so the personal
  // paragraph doesn't duplicate the letter's own closing invitation.
  const trimClose = (t: string) =>
    t.replace(/\s*(?:We(?:’|')?d|We would)\s+(?:love|be glad|be honored|be delighted|be grateful|welcome)\b[^.?!]*[.?!]\s*$/i, "").trim();
  const reasonRaw = (reason || "").trim();
  const reasonParas = reasonRaw
    ? trimClose(reasonRaw).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    : ["We write to you because few organizations commit so fully to this work, and your support would place that commitment in front of the very audience carrying the field forward."];
  const sig = (img: string, name: string, title: string) => `
        <img src="${base}/sig/${img}" alt="${escapeHtml(name)}" height="40" style="height:40px;width:auto;display:block;margin:0 0 4px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:140px;height:1px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${INK};font-weight:bold;padding-top:8px;">${escapeHtml(name)}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${SOFT};padding-top:2px;">${escapeHtml(title)}</div>`;
  const discountBlock = discountPercent ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px 0;">
        <tr><td bgcolor="#FBF4E2" style="background-color:#FBF4E2;border:1px solid #EAD9AE;border-radius:10px;padding:16px 20px;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;padding-bottom:6px;">A personal courtesy</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:14.5px;line-height:1.7;color:#3C2E10;">As one of a small number of organizations we are inviting directly, we are pleased to extend <strong>${discountPercent}% off any level</strong>, sponsorship or exhibitor table alike. It is applied automatically when you sponsor through the button below.</div>
        </td></tr>
      </table>` : "";
  const p = (html: string, mb = 18) =>
    `<p style="margin:0 0 ${mb}px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">${html}</p>`;

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>An Invitation &middot; 2026 Lurie Children&rsquo;s &amp; AALB Conference</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;}
  a{color:${LINK};}
  @media only screen and (max-width:600px){
    .sl-card{width:100%!important;}
    .sl-body{padding:32px 24px 30px 24px!important;}
    .sl-head{padding:36px 22px 30px 22px!important;}
    .sl-foot{padding:24px 22px!important;}
    .sl-display{font-size:25px!important;line-height:31px!important;}
    .sl-seal{width:96px!important;height:96px!important;}
    .sl-dropcap{font-size:46px!important;line-height:36px!important;}
    .sl-cta{display:block!important;width:100%!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#ECE6D7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ECE6D7;">An invitation to stand with us as a sponsor of the Second Joint Conference on language access in American healthcare, August 15 and 16, 2026, in Chicago.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ECE6D7;background-image:linear-gradient(180deg,#F0EBDD 0%,#E6DECB 100%);">
<tr><td align="center" style="padding:34px 14px 44px 14px;">

  <table role="presentation" class="sl-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#FBF8F1;border:1px solid #E4DAC4;box-shadow:0 18px 48px rgba(12,59,75,0.18);">

    <tr><td align="center" bgcolor="${TEAL_DEEP}" class="sl-head" style="background-color:${TEAL_DEEP};background-image:linear-gradient(160deg,${TEAL} 0%,${TEAL_DEEP} 100%);padding:44px 40px 34px 40px;">
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;letter-spacing:4px;text-transform:uppercase;color:${GOLD_SOFT};font-weight:bold;">Lurie Children&rsquo;s &middot; AALB</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding-top:6px;">An Invitation to Sponsor</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:8px;line-height:10px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};font-weight:bold;padding:22px 0 8px 0;">&middot;&nbsp;Second Joint Conference&nbsp;&middot;</div>

      <!--[if !mso]><!-->
      <div class="sl-seal" style="width:116px;height:116px;border-radius:50%;background-color:${GOLD};background-image:linear-gradient(135deg,#F4E9CD 0%,#D9B863 28%,#C9A14B 52%,#9C7A2E 78%,#E7D5A4 100%);border:2px solid #F4E9CD;box-shadow:0 6px 16px rgba(0,0,0,0.30),inset 0 1px 2px rgba(255,255,255,0.55);display:inline-block;">
        <table role="presentation" width="116" height="116" cellpadding="0" cellspacing="0" border="0" style="width:116px;height:116px;"><tr><td align="center" valign="middle" style="text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:30px;color:#3C2E10;font-weight:bold;letter-spacing:1px;">2026</div>
        </td></tr></table>
      </div>
      <!--<![endif]-->
      <!--[if mso]>
      <v:oval fill="true" stroke="true" strokecolor="#F4E9CD" strokeweight="2px" style="width:116px;height:116px;">
        <v:fill type="solid" color="#C9A14B"/>
        <v:textbox inset="0,0,0,0"><center><div style="font-family:Georgia,serif;font-size:30px;color:#3C2E10;font-weight:bold;">2026</div></center></v:textbox>
      </v:oval>
      <![endif]-->

      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:13px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};padding:10px 0 0 0;">True Language Access</div>
      <div class="sl-display" style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:38px;color:#FFFFFF;padding:18px 0 0 0;">The Second Joint Conference</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;line-height:22px;color:#A9C6CD;padding:7px 0 0 0;">on Language Access in American Healthcare</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding:14px 0 0 0;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
    </td></tr>

    <tr><td style="height:3px;line-height:3px;font-size:0;background-color:${GOLD};background-image:linear-gradient(90deg,#9C7A2E 0%,#F4E9CD 50%,#9C7A2E 100%);">&nbsp;</td></tr>

    <tr><td class="sl-body" style="padding:40px 52px 36px 52px;background-color:#FBF8F1;">
      ${isPartner ? `<div style="margin:0 0 18px 0;"><span style="display:inline-block;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;color:${TEAL};background:#EAF1F2;border:1px solid #CFE0E4;border-radius:999px;padding:6px 14px;">Our Official Partner</span></div>` : ""}
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${SOFT};">${escapeHtml(dateLabel)}</div>

      <div style="padding:20px 0 18px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.4;color:${INK};font-weight:bold;">${escapeHtml(contactName)}</div>
        ${recipientTitle ? `<div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;line-height:1.5;color:${SOFT};padding-top:2px;">${escapeHtml(recipientTitle)}</div>` : ""}
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.5;color:${SOFT};padding-top:2px;">${escapeHtml(companyName)}</div>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:46px;height:2px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
      <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>

      ${p(`Dear ${escapeHtml(greeting)}:`)}

      <p style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">
        <span class="sl-dropcap" style="float:left;font-family:Georgia,'Times New Roman',serif;font-size:54px;line-height:42px;color:${TEAL};padding:6px 11px 0 0;">O</span>n behalf of Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers, it is our privilege to invite <strong>${escapeHtml(companyName)}</strong> to stand with us as a sponsor of our Second Joint Conference on language access in American healthcare, August 15 and 16, 2026, in Chicago.
      </p>

      ${p(`Over two days, the conference brings together interpreters, clinicians, researchers, educators, and patient advocates from across the country, in person at Lurie Children&rsquo;s and streamed to a national virtual audience, under a single theme: <span style="font-style:italic;color:${TEAL};">True Language Access: Yesterday, Today, and Tomorrow.</span>`)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px 0;">
        <tr>
          <td style="width:3px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td>
          <td style="padding:2px 0 2px 20px;">
            ${reasonParas.map((para, i) => `<p style="margin:0 0 ${i === reasonParas.length - 1 ? 0 : 12}px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15.5px;line-height:1.8;color:#284752;">${escapeHtml(para)}</p>`).join("")}
          </td>
        </tr>
      </table>

      ${p(`Americans Against Language Barriers has trained roughly three thousand medical interpreters nationwide, and Lurie Children&rsquo;s, one of the nation&rsquo;s leading children&rsquo;s hospitals, cares for families across Chicago in dozens of languages every day. Together we present this conference, and your support may be tax-deductible. To learn more or to confirm, the links below will take you there, or simply reply, and it reaches us directly at <a href="mailto:kevin@aalb.org" style="color:${LINK};text-decoration:none;">kevin@aalb.org</a>.`, 22)}

      ${keynoteSpotlight(site, base)}

      ${discountBlock}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 28px 0;">
        <tr><td align="center">
          <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="${TEAL}" style="background-color:${TEAL};border-radius:9px;">
              <a href="${landingUrl}" style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:9px;">Become a Sponsor &nbsp;&rarr;</a>
            </td>
          </tr></table>
          <!--[if mso]></td><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="#FBF8F1" style="background-color:#FBF8F1;border:1.5px solid ${GOLD};border-radius:9px;">
              <a href="${site}" style="display:inline-block;padding:13.5px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:${TEAL};text-decoration:none;border-radius:9px;">Explore the Conference</a>
            </td>
          </tr></table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td></tr>
      </table>

      <div style="font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};padding-bottom:16px;">With deep respect,</div>

      ${sig("kevin.png", "Kevin Thakkar", "Founder & Executive Director, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("iris.png", "Iris Laffitte", "Operations Manager, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("zachary.png", "Zachary Paul Romansky", "Lurie Children’s Language Services Department")}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0 0;border-top:1px solid #ECE3D0;">
        <tr><td align="center" style="padding:24px 0 4px 0;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#9A8B6A;padding-bottom:16px;">Presented Jointly By</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/aalb.png" alt="Americans Against Language Barriers" height="40" style="height:40px;width:auto;display:block;"></td>
            <td style="border-left:1px solid #E0D5BD;width:1px;font-size:0;">&nbsp;</td>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/lurie.png" alt="Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago" height="34" style="height:34px;width:auto;display:block;"></td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td class="sl-foot" align="center" bgcolor="${TEAL_DEEP}" style="background-color:${TEAL_DEEP};background-image:linear-gradient(180deg,${TEAL_DEEP} 0%,#0A3340 100%);padding:26px 40px 28px 40px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.5px;color:${GOLD_SOFT};">2026 Lurie Children&rsquo;s &amp; AALB Conference</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;padding-top:8px;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;">conference.aalb.org &middot; contact@aalb.org</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:0.5px;color:#5F7E86;padding-top:8px;">501(c)(3) &middot; EINs 83-3016421 and 36-2170833</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:10px;">${escapeHtml(postalAddress)}</div>
      ${unsubscribeUrl ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:4px;">You received this invitation to sponsor the conference. <a href="${unsubscribeUrl}" style="color:#9FB6BC;text-decoration:underline;">Unsubscribe</a>.</div>` : ""}
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

type SponsorFoodLetterArgs = {
  contactName: string;
  companyName: string;
  // A personalized line about this restaurant (cuisine, story, specialty).
  note?: string | null;
  // The self-serve pledge funnel (primary CTA). When set, the button invites
  // them to pledge food and become a tracked Food Sponsor in one step.
  pledgeUrl?: string;
  // Conference home, for the secondary "see the conference" link.
  learnMoreUrl?: string;
  // One-click unsubscribe URL (deliverability / CAN-SPAM).
  unsubscribeUrl?: string;
  assetBase?: string;
};

// The in-kind INVITE (food & ASL), set in the same engraved gold-foil style as
// the in-kind acceptance letter and the marquee sponsor letter: deep-teal
// letterhead with a gold "2026" seal, an engraved drop cap, the personalized
// note as a gold-ruled pull-quote, gold-bulleted recognition, and real cursive
// signatures. Leads with the invitation, carries the mission and the in-kind
// ask, and offers the self-serve pledge funnel (or a "see the conference"
// fallback). Kind-parameterized so food and ASL share one shell. No em dashes;
// both host institutions named. sponsorFoodLetterEmail / sponsorAslLetterEmail
// stay as thin wrappers so the send routes are unchanged.
function engravedInKindInvite(kind: "food" | "asl", {
  contactName, companyName, note, pledgeUrl, learnMoreUrl, unsubscribeUrl, assetBase,
}: SponsorFoodLetterArgs) {
  const postalAddress = process.env.MAIL_POSTAL_ADDRESS?.trim() || "Americans Against Language Barriers, Chicago, IL";
  const TEAL_DEEP = "#0C3B4B", INK = "#0B1F25", SOFT = "#5A6E76", GOLD_SOFT = "#F4E9CD", LINK = "#1E6FA2";
  const base = (assetBase || ASSET_BASE).replace(/\/$/, "");
  const site = (learnMoreUrl || base).replace(/\/$/, "");
  const isAsl = kind === "asl";
  const sponsorLabel = isAsl ? "ASL Interpreter Sponsor" : "Food Sponsor";

  const cn = (contactName || "").trim();
  const isPerson = !!cn && cn.toLowerCase() !== companyName.trim().toLowerCase();
  const honorific = /^(dr|mr|mrs|ms|prof|rev|hon|sr|fr|chef)\.?$/i;
  const firstNameOf = (n: string) => { const t = n.replace(/,.*$/, "").trim().split(/\s+/); return honorific.test(t[0]) ? (t[1] || t[0]) : t[0]; };
  const greeting = (isPerson ? firstNameOf(cn) : companyName.replace(/\s*\([^)]*\)\s*$/, "").trim()) || "there";

  // Kind-specific copy.
  const inviteTail = isAsl
    ? `to help keep every session of our Second Joint Conference on language access in American healthcare, August 15 and 16, 2026, in Chicago, accessible in American Sign Language, as an <strong>ASL Interpreter Sponsor</strong>`
    : `to help feed our Second Joint Conference on language access in American healthcare, August 15 and 16, 2026, in Chicago, as a <strong>Food Sponsor</strong>`;
  const missionPara = isAsl
    ? `A conference about being heard has to include the people for whom American Sign Language is that voice. We are committed to interpreting our sessions in ASL so that Deaf and hard-of-hearing attendees are full participants, never an afterthought, and that commitment is only as real as the interpreters who make it happen.`
    : `We have kept every conference we host meat-free, and this one will be no different: every meal will be fully plant-based, with no meat served. It would ring hollow to spend two days insisting that no one should go unheard, and then serve animals who cannot speak for themselves at all. A fully meat-free conference of this size is only possible with Chicago kitchens like yours.`;
  const askPara = isAsl
    ? `We are expecting about seventy to eighty attendees in person, plus a virtual audience. What we are really hoping for is a donation of your interpreters&rsquo; time, ASL interpretation for a session, a day, or the full event. If donating the whole thing is not possible, there is an easy middle ground: you could donate some hours and let us cover the rest. Either way, your in-kind donation makes you an official ASL Interpreter Sponsor.`
    : `We are expecting about seventy to eighty attendees in person, plus a virtual audience, so even part of a meal goes a long way. What we are really hoping for is a donation of your food, a plant-based meal, or part of one. If donating the whole thing is not possible, there is an easy middle ground: you could donate part and let us purchase the rest. Either way, your in-kind donation makes you an official Food Sponsor.`;
  // Recognition mirrors the published tier benefits (sponsors.ts TIERS) so the
  // letter never promises more or less than the website and prospectus do.
  const recognitionItems = isAsl
    ? [
        "Your name and logo on the conference website",
        "Your name and logo on signage at the conference",
        "An honorable mention during opening remarks",
        "Social media thank-you posts",
        "One flyer or material of yours distributed to attendees",
        "Two complimentary conference tickets for your team",
      ]
    : [
        "Your name and logo on the conference website",
        "Your name and logo on signage at the conference",
        "An honorable mention at the opening and at the meal you provide, before a national audience of interpreters, clinicians, and advocates",
        "Two complimentary conference tickets for your team",
      ];
  // Careful, accurate tax language: the IRS does not allow a deduction for the
  // value of donated services, and a charity should describe (not value) an
  // in-kind gift in its acknowledgment.
  const taxLine = isAsl
    ? "Out-of-pocket costs connected to your donation may be tax-deductible (donated services themselves generally are not), and we will gladly provide a written acknowledgment describing your gift"
    : "A food donation from your business may be tax-deductible, and we will gladly provide a written acknowledgment describing your gift";
  const ctaLabel = isAsl ? "Sponsor ASL interpretation in kind" : "Sponsor our food in kind";
  const ctaHref = pledgeUrl || site;
  const noteLabel = isAsl ? "Why we thought of you" : "Why we thought of your kitchen";
  const footNote = isAsl
    ? "You received this invitation to provide ASL interpretation for the conference."
    : "You received this invitation to provide food for the conference.";

  // Engraved primitives, shared visual language with the acceptance letter.
  const p = (html: string, mb = 18) =>
    `<p style="margin:0 0 ${mb}px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">${html}</p>`;
  const sig = (img: string, name: string, title: string) => `
        <img src="${base}/sig/${img}" alt="${escapeHtml(name)}" height="40" style="height:40px;width:auto;display:block;margin:0 0 4px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:140px;height:1px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${INK};font-weight:bold;padding-top:8px;">${escapeHtml(name)}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${SOFT};padding-top:2px;">${escapeHtml(title)}</div>`;
  const goldList = (items: string[], color = INK) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 0 0;">
        ${items.map((t) => `<tr>
          <td valign="top" style="width:18px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:${GOLD};">&#8226;</td>
          <td valign="top" style="padding:3px 0;font-family:Georgia,'Times New Roman',serif;font-size:14.5px;line-height:1.7;color:${color};">${t}</td>
        </tr>`).join("")}
      </table>`;
  const eyebrow = (text: string) =>
    `<div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;margin:26px 0 12px 0;">${text}</div>`;

  const notePanel = (note && note.trim()) ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px 0;">
        <tr>
          <td style="width:3px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td>
          <td style="padding:2px 0 2px 20px;">
            <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;padding-bottom:8px;">${noteLabel}</div>
            ${escapeHtml(note.trim()).split(/\n\s*\n/).map((para, i, a) => `<p style="margin:0 0 ${i === a.length - 1 ? 0 : 12}px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15.5px;line-height:1.8;color:#284752;">${para.replace(/\n/g, "<br>")}</p>`).join("")}
          </td>
        </tr>
      </table>` : "";

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>An Invitation to be a ${escapeHtml(sponsorLabel)} &middot; 2026 Lurie Children&rsquo;s &amp; AALB Conference</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;}
  a{color:${LINK};}
  @media only screen and (max-width:600px){
    .sl-card{width:100%!important;}
    .sl-body{padding:32px 24px 30px 24px!important;}
    .sl-head{padding:36px 22px 30px 22px!important;}
    .sl-foot{padding:24px 22px!important;}
    .sl-display{font-size:25px!important;line-height:31px!important;}
    .sl-seal{width:96px!important;height:96px!important;}
    .sl-dropcap{font-size:46px!important;line-height:36px!important;}
    .sl-cta{display:block!important;width:100%!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#ECE6D7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ECE6D7;">An invitation for ${escapeHtml(companyName)} to stand with us as a ${escapeHtml(sponsorLabel)} of the Second Joint Conference on language access, August 15 and 16, 2026, in Chicago.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ECE6D7;background-image:linear-gradient(180deg,#F0EBDD 0%,#E6DECB 100%);">
<tr><td align="center" style="padding:34px 14px 44px 14px;">

  <table role="presentation" class="sl-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#FBF8F1;border:1px solid #E4DAC4;box-shadow:0 18px 48px rgba(12,59,75,0.18);">

    <tr><td align="center" bgcolor="${TEAL_DEEP}" class="sl-head" style="background-color:${TEAL_DEEP};background-image:linear-gradient(160deg,${TEAL} 0%,${TEAL_DEEP} 100%);padding:44px 40px 34px 40px;">
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;letter-spacing:4px;text-transform:uppercase;color:${GOLD_SOFT};font-weight:bold;">Lurie Children&rsquo;s &middot; AALB</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding-top:6px;">An Invitation to Sponsor</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:8px;line-height:10px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};font-weight:bold;padding:22px 0 8px 0;">&middot;&nbsp;Second Joint Conference&nbsp;&middot;</div>

      <!--[if !mso]><!-->
      <div class="sl-seal" style="width:116px;height:116px;border-radius:50%;background-color:${GOLD};background-image:linear-gradient(135deg,#F4E9CD 0%,#D9B863 28%,#C9A14B 52%,#9C7A2E 78%,#E7D5A4 100%);border:2px solid #F4E9CD;box-shadow:0 6px 16px rgba(0,0,0,0.30),inset 0 1px 2px rgba(255,255,255,0.55);display:inline-block;">
        <table role="presentation" width="116" height="116" cellpadding="0" cellspacing="0" border="0" style="width:116px;height:116px;"><tr><td align="center" valign="middle" style="text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:30px;color:#3C2E10;font-weight:bold;letter-spacing:1px;">2026</div>
        </td></tr></table>
      </div>
      <!--<![endif]-->
      <!--[if mso]>
      <v:oval fill="true" stroke="true" strokecolor="#F4E9CD" strokeweight="2px" style="width:116px;height:116px;">
        <v:fill type="solid" color="#C9A14B"/>
        <v:textbox inset="0,0,0,0"><center><div style="font-family:Georgia,serif;font-size:30px;color:#3C2E10;font-weight:bold;">2026</div></center></v:textbox>
      </v:oval>
      <![endif]-->

      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:13px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};padding:10px 0 0 0;">True Language Access</div>
      <div class="sl-display" style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:38px;color:#FFFFFF;padding:18px 0 0 0;">The Second Joint Conference</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;line-height:22px;color:#A9C6CD;padding:7px 0 0 0;">on Language Access in American Healthcare</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding:14px 0 0 0;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
    </td></tr>

    <tr><td style="height:3px;line-height:3px;font-size:0;background-color:${GOLD};background-image:linear-gradient(90deg,#9C7A2E 0%,#F4E9CD 50%,#9C7A2E 100%);">&nbsp;</td></tr>

    <tr><td class="sl-body" style="padding:40px 52px 36px 52px;background-color:#FBF8F1;">
      <div style="padding:0 0 18px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.4;color:${INK};font-weight:bold;">${escapeHtml(companyName)}</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;line-height:1.5;color:${SOFT};padding-top:2px;">Invited to be a ${escapeHtml(sponsorLabel)}</div>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:46px;height:2px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
      <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>

      ${p(`Dear ${escapeHtml(greeting)},`)}

      <p style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">
        <span class="sl-dropcap" style="float:left;font-family:Georgia,'Times New Roman',serif;font-size:54px;line-height:42px;color:${TEAL};padding:6px 11px 0 0;">O</span>n behalf of Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers, it is our privilege to invite <strong>${escapeHtml(companyName)}</strong> ${inviteTail}.
      </p>

      ${p(missionPara)}

      ${notePanel}

      ${eyebrow("The ask")}
      ${p(askPara, 22)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 28px 0;">
        <tr><td align="center">
          <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="${TEAL}" style="background-color:${TEAL};border-radius:9px;">
              <a href="${ctaHref}" style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:9px;">${ctaLabel} &nbsp;&rarr;</a>
            </td>
          </tr></table>
          <!--[if mso]></td><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="#FBF8F1" style="background-color:#FBF8F1;border:1.5px solid ${GOLD};border-radius:9px;">
              <a href="${site}" style="display:inline-block;padding:13.5px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:${TEAL};text-decoration:none;border-radius:9px;">See the conference</a>
            </td>
          </tr></table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td></tr>
      </table>

      ${eyebrow("Your recognition as a " + sponsorLabel)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px 0;">
        <tr><td bgcolor="#FBF4E2" style="background-color:#FBF4E2;border:1px solid #EAD9AE;border-radius:10px;padding:16px 20px;">
          ${goldList(recognitionItems, "#3C2E10")}
        </td></tr>
      </table>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.7;color:${SOFT};padding:0 0 6px 0;">${taxLine}. Please consult your tax advisor.</div>

      ${p(`The easiest next step is to tell us what you could provide. It takes a minute, it does not commit you to anything final, and it puts you on our ${sponsorLabel} list right away. Or simply reply, straight to us at <a href="mailto:kevin@aalb.org" style="color:${LINK};text-decoration:none;">kevin@aalb.org</a>, and we will sort out the details together.`, 22)}

      <div style="font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};padding-bottom:16px;">With gratitude,</div>

      ${sig("kevin.png", "Kevin Thakkar", "Founder & Executive Director, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("iris.png", "Iris Laffitte", "Operations Manager, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("zachary.png", "Zachary Paul Romansky", "Lurie Children’s Language Services Department")}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0 0;border-top:1px solid #ECE3D0;">
        <tr><td align="center" style="padding:24px 0 4px 0;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#9A8B6A;padding-bottom:16px;">Presented Jointly By</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/aalb.png" alt="Americans Against Language Barriers" height="40" style="height:40px;width:auto;display:block;"></td>
            <td style="border-left:1px solid #E0D5BD;width:1px;font-size:0;">&nbsp;</td>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/lurie.png" alt="Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago" height="34" style="height:34px;width:auto;display:block;"></td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td class="sl-foot" align="center" bgcolor="${TEAL_DEEP}" style="background-color:${TEAL_DEEP};background-image:linear-gradient(180deg,${TEAL_DEEP} 0%,#0A3340 100%);padding:26px 40px 28px 40px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.5px;color:${GOLD_SOFT};">2026 Lurie Children&rsquo;s &amp; AALB Conference</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;padding-top:8px;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;">conference.aalb.org &middot; contact@aalb.org</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:0.5px;color:#5F7E86;padding-top:8px;">501(c)(3) &middot; EINs 83-3016421 and 36-2170833</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:10px;">${escapeHtml(postalAddress)}</div>
      ${unsubscribeUrl ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:4px;">${footNote} <a href="${unsubscribeUrl}" style="color:#9FB6BC;text-decoration:underline;">Unsubscribe</a>.</div>` : ""}
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

// Engraved gold-foil invite to a vegan/vegetarian restaurant or caterer to
// provide a plant-based meal in kind as a Food Sponsor. Thin wrapper over
// engravedInKindInvite so the send routes are unchanged.
export function sponsorFoodLetterEmail(args: SponsorFoodLetterArgs) {
  return engravedInKindInvite("food", args);
}

// Engraved gold-foil invite to an ASL interpreting company to donate
// interpretation in kind as an ASL Interpreter Sponsor.
export function sponsorAslLetterEmail(args: SponsorFoodLetterArgs) {
  return engravedInKindInvite("asl", args);
}

type AmbassadorInviteArgs = {
  contactName: string;
  orgName: string;
  // The individually written paragraph about THEIR program. It opens the
  // letter, set in the same roman type as everything else — a decorated
  // quote box reads as mail-merge; a letter that simply starts with the
  // recipient does not.
  note?: string | null;
  // Their personal share code (e.g. GARCIA20) and the register link that
  // prefills it.
  code: string;
  shareUrl: string;
  learnMoreUrl?: string;
  unsubscribeUrl?: string;
  // Pre-formatted date string; computed by the caller.
  dateLabel: string;
  // Distance tier (see ambassadorRegion): "chicago" = their own city,
  // "midwest" = a short trip, "far" = the livestream leads.
  region?: "chicago" | "midwest" | "far";
  assetBase?: string;
};

// The engraved gold-foil letter for AMBASSADORS: educators, program
// directors, and association leaders we ask to share the conference with
// their students and members (not to sponsor it). Same visual language as
// the sponsor letters — teal letterhead, gold seal, serif drop cap — but the
// letter opens with the personalized paragraph about them, keeps the body to
// two short paragraphs (Chicago-first for drivable orgs, livestream-first
// for far ones), and lands the 20% code as a standing courtesy.
export function ambassadorInviteEmail({
  contactName, orgName, note, code, shareUrl, learnMoreUrl, unsubscribeUrl, dateLabel, region, assetBase,
}: AmbassadorInviteArgs) {
  const postalAddress = process.env.MAIL_POSTAL_ADDRESS?.trim() || "Americans Against Language Barriers, Chicago, IL";
  const TEAL_DEEP = "#0C3B4B", INK = "#0B1F25", SOFT = "#5A6E76", GOLD_SOFT = "#F4E9CD", LINK = "#1E6FA2";
  const base = (assetBase || ASSET_BASE).replace(/\/$/, "");
  const site = (learnMoreUrl || base).replace(/\/$/, "");

  const cn = (contactName || "").trim();
  const isPerson = !!cn && cn.toLowerCase() !== orgName.trim().toLowerCase();
  const honorific = /^(dr|mr|mrs|ms|prof|rev|hon|sr|fr)\.?$/i;
  const firstNameOf = (n: string) => { const t = n.replace(/,.*$/, "").trim().split(/\s+/); return honorific.test(t[0]) ? (t[1] || t[0]) : t[0]; };
  // Org-addressed letters greet the short institution name ("Dear CHIA,"),
  // not the full "Org — Program" row label.
  const greeting = (isPerson
    ? firstNameOf(cn)
    : orgName.split("—")[0].replace(/\s*\([^)]*\)\s*$/, "").trim()) || "there";

  const p = (html: string, mb = 18) =>
    `<p style="margin:0 0 ${mb}px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">${html}</p>`;
  const sig = (img: string, name: string, title: string) => `
        <img src="${base}/sig/${img}" alt="${escapeHtml(name)}" height="40" style="height:40px;width:auto;display:block;margin:0 0 4px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:140px;height:1px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${INK};font-weight:bold;padding-top:8px;">${escapeHtml(name)}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${SOFT};padding-top:2px;">${escapeHtml(title)}</div>`;
  const eyebrow = (text: string) =>
    `<div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;margin:26px 0 12px 0;">${text}</div>`;

  // The personalized paragraph IS the opening of the letter. First letter
  // carries the drop cap; any further note paragraphs render as body text.
  // Falls back to a general opening when no note was written.
  const noteParas = (note || "").trim().split(/\n\s*\n/).filter(Boolean);
  const opening = noteParas[0] ||
    `You lead people this conference was built for — the interpreters, clinicians, and students who make American healthcare understandable in every language.`;
  const openingFirst = opening.charAt(0);
  const openingRest = escapeHtml(opening.slice(1));
  const extraNoteParas = noteParas.slice(1);

  // The one geo-aware paragraph: for metro Chicago the conference is in THEIR
  // city; for the drivable Midwest it is a short trip; for everyone else the
  // livestream is the point.
  const convenePara = region === "chicago"
    ? `That is why we are writing. On August 15 and 16, Lurie Children&rsquo;s and Americans Against Language Barriers convene <em>True Language Access: Yesterday, Today, and Tomorrow</em> at Lurie Children&rsquo;s in Streeterville &mdash; in your own city, a ride downtown. Two days with the people who shaped this field and the people who will carry it forward, ten-plus CEU hours, which will be accredited by NBCMI and CCHI, and not a single travel budget between your community and the room. Chicago is where this conversation is happening; your people should be in it.`
    : region === "midwest"
    ? `That is why we are writing. On August 15 and 16, Lurie Children&rsquo;s and Americans Against Language Barriers convene <em>True Language Access: Yesterday, Today, and Tomorrow</em> in the heart of Chicago &mdash; the people who shaped this field and the people who will carry it forward, two days, ten-plus CEU hours, which will be accredited by NBCMI and CCHI. For your community it is a short trip, not a travel budget &mdash; and every session also streams live for those who stay put.`
    : `That is why we are writing. On August 15 and 16, Lurie Children&rsquo;s and Americans Against Language Barriers convene <em>True Language Access: Yesterday, Today, and Tomorrow</em> in Chicago &mdash; and the whole program streams live. The virtual seat is a full seat: the same sessions among the people who shaped this field and the people who will carry it forward, the same ten-plus CEU hours, which will be accredited by NBCMI and CCHI, without an airfare between your community and the room.`;

  // Plain-text forwardable blurb: everything a student or member needs, in
  // one paragraph the ambassador can paste into an email or newsletter.
  const blurb = `The 2026 Lurie Children's & AALB Conference — True Language Access: Yesterday, Today, and Tomorrow — is August 15 and 16 at Lurie Children's Hospital in Chicago, with a full virtual option. Two days on language access in American healthcare, with 10+ CEU hours, which will be accredited by NBCMI and CCHI. Register at ${shareUrl}, where code ${code} takes 20% off any ticket through August 10.`;

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>An Invitation &middot; 2026 Lurie Children&rsquo;s &amp; AALB Conference</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;}
  a{color:${LINK};}
  @media only screen and (max-width:600px){
    .sl-card{width:100%!important;}
    .sl-body{padding:32px 24px 30px 24px!important;}
    .sl-head{padding:36px 22px 30px 22px!important;}
    .sl-foot{padding:24px 22px!important;}
    .sl-display{font-size:25px!important;line-height:31px!important;}
    .sl-seal{width:96px!important;height:96px!important;}
    .sl-dropcap{font-size:46px!important;line-height:36px!important;}
    .sl-cta{display:block!important;width:100%!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#ECE6D7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ECE6D7;">${region === "chicago" ? `August 15 and 16 at Lurie Children&rsquo;s &mdash; two days on language access in healthcare, in your own city, a ride downtown.` : region === "midwest" ? `August 15 and 16 at Lurie Children&rsquo;s in Chicago &mdash; two days on language access in healthcare, an easy trip away.` : `Every session streams live &mdash; join the 2026 Lurie Children&rsquo;s &amp; AALB Conference from anywhere, August 15 and 16.`}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ECE6D7;background-image:linear-gradient(180deg,#F0EBDD 0%,#E6DECB 100%);">
<tr><td align="center" style="padding:34px 14px 44px 14px;">

  <table role="presentation" class="sl-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#FBF8F1;border:1px solid #E4DAC4;box-shadow:0 18px 48px rgba(12,59,75,0.18);">

    <tr><td align="center" bgcolor="${TEAL_DEEP}" class="sl-head" style="background-color:${TEAL_DEEP};background-image:linear-gradient(160deg,${TEAL} 0%,${TEAL_DEEP} 100%);padding:44px 40px 34px 40px;">
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;letter-spacing:4px;text-transform:uppercase;color:${GOLD_SOFT};font-weight:bold;">Lurie Children&rsquo;s &middot; AALB</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding-top:6px;">An Invitation</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:8px;line-height:10px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};font-weight:bold;padding:22px 0 8px 0;">&middot;&nbsp;Second Joint Conference&nbsp;&middot;</div>

      <!--[if !mso]><!-->
      <div class="sl-seal" style="width:116px;height:116px;border-radius:50%;background-color:${GOLD};background-image:linear-gradient(135deg,#F4E9CD 0%,#D9B863 28%,#C9A14B 52%,#9C7A2E 78%,#E7D5A4 100%);border:2px solid #F4E9CD;box-shadow:0 6px 16px rgba(0,0,0,0.30),inset 0 1px 2px rgba(255,255,255,0.55);display:inline-block;">
        <table role="presentation" width="116" height="116" cellpadding="0" cellspacing="0" border="0" style="width:116px;height:116px;"><tr><td align="center" valign="middle" style="text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:30px;color:#3C2E10;font-weight:bold;letter-spacing:1px;">2026</div>
        </td></tr></table>
      </div>
      <!--<![endif]-->
      <!--[if mso]>
      <v:oval fill="true" stroke="true" strokecolor="#F4E9CD" strokeweight="2px" style="width:116px;height:116px;">
        <v:fill type="solid" color="#C9A14B"/>
        <v:textbox inset="0,0,0,0"><center><div style="font-family:Georgia,serif;font-size:30px;color:#3C2E10;font-weight:bold;">2026</div></center></v:textbox>
      </v:oval>
      <![endif]-->

      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:13px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};padding:10px 0 0 0;">True Language Access</div>
      <div class="sl-display" style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:38px;color:#FFFFFF;padding:18px 0 0 0;">The Second Joint Conference</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;line-height:22px;color:#A9C6CD;padding:7px 0 0 0;">on Language Access in American Healthcare</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding:14px 0 0 0;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
    </td></tr>

    <tr><td style="height:3px;line-height:3px;font-size:0;background-color:${GOLD};background-image:linear-gradient(90deg,#9C7A2E 0%,#F4E9CD 50%,#9C7A2E 100%);">&nbsp;</td></tr>

    <tr><td class="sl-body" style="padding:40px 52px 36px 52px;background-color:#FBF8F1;">
      <div style="padding:0 0 18px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.4;color:${INK};font-weight:bold;">${escapeHtml(orgName)}</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;line-height:1.5;color:${SOFT};padding-top:2px;">${escapeHtml(dateLabel)}</div>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:46px;height:2px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
      <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>

      ${p(`Dear ${escapeHtml(greeting)},`)}

      <p style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">
        <span class="sl-dropcap" style="float:left;font-family:Georgia,'Times New Roman',serif;font-size:54px;line-height:42px;color:${TEAL};padding:6px 11px 0 0;">${escapeHtml(openingFirst)}</span>${openingRest}
      </p>
      ${extraNoteParas.map((para) => p(escapeHtml(para))).join("\n")}

      ${p(convenePara)}

      ${keynoteSpotlight(shareUrl, base)}

      ${p(`As is customary between institutions that share this work, a courtesy rate stands for your students and members &mdash; the code below is already in their name.`)}

      ${eyebrow("Reserved for your community")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px 0;">
        <tr><td align="center" bgcolor="#FBF4E2" style="background-color:#FBF4E2;border:1px solid #EAD9AE;border-radius:10px;padding:20px 20px 18px 20px;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;">Your personal code</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:10px auto 6px auto;"><tr>
            <td bgcolor="#FBF8F1" style="background-color:#FBF8F1;border:1.5px dashed ${GOLD};border-radius:8px;padding:10px 22px;font-family:'Courier New',Courier,monospace;font-size:20px;letter-spacing:3px;font-weight:bold;color:#3C2E10;">${escapeHtml(code)}</td>
          </tr></table>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13.5px;line-height:1.7;color:#3C2E10;">20% below the standard rate &middot; in person or virtual &middot; unlimited uses &middot; through August 10, 2026</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:12.5px;line-height:1.6;color:#8a744a;padding-top:4px;">${region === "far" ? `It covers the virtual seat as well as the Chicago one &mdash; and it is yours too.` : `It seats you too &mdash; we would be glad to see you at Lurie Children&rsquo;s.`}</div>
        </td></tr>
      </table>

      ${eyebrow("Ready to forward")}
      ${p(`The note below is ready to place in an email, a newsletter, or a course page as written:`, 12)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
        <tr>
          <td style="width:3px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td>
          <td bgcolor="#F7F3EA" style="background-color:#F7F3EA;padding:14px 18px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;line-height:1.8;color:#284752;">${escapeHtml(blurb)}</p>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 28px 0;">
        <tr><td align="center">
          <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="${TEAL}" style="background-color:${TEAL};border-radius:9px;">
              <a href="${shareUrl}" style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:9px;">Open the share link &nbsp;&rarr;</a>
            </td>
          </tr></table>
          <!--[if mso]></td><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="#FBF8F1" style="background-color:#FBF8F1;border:1.5px solid ${GOLD};border-radius:9px;">
              <a href="${site}" style="display:inline-block;padding:13.5px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:${TEAL};text-decoration:none;border-radius:9px;">See the conference</a>
            </td>
          </tr></table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td></tr>
      </table>

      ${p(`The full program is at <a href="${site}" style="color:${LINK};text-decoration:none;">conference.aalb.org</a>. Should a syllabus line, newsletter note, or slide be useful, write to Kevin at <a href="mailto:kevin@aalb.org" style="color:${LINK};text-decoration:none;">kevin@aalb.org</a> and we will send materials sized to fit.`, 22)}

      <div style="font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};padding-bottom:16px;">With respect,</div>

      ${sig("kevin.png", "Kevin Thakkar", "Founder & Executive Director, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("iris.png", "Iris Laffitte", "Operations Manager, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("zachary.png", "Zachary Paul Romansky", "Lurie Children’s Language Services Department")}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0 0;border-top:1px solid #ECE3D0;">
        <tr><td align="center" style="padding:24px 0 4px 0;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#9A8B6A;padding-bottom:16px;">Presented Jointly By</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/aalb.png" alt="Americans Against Language Barriers" height="40" style="height:40px;width:auto;display:block;"></td>
            <td style="border-left:1px solid #E0D5BD;width:1px;font-size:0;">&nbsp;</td>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/lurie.png" alt="Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago" height="34" style="height:34px;width:auto;display:block;"></td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td class="sl-foot" align="center" bgcolor="${TEAL_DEEP}" style="background-color:${TEAL_DEEP};background-image:linear-gradient(180deg,${TEAL_DEEP} 0%,#0A3340 100%);padding:26px 40px 28px 40px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.5px;color:${GOLD_SOFT};">2026 Lurie Children&rsquo;s &amp; AALB Conference</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;padding-top:8px;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;">conference.aalb.org &middot; contact@aalb.org</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:0.5px;color:#5F7E86;padding-top:8px;">501(c)(3) &middot; EINs 83-3016421 and 36-2170833</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:10px;">${escapeHtml(postalAddress)}</div>
      ${unsubscribeUrl ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:4px;">You received this invitation to share the conference with your community. <a href="${unsubscribeUrl}" style="color:#9FB6BC;text-decoration:underline;">Unsubscribe</a>.</div>` : ""}
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

type PartnerOfferArgs = {
  contactName: string;
  orgName: string;
  // Handcrafted invitation paragraph(s). Blank lines split paragraphs.
  intro: string;
  freeTickets: number;
  shareDiscountPct: number;
  exhibitorDiscountPct: number;
  staffCode: string;
  shareCode: string;
  // Public registration funnel (where a code is entered).
  registerUrl: string;
  // Sponsor/exhibitor page, for the 20% exhibitor offer.
  exhibitorUrl?: string;
  // Conference home, for the secondary "see the conference" link.
  learnMoreUrl?: string;
  unsubscribeUrl?: string;
  assetBase?: string;
};

// A warm, engraved gold-foil letter thanking an organization AALB partners with
// (interpreter training, official partnership) and giving them three gifts at
// the conference: complimentary staff tickets, a shareable attendee discount
// code, and a partner discount on an exhibitor table. Same letterhead as the
// sponsor invites; the handcrafted `intro` carries the per-partner voice, and
// the two codes are shown as prominent chips.
export function partnerOfferEmail({
  contactName, orgName, intro, freeTickets, shareDiscountPct, exhibitorDiscountPct,
  staffCode, shareCode, registerUrl, exhibitorUrl, learnMoreUrl, unsubscribeUrl, assetBase,
}: PartnerOfferArgs) {
  const postalAddress = process.env.MAIL_POSTAL_ADDRESS?.trim() || "Americans Against Language Barriers, Chicago, IL";
  const TEAL_DEEP = "#0C3B4B", INK = "#0B1F25", SOFT = "#5A6E76", GOLD_SOFT = "#F4E9CD", LINK = "#1E6FA2";
  const base = (assetBase || ASSET_BASE).replace(/\/$/, "");
  const site = (learnMoreUrl || base).replace(/\/$/, "");
  const exhibit = (exhibitorUrl || `${site}/sponsor`).replace(/\/$/, "");
  const register = registerUrl || `${site}/register`;
  const ticketsWord = freeTickets === 1 ? "ticket" : "tickets";
  const seatsWord = freeTickets === 1 ? "seat is" : "seats are";

  const cn = (contactName || "").trim();
  const isPerson = !!cn && cn.toLowerCase() !== orgName.trim().toLowerCase();
  const honorific = /^(dr|mr|mrs|ms|prof|rev|hon|sr|fr)\.?$/i;
  const firstNameOf = (n: string) => { const t = n.replace(/,.*$/, "").trim().split(/\s+/); return honorific.test(t[0]) ? (t[1] || t[0]) : t[0]; };
  const greeting = (isPerson ? firstNameOf(cn) : orgName.replace(/\s*\([^)]*\)\s*$/, "").trim()) || "there";

  const p = (html: string, mb = 18) =>
    `<p style="margin:0 0 ${mb}px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">${html}</p>`;
  const sig = (img: string, name: string, title: string) => `
        <img src="${base}/sig/${img}" alt="${escapeHtml(name)}" height="40" style="height:40px;width:auto;display:block;margin:0 0 4px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:140px;height:1px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${INK};font-weight:bold;padding-top:8px;">${escapeHtml(name)}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${SOFT};padding-top:2px;">${escapeHtml(title)}</div>`;
  const askNo = (n: number) => `
        <table role="presentation" width="30" height="30" cellpadding="0" cellspacing="0" border="0" style="width:30px;height:30px;background-color:${GOLD};background-image:linear-gradient(135deg,#F4E9CD 0%,#D9B863 30%,#C9A14B 58%,#9C7A2E 88%);border-radius:50%;box-shadow:inset 0 1px 1px rgba(255,255,255,0.5);">
          <tr><td align="center" valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#3C2E10;font-weight:bold;line-height:1;">${n}</td></tr>
        </table>`;
  const codeChip = (code: string) => `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 2px 0;"><tr>
          <td bgcolor="#FBF4E2" style="background-color:#FBF4E2;border:1.5px dashed ${GOLD};border-radius:8px;padding:9px 18px;font-family:'Courier New',Courier,monospace;font-size:18px;letter-spacing:2px;font-weight:bold;color:#3C2E10;">${escapeHtml(code)}</td>
        </tr></table>`;
  const gift = (n: number, title: string, body: string) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
        <tr>
          <td valign="top" style="width:30px;">${askNo(n)}</td>
          <td valign="top" style="padding:1px 0 0 15px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.4;color:${INK};font-weight:bold;">${title}</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:14.5px;line-height:1.7;color:${SOFT};padding-top:3px;">${body}</div>
          </td>
        </tr>
      </table>`;
  const eyebrow = (text: string) =>
    `<div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;margin:26px 0 14px 0;">${text}</div>`;

  // Plain text only: the render path escapes firstPara (drop cap + body), so
  // any markup in this fallback would show up literally in the letter.
  const introParas = (intro || "").trim().split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const firstPara = introParas[0] || `It is our privilege to count ${orgName} among our partners, and we did not want this year's conference to pass without bringing something back to you.`;
  const restParas = introParas.slice(1);

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>A Partner Invitation &middot; 2026 Lurie Children&rsquo;s &amp; AALB Conference</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;}
  a{color:${LINK};}
  @media only screen and (max-width:600px){
    .sl-card{width:100%!important;}
    .sl-body{padding:32px 24px 30px 24px!important;}
    .sl-head{padding:36px 22px 30px 22px!important;}
    .sl-foot{padding:24px 22px!important;}
    .sl-display{font-size:25px!important;line-height:31px!important;}
    .sl-seal{width:96px!important;height:96px!important;}
    .sl-dropcap{font-size:46px!important;line-height:36px!important;}
    .sl-cta{display:block!important;width:100%!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#ECE6D7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ECE6D7;">With our thanks: complimentary tickets, a ${shareDiscountPct}% code to share, and a partner rate on an exhibitor table at the 2026 Lurie Children&rsquo;s &amp; AALB Conference.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ECE6D7;background-image:linear-gradient(180deg,#F0EBDD 0%,#E6DECB 100%);">
<tr><td align="center" style="padding:34px 14px 44px 14px;">

  <table role="presentation" class="sl-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#FBF8F1;border:1px solid #E4DAC4;box-shadow:0 18px 48px rgba(12,59,75,0.18);">

    <tr><td align="center" bgcolor="${TEAL_DEEP}" class="sl-head" style="background-color:${TEAL_DEEP};background-image:linear-gradient(160deg,${TEAL} 0%,${TEAL_DEEP} 100%);padding:44px 40px 34px 40px;">
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;letter-spacing:4px;text-transform:uppercase;color:${GOLD_SOFT};font-weight:bold;">Lurie Children&rsquo;s &middot; AALB</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding-top:6px;">A Note for Our Partners</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:8px;line-height:10px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};font-weight:bold;padding:22px 0 8px 0;">&middot;&nbsp;Second Joint Conference&nbsp;&middot;</div>

      <!--[if !mso]><!-->
      <div class="sl-seal" style="width:116px;height:116px;border-radius:50%;background-color:${GOLD};background-image:linear-gradient(135deg,#F4E9CD 0%,#D9B863 28%,#C9A14B 52%,#9C7A2E 78%,#E7D5A4 100%);border:2px solid #F4E9CD;box-shadow:0 6px 16px rgba(0,0,0,0.30),inset 0 1px 2px rgba(255,255,255,0.55);display:inline-block;">
        <table role="presentation" width="116" height="116" cellpadding="0" cellspacing="0" border="0" style="width:116px;height:116px;"><tr><td align="center" valign="middle" style="text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:30px;color:#3C2E10;font-weight:bold;letter-spacing:1px;">2026</div>
        </td></tr></table>
      </div>
      <!--<![endif]-->
      <!--[if mso]>
      <v:oval fill="true" stroke="true" strokecolor="#F4E9CD" strokeweight="2px" style="width:116px;height:116px;">
        <v:fill type="solid" color="#C9A14B"/>
        <v:textbox inset="0,0,0,0"><center><div style="font-family:Georgia,serif;font-size:30px;color:#3C2E10;font-weight:bold;">2026</div></center></v:textbox>
      </v:oval>
      <![endif]-->

      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:13px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};padding:10px 0 0 0;">True Language Access</div>
      <div class="sl-display" style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:38px;color:#FFFFFF;padding:18px 0 0 0;">The Second Joint Conference</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;line-height:22px;color:#A9C6CD;padding:7px 0 0 0;">on Language Access in American Healthcare</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding:14px 0 0 0;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
    </td></tr>

    <tr><td style="height:3px;line-height:3px;font-size:0;background-color:${GOLD};background-image:linear-gradient(90deg,#9C7A2E 0%,#F4E9CD 50%,#9C7A2E 100%);">&nbsp;</td></tr>

    <tr><td class="sl-body" style="padding:40px 52px 36px 52px;background-color:#FBF8F1;">
      <div style="padding:0 0 18px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.4;color:${INK};font-weight:bold;">${escapeHtml(orgName)}</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;line-height:1.5;color:${SOFT};padding-top:2px;">Our Partner</div>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:46px;height:2px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
      <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>

      ${p(`Dear ${escapeHtml(greeting)},`)}

      <p style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">
        <span class="sl-dropcap" style="float:left;font-family:Georgia,'Times New Roman',serif;font-size:54px;line-height:42px;color:${TEAL};padding:6px 11px 0 0;">${escapeHtml(firstPara.charAt(0))}</span>${escapeHtml(firstPara.slice(1))}
      </p>
      ${restParas.map((para) => p(escapeHtml(para))).join("")}

      ${eyebrow("Three things, with our thanks")}

      ${gift(1, `${freeTickets} complimentary ${ticketsWord}, on us`,
        `We would love for your team to join us, in person in Chicago or online. Enter this code at registration and your ${seatsWord} free:${codeChip(staffCode)}<span style="font-size:13px;color:${SOFT};">Good for ${freeTickets} ${ticketsWord}.</span>`)}

      ${gift(2, `${shareDiscountPct}% off, for anyone you send our way`,
        `Share this code as widely as you like, with the interpreters you have trained, your staff, your colleagues. It takes ${shareDiscountPct}% off conference registration, for as many people as want to use it:${codeChip(shareCode)}`)}

      ${gift(3, `${exhibitorDiscountPct}% off an exhibitor table`,
        `And if you would like a presence on the exhibitor floor, your table is ${exhibitorDiscountPct}% off as our partner. Just reply, or start at <a href="${exhibit}" style="color:${LINK};text-decoration:none;">${escapeHtml(exhibit.replace(/^https?:\/\//, ""))}</a>, and we will apply it for you.`)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 6px 0;">
        <tr><td align="center">
          <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="${TEAL}" style="background-color:${TEAL};border-radius:9px;">
              <a href="${register}" style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:9px;">Register for the conference &nbsp;&rarr;</a>
            </td>
          </tr></table>
          <!--[if mso]></td><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="#FBF8F1" style="background-color:#FBF8F1;border:1.5px solid ${GOLD};border-radius:9px;">
              <a href="${site}" style="display:inline-block;padding:13.5px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:${TEAL};text-decoration:none;border-radius:9px;">See the conference</a>
            </td>
          </tr></table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td></tr>
      </table>

      ${p(`Thank you for being the kind of partner who makes this work possible. If there is anything at all we can do for you, reply straight to us at <a href="mailto:kevin@aalb.org" style="color:${LINK};text-decoration:none;">kevin@aalb.org</a>, and we would be glad to help.`, 22)}

      <div style="font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};padding-bottom:16px;">With gratitude,</div>

      ${sig("kevin.png", "Kevin Thakkar", "Founder & Executive Director, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("iris.png", "Iris Laffitte", "Operations Manager, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("zachary.png", "Zachary Paul Romansky", "Lurie Children’s Language Services Department")}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0 0;border-top:1px solid #ECE3D0;">
        <tr><td align="center" style="padding:24px 0 4px 0;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#9A8B6A;padding-bottom:16px;">Presented Jointly By</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/aalb.png" alt="Americans Against Language Barriers" height="40" style="height:40px;width:auto;display:block;"></td>
            <td style="border-left:1px solid #E0D5BD;width:1px;font-size:0;">&nbsp;</td>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/lurie.png" alt="Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago" height="34" style="height:34px;width:auto;display:block;"></td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td class="sl-foot" align="center" bgcolor="${TEAL_DEEP}" style="background-color:${TEAL_DEEP};background-image:linear-gradient(180deg,${TEAL_DEEP} 0%,#0A3340 100%);padding:26px 40px 28px 40px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.5px;color:${GOLD_SOFT};">2026 Lurie Children&rsquo;s &amp; AALB Conference</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;padding-top:8px;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;">conference.aalb.org &middot; contact@aalb.org</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:0.5px;color:#5F7E86;padding-top:8px;">501(c)(3) &middot; EINs 83-3016421 and 36-2170833</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:10px;">${escapeHtml(postalAddress)}</div>
      ${unsubscribeUrl ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:4px;">You received this note as a partner of the conference. <a href="${unsubscribeUrl}" style="color:#9FB6BC;text-decoration:underline;">Unsubscribe</a>.</div>` : ""}
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

type SponsorInKindPledgeArgs = {
  kind: "food" | "asl";
  contactName: string;
  companyName: string;
  // What they pledged to provide, and the chosen arrangement label.
  provide: string;
  arrangementLabel: string;
  assetBase?: string;
};

// Confirmation sent when a restaurant (food) or interpreting team (asl) pledges
// in kind through the funnel. Warm, short, and makes clear they are now a
// tracked sponsor; the team will reach out to coordinate logistics.
export function sponsorInKindPledgeEmail({ kind, contactName, companyName, provide, arrangementLabel, assetBase }: SponsorInKindPledgeArgs) {
  const first = sponsorFirstName(contactName, companyName) || "there";
  const isAsl = kind === "asl";
  const sponsorLabel = isAsl ? "ASL Interpreter Sponsor" : "Food Sponsor";
  const mission = isAsl
    ? "helping us keep every session of the conference accessible in American Sign Language"
    : "helping us hold the line on a fully plant-based, meat-free event";
  const provideLabel = isAsl ? "Interpreting you can provide" : "What you can provide";
  const recognitionLast = isAsl
    ? "An honorable mention during opening remarks"
    : "An honorable mention at the opening and at the meal you provide";
  const taxLine = isAsl
    ? "Out-of-pocket costs connected to your donation may be tax-deductible (donated services themselves generally are not)"
    : "Your in-kind food donation may be tax-deductible";
  return shell(`
    <h1 style="font-size:23px;font-weight:800;margin:0 0 12px 0;letter-spacing:-0.01em;">Thank you, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      We are genuinely grateful. With your help, <strong>${escapeHtml(companyName)}</strong> is now an official <strong>${sponsorLabel}</strong> of the 2026 Lurie Children&rsquo;s and AALB Conference, ${mission}.
    </p>
    ${sectionHeading("What we noted")}
    ${glanceCard([
      { label: provideLabel, value: escapeHtml(provide || "We will confirm together") },
      { label: "Arrangement", value: escapeHtml(arrangementLabel) },
    ])}
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:16px 0 0 0;">
      Our team will reach out shortly to coordinate the details. Nothing here is final until we talk, so there is no pressure on the specifics yet.
    </p>
    ${sectionHeading("Your recognition")}
    ${bulletList([
      "Your name and logo on the conference website",
      "Your name and logo on signage at the conference",
      recognitionLast,
      "Two complimentary conference tickets for your team",
    ])}
    <p style="font-size:14px;line-height:1.7;color:${MUTED};margin:14px 0 0 0;">
      ${taxLine}, and we will gladly provide a written acknowledgment describing your gift. Please consult your tax advisor.
    </p>
    ${signOff("With gratitude,")}
    ${logoLockup(assetBase)}
  `);
}

type SponsorInKindAcceptanceArgs = {
  kind: "food" | "asl" | "captioning";
  contactName: string;
  companyName: string;
  // The pledge summary we hold (from sponsor.message), reflected back so the
  // letter names exactly what they offered. Optional.
  pledge?: string | null;
  // The sponsor portal, where they upload their logo and add their website.
  materialsUrl: string;
  // Conference home, for the secondary "See the conference" link.
  learnMoreUrl?: string;
  // One-click unsubscribe URL (deliverability / CAN-SPAM).
  unsubscribeUrl?: string;
  // Pre-formatted date string (e.g. "July 2, 2026"); defaults to today.
  dateLabel?: string;
  assetBase?: string;
};

// The formal welcome / onboarding letter, sent when an admin clicks "Accept" on
// an in-kind Food or ASL sponsor who has pledged. Set like the engraved
// invitations (sponsorLetterEmail / attendeeAlumniInviteEmail): cream card,
// deep-teal letterhead with the gold "2026" seal, a gold-foil rule, a serif
// body with a drop cap, a gold-ruled pledge pull-quote, and real ink signatures
// (rendered from /public/sig, with printed name + title as the image-blocked
// fallback). It makes the sponsorship official, then asks for the three things
// we need to feature them and coordinate: their logo and website (portal
// button), and the logistics of what they are providing (reply-first). No em
// dashes; both host institutions named on the tax line. Self-contained and
// responsive, with solid colors under every gradient and a VML seal for Outlook.
export function sponsorInKindAcceptanceEmail({
  kind, contactName, companyName, pledge, materialsUrl, learnMoreUrl, unsubscribeUrl, dateLabel, assetBase,
}: SponsorInKindAcceptanceArgs) {
  const postalAddress = process.env.MAIL_POSTAL_ADDRESS?.trim() || "Americans Against Language Barriers, Chicago, IL";
  const TEAL_DEEP = "#0C3B4B", INK = "#0B1F25", SOFT = "#5A6E76", GOLD_SOFT = "#F4E9CD", LINK = "#1E6FA2";
  const base = (assetBase || ASSET_BASE).replace(/\/$/, "");
  const site = (learnMoreUrl || base).replace(/\/$/, "");
  const today = dateLabel || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const isAsl = kind === "asl";
  const isCaptioning = kind === "captioning";
  const sponsorLabel = isAsl ? "ASL Interpreter Sponsor" : isCaptioning ? "Captioning Sponsor" : "Food Sponsor";

  // Greeting: a person's first name when we have one, otherwise the org name
  // (sans a trailing "(ABBR)").
  const cn = (contactName || "").trim();
  const isPerson = !!cn && cn.toLowerCase() !== companyName.trim().toLowerCase();
  const honorific = /^(dr|mr|mrs|ms|prof|rev|hon|sr|fr|chef)\.?$/i;
  const firstNameOf = (n: string) => { const t = n.replace(/,.*$/, "").trim().split(/\s+/); return honorific.test(t[0]) ? (t[1] || t[0]) : t[0]; };
  const greeting = (isPerson ? firstNameOf(cn) : companyName.replace(/\s*\([^)]*\)\s*$/, "").trim()) || "there";

  const mission = isAsl
    ? "helping us keep every session of the conference accessible in American Sign Language, so that Deaf and hard-of-hearing attendees are full participants and never an afterthought"
    : isCaptioning
    ? "helping us make every session accessible with live captioning, for the in-person and virtual audiences alike, so no one misses a word"
    : "helping us hold the line on a fully plant-based, meat-free conference, where every meal honors the same promise these two days are about";
  const pledgeLabel = isAsl ? "The interpreting you are providing" : isCaptioning ? "The captioning you are providing" : "What you are providing";
  // A plain-language summary of what the portal form asks, so the letter names
  // the details without turning into a reply-by-email checklist.
  const detailsSummary = isAsl
    ? "your coverage, how many interpreters, on-site or remote, a day-of contact, and any materials to send ahead"
    : isCaptioning
    ? "your coverage, how the captions are delivered for the room and the stream, any technical needs, a day-of contact, and any materials to send ahead"
    : "what you are providing, which day and meal, delivery or pickup, a day-of contact, allergen notes, and any setup needs";
  const recognitionLast = isAsl || isCaptioning
    ? "An honorable mention during opening remarks"
    : "An honorable mention at the opening and at the meal you provide, before a national audience of interpreters, clinicians, and advocates";
  // Careful, accurate tax language: donated services are not deductible under
  // IRS rules, and the acknowledgment describes the gift without valuing it.
  const taxLine = isAsl || isCaptioning
    ? "Out-of-pocket costs connected to your donation may be tax-deductible as a charitable contribution to a 501(c)(3); the value of donated services themselves generally is not"
    : "Your in-kind food donation may be tax-deductible as a charitable contribution to a 501(c)(3)";

  // Style primitives shared with the engraved invitations.
  const p = (html: string, mb = 18) =>
    `<p style="margin:0 0 ${mb}px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">${html}</p>`;
  const sig = (img: string, name: string, title: string) => `
        <img src="${base}/sig/${img}" alt="${escapeHtml(name)}" height="40" style="height:40px;width:auto;display:block;margin:0 0 4px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:140px;height:1px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${INK};font-weight:bold;padding-top:8px;">${escapeHtml(name)}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${SOFT};padding-top:2px;">${escapeHtml(title)}</div>`;
  // A gold seal numeral for the three asks.
  const askNo = (n: number) => `
        <table role="presentation" width="30" height="30" cellpadding="0" cellspacing="0" border="0" style="width:30px;height:30px;background-color:${GOLD};background-image:linear-gradient(135deg,#F4E9CD 0%,#D9B863 30%,#C9A14B 58%,#9C7A2E 88%);border-radius:50%;box-shadow:inset 0 1px 1px rgba(255,255,255,0.5);">
          <tr><td align="center" valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#3C2E10;font-weight:bold;line-height:1;">${n}</td></tr>
        </table>`;
  const ask = (n: number, title: string, body: string) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;">
        <tr>
          <td valign="top" style="width:30px;">${askNo(n)}</td>
          <td valign="top" style="padding:1px 0 0 15px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.4;color:${INK};font-weight:bold;">${title}</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:14.5px;line-height:1.7;color:${SOFT};padding-top:3px;">${body}</div>
          </td>
        </tr>
      </table>`;
  // Gold-bulleted serif lines, for logistics and recognition.
  const goldList = (items: string[], color = INK) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 0 0;">
        ${items.map((t) => `<tr>
          <td valign="top" style="width:18px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:${GOLD};">&#8226;</td>
          <td valign="top" style="padding:3px 0;font-family:Georgia,'Times New Roman',serif;font-size:14.5px;line-height:1.7;color:${color};">${t}</td>
        </tr>`).join("")}
      </table>`;
  const eyebrow = (text: string) =>
    `<div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;margin:26px 0 12px 0;">${text}</div>`;

  const pledgePanel = (pledge && pledge.trim()) ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px 0;">
        <tr><td bgcolor="#FBF4E2" style="background-color:#FBF4E2;border:1px solid #EAD9AE;border-radius:10px;padding:16px 20px;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;padding-bottom:6px;">${pledgeLabel}</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#3C2E10;">${escapeHtml(pledge.trim())}</div>
        </td></tr>
      </table>` : "";

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(sponsorLabel)} &middot; 2026 Lurie Children&rsquo;s &amp; AALB Conference</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;}
  a{color:${LINK};}
  @media only screen and (max-width:600px){
    .sl-card{width:100%!important;}
    .sl-body{padding:32px 24px 30px 24px!important;}
    .sl-head{padding:36px 22px 30px 22px!important;}
    .sl-foot{padding:24px 22px!important;}
    .sl-display{font-size:25px!important;line-height:31px!important;}
    .sl-seal{width:96px!important;height:96px!important;}
    .sl-dropcap{font-size:46px!important;line-height:36px!important;}
    .sl-cta{display:block!important;width:100%!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#ECE6D7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ECE6D7;">It is official: ${escapeHtml(companyName)} is a confirmed ${escapeHtml(sponsorLabel)} of the Second Joint Conference on language access, August 15 and 16, 2026, in Chicago.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ECE6D7;background-image:linear-gradient(180deg,#F0EBDD 0%,#E6DECB 100%);">
<tr><td align="center" style="padding:34px 14px 44px 14px;">

  <table role="presentation" class="sl-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#FBF8F1;border:1px solid #E4DAC4;box-shadow:0 18px 48px rgba(12,59,75,0.18);">

    <tr><td align="center" bgcolor="${TEAL_DEEP}" class="sl-head" style="background-color:${TEAL_DEEP};background-image:linear-gradient(160deg,${TEAL} 0%,${TEAL_DEEP} 100%);padding:44px 40px 34px 40px;">
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;letter-spacing:4px;text-transform:uppercase;color:${GOLD_SOFT};font-weight:bold;">Lurie Children&rsquo;s &middot; AALB</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding-top:6px;">Your Sponsorship, Confirmed</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:8px;line-height:10px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};font-weight:bold;padding:22px 0 8px 0;">&middot;&nbsp;Second Joint Conference&nbsp;&middot;</div>

      <!--[if !mso]><!-->
      <div class="sl-seal" style="width:116px;height:116px;border-radius:50%;background-color:${GOLD};background-image:linear-gradient(135deg,#F4E9CD 0%,#D9B863 28%,#C9A14B 52%,#9C7A2E 78%,#E7D5A4 100%);border:2px solid #F4E9CD;box-shadow:0 6px 16px rgba(0,0,0,0.30),inset 0 1px 2px rgba(255,255,255,0.55);display:inline-block;">
        <table role="presentation" width="116" height="116" cellpadding="0" cellspacing="0" border="0" style="width:116px;height:116px;"><tr><td align="center" valign="middle" style="text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:30px;color:#3C2E10;font-weight:bold;letter-spacing:1px;">2026</div>
        </td></tr></table>
      </div>
      <!--<![endif]-->
      <!--[if mso]>
      <v:oval fill="true" stroke="true" strokecolor="#F4E9CD" strokeweight="2px" style="width:116px;height:116px;">
        <v:fill type="solid" color="#C9A14B"/>
        <v:textbox inset="0,0,0,0"><center><div style="font-family:Georgia,serif;font-size:30px;color:#3C2E10;font-weight:bold;">2026</div></center></v:textbox>
      </v:oval>
      <![endif]-->

      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;line-height:13px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};padding:10px 0 0 0;">True Language Access</div>
      <div class="sl-display" style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:38px;color:#FFFFFF;padding:18px 0 0 0;">The Second Joint Conference</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;line-height:22px;color:#A9C6CD;padding:7px 0 0 0;">on Language Access in American Healthcare</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:#7FA7B1;padding:14px 0 0 0;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
    </td></tr>

    <tr><td style="height:3px;line-height:3px;font-size:0;background-color:${GOLD};background-image:linear-gradient(90deg,#9C7A2E 0%,#F4E9CD 50%,#9C7A2E 100%);">&nbsp;</td></tr>

    <tr><td class="sl-body" style="padding:40px 52px 36px 52px;background-color:#FBF8F1;">
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${SOFT};">${escapeHtml(today)}</div>

      <div style="padding:20px 0 18px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.4;color:${INK};font-weight:bold;">${escapeHtml(companyName)}</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;line-height:1.5;color:${SOFT};padding-top:2px;">Confirmed ${escapeHtml(sponsorLabel)}</div>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:46px;height:2px;background-color:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
      <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>

      ${p(`Dear ${escapeHtml(greeting)},`)}

      <p style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};">
        <span class="sl-dropcap" style="float:left;font-family:Georgia,'Times New Roman',serif;font-size:54px;line-height:42px;color:${TEAL};padding:6px 11px 0 0;">I</span>t is official, and it is our joy to tell you so. On behalf of Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers, we are delighted to welcome <strong>${escapeHtml(companyName)}</strong> as a confirmed <strong>${escapeHtml(sponsorLabel)}</strong> of our Second Joint Conference on language access in American healthcare.
      </p>

      ${p(`Thank you for ${mission}. It genuinely means a great deal to have you standing with us.`, 20)}

      ${pledgePanel}

      ${p(`So that we can feature you properly and get every detail right, there are just three small things we would love from you.`, 18)}

      ${ask(1, "Your logo, for the website", `We would love to add <strong>${escapeHtml(companyName)}</strong> to the conference website and our on-site signage. You can upload it from your sponsor page in about a minute; a vector file (SVG or PDF), or a PNG at least 1000px wide, keeps it crisp in print and on screen.`)}
      ${ask(2, "A link to your website", `So we can link your name straight to your site, add your website on that same page.`)}
      ${ask(3, "The logistics", `We have put a short form on your sponsor page for the details, ${detailsSummary}. It takes a minute, and you can update it anytime.`)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 2px 0;">
        <tr><td align="center">
          <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="${TEAL}" style="background-color:${TEAL};border-radius:9px;">
              <a href="${materialsUrl}" style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:9px;">Complete your sponsor details &nbsp;&rarr;</a>
            </td>
          </tr></table>
          <!--[if mso]></td><td><![endif]-->
          <table role="presentation" class="sl-cta" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:6px;"><tr>
            <td align="center" bgcolor="#FBF8F1" style="background-color:#FBF8F1;border:1.5px solid ${GOLD};border-radius:9px;">
              <a href="${site}" style="display:inline-block;padding:13.5px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.4px;color:${TEAL};text-decoration:none;border-radius:9px;">See the conference</a>
            </td>
          </tr></table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td></tr>
      </table>

      ${eyebrow("Your recognition")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px 0;">
        <tr><td bgcolor="#FBF4E2" style="background-color:#FBF4E2;border:1px solid #EAD9AE;border-radius:10px;padding:16px 20px;">
          ${goldList([
            "Your name and logo on the conference website",
            "Your name and logo on signage at the conference",
            recognitionLast,
          ], "#3C2E10")}
        </td></tr>
      </table>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.7;color:${SOFT};padding:0 0 6px 0;">${taxLine}. Once your gift is complete, we will send you a formal written acknowledgment describing it for your records. Please consult your tax advisor about deductibility.</div>

      ${eyebrow("Please be our guests")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
        <tr><td bgcolor="#F2F6F6" style="background-color:#F2F6F6;border:1px solid #D9E6E8;border-left:3px solid ${TEAL};border-radius:10px;padding:16px 20px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${INK};">
            And this is our favorite part: your sponsorship includes <strong>two complimentary tickets</strong> to the conference, and we would genuinely love to have you there, whether in person in Chicago or online. It is entirely optional, but the seats are yours and you would be most welcome. Just tell us on your sponsor page whether you can join, and who the tickets are for.
          </div>
        </td></tr>
      </table>

      ${p(`There is no rush on any of this, and nothing here is set in stone. Reply anytime, straight to us at <a href="mailto:kevin@aalb.org" style="color:${LINK};text-decoration:none;">kevin@aalb.org</a>, and we will sort out the details together.`, 22)}

      <div style="font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.85;color:${INK};padding-bottom:16px;">With gratitude,</div>

      ${sig("kevin.png", "Kevin Thakkar", "Founder & Executive Director, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("iris.png", "Iris Laffitte", "Operations Manager, Americans Against Language Barriers")}
      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${sig("zachary.png", "Zachary Paul Romansky", "Lurie Children’s Language Services Department")}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0 0;border-top:1px solid #ECE3D0;">
        <tr><td align="center" style="padding:24px 0 4px 0;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#9A8B6A;padding-bottom:16px;">Presented Jointly By</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/aalb.png" alt="Americans Against Language Barriers" height="40" style="height:40px;width:auto;display:block;"></td>
            <td style="border-left:1px solid #E0D5BD;width:1px;font-size:0;">&nbsp;</td>
            <td align="center" style="padding:0 18px;"><img src="${base}/logos/lurie.png" alt="Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago" height="34" style="height:34px;width:auto;display:block;"></td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td class="sl-foot" align="center" bgcolor="${TEAL_DEEP}" style="background-color:${TEAL_DEEP};background-image:linear-gradient(180deg,${TEAL_DEEP} 0%,#0A3340 100%);padding:26px 40px 28px 40px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.5px;color:${GOLD_SOFT};">2026 Lurie Children&rsquo;s &amp; AALB Conference</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;padding-top:8px;">August 15&ndash;16, 2026 &middot; Chicago, Illinois</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#9FB6BC;">conference.aalb.org &middot; contact@aalb.org</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;letter-spacing:0.5px;color:#5F7E86;padding-top:8px;">501(c)(3) &middot; EINs 83-3016421 and 36-2170833</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:10px;">${escapeHtml(postalAddress)}</div>
      ${unsubscribeUrl ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;color:#5F7E86;padding-top:4px;">You are receiving this as a confirmed sponsor of the conference. <a href="${unsubscribeUrl}" style="color:#9FB6BC;text-decoration:underline;">Unsubscribe</a>.</div>` : ""}
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
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
    : `Your selected level is the <strong>${escapeHtml(tier.name)}</strong> at ${escapeHtml(tier.amountLabel)}, which includes ${tier.ticketsIncluded > 0 ? `${tier.ticketsIncluded} conference ticket${tier.ticketsIncluded === 1 ? "" : "s"}` : "logo recognition at the conference"}.`;
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
      Your payment may be tax-deductible as a business expense, or as a charitable contribution to the extent it exceeds the value of any benefits received. Please consult your tax advisor.
    </p>
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:8px 0 0 0;">
      If you have any questions, simply reply to this email.
    </p>
  `);
}

type SponsorAcceptedArgs = {
  firstName: string;
  companyName: string;
  tier: { name: string; amountLabel: string; ticketsIncluded: number };
  statusUrl: string;
  donatesFoodInstead: boolean;
  isExhibitor: boolean;
  benefits?: string[];
  assetBase?: string;
};

// Sent when an admin moves an application to "Awaiting payment", i.e. accepts
// it and asks the contact to pay. A celebratory, fully branded confirmation
// (hero, what's-included, conference glance), distinct from the plainer
// application-received acknowledgement.
export function sponsorAcceptedEmail({
  firstName, companyName, tier, statusUrl, donatesFoodInstead, isExhibitor, benefits, assetBase,
}: SponsorAcceptedArgs) {
  const first = firstName || "there";
  const ticketLine = tier.ticketsIncluded
    ? `${tier.ticketsIncluded} conference ${tier.ticketsIncluded === 1 ? "ticket" : "tickets"}`
    : "Recognition at the conference";
  const roleLine = isExhibitor
    ? `It is our pleasure to welcome <strong>${escapeHtml(companyName)}</strong> as an <strong>exhibitor</strong> at the 2nd Joint Conference of Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers, August 15 and 16, 2026, in Chicago.`
    : `It is our pleasure to welcome <strong>${escapeHtml(companyName)}</strong> as a <strong>${escapeHtml(tier.name)}</strong> of the 2nd Joint Conference of Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers, August 15 and 16, 2026, in Chicago.`;
  const payCallout = donatesFoodInstead
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:#f8fafc;border-left:3px solid ${GOLD};padding:16px 18px;border-radius:6px;">
        <div style="font-size:11px;letter-spacing:0.14em;font-weight:700;color:${GOLD};text-transform:uppercase;">Next step</div>
        <div style="font-size:14.5px;line-height:1.6;color:${TEXT};margin-top:5px;">You opted to donate food in kind, so there is nothing to pay. Our team will be in touch to coordinate menu, quantities, and logistics.</div>
      </td></tr></table>`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:#f8fafc;border-left:3px solid ${BLUE};padding:16px 18px;border-radius:6px;">
        <div style="font-size:11px;letter-spacing:0.14em;font-weight:700;color:${BLUE};text-transform:uppercase;">One step left</div>
        <div style="font-size:14.5px;line-height:1.6;color:${TEXT};margin-top:5px;">Complete your payment of <strong>${escapeHtml(tier.amountLabel)}</strong> to secure ${isExhibitor ? "your table" : "your place"}.${isExhibitor ? " You&rsquo;ll confirm your table representative and details on the way." : ""}</div>
      </td></tr></table>`;
  return shell(`
    ${heroBanner()}
    <h1 style="font-size:24px;font-weight:800;margin:0 0 14px 0;letter-spacing:-0.01em;">Congratulations, ${escapeHtml(first)}. You&rsquo;re confirmed.</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 6px 0;">
      ${roleLine}
    </p>

    ${payCallout}

    ${donatesFoodInstead ? "" : button(statusUrl, isExhibitor ? "Complete your details &amp; payment" : "Complete your payment")}

    ${sectionHeading(isExhibitor ? "Your exhibitor table" : "Your sponsorship")}
    ${glanceCard([
      { label: isExhibitor ? "Participation" : "Level", value: escapeHtml(tier.name) },
      { label: donatesFoodInstead ? "Contribution" : "Investment", value: donatesFoodInstead ? "Food donated in kind" : escapeHtml(tier.amountLabel) },
      { label: "Includes", value: ticketLine },
    ])}

    ${benefits && benefits.length ? `${sectionHeading("What&rsquo;s included")}${bulletList(benefits)}` : ""}

    ${sectionHeading("Conference at a Glance")}
    ${glanceCard(GLANCE_ROWS)}

    <p style="font-size:14.5px;line-height:1.7;color:${TEXT};margin:18px 0 0 0;">
      Thank you for standing with us for language access in healthcare. If you have any questions, simply reply to this email and we&rsquo;ll be glad to help.
    </p>

    ${signOff()}

    ${logoLockup(assetBase)}

    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;padding-top:14px;border-top:1px solid #eef1f4;">
      Your payment may be tax-deductible as a business expense, or as a charitable contribution to the extent it exceeds the value of any benefits received. Please consult your tax advisor.
    </p>
  `);
}

type SponsorPaidArgs = {
  firstName: string;
  companyName: string;
  tierName: string;
  amountCents: number;
  statusUrl: string;
  isExhibitor?: boolean;
  ticketsIncluded?: number;
  wantsLogo?: boolean;
  hasLogo?: boolean;
  registreeName?: string | null;
  benefits?: string[];
  assetBase?: string;
};

// Sent the moment a sponsor/exhibitor payment is confirmed. Fully branded
// receipt that reflects back exactly what we already have from them, so it never
// asks for something they've already given (e.g. a logo they uploaded).
export function sponsorPaidEmail({
  firstName, companyName, tierName, amountCents, statusUrl,
  isExhibitor = false, ticketsIncluded = 0, wantsLogo = false, hasLogo = false,
  registreeName = null, benefits, assetBase,
}: SponsorPaidArgs) {
  const first = firstName || "there";
  const isComplimentary = amountCents === 0;
  const amount = isComplimentary
    ? "Complimentary"
    : `$${(amountCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const receiptSentence = isComplimentary
    ? `Your complimentary ${isExhibitor ? "table" : "sponsorship"} is all set, there is nothing to pay.`
    : `Your payment of <strong>${escapeHtml(amount)}</strong> has been received, and this email is your receipt.`;
  const ticketLine = ticketsIncluded
    ? `${ticketsIncluded} conference ${ticketsIncluded === 1 ? "ticket" : "tickets"}`
    : "Recognition at the conference";

  // Reflect back what we already hold, so the email is accurate per recipient.
  const onFile: string[] = [];
  if (isExhibitor && registreeName) {
    onFile.push(`<strong>Table representative:</strong> ${escapeHtml(registreeName)}`);
  }
  if (hasLogo) {
    onFile.push(`<strong>Logo:</strong> received. We&rsquo;ll feature ${escapeHtml(companyName)} on the conference website, and you can view or replace it from your portal.`);
  } else if (wantsLogo) {
    onFile.push(`<strong>Logo:</strong> you asked to be featured on the site, but we don&rsquo;t have a file yet. Upload it from your portal whenever you&rsquo;re ready.`);
  }

  const logoOutstanding = wantsLogo && !hasLogo;
  const nextLine = isExhibitor
    ? `Closer to the conference we&rsquo;ll send your tickets, table setup and load-in details, and the final schedule.${logoOutstanding ? " The one thing we still need from you is your logo." : " Nothing else is needed from you right now."}`
    : `Closer to the conference we&rsquo;ll send your tickets, recognition placement, and the final schedule.${logoOutstanding ? " The one thing we still need from you is your logo." : " Nothing else is needed from you right now."}`;

  return shell(`
    ${heroBanner()}
    <h1 style="font-size:24px;font-weight:800;margin:0 0 14px 0;letter-spacing:-0.01em;">You&rsquo;re all set, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 6px 0;">
      ${escapeHtml(companyName)} is confirmed as ${isExhibitor ? "an <strong>exhibitor</strong>" : `a <strong>${escapeHtml(tierName)}</strong>`} at the 2nd Joint Conference of Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers, August 15 and 16, 2026, in Chicago. ${receiptSentence}
    </p>

    ${sectionHeading(isExhibitor ? "Your exhibitor table" : "Your sponsorship")}
    ${glanceCard([
      { label: isExhibitor ? "Participation" : "Level", value: isExhibitor ? "Exhibitor" : escapeHtml(tierName) },
      { label: isComplimentary ? "Cost" : "Paid", value: escapeHtml(amount) },
      { label: "Includes", value: ticketLine },
    ])}

    ${onFile.length ? `${sectionHeading("What we have from you")}${bulletList(onFile)}` : ""}

    ${sectionHeading("What happens next")}
    <p style="font-size:14.5px;line-height:1.7;color:${TEXT};margin:0 0 16px 0;">${nextLine}</p>

    ${button(statusUrl, "View your portal")}

    ${benefits && benefits.length ? `${sectionHeading("What&rsquo;s included")}${bulletList(benefits)}` : ""}

    ${sectionHeading("Conference at a Glance")}
    ${glanceCard(GLANCE_ROWS)}

    <p style="font-size:14.5px;line-height:1.7;color:${TEXT};margin:18px 0 0 0;">
      Thank you for standing with us for language access in healthcare. Questions about anything above? Just reply to this email and we&rsquo;ll be glad to help.
    </p>

    ${signOff()}

    ${logoLockup(assetBase)}

    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;padding-top:14px;border-top:1px solid #eef1f4;">
      ${isComplimentary
        ? `This ${isExhibitor ? "table" : "sponsorship"} is complimentary, so there is nothing to pay. Keep this email for your records.`
        : "Your payment may be tax-deductible as a business expense, or as a charitable contribution to the extent it exceeds the value of any benefits received; consult your tax advisor. Keep this email as your receipt."}
    </p>
  `);
}

type SponsorLogoRequestArgs = {
  firstName: string;
  companyName: string;
  statusUrl: string;
  // Whether a logo already exists on file; the copy must not claim we have a
  // low-resolution logo when we have none at all.
  hasLogoOnFile?: boolean;
  assetBase?: string;
};

// Admin-triggered request for a print/web quality logo, with a one-click path to
// upload it from the portal, so the team stops chasing logos by hand.
export function sponsorLogoRequestEmail({
  firstName, companyName, statusUrl, hasLogoOnFile = true, assetBase,
}: SponsorLogoRequestArgs) {
  const first = firstName || "there";
  const situation = hasLogoOnFile
    ? `The logo we have on file is a little low-resolution for print and large-screen use, so we&rsquo;d love a higher-quality version.`
    : `We don&rsquo;t yet have a logo on file for you, and we&rsquo;d love one so your organization is represented properly.`;
  return shell(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.01em;">A quick logo request, ${escapeHtml(first)}.</h1>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 14px 0;">
      We&rsquo;re putting together the conference materials and want to feature ${escapeHtml(companyName)} at its best. ${situation}
    </p>
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:0 0 6px 0;">Ideally:</p>
    ${bulletList([
      "Vector if you have it (.SVG, .EPS, .AI, or .PDF), which scales to any size with no quality loss",
      "Otherwise a PNG at least 1000px wide, with a transparent background",
      "A horizontal version if one exists",
    ])}
    <p style="font-size:15px;line-height:1.7;color:${TEXT};margin:14px 0 16px 0;">
      The fastest way is to upload it right from your portal:
    </p>
    ${button(statusUrl, "Upload your logo")}
    <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:18px 0 0 0;">
      Prefer email? Just reply to this message with the file attached and we&rsquo;ll take it from there.
    </p>
    ${signOff()}
    ${logoLockup(assetBase)}
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
      { label: "Review", value: "Proposals are reviewed on a rolling basis; we reply within two weeks" },
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
      Your ${durationMin}-minute conversation${title ? ` (${escapeHtml(title)})` : ""} with <strong>${escapeHtml(hostName)}</strong> is confirmed.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px 0;"><tr><td style="background:#f8fafc;border-left:3px solid ${TEAL};padding:14px 18px;border-radius:6px;">
      <div style="font-size:11px;letter-spacing:0.08em;font-weight:700;color:${TEAL};text-transform:uppercase;">When</div>
      <div style="font-size:16px;font-weight:700;color:${TEXT};margin-top:4px;">${formatMeetingWhen(startAt, tz)}</div>
    </td></tr></table>
    ${joinUrl
      ? button(joinUrl, "Join the Zoom meeting")
      : `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 0 0;"><tr><td style="background:#f8fafc;border-left:3px solid ${BLUE};padding:14px 18px;border-radius:6px;">
          <div style="font-size:14px;color:${TEXT};line-height:1.6;">We&rsquo;ll be in touch by email with your <strong>Zoom link</strong> ahead of the meeting.</div>
        </td></tr></table>`}
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
      <strong>${escapeHtml(inviteeName)}</strong> (<a href="mailto:${escapeHtml(inviteeEmail)}" style="color:${BLUE};">${escapeHtml(inviteeEmail)}</a>) booked a ${durationMin}-minute conversation${title ? ` (${escapeHtml(title)})` : ""} with you.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px 0;"><tr><td style="background:#f8fafc;border-left:3px solid ${TEAL};padding:14px 18px;border-radius:6px;">
      <div style="font-size:11px;letter-spacing:0.08em;font-weight:700;color:${TEAL};text-transform:uppercase;">When (your time)</div>
      <div style="font-size:16px;font-weight:700;color:${TEXT};margin-top:4px;">${formatMeetingWhen(startAt, tz)}</div>
    </td></tr></table>
    ${startUrl ? button(startUrl, "Start the Zoom meeting") : joinUrl ? button(joinUrl, "Join the Zoom meeting") : `<p style="font-size:14px;color:${MUTED};margin:16px 0 0 0;">Zoom link wasn&rsquo;t created automatically. Set one up and share it with the invitee.</p>`}
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

// ---------------------------------------------------------------------------
// PLAIN personal notes.
//
// The engraved letters photographed beautifully and converted poorly: heavy
// designed HTML reads as "marketing" both to Gmail's Promotions classifier
// and to the reader. These render as a short email a person typed: white
// background, system sans, no images, no buttons, a couple of plain text
// links, signed by one human. Copy rules, learned the hard way: no em dashes,
// no poetic flourishes, contractions and parentheses like real correspondence,
// straight apostrophes, hyphenated date ranges. Details before the ask: the
// note gives the keynote, the venue, the CE hours, and a link to browse the
// program on the conference site, and only then the sign-up link. Subjects
// stay on the same A/B variant sets. The engraved renderers remain above,
// unused by the send path.

function plainNoteEmail({
  firstName,
  paras,
  footerReason,
  unsubscribeUrl,
  siteUrl,
}: {
  firstName: string;
  // Pre-composed paragraph HTML: composers escape all user-derived text.
  paras: string[];
  footerReason: string;
  unsubscribeUrl?: string | null;
  // Conference home, for the signature link. Falls back to the public site.
  siteUrl?: string | null;
}) {
  const postalAddress = process.env.MAIL_POSTAL_ADDRESS?.trim() || "Americans Against Language Barriers, Chicago, IL";
  const site = (siteUrl || "https://conference.aalb.org").replace(/\/$/, "");
  const first = escapeHtml((firstName || "there").trim());
  // Sign as the person the email is actually From. attendeeFromHeader() puts
  // ATTENDEE_FROM_NAME (default: Kevin) in the recipient's inbox; an email
  // displayed as from one person and signed by another reads as fake. The
  // "Name, Title" format is split for the signature block. Mirrors
  // ATTENDEE_FROM_NAME_DEFAULT in lib/attendees (importing it here would be
  // circular).
  const fromName = (process.env.ATTENDEE_FROM_NAME || "Kevin Thakkar, Founder & Executive Director").trim();
  const commaAt = fromName.indexOf(",");
  const signerFull = escapeHtml(commaAt > 0 ? fromName.slice(0, commaAt).trim() : fromName);
  const signerTitle = escapeHtml(commaAt > 0 ? fromName.slice(commaAt + 1).trim() : "");
  const signerFirst = escapeHtml((commaAt > 0 ? fromName.slice(0, commaAt) : fromName).trim().split(/\s+/)[0] || "");
  const p = (html: string) =>
    `<p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:14.5px;line-height:1.75;color:#111827;">${html}</p>`;
  // No hidden preheader on purpose: the inbox preview should show the real
  // first line of the note, the way a personal email would.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>2026 Lurie Children's &amp; AALB Conference</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:96%;"><tr><td align="left" style="padding:26px 12px 30px 12px;">
    ${p(`Hi ${first},`)}
    ${paras.map((x) => p(x)).join("\n    ")}
    ${p(`If you have any questions, just reply to this email.`)}
    ${p(`${signerFirst}<br><span style="font-size:12.5px;color:#6B7280;">${signerFull}${signerTitle ? `<br>${signerTitle}` : ""}<br>Americans Against Language Barriers<br><a href="${site}" style="color:#6B7280;">conference.aalb.org</a></span>`)}
    ${p(`P.S. Registering takes about two minutes.`)}
    <p style="margin:26px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;line-height:1.6;color:#9CA3AF;">${footerReason} ${escapeHtml(postalAddress)}.${unsubscribeUrl ? ` <a href="${unsubscribeUrl}" style="color:#9CA3AF;">Unsubscribe</a>` : ""}</p>
  </td></tr></table>
</td></tr></table>
</body>
</html>`;
}

const PLAIN_LINK = "color:#1D4ED8;";

// Shared keynote paragraph: the one thing every audience should know.
const PLAIN_KEYNOTE_PARA = `This year the keynote is from The Joint Commission, whose standards nearly every hospital in America has to meet: "The Standards That Protect Patients: A Joint Commission View on Language Access." And Michael Mul&eacute;, who led language access enforcement at the U.S. Department of Justice, Civil Rights Division, is speaking too. Hospital standards and federal civil rights law, on the same stage.`;

// Where it happens, that there's a stream, the CE hours, and a link to the
// conference site so the reader can browse speakers and sessions before any
// ask. Every plain note carries this: an invite whose only link is checkout
// asks people to pay sight unseen.
function plainDetailsPara(siteUrl?: string | null): string {
  const site = (siteUrl || "https://conference.aalb.org").replace(/\/$/, "");
  return `It's two days at Ann &amp; Robert H. Lurie Children's Hospital of Chicago, with a live stream if you'd rather join from home, and over ten hours of CEUs, which will be accredited by NBCMI and CCHI. The full lineup, from Wilma Alvarado-Little (New York State Department of Health) to Yuliya Speroff (AALB's 2024 Trainer of the Year), is at <a href="${site}" style="${PLAIN_LINK}">conference.aalb.org</a> if you want to look around first.`;
}

// "Spanish, English" -> "Spanish and English", for the returning roster's
// language line. Null unless languagesWorthNaming() says the string names a
// real pair, so the line never renders for blank or English-only records.
function plainLanguagesList(s: string | null | undefined): string | null {
  if (!languagesWorthNaming(s)) return null;
  const parts = (s || "").split(/[,\/&+]+/).map((t) => t.trim()).filter(Boolean);
  if (!parts.length) return null;
  const names = parts.map(escapeHtml);
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}

// The ask, always last: the note builds the case (keynote, program, venue)
// BEFORE the price list, and the price before the ask. It names the effort
// (about two minutes) because unstated effort is friction. The link carries the discount by
// itself; the first-name fallback code (ensureFirstNameCode) still works on
// the main site but the email doesn't need to explain it.
function plainCtaPara(url: string, discountPercent: number): string {
  return discountPercent > 0
    ? `<strong><a href="${url}" style="${PLAIN_LINK}">Sign up here</a></strong>. Your personal invitation rate is already built into the link.`
    : `<strong><a href="${url}" style="${PLAIN_LINK}">Sign up here</a></strong>.`;
}

// 2024-roster reunion note: opening keyed to what they actually did in 2024.
export function plainReturningInviteEmail(args: AttendeeReturningArgs) {
  const { firstName, url, discountPercent, inviteMessage, unsubscribeUrl, returning2024, attended2024Mode } = args;
  const paid = returning2024 === "paid";
  const inPerson = attended2024Mode === "in-person";
  const paras: string[] = [];
  paras.push(
    paid
      ? (inPerson
        ? `You came to AALB's first conference with Lurie Children's back in 2024. We're doing the second one <strong>August 15-16</strong> in Chicago and I'd love to see you there again.`
        : `You watched AALB's first conference with Lurie Children's on the live stream in 2024. The second one is <strong>August 15-16</strong>, and the stream is back if you can't make it to Chicago.`)
      : // Attempted and lead read the same. Neither paid, so "signed up" or
        // "registered" would overstate: they indicated interest, and that's
        // the phrase (user-chosen). No checkout talk, no registration-status
        // talk; nobody wants their payment history recapped in an invitation.
        `You had indicated your interest in AALB's first conference with Lurie Children's back in 2024, but didn't end up signing up. The second one is <strong>August 15-16</strong> in Chicago, and it streams live too. I'd love to have you with us this time.`
  );
  const note = (inviteMessage || "").trim();
  if (note) paras.push(escapeHtml(note).replace(/\n/g, "<br>"));
  // The 2024 roster told us their language pair; use it. One sentence tying
  // the keynote's standards to their actual work, only when we can name a
  // real pair.
  const langs = plainLanguagesList(args.primaryLanguages);
  paras.push(langs ? `${PLAIN_KEYNOTE_PARA} The work those standards protect is the interpreting you do in ${langs}.` : PLAIN_KEYNOTE_PARA);
  paras.push(plainDetailsPara(args.learnMoreUrl));
  paras.push(plainCtaPara(url, discountPercent));
  return plainNoteEmail({
    firstName,
    paras,
    footerReason: "You're getting this because you registered for our 2024 conference.",
    unsubscribeUrl,
    siteUrl: args.learnMoreUrl,
  });
}

// AALB community note (alumni, current students, former students).
export function plainCommunityInviteEmail(args: AttendeeInviteArgs) {
  const { firstName, url, discountPercent, inviteMessage, unsubscribeUrl } = args;
  const rel = args.relationship || "alumnus";
  const paras: string[] = [];
  paras.push(
    rel === "student"
      ? `You're in our interpreter training right now, so I wanted to invite you personally: AALB's conference with Lurie Children's is <strong>August 15-16</strong> in Chicago, and it streams live too.`
      : rel === "former-student"
      ? `You did our 40-hour interpreter training, so I wanted to invite you personally: AALB's conference with Lurie Children's is <strong>August 15-16</strong> in Chicago, and it streams live too.`
      : `You got your certificate with us, so I wanted to invite you personally: AALB's conference with Lurie Children's is <strong>August 15-16</strong> in Chicago, and it streams live too.`
  );
  const note = (inviteMessage || "").trim();
  if (note) paras.push(escapeHtml(note).replace(/\n/g, "<br>"));
  paras.push(PLAIN_KEYNOTE_PARA);
  paras.push(
    rel === "alumnus"
      ? `It's also the easiest place all year to catch up with the people you trained with.`
      : `Martti and LanguageLine will have tables there, plus the hospital language access people who do the hiring.`
  );
  paras.push(plainDetailsPara(args.learnMoreUrl));
  paras.push(plainCtaPara(url, discountPercent));
  return plainNoteEmail({
    firstName,
    paras,
    footerReason: "You're getting this because you trained with AALB.",
    unsubscribeUrl,
    siteUrl: args.learnMoreUrl,
  });
}

// Standard one-off invite for everyone outside the AALB/2024 rosters.
export function plainStandardInviteEmail(args: AttendeeInviteArgs) {
  const { firstName, url, discountPercent, inviteMessage, unsubscribeUrl } = args;
  const paras: string[] = [];
  paras.push(
    `I'd like to invite you to the conference Americans Against Language Barriers (AALB) is putting on with Lurie Children's about language access in American healthcare. It's <strong>August 15-16</strong> in Chicago, and it streams live too.`
  );
  const note = (inviteMessage || "").trim();
  if (note) paras.push(escapeHtml(note).replace(/\n/g, "<br>"));
  paras.push(PLAIN_KEYNOTE_PARA);
  paras.push(plainDetailsPara(args.learnMoreUrl));
  paras.push(plainCtaPara(url, discountPercent));
  return plainNoteEmail({
    firstName,
    paras,
    footerReason: "You're getting this because we thought this conference might interest you.",
    unsubscribeUrl,
    siteUrl: args.learnMoreUrl,
  });
}

// NBCMI registry note: certified medical interpreters we have no prior
// relationship with. The opener names their credential (the reason they're
// hearing from us) and the details paragraph carries the CEU hours, which is
// what recertification actually runs on.
export function plainCmiInviteEmail(args: AttendeeInviteArgs) {
  const { firstName, url, discountPercent, inviteMessage, unsubscribeUrl } = args;
  const paras: string[] = [];
  paras.push(
    // The registry export is a snapshot, so don't assert the credential is
    // current: "you've been certified" stays true even if it lapsed.
    `You've been certified as a medical interpreter through NBCMI, so I wanted to invite you to the conference Americans Against Language Barriers (AALB) is putting on with Lurie Children's about language access in American healthcare. It's <strong>August 15-16</strong> in Chicago, and it streams live too.`
  );
  const note = (inviteMessage || "").trim();
  if (note) paras.push(escapeHtml(note).replace(/\n/g, "<br>"));
  paras.push(PLAIN_KEYNOTE_PARA);
  paras.push(plainDetailsPara(args.learnMoreUrl));
  // Their code is their own first name (ensureFirstNameCode creates it at
  // queue time): a branded campaign code reads as a mass blast, a name reads
  // as an invitation. Shown in normal casing; checkout normalizes.
  const cmiSite = (args.learnMoreUrl || "https://conference.aalb.org").replace(/\/$/, "");
  paras.push(
    discountPercent > 0
      ? `<strong><a href="${url}" style="${PLAIN_LINK}">Sign up here</a></strong> and your ${discountPercent}% comes off automatically, or learn more first at <a href="${cmiSite}" style="${PLAIN_LINK}">conference.aalb.org</a>. If you register from the main site, just use your name (${escapeHtml((firstName || "").trim())}) as your code.`
      : `<strong><a href="${url}" style="${PLAIN_LINK}">Sign up here</a></strong>, or learn more first at <a href="${cmiSite}" style="${PLAIN_LINK}">conference.aalb.org</a>.`
  );
  return plainNoteEmail({
    firstName,
    paras,
    footerReason: "You're getting this because you were listed on the National Board of Certification for Medical Interpreters public registry.",
    unsubscribeUrl,
    siteUrl: args.learnMoreUrl,
  });
}
