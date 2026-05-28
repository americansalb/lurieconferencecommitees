import { Award, Briefcase, ArrowRight, Sparkles } from "lucide-react";
import { TOKENS } from "./tokens";

const PLACEHOLDERS = [0, 1, 2, 3];

export default function SponsorsBlock() {
  return (
    <section
      id="sponsors"
      className="relative py-28 sm:py-36 overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${TOKENS.paper} 0%, #F6F1E6 100%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 100% at 50% 0%, rgba(201,161,75,0.10) 0%, transparent 70%)`,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Eyebrow>Partners &amp; Sponsors</Eyebrow>
          <h2
            className="font-serif-display mt-6 text-4xl sm:text-5xl md:text-[58px] font-bold leading-[1.05] tracking-tight"
            style={{ color: TOKENS.ink }}
          >
            Partner{" "}
            <span className="italic font-medium" style={{ color: TOKENS.teal }}>with us.</span>
          </h2>
          <p
            className="mt-6 text-base sm:text-lg leading-relaxed"
            style={{ color: TOKENS.muted }}
          >
            Sponsorship and exhibitor opportunities support the conference and reach a national audience of interpreters, clinicians, healthcare administrators, language service providers, and policy leaders.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto">
          {PLACEHOLDERS.map((i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-xl bg-white flex items-center justify-center"
              style={{
                border: `1px solid ${TOKENS.hairline}`,
                boxShadow: "0 6px 18px -10px rgba(11,31,37,0.10)",
              }}
            >
              <div className="text-center">
                <div
                  className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ background: TOKENS.goldSoft, color: TOKENS.gold }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: TOKENS.mutedSoft }}>
                  Sponsor
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: TOKENS.mutedSoft }}>
                  Coming soon
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/sponsor"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${TOKENS.tealDark} 0%, ${TOKENS.teal} 100%)`,
              boxShadow: "0 12px 28px -12px rgba(14,68,86,0.45)",
            }}
          >
            <Award className="w-4 h-4" /> Become a Sponsor
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/sponsor"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold bg-white transition-colors"
            style={{
              border: `1.5px solid ${TOKENS.teal}`,
              color: TOKENS.teal,
            }}
          >
            <Briefcase className="w-4 h-4" /> Become an Exhibitor
          </a>
        </div>
      </div>
    </section>
  );
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
