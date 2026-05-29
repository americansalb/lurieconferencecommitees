import { TOKENS, CONFERENCE } from "./tokens";

const QUICK_LINKS = [
  { href: "/proposal", label: "Submit a Proposal" },
  { href: "/register", label: "Register" },
  { href: "/sponsor", label: "Become a Sponsor" },
  { href: "#faq", label: "FAQ" },
];

export default function Footer() {
  return (
    <footer
      className="text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${TOKENS.tealDark} 0%, ${TOKENS.tealDeep} 100%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 80% at 50% 0%, rgba(201,161,75,0.10) 0%, transparent 60%)`,
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Joint wordmarks on a clean white card so the brand colors,
            including each org's signature hand circle, stay fully legible
            against the dark teal floor. Matches the white-pill identity
            from the rest of the page. */}
        <div className="mb-14 pb-12 flex justify-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div
            className="bg-white rounded-2xl px-6 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-8"
            style={{ boxShadow: "0 16px 40px -16px rgba(0,0,0,0.30)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/lurie.png"
              alt="Ann & Robert H. Lurie Children's Hospital of Chicago"
              className="h-10 sm:h-12 w-auto"
            />
            <span className="hidden sm:block h-10 w-px" style={{ background: "#cbd5e1" }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/aalb.png"
              alt="Americans Against Language Barriers"
              className="h-10 sm:h-12 w-auto"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-12">
          <div>
            <div className="font-serif-display text-2xl font-bold leading-tight">
              2026 Lurie Children&rsquo;s{" "}
              <span className="italic font-medium" style={{ color: TOKENS.gold }}>&amp;</span>{" "}
              AALB Conference
            </div>
            <p className="mt-4 text-sm leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
              {CONFERENCE.theme}.<br />
              {CONFERENCE.prettyDates}, {CONFERENCE.city}.
            </p>
          </div>

          <div>
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase mb-4" style={{ color: TOKENS.gold }}>
              Quick links
            </div>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm hover:text-white" style={{ color: "rgba(255,255,255,0.78)" }}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase mb-4" style={{ color: TOKENS.gold }}>
              Contact
            </div>
            <ul className="space-y-2.5">
              <li>
                <a href={`mailto:${CONFERENCE.contactEmail}`} className="text-sm hover:text-white" style={{ color: "rgba(255,255,255,0.78)" }}>
                  {CONFERENCE.contactEmail}
                </a>
              </li>
              <li>
                <a href="https://www.aalb.org" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white" style={{ color: "rgba(255,255,255,0.78)" }}>
                  aalb.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
          style={{
            borderTop: `1px solid rgba(255,255,255,0.08)`,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          <div>
            &copy; 2026 Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago &amp; Americans Against Language Barriers
          </div>
          <div>
            501(c)(3) &middot; EINs {CONFERENCE.eins}
          </div>
        </div>
      </div>
    </footer>
  );
}
