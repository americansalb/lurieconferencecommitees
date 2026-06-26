import { Award, Briefcase, ArrowRight, Users, Eye, HeartHandshake } from "lucide-react";
import { TOKENS } from "./tokens";

// Confirmed exhibitors / sponsors shown on the landing page. Add entries here
// as they come in; the "joined by" strip scales gracefully from one upward.
const PARTNERS: { name: string; logo: string; role?: string; url?: string }[] = [
  { name: "LanguageLine Solutions", logo: "/partners/languageline.png", role: "Exhibitor", url: "https://www.languageline.com" },
];

const BENEFITS = [
  { icon: Users, title: "A national audience", body: "Interpreters, clinicians, administrators, language service providers, and policy leaders from across the country." },
  { icon: Eye, title: "Real visibility", body: "Your brand featured across the conference, on-site and in front of a highly engaged room." },
  { icon: HeartHandshake, title: "A shared mission", body: "Stand with two trusted institutions advancing language access in healthcare." },
];

export default function SponsorsBlock() {
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

        {/* Joined by */}
        {PARTNERS.length > 0 && (
          <div className="mb-16">
            <p className="text-center text-[11px] font-bold tracking-[0.28em] uppercase mb-7" style={{ color: TOKENS.mutedSoft }}>
              Proud to be joined by
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {PARTNERS.map((p) => (
                <PartnerLogo key={p.name} partner={p} />
              ))}
            </div>
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
      </div>
    </section>
  );
}

function PartnerLogo({ partner }: { partner: { name: string; logo: string; role?: string; url?: string } }) {
  const inner = (
    <div
      className="rounded-[22px] p-[1.5px]"
      style={{
        background: `linear-gradient(135deg, ${TOKENS.gold} 0%, ${TOKENS.goldSoft} 48%, ${TOKENS.gold} 100%)`,
        boxShadow: "0 22px 48px -24px rgba(201,161,75,0.42), 0 4px 14px -8px rgba(11,31,37,0.14)",
      }}
    >
      <div
        className="bg-white rounded-[20px] flex flex-col items-center px-12 py-9"
        style={{ minWidth: 300 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={partner.logo} alt={partner.name} className="h-16 sm:h-[78px] w-auto max-w-[340px] object-contain" />
        {partner.role && (
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
    ? <a href={partner.url} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:-translate-y-0.5">{inner}</a>
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
