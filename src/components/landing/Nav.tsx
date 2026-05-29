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
        <a href="#top" className="flex items-center group min-w-0">
          {/* One shared white pill around both wordmarks. Identical treatment
              whether the nav is transparent over the dark hero or solid white
              after scroll, so the brand identity never flips on the user.
              Subtle shadow on the dark hero, hairline border once scrolled. */}
          <div
            className="flex items-center gap-3 sm:gap-4 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white transition-all"
            style={{
              boxShadow: scrolled
                ? "0 1px 0 rgba(15,23,42,0.04)"
                : "0 12px 28px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
              border: scrolled ? "1px solid #e2e8f0" : "1px solid transparent",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/lurie.png"
              alt="Ann & Robert H. Lurie Children's Hospital of Chicago"
              className="h-6 sm:h-8 w-auto shrink-0"
            />
            <span className="h-6 sm:h-8 w-px shrink-0" style={{ background: "#cbd5e1" }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/aalb.png"
              alt="Americans Against Language Barriers"
              className="h-6 sm:h-8 w-auto shrink-0"
            />
          </div>
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
              background: `linear-gradient(135deg, #E8C56F 0%, ${TOKENS.gold} 100%)`,
              color: "#3C2E10",
              boxShadow: "0 10px 26px -10px rgba(201,161,75,0.55)",
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

