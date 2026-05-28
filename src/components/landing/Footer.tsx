import { Mail, Globe } from "lucide-react";
import { TOKENS, CONFERENCE } from "./tokens";

const QUICK_LINKS = [
  { href: "/proposal", label: "Submit a Proposal" },
  { href: "/register", label: "Register" },
  { href: "/sponsor", label: "Become a Sponsor" },
  { href: "#faq", label: "FAQ" },
];

export default function Footer() {
  return (
    <footer style={{ background: TOKENS.tealDark }} className="text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-white text-xs shadow-sm"
                style={{ background: `linear-gradient(135deg, ${TOKENS.blue} 0%, ${TOKENS.teal} 100%)` }}
              >
                L
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px] font-bold tracking-widest uppercase text-white/60">
                  Lurie Children&rsquo;s &amp; AALB
                </span>
                <span className="text-sm font-extrabold tracking-tight">
                  Conference 2026
                </span>
              </span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-sm">
              {CONFERENCE.theme}. {CONFERENCE.prettyDates}, {CONFERENCE.city}.
            </p>
          </div>

          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-white/50 mb-3">
              Quick links
            </div>
            <ul className="space-y-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-white/85 hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-white/50 mb-3">
              Contact
            </div>
            <ul className="space-y-2.5">
              <li>
                <a href={`mailto:${CONFERENCE.contactEmail}`} className="text-sm text-white/85 hover:text-white inline-flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> {CONFERENCE.contactEmail}
                </a>
              </li>
              <li>
                <a href="https://www.aalb.org" target="_blank" rel="noopener noreferrer" className="text-sm text-white/85 hover:text-white inline-flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> aalb.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/50">
          <div>
            &copy; 2026 Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago &amp; Americans Against Language Barriers
          </div>
          <div>
            Tax-deductible under IRS code 501(c)(3). EINs: {CONFERENCE.eins}.
          </div>
        </div>
      </div>
    </footer>
  );
}
