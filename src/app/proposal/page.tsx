import Link from "next/link";
import { ArrowRight, Mic, Sparkles } from "lucide-react";
import { TOKENS, CONFERENCE } from "@/components/landing/tokens";

// Phase 1 placeholder for the public speaker-proposal form.
// Phase 3 replaces this with the full proposal intake (bio, abstract,
// learning objectives, headshot upload, etc.) feeding into the Presenter model.
export const metadata = {
  title: "Submit a Proposal",
  description: `Submit a speaker proposal for the ${CONFERENCE.name}. Talks, panels, and workshops on language access in healthcare.`,
};

export default function ProposalStubPage() {
  return (
    <div
      className="min-h-screen px-4 py-12 flex items-center justify-center"
      style={{ background: `radial-gradient(60% 80% at 50% 0%, ${TOKENS.tealDark} 0%, ${TOKENS.teal} 60%, ${TOKENS.tealDark} 100%)` }}
    >
      <div className="max-w-xl w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-xs font-semibold mb-6">
          <ArrowRight className="w-3 h-3 rotate-180" /> Back to the conference
        </Link>
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-5"
            style={{ background: TOKENS.tealSoft, color: TOKENS.teal }}
          >
            <Mic className="w-3 h-3" /> Speaker Proposals
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: TOKENS.ink }}>
            Tell us about your talk.
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: TOKENS.muted }}>
            Our public proposal form is being built. In the meantime, send us your idea by email and our program team will follow up to collect the details.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`mailto:${CONFERENCE.contactEmail}?subject=Speaker%20proposal%20for%20Conference%202026`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-md transition-all"
              style={{ background: `linear-gradient(135deg, ${TOKENS.teal} 0%, ${TOKENS.blue} 100%)` }}
            >
              Send us your proposal <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="mt-8 text-left text-sm leading-relaxed" style={{ color: TOKENS.muted }}>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: TOKENS.teal }}>
              <Sparkles className="w-3 h-3 inline mr-1" /> Helpful to include
            </div>
            <ul className="space-y-1.5">
              <li>&middot; A working title for your session</li>
              <li>&middot; A short abstract (200&ndash;300 words)</li>
              <li>&middot; Three learning objectives</li>
              <li>&middot; Preferred format (talk, panel, or workshop) and length</li>
              <li>&middot; A short bio and any prior speaking experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
