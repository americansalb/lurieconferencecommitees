import { ArrowRight } from "lucide-react";
import { TOKENS } from "./tokens";
import { SPEAKERS } from "./speakers-data";
import SpeakerCard from "./SpeakerCard";

// Confirmed speaker lineup. Replaces the old "coming soon" callout that used
// to live at the foot of the Theme section. Cards cycle the brand chord
// (teal / blue / gold) so the row reads as a set, not a grid of clones.
const ACCENTS = [TOKENS.teal, TOKENS.blue, TOKENS.gold];

export default function Speakers() {
  return (
    <section id="speakers" className="relative bg-white py-28 sm:py-36 overflow-hidden">
      {/* Faint teal halo, echoing the Theme section's gold one. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 100% at 50% 0%, rgba(42,143,204,0.07) 0%, transparent 70%)`,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <Eyebrow>Featured Speakers</Eyebrow>
          <h2
            className="mt-6 text-4xl sm:text-5xl md:text-[58px] font-bold leading-[1.05] tracking-tight"
            style={{ color: TOKENS.ink }}
          >
            Voices shaping the field.
          </h2>
          <p
            className="mt-7 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: TOKENS.muted }}
          >
            A growing lineup of the clinicians, interpreters, and advocates leading the work on language access, with more to be announced.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {SPEAKERS.map((s, i) => (
            <SpeakerCard key={s.slug} speaker={s} accent={ACCENTS[i % ACCENTS.length]} />
          ))}
        </div>

        {/* More to come + proposal CTA (carried over from the old callout). */}
        <div className="mt-16 text-center">
          <p className="text-[15px] font-medium" style={{ color: TOKENS.muted }}>
            More speakers to be announced. Want to be one of them?
          </p>
          <a
            href="/proposal"
            className="mt-5 inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition-all hover:gap-3"
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
