import { Mic, ArrowRight } from "lucide-react";
import { TOKENS } from "./tokens";

// Three lenses on language access. Each pillar gets its own warm
// accent (sepia past, teal present, blue future) so the cards read
// as a chord, not a row of identical tiles.
const PILLARS = [
  {
    numeral: "I",
    eyebrow: "Yesterday",
    title: "Where we came from.",
    body: "We honor the educators, interpreters, and advocates whose decades of work laid the foundation for language access as a civil right.",
    accent: TOKENS.gold,
    accentSoft: TOKENS.goldSoft,
  },
  {
    numeral: "II",
    eyebrow: "Today",
    title: "Where we stand.",
    body: "We confront the gap between policy and practice in modern healthcare, where standards exist on paper but break down at the bedside.",
    accent: TOKENS.teal,
    accentSoft: TOKENS.tealSoft,
  },
  {
    numeral: "III",
    eyebrow: "Tomorrow",
    title: "Where we are going.",
    body: "We imagine the systems, training, and technology that could make true language access the default, not the exception, for every patient.",
    accent: TOKENS.blue,
    accentSoft: TOKENS.blueSoft,
  },
];

export default function Theme() {
  return (
    <section
      id="theme"
      className="relative py-28 sm:py-36 overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${TOKENS.paper} 0%, #F6F1E6 100%)`,
      }}
    >
      {/* Very subtle gold halo behind the headline, kept tasteful. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[520px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 100% at 50% 0%, rgba(201,161,75,0.10) 0%, transparent 70%)`,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <Eyebrow>2026 Theme</Eyebrow>
          <h2
            className="font-serif-display mt-6 text-4xl sm:text-5xl md:text-[64px] font-bold leading-[1.05] tracking-tight"
            style={{ color: TOKENS.ink }}
          >
            True Language Access:
            <br />
            <span className="italic font-medium" style={{ color: TOKENS.teal }}>
              Yesterday, Today, and Tomorrow.
            </span>
          </h2>
          <p
            className="mt-7 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: TOKENS.muted }}
          >
            A two-day exploration of where the field has been, where it stands, and where it has to go. Three lenses, one through-line: the patient&rsquo;s right to be understood.
          </p>
        </div>

        {/* Three floating pillar cards. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PILLARS.map((p) => (
            <div
              key={p.numeral}
              className="relative bg-white rounded-2xl p-8 sm:p-9 border transition-all hover:-translate-y-0.5"
              style={{
                borderColor: TOKENS.hairline,
                boxShadow: "0 12px 32px -16px rgba(11,31,37,0.16), 0 2px 6px -3px rgba(11,31,37,0.06)",
              }}
            >
              {/* Pastel circle with Roman numeral */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-7"
                style={{
                  background: p.accentSoft,
                  color: p.accent,
                }}
              >
                <span className="font-serif-display text-xl font-bold tabular-nums leading-none italic">
                  {p.numeral}
                </span>
              </div>
              <div
                className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2"
                style={{ color: p.accent }}
              >
                {p.eyebrow}
              </div>
              <h3
                className="font-serif-display text-2xl sm:text-[26px] font-bold leading-tight mb-4"
                style={{ color: TOKENS.ink }}
              >
                {p.title}
              </h3>
              <p className="text-[15px] leading-relaxed" style={{ color: TOKENS.muted }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>

        {/* Speaker Lineup Coming Soon callout */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div
            className="rounded-2xl p-[1.5px]"
            style={{
              background: `linear-gradient(135deg, ${TOKENS.teal} 0%, ${TOKENS.blue} 45%, ${TOKENS.gold} 100%)`,
            }}
          >
            <div className="bg-white rounded-[14px] p-10 sm:p-12 text-center">
              <div
                className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-5"
                style={{ background: TOKENS.tealSoft, color: TOKENS.teal }}
              >
                <Mic className="w-5 h-5" />
              </div>
              <h3
                className="font-serif-display text-2xl sm:text-3xl font-bold leading-tight mb-3"
                style={{ color: TOKENS.ink }}
              >
                Speaker lineup, coming soon.
              </h3>
              <p
                className="text-[15px] leading-relaxed max-w-md mx-auto mb-7"
                style={{ color: TOKENS.muted }}
              >
                We&rsquo;re curating a lineup of industry leaders, practitioners, and pioneers. Want to be one of them?
              </p>
              <a
                href="/proposal"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition-all"
                style={{
                  background: `linear-gradient(135deg, #D4B266 0%, ${TOKENS.gold} 100%)`,
                  color: "#3C2E10",
                  boxShadow: "0 10px 24px -10px rgba(201,161,75,0.55)",
                }}
              >
                Submit a Speaker Proposal <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="w-8 h-px" style={{ background: TOKENS.gold }} />
      <span
        className="text-[10px] font-bold tracking-[0.32em] uppercase"
        style={{ color: TOKENS.gold }}
      >
        {children}
      </span>
      <span className="w-8 h-px" style={{ background: TOKENS.gold }} />
    </div>
  );
}
