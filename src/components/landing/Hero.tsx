import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { TOKENS, CONFERENCE } from "./tokens";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative pt-40 pb-44 sm:pt-56 sm:pb-52 overflow-hidden"
      style={{ background: TOKENS.tealDark }}
    >
      {/* Atmospheric light. Three crisp gradient layers, no blur.
          Together they give the hero warmth and depth without reading
          as cloudy or busy. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            // Vertical light from the top, warming the upper half.
            `linear-gradient(180deg, ${TOKENS.teal} 0%, ${TOKENS.tealDark} 55%, ${TOKENS.tealDeep} 100%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            // The gold halo, centered behind the wordmark. The user-requested
            // "glowing gold" lives in this single warm spotlight, not in any
            // decorative orbs or blurred shapes.
            `radial-gradient(ellipse 90% 65% at 50% 38%, rgba(201,161,75,0.18) 0%, rgba(201,161,75,0.06) 35%, transparent 70%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            // Soft vignette so the edges feel intentional, not blank.
            `radial-gradient(ellipse 120% 80% at 50% 100%, rgba(8,53,67,0.55) 0%, transparent 60%)`,
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase mb-10 border"
          style={{
            color: "#F4E9CD",
            borderColor: "rgba(201,161,75,0.45)",
            background: "rgba(201,161,75,0.08)",
            boxShadow: "0 0 24px rgba(201,161,75,0.08)",
          }}
        >
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: TOKENS.gold, boxShadow: `0 0 8px ${TOKENS.gold}` }}
          />
          2nd Annual Joint Conference
        </div>

        <h1
          className="font-serif-display text-white text-[46px] sm:text-[72px] md:text-[88px] leading-[1.01] tracking-tight font-bold mb-8 max-w-4xl mx-auto"
          style={{ textShadow: "0 1px 40px rgba(201,161,75,0.18)" }}
        >
          2026 Lurie Children&rsquo;s{" "}
          <span
            className="italic font-medium"
            style={{
              color: TOKENS.gold,
              textShadow: "0 0 32px rgba(201,161,75,0.5), 0 0 8px rgba(201,161,75,0.35)",
            }}
          >
            &amp;
          </span>
          <br className="hidden sm:block" />
          {" "}AALB Conference
        </h1>

        <p
          className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-11"
          style={{ color: "rgba(255,255,255,0.82)" }}
        >
          A two-day national conversation on language access in healthcare, hosted by Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers.
        </p>

        <div
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm mb-12"
          style={{ color: "rgba(255,255,255,0.75)" }}
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
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-lg font-bold text-base text-slate-900 bg-white hover:bg-white/95 transition-all w-full sm:w-auto"
            style={{ boxShadow: "0 12px 30px -10px rgba(201,161,75,0.35)" }}
          >
            Register Now <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/proposal"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-lg font-bold text-base text-white border transition-colors w-full sm:w-auto"
            style={{
              borderColor: "rgba(255,255,255,0.32)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Submit a Proposal
          </a>
        </div>
      </div>

      {/* A thin gold underline detail at the very bottom of the hero,
          tying the hero into the page below without a heavy fade. */}
      <div
        aria-hidden
        className="absolute bottom-0 inset-x-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${TOKENS.gold}66 50%, transparent 100%)`,
        }}
      />
    </section>
  );
}
