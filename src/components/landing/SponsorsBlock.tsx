import { ArrowRight } from "lucide-react";
import { TOKENS } from "./tokens";

// Mirrors the Webflow page's four logo placeholders for the
// "sponsors lineup coming soon" feel until confirmed sponsors land.
const PLACEHOLDERS = [0, 1, 2, 3];

export default function SponsorsBlock() {
  return (
    <section id="sponsors" className="py-28 sm:py-36 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: TOKENS.gold }}>
              Partners &amp; Sponsors
            </span>
            <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
          </div>
          <h2
            className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight"
            style={{ color: TOKENS.ink }}
          >
            Partner with us.
          </h2>
          <p
            className="mt-7 text-base sm:text-lg leading-relaxed"
            style={{ color: TOKENS.muted }}
          >
            Sponsorship and exhibitor opportunities support the conference and reach a national audience of interpreters, clinicians, healthcare administrators, language service providers, and policy leaders.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden mb-16 max-w-4xl mx-auto" style={{ background: TOKENS.hairline }}>
          {PLACEHOLDERS.map((i) => (
            <div
              key={i}
              className="aspect-[4/3] bg-white flex items-center justify-center"
            >
              <div className="text-center">
                <div className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: TOKENS.mutedSoft }}>
                  Sponsor
                </div>
                <div className="text-[10px] mt-1" style={{ color: TOKENS.mutedSoft }}>
                  Coming soon
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/sponsor"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold text-white transition-colors"
            style={{ background: TOKENS.teal }}
          >
            Become a Sponsor
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/sponsor"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold border bg-white transition-colors"
            style={{ borderColor: TOKENS.teal, color: TOKENS.teal }}
          >
            Become an Exhibitor
          </a>
        </div>
      </div>
    </section>
  );
}
