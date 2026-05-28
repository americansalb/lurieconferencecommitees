import { Mic, ArrowRight } from "lucide-react";
import { TOKENS } from "./tokens";

export default function CallForPresenters() {
  return (
    <section id="proposals" className="py-24 sm:py-32 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div
          className="relative rounded-3xl overflow-hidden p-8 sm:p-14 text-white shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${TOKENS.tealDark} 0%, ${TOKENS.teal} 50%, ${TOKENS.blue} 100%)`,
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full opacity-20 blur-3xl"
            style={{ background: `radial-gradient(circle, ${TOKENS.gold} 0%, transparent 70%)` }}
          />

          <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-5 bg-white/15 backdrop-blur">
                <Mic className="w-3 h-3" /> Call for Presenters
              </div>
              <h2 className="font-serif-display text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight">
                Share your voice.
              </h2>
              <p className="mt-5 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl">
                We&rsquo;re inviting interpreters, clinicians, researchers, educators, technologists, and patient advocates to submit proposals for talks, panels, and workshops on language access in healthcare.
              </p>
            </div>
            <a
              href="/proposal"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-base text-slate-900 bg-white hover:bg-white/95 shadow-xl transition-all whitespace-nowrap shrink-0"
            >
              Submit Your Proposal <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
