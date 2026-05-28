import { Calendar, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { TOKENS, CONFERENCE } from "./tokens";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative pt-32 pb-24 sm:pt-44 sm:pb-32 overflow-hidden"
      style={{
        background: `radial-gradient(60% 80% at 50% 0%, ${TOKENS.tealDark} 0%, ${TOKENS.teal} 45%, ${TOKENS.tealDark} 100%)`,
      }}
    >
      {/* Decorative orbs */}
      <div
        aria-hidden
        className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle, ${TOKENS.blue} 0%, transparent 70%)` }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${TOKENS.gold} 0%, transparent 70%)` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase mb-7 bg-white/10 backdrop-blur text-white/95 border border-white/15">
          <Sparkles className="w-3 h-3" /> 2nd Annual Joint Conference
        </div>

        <h1 className="font-serif-display text-white text-[44px] sm:text-[64px] md:text-[78px] leading-[1.02] tracking-tight font-bold mb-6 max-w-4xl mx-auto">
          2026 Lurie Children&rsquo;s <span className="italic font-medium" style={{ color: "#FFE8B0" }}>&amp;</span> AALB Conference
        </h1>

        <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed mb-9">
          A two-day national conversation on language access in healthcare, hosted by Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/85 mb-10">
          <span className="inline-flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: "#FFE8B0" }} /> {CONFERENCE.prettyDates}
          </span>
          <span className="hidden sm:inline text-white/30">&middot;</span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: "#FFE8B0" }} /> {CONFERENCE.venueShort}, {CONFERENCE.city}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-base text-slate-900 bg-white hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto"
          >
            Register Now <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/proposal"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-base text-white border border-white/30 hover:bg-white/10 transition-all w-full sm:w-auto"
          >
            Submit a Proposal
          </a>
        </div>
      </div>

      {/* Bottom wave */}
      <div
        aria-hidden
        className="absolute bottom-0 inset-x-0 h-12"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${TOKENS.cream} 100%)`,
        }}
      />
    </section>
  );
}
