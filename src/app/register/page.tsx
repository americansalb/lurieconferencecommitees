import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Sparkles } from "lucide-react";
import { TOKENS, CONFERENCE } from "@/components/landing/tokens";

// Phase 1 placeholder for the conference registration funnel.
// Phase 2 replaces this with the full attendee flow (in-person / virtual
// selection, attendee details, Stripe checkout).
export const metadata = {
  title: "Register",
  description: `Register for the ${CONFERENCE.name}. ${CONFERENCE.prettyDates}, ${CONFERENCE.city}. Virtual and in-person tickets available.`,
};

export default function RegisterStubPage() {
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
            <Sparkles className="w-3 h-3" /> Registration
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: TOKENS.ink }}>
            We&rsquo;re upgrading registration.
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: TOKENS.muted }}>
            A new registration experience is coming to this site shortly. In the meantime, you can register through our current form on aalb.org. Same tickets, same pricing, same conference.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://www.aalb.org/conference-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-md transition-all"
              style={{ background: `linear-gradient(135deg, ${TOKENS.teal} 0%, ${TOKENS.blue} 100%)` }}
            >
              Register on aalb.org <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={`mailto:${CONFERENCE.contactEmail}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold border bg-white hover:bg-slate-50 transition-all"
              style={{ borderColor: TOKENS.teal, color: TOKENS.teal }}
            >
              Email us
            </a>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-lg p-3" style={{ background: TOKENS.creamSoft }}>
              <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: TOKENS.teal }}>Dates</div>
              <div className="mt-1 text-sm font-bold inline-flex items-center gap-1.5" style={{ color: TOKENS.ink }}>
                <Calendar className="w-3.5 h-3.5" /> {CONFERENCE.prettyDates}
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: TOKENS.creamSoft }}>
              <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: TOKENS.teal }}>Venue</div>
              <div className="mt-1 text-sm font-bold inline-flex items-center gap-1.5" style={{ color: TOKENS.ink }}>
                <MapPin className="w-3.5 h-3.5" /> {CONFERENCE.venueShort}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
