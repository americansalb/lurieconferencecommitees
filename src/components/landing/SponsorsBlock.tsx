"use client";

import { useCallback, useState } from "react";
import { Award, Briefcase, ArrowRight, Users, Eye, HeartHandshake, UtensilsCrossed, Captions, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

// Each level gets its own band, and the bands are not interchangeable: a
// Silver Sponsor and a $450 Supporter should not be presented identically just
// because they both have a logo. Three things carry the rank, so it reads at a
// glance instead of depending on the caption:
//
//   size   how much room the logo gets
//   frame  silver metal for the cash sponsorship level, gold for the partners
//          who cover a line item, a quiet hairline for everyone else
//   the heading, which is a lit chip at the top of the ladder and a plain
//   label at the bottom
type Size = "hero" | "feature" | "standard" | "compact";
type Frame = "silver" | "gold" | "plain";

const GROUPS: {
  heading: string;
  roles: string[];
  size: Size;
  frame: Frame;
  icon?: LucideIcon;
  note?: string;
}[] = [
  { heading: "Silver Sponsor", roles: ["Silver Sponsor"], size: "hero", frame: "silver", icon: Award },
  { heading: "Food Sponsor", roles: ["Food Sponsor"], size: "feature", frame: "gold", icon: UtensilsCrossed },
  { heading: "Captioning Sponsor", roles: ["Captioning Sponsor"], size: "feature", frame: "gold", icon: Captions },
  { heading: "Exhibitors", roles: ["Exhibitor"], size: "standard", frame: "plain", icon: Store },
  { heading: "Partners & Supporters", roles: ["Health Education Partner", "Supporter"], size: "compact", frame: "plain" },
];

// Silver reads as actual metal rather than grey, so the top band is visibly
// richer than the gold ones without shouting.
const FRAMES: Record<Frame, { background: string; boxShadow: string }> = {
  silver: {
    background: "linear-gradient(135deg, #A8B2BB 0%, #F4F7F9 26%, #8F9AA4 52%, #F7F9FB 76%, #A2ACB5 100%)",
    boxShadow: "0 26px 54px -26px rgba(72,88,102,0.45), 0 5px 16px -9px rgba(11,31,37,0.18)",
  },
  gold: {
    background: `linear-gradient(135deg, ${TOKENS.gold} 0%, ${TOKENS.goldSoft} 48%, ${TOKENS.gold} 100%)`,
    boxShadow: "0 22px 48px -24px rgba(201,161,75,0.42), 0 4px 14px -8px rgba(11,31,37,0.14)",
  },
  plain: {
    background: TOKENS.hairline,
    boxShadow: "0 10px 26px -20px rgba(11,31,37,0.22)",
  },
};

// Card width, logo height and padding per rank. The logo box stays a fixed
// height within a band so no partner's aspect ratio can make their card taller
// than the one beside it.
const SIZES: Record<Size, { card: string; logo: string; pad: string; radius: string }> = {
  hero:     { card: "w-[440px]", logo: "h-[92px] sm:h-28", pad: "px-9 py-9 sm:py-10", radius: "rounded-[24px]" },
  feature:  { card: "w-[360px]", logo: "h-[76px] sm:h-[88px]", pad: "px-8 py-8", radius: "rounded-[22px]" },
  standard: { card: "w-[292px]", logo: "h-16 sm:h-[68px]", pad: "px-7 py-7", radius: "rounded-[18px]" },
  compact:  { card: "w-[236px]", logo: "h-12 sm:h-14", pad: "px-6 py-5", radius: "rounded-[16px]" },
};

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
              const top = g.size === "hero" || g.size === "feature";
              return (
                <div key={g.heading} className={g.size === "hero" ? "mb-14" : "mb-12 last:mb-0"}>
                  <BandHeading heading={g.heading} note={g.note} icon={g.icon} size={g.size} />
                  <div className={`flex flex-wrap items-start justify-center ${top ? "gap-5" : "gap-4"}`}>
                    {members.map((p) => (
                      <PartnerLogo
                        key={p.name}
                        partner={{ ...p, logo: resolveLogo(p.name, uploadedLogos) || p.logo }}
                        size={g.size}
                        frame={g.frame}
                        showRole={g.roles.length > 1}
                      />
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

// The heading is the other half of the hierarchy. At the top of the ladder it
// is a filled chip with the level's icon and a line saying what the money
// actually pays for; further down it thins out to a plain lettered label, so
// the eye ranks the bands before it reads a word.
function BandHeading({ heading, note, icon: Icon, size }: { heading: string; note?: string; icon?: LucideIcon; size: Size }) {
  const hero = size === "hero";
  const feature = size === "feature";

  if (hero || feature) {
    return (
      <div className="text-center mb-7">
        <div
          className="inline-flex items-center gap-2.5 rounded-full px-5 py-2"
          style={
            hero
              ? { background: `linear-gradient(135deg, ${TOKENS.tealDark} 0%, ${TOKENS.teal} 100%)`, boxShadow: "0 14px 30px -16px rgba(14,68,86,0.5)" }
              : { background: "white", border: `1.5px solid ${TOKENS.gold}`, boxShadow: "0 10px 24px -18px rgba(201,161,75,0.6)" }
          }
        >
          {Icon && <Icon className="w-4 h-4" style={{ color: hero ? TOKENS.goldSoft : TOKENS.gold }} />}
          <span
            className={`font-bold uppercase whitespace-nowrap ${hero ? "text-[12.5px] tracking-[0.22em]" : "text-[11.5px] tracking-[0.2em]"}`}
            style={{ color: hero ? "#fff" : TOKENS.gold }}
          >
            {heading}
          </span>
        </div>
        {note && (
          <p className="mt-2.5 text-[12.5px]" style={{ color: TOKENS.mutedSoft }}>
            {note}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      <span className="block h-px w-8 sm:w-14 rounded-full" style={{ background: TOKENS.hairline }} />
      <span className="inline-flex items-center gap-2 text-[10.5px] font-bold tracking-[0.26em] uppercase whitespace-nowrap" style={{ color: TOKENS.mutedSoft }}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {heading}
      </span>
      <span className="block h-px w-8 sm:w-14 rounded-full" style={{ background: TOKENS.hairline }} />
    </div>
  );
}

function PartnerLogo({ partner, size = "standard", frame = "plain", showRole = true }: { partner: Partner; size?: Size; frame?: Frame; showRole?: boolean }) {
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
  // Within a band every card is the SAME fixed size (yielding to the viewport
  // on narrow phones), and each logo scales to fit an identical box via
  // object-contain, so no partner's aspect ratio can change their card. Size
  // varies between bands, never inside one.
  //
  // A name-only card is the exception: it should not reserve a logo's worth of
  // empty space, or a sponsor whose artwork hasn't landed yet gets a large
  // blank card with one word floating in it, which reads as a broken image.
  const nameOnly = logoFailed || !hasArtwork;
  const s = SIZES[size];
  const f = FRAMES[frame];
  const innerRadius =
    size === "hero" ? "rounded-[22.5px]" : size === "feature" ? "rounded-[20.5px]" : size === "standard" ? "rounded-[16.5px]" : "rounded-[14.5px]";
  const inner = (
    <div
      className={`${s.radius} p-[1.5px] max-w-full ${nameOnly && size === "hero" ? SIZES.feature.card : s.card}`}
      style={f}
    >
      <div className={`bg-white ${innerRadius} flex flex-col items-center justify-center w-full ${nameOnly ? "px-7 py-6" : s.pad}`}>
        {nameOnly ? (
          <div
            className={`flex items-center font-extrabold tracking-tight text-center leading-tight ${size === "compact" ? "text-[17px]" : "text-xl sm:text-2xl"}`}
            style={{ color: TOKENS.ink }}
          >
            {partner.name}
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            ref={checkLoaded}
            src={partner.logo}
            alt={partner.name}
            onError={() => setLogoFailed(true)}
            className={`w-full object-contain ${s.logo}`}
          />
        )}
        {partner.role && showRole && (
          <>
            <span
              className="mt-4 mb-3 block h-px w-10 rounded-full"
              style={{ background: frame === "plain" ? TOKENS.hairline : TOKENS.gold, opacity: frame === "plain" ? 1 : 0.55 }}
            />
            <div
              className="text-[9.5px] font-bold tracking-[0.28em] uppercase text-center"
              style={{ color: frame === "plain" ? TOKENS.mutedSoft : TOKENS.gold }}
            >
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
