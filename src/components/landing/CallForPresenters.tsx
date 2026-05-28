import { ArrowRight } from "lucide-react";
import { TOKENS } from "./tokens";

export default function CallForPresenters() {
  return (
    <section id="proposals" className="py-28 sm:py-36" style={{ background: TOKENS.paper }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div
          className="rounded-2xl overflow-hidden p-10 sm:p-16 text-white"
          style={{ background: TOKENS.tealDark }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 items-end">
            <div>
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: TOKENS.gold }}>
                  Call for Presenters
                </span>
              </div>
              <h2 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
                Share your voice.
              </h2>
              <p className="mt-6 text-base sm:text-lg leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,0.78)" }}>
                We&rsquo;re inviting interpreters, clinicians, researchers, educators, technologists, and patient advocates to submit proposals for talks, panels, and workshops on language access in healthcare.
              </p>
            </div>
            <a
              href="/proposal"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold text-base text-slate-900 bg-white hover:bg-white/95 transition-colors whitespace-nowrap shrink-0"
            >
              Submit Your Proposal <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
