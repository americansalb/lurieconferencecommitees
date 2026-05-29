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
        {/* Joint wordmarks at the top of the footer, gently lit on the dark
            teal background via a subtle brightness/contrast lift so the brand
            colors stay legible without the logos feeling pasted on. */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 mb-14 pb-12" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/lurie.png"
            alt="Ann & Robert H. Lurie Children's Hospital of Chicago"
            className="h-10 sm:h-12 w-auto"
            style={{ filter: "brightness(0) invert(1)", opacity: 0.85 }}
          />
          <span className="hidden sm:block h-10 w-px" style={{ background: "rgba(255,255,255,0.15)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/aalb.png"
            alt="Americans Against Language Barriers"
            className="h-10 sm:h-12 w-auto"
            style={{ filter: "brightness(0) invert(1)", opacity: 0.85 }}
          />
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
