import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { TOKENS, CONFERENCE } from "./tokens";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative pt-32 pb-28 sm:pt-44 sm:pb-36 overflow-hidden"
      style={{ background: TOKENS.tealDeep }}
    >
      {/* Subtle vertical light from the top, no blurs, no orbs. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${TOKENS.tealDark} 0%, ${TOKENS.tealDeep} 100%)`,
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div
          className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase mb-9 border"
          style={{
            color: TOKENS.goldSoft,
            borderColor: TOKENS.gold + "55",
            background: "rgba(201, 161, 75, 0.08)",
          }}
        >
          2nd Annual Joint Conference
        </div>

        <h1 className="font-serif-display text-white text-[44px] sm:text-[68px] md:text-[84px] leading-[1.01] tracking-tight font-bold mb-7 max-w-4xl mx-auto">
          2026 Lurie Children&rsquo;s{" "}
          <span className="italic font-medium" style={{ color: TOKENS.gold }}>
            &amp;
          </span>
          <br className="hidden sm:block" />
          {" "}AALB Conference
        </h1>

        <p
          className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
          style={{ color: "rgba(255,255,255,0.78)" }}
        >
          A two-day national conversation on language access in healthcare, hosted by Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers.
        </p>

        <div
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm mb-11"
          style={{ color: "rgba(255,255,255,0.72)" }}
        >
          <span className="inline-flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: TOKENS.gold }} />
            {CONFERENCE.prettyDates}
          </span>
          <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.25)" }}>&middot;</span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: TOKENS.gold }} />
            {CONFERENCE.venueShort}, {CONFERENCE.city}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-lg font-bold text-base text-slate-900 bg-white hover:bg-white/95 transition-colors w-full sm:w-auto"
          >
            Register Now <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/proposal"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-lg font-bold text-base text-white border transition-colors w-full sm:w-auto"
            style={{
              borderColor: "rgba(255,255,255,0.28)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Submit a Proposal
          </a>
        </div>
      </div>
    </section>
  );
}
