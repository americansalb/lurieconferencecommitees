import { Award, Briefcase, ArrowRight } from "lucide-react";
import { TOKENS } from "./tokens";

// The Webflow page shows four placeholder organization boxes (no sponsors
// confirmed yet). Mirror that here with the same placeholder feel so the
// section reads as "sponsor lineup coming soon" while we collect logos.
const PLACEHOLDERS = [0, 1, 2, 3];

export default function SponsorsBlock() {
  return (
    <section
      id="sponsors"
      className="py-24 sm:py-32"
      style={{ background: TOKENS.cream }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: TOKENS.teal }}>
            Partners &amp; Sponsors
          </div>
          <h2 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight" style={{ color: TOKENS.ink }}>
            Partner with us.
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: TOKENS.muted }}>
            Sponsorship and exhibitor opportunities support the conference and reach a national audience of interpreters, clinicians, healthcare administrators, language service providers, and policy leaders.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
          {PLACEHOLDERS.map((i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-2xl border-2 border-dashed flex items-center justify-center bg-white/60"
              style={{ borderColor: TOKENS.teal + "30" }}
            >
              <div className="text-center">
                <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: TOKENS.teal + "90" }}>
                  Sponsor logo
                </div>
                <div className="text-[10px] mt-1" style={{ color: TOKENS.muted }}>
                  Coming soon
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/sponsor"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-sm hover:shadow-md transition-all"
            style={{ background: `linear-gradient(135deg, ${TOKENS.teal} 0%, ${TOKENS.blue} 100%)` }}
          >
            <Award className="w-4 h-4" /> Become a Sponsor
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/sponsor"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold border bg-white hover:bg-slate-50 transition-all"
            style={{ borderColor: TOKENS.teal, color: TOKENS.teal }}
          >
            <Briefcase className="w-4 h-4" /> Become an Exhibitor
          </a>
        </div>
      </div>
    </section>
  );
}
