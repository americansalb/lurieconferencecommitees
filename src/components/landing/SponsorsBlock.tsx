"use client";

import { useCallback, useState } from "react";
import { Award, Briefcase, ArrowRight, Users, Eye, HeartHandshake } from "lucide-react";
import { TOKENS, CONFERENCE } from "./tokens";

// Confirmed exhibitors / sponsors shown on the landing page. Add entries here
// as they come in; the "joined by" strip scales gracefully from one upward.
// Drop each logo file in /public/partners/. If a logo file is missing, the
// card falls back to the partner's name so nothing renders broken.
type Partner = { name: string; logo: string; role?: string; url?: string };

const PARTNERS: Partner[] = [
  // Order matters: the strip wraps 3-across. Sponsorship levels lead (Silver,
  // then exhibitors and the Food Sponsor); partner-level recognitions and
  // Supporters sit last, so they land in the rows below.
  { name: "Propio", logo: "", role: "Silver Sponsor", url: "https://propio.com" },
  { name: "CommunityHealth", logo: "/partners/communityhealth.webp", role: "Exhibitor", url: "https://www.communityhealth.org" },
  { name: "Certification Commission for Healthcare Interpreters", logo: "/partners/cchi.webp", role: "Exhibitor", url: "https://cchicertification.org" },
  { name: "The Chicago Diner", logo: "/partners/chicago-diner.png", role: "Food Sponsor", url: "https://www.veggiediner.com" },
  { name: "LanguageLine Solutions", logo: "/partners/languageline.png", role: "Exhibitor", url: "https://www.languageline.com" },
  { name: "Multilingual Connections", logo: "/partners/multilingual-connections.svg", role: "Exhibitor", url: "https://multilingualconnections.com" },
  { name: "Martti, an Equiti Solution", logo: "/partners/martti.png", role: "Exhibitor", url: "https://equitihealth.com" },
  { name: "Language Lizard", logo: "/partners/language-lizard.png", role: "Health Education Partner", url: "https://www.languagelizard.com" },
  { name: "National Captioning Institute", logo: "", role: "Captioning Sponsor", url: "https://www.ncicap.org" },
  { name: "Cross-Cultural Communications", logo: "/partners/cross-cultural-communications.png", role: "Supporter", url: "https://cultureandlanguage.net" },
  { name: "En-Vision America", logo: "", role: "Supporter", url: "https://www.envisionamerica.com" },
];

// Each sponsorship level gets its own band. `featured` gives the paid
// sponsorship levels a larger card, so the hierarchy is visible rather than
// only stated in the caption underneath.
const GROUPS: { heading: string; roles: string[]; featured?: boolean }[] = [
  { heading: "Silver Sponsor", roles: ["Silver Sponsor"], featured: true },
  { heading: "Food Sponsor", roles: ["Food Sponsor"], featured: true },
  { heading: "Captioning Sponsor", roles: ["Captioning Sponsor"], featured: true },
  { heading: "Exhibitors", roles: ["Exhibitor"] },
  { heading: "Partners & Supporters", roles: ["Health Education Partner", "Supporter"] },
];

const BENEFITS = [
  { icon: Users, title: "A national audience", body: "Interpreters, clinicians, administrators, language service providers, and policy leaders from across the country." },
  { icon: Eye, title: "Real visibility", body: "Your brand featured across the conference, on-site and in front of a highly engaged room." },
  { icon: HeartHandshake, title: "A shared mission", body: "Stand with two trusted institutions advancing language access in healthcare." },
];

// Sponsor records are keyed by whatever the organization typed into their own
// application ("Propio Language Services"), while this list uses the short name
// the logo actually shows ("Propio"). Exact-match lookup silently dropped real
// artwork on the floor and left a paid sponsor rendered as plain text, so match
// on the squashed name and allow one to be a prefix of the other.
const norm = (s: string) => s.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "");

function resolveLogo(name: string, uploaded: Record<string, string>): string | null {
  if (uploaded[name]) return uploaded[name];
  const n = norm(name);
  if (!n) return null;
  for (const [key, url] of Object.entries(uploaded)) {
    const k = norm(key);
    // 4 characters keeps an acronym like "CCHI" from matching everything.
    if (k === n || (k.length >= 4 && n.startsWith(k)) || (n.length >= 4 && k.startsWith(n))) return url;
  }
  return null;
}

// Logos a sponsor uploaded through their own portal, or that the team put on
// file for them. Passed in from the server page, which reads them from the
// database, so a partner's real artwork appears the moment it lands and nobody
// has to commit a file. A local file in /public/partners stays the fallback for
// the ones who predate that.
export default function SponsorsBlock({ uploadedLogos = {} }: { uploadedLogos?: Record<string, string> }) {
  return (
    <section
      id="sponsors"
      className="relative py-28 sm:py-36 overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${TOKENS.paper} 0%, #F6F1E6 100%)` }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 100% at 50% 0%, rgba(201,161,75,0.10) 0%, transparent 70%)` }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <Eyebrow>Partners &amp; Sponsors</Eyebrow>
          <h2 className="mt-6 text-4xl sm:text-5xl md:text-[58px] font-bold leading-[1.05] tracking-tight" style={{ color: TOKENS.ink }}>
            Partner{" "}
            <span className="italic font-medium" style={{ color: TOKENS.teal }}>with us.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg leading-relaxed" style={{ color: TOKENS.muted }}>
            Sponsorship and exhibitor opportunities support the conference and reach a national audience of interpreters, clinicians, healthcare administrators, language service providers, and policy leaders.
          </p>
        </div>

        {/* Why partner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-16 max-w-5xl mx-auto">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl bg-white p-6 text-left"
              style={{ border: `1px solid ${TOKENS.hairline}`, boxShadow: "0 8px 22px -14px rgba(11,31,37,0.12)" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: TOKENS.tealSoft, color: TOKENS.teal }}>
                <b.icon className="w-5 h-5" />
              </div>
              <h3 className="text-[17px] font-bold mb-1.5" style={{ color: TOKENS.ink }}>{b.title}</h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: TOKENS.muted }}>{b.body}</p>
            </div>
          ))}
        </div>

        {/* Joined by, grouped so each level reads as its own standing. */}
        {PARTNERS.length > 0 && (
          <div className="mb-16">
            <p className="text-center text-[11px] font-bold tracking-[0.28em] uppercase mb-9" style={{ color: TOKENS.mutedSoft }}>
              Proud to be joined by
            </p>
            {GROUPS.map((g) => {
              const members = PARTNERS.filter((p) => g.roles.includes(p.role || ""));
              if (!members.length) return null;
              return (
                <div key={g.heading} className="mb-11 last:mb-0">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <span className="block h-px w-8 sm:w-12 rounded-full" style={{ background: TOKENS.gold, opacity: 0.5 }} />
                    <span className="text-[11px] font-bold tracking-[0.26em] uppercase whitespace-nowrap" style={{ color: TOKENS.gold }}>
                      {g.heading}
                    </span>
                    <span className="block h-px w-8 sm:w-12 rounded-full" style={{ background: TOKENS.gold, opacity: 0.5 }} />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {members.map((p) => (
                      <PartnerLogo key={p.name} partner={{ ...p, logo: resolveLogo(p.name, uploadedLogos) || p.logo }} featured={g.featured} showRole={g.roles.length > 1} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/sponsor"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${TOKENS.tealDark} 0%, ${TOKENS.teal} 100%)`, boxShadow: "0 12px 28px -12px rgba(14,68,86,0.45)" }}
          >
            <Award className="w-4 h-4" /> Become a Sponsor
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/sponsor"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold bg-white transition-colors"
            style={{ border: `1.5px solid ${TOKENS.teal}`, color: TOKENS.teal }}
          >
            <Briefcase className="w-4 h-4" /> Become an Exhibitor
          </a>
        </div>

        {/* Entry-level acknowledgment option. */}
        <div className="mt-10 max-w-2xl mx-auto text-center">
          <div
            className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl px-5 py-4 bg-white"
            style={{ border: `1px solid ${TOKENS.hairline}`, boxShadow: "0 8px 22px -16px rgba(11,31,37,0.18)" }}
          >
            <span className="text-[13px]" style={{ color: TOKENS.muted }}>Just want your logo seen?</span>
            <a href="/sponsor" className="text-[13px] font-bold" style={{ color: TOKENS.teal }}>
              Become a Supporter for $450 &rarr;
            </a>
            <span className="text-[13px]" style={{ color: TOKENS.muted }}>your logo on the website and on-site.</span>
          </div>
          <p className="mt-5 text-[12.5px] leading-relaxed" style={{ color: TOKENS.mutedSoft }}>
            The conference is presented jointly by Lurie Children&rsquo;s and Americans Against Language
            Barriers, both 501(c)(3) nonprofits (EINs {CONFERENCE.eins}). The $450 Supporter level is logo
            recognition only, with no tickets or other benefits, so it is generally fully tax-deductible. For
            sponsorship and exhibitor levels that include tickets or a table, your payment may be deductible as
            a business expense, or as a charitable contribution to the extent it exceeds the value of those
            benefits. Please consult your tax advisor.
          </p>
        </div>
      </div>
    </section>
  );
}

function PartnerLogo({ partner, featured = false, showRole = true }: { partner: Partner; featured?: boolean; showRole?: boolean }) {
  // If the logo file hasn't been added yet, show the partner's name instead of
  // a broken image, so a confirmed exhibitor can be listed before their art
  // lands.
  const [logoFailed, setLogoFailed] = useState(false);
  // onError alone is not enough. The browser starts fetching the image while
  // parsing the server-rendered HTML, so a missing file can fail before React
  // hydrates and attaches the handler, and the card is left showing a broken
  // image icon forever. Re-check the element once on mount: a finished load
  // with zero width is a failed one.
  const checkLoaded = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0) setLogoFailed(true);
  }, []);
  const hasArtwork = !!partner.logo;
  // Every card is the SAME fixed size (yielding to the viewport on narrow
  // phones), and each logo scales to fit an identical box via object-contain,
  // so no logo's shape can change its card. Content-sized cards made the
  // strip read as a jumble of mismatched tiles.
  // A name-only card should not reserve a logo's worth of empty space. Without
  // this, a sponsor whose artwork hasn't landed yet gets a large blank card with
  // one word floating in it, which reads as a broken image rather than a name.
  const nameOnly = logoFailed || !hasArtwork;
  const inner = (
    <div
      className={`rounded-[22px] p-[1.5px] max-w-full ${featured && !nameOnly ? "w-[420px]" : "w-[320px]"}`}
      style={{
        background: `linear-gradient(135deg, ${TOKENS.gold} 0%, ${TOKENS.goldSoft} 48%, ${TOKENS.gold} 100%)`,
        boxShadow: "0 22px 48px -24px rgba(201,161,75,0.42), 0 4px 14px -8px rgba(11,31,37,0.14)",
      }}
    >
      <div className={`bg-white rounded-[20px] flex flex-col items-center justify-center px-8 w-full ${nameOnly ? "py-6" : "py-8 sm:py-9"}`}>
        {nameOnly ? (
          <div className="flex items-center font-extrabold tracking-tight text-center text-xl sm:text-2xl leading-tight" style={{ color: TOKENS.ink }}>
            {partner.name}
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            ref={checkLoaded}
            src={partner.logo}
            alt={partner.name}
            onError={() => setLogoFailed(true)}
            className={`w-full object-contain ${featured ? "h-20 sm:h-[92px]" : "h-16 sm:h-[72px]"}`}
          />
        )}
        {partner.role && showRole && (
          <>
            <span className="mt-5 mb-3.5 block h-px w-10 rounded-full" style={{ background: TOKENS.gold, opacity: 0.55 }} />
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: TOKENS.gold }}>
              {partner.role}
            </div>
          </>
        )}
      </div>
    </div>
  );
  return partner.url
    ? <a href={partner.url} target="_blank" rel="noopener noreferrer" className="block max-w-full transition-transform hover:-translate-y-0.5">{inner}</a>
    : inner;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="w-8 h-px" style={{ background: TOKENS.gold }} />
      <span className="text-[10px] font-bold tracking-[0.32em] uppercase" style={{ color: TOKENS.gold }}>
        {children}
      </span>
      <span className="w-8 h-px" style={{ background: TOKENS.gold }} />
    </div>
  );
}
