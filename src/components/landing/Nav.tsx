"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
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
          ? "bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5 group">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-white text-xs shadow-sm"
            style={{ background: `linear-gradient(135deg, ${TOKENS.teal} 0%, ${TOKENS.blue} 100%)` }}
          >
            L
          </span>
          <span className="flex flex-col leading-tight">
            <span className={`text-[10px] font-bold tracking-widest uppercase ${scrolled ? "text-slate-500" : "text-white/80"}`}>
              Lurie Children&rsquo;s &amp; AALB
            </span>
            <span className={`text-sm font-extrabold tracking-tight ${scrolled ? "text-slate-900" : "text-white"}`}>
              Conference 2026
            </span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
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

        <div className="flex items-center gap-2">
          <a
            href="/register"
            className={`hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${
              scrolled
                ? "text-white hover:shadow"
                : "bg-white text-slate-900 hover:bg-white/95"
            }`}
            style={scrolled ? { background: `linear-gradient(135deg, ${TOKENS.teal} 0%, ${TOKENS.blue} 100%)` } : undefined}
          >
            Register Now
          </a>
          <button
            className={`md:hidden p-2 rounded-lg ${scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-slate-200">
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
              className="mt-1 px-3 py-2.5 rounded-lg text-sm font-bold text-white text-center shadow-sm"
              style={{ background: `linear-gradient(135deg, ${TOKENS.teal} 0%, ${TOKENS.blue} 100%)` }}
            >
              Register Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
