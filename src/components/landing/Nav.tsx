"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { TOKENS } from "./tokens";

const links = [
  { href: "#theme", label: "Theme" },
  { href: "#venue", label: "Venue" },
  { href: "#pricing", label: "Pricing" },
  { href: "#proposals", label: "Proposals" },
  { href: "#sponsors", label: "Sponsors" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const isAuthed = !!session?.user;

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 24); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3 group min-w-0">
          {/* Co-branded lockup: Lurie logo + AALB logo with a hairline divider
              between. Real logos drop into /public/logos. Until then a clean
              text fallback keeps the nav looking intentional. */}
          <LogoMark
            scrolled={scrolled}
            src="/logos/lurie.png"
            alt="Ann & Robert H. Lurie Children's Hospital of Chicago"
            fallback={{ line1: "Ann & Robert H. Lurie", line2: "Children's Hospital of Chicago", accent: scrolled ? TOKENS.blue : "white" }}
          />
          <span
            className="h-7 w-px"
            style={{ background: scrolled ? "#cbd5e1" : "rgba(255,255,255,0.25)" }}
          />
          <LogoMark
            scrolled={scrolled}
            src="/logos/aalb.png"
            alt="Americans Against Language Barriers"
            fallback={{ line1: "Americans Against", line2: "Language Barriers", accent: scrolled ? TOKENS.teal : "white" }}
          />
        </a>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                scrolled
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  : "text-white/85 hover:text-white hover:bg-white/10"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={isAuthed ? "/dashboard" : "/login"}
            className={`hidden md:inline-flex items-center text-[10px] font-semibold tracking-[0.18em] uppercase transition-colors ${
              scrolled ? "text-slate-500 hover:text-slate-800" : "text-white/55 hover:text-white"
            }`}
            title={isAuthed ? "Planning portal" : "Sign in to the planning portal"}
          >
            Volunteer Login
          </a>
          <a
            href="/register"
            className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: scrolled
                ? TOKENS.tealDark
                : `linear-gradient(135deg, #E8C56F 0%, ${TOKENS.gold} 100%)`,
              color: scrolled ? "white" : "#3C2E10",
              boxShadow: scrolled
                ? `0 8px 22px -10px ${TOKENS.tealDark}`
                : "0 10px 26px -10px rgba(201,161,75,0.55)",
            }}
          >
            Register Now
          </a>
          <button
            className={`lg:hidden p-2 rounded-lg ${scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {l.label}
              </a>
            ))}
            <a
              href="/register"
              className="mt-1 px-3 py-2.5 rounded-full text-sm font-bold text-center"
              style={{
                background: `linear-gradient(135deg, #E8C56F 0%, ${TOKENS.gold} 100%)`,
                color: "#3C2E10",
              }}
            >
              Register Now
            </a>
            <a
              href={isAuthed ? "/dashboard" : "/login"}
              onClick={() => setOpen(false)}
              className="mt-1 text-center text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 hover:text-slate-700"
            >
              Volunteer Login
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function LogoMark({
  scrolled, alt, fallback,
}: {
  scrolled: boolean;
  src: string;
  alt: string;
  fallback: { line1: string; line2: string; accent: string };
}) {
  // Renders a typographic wordmark in the brand's accent colour. When the
  // PNG logos drop into /public/logos this can be swapped for an <img>; the
  // structure (height, vertical divider) stays the same so nothing shifts.
  const accent = scrolled ? fallback.accent : "white";
  return (
    <span className="inline-flex flex-col leading-tight" title={alt}>
      <span
        className="text-[10px] sm:text-[11px] font-extrabold tracking-tight whitespace-nowrap"
        style={{ color: accent }}
      >
        {fallback.line1}
      </span>
      <span
        className="text-[10px] sm:text-[11px] font-semibold tracking-tight whitespace-nowrap"
        style={{ color: accent, opacity: 0.78 }}
      >
        {fallback.line2}
      </span>
    </span>
  );
}
