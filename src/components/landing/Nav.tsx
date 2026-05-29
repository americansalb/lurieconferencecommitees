"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm"
      style={{ borderColor: TOKENS.hairline }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3 sm:gap-4 group min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/lurie-icon.png"
            alt="Ann & Robert H. Lurie Children's Hospital of Chicago"
            className="h-9 sm:h-11 w-auto shrink-0"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/aalb-icon.png"
            alt="Americans Against Language Barriers"
            className="h-9 sm:h-11 w-auto shrink-0"
          />
        </a>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/register"
            className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: `linear-gradient(135deg, #E8C56F 0%, ${TOKENS.gold} 100%)`,
              color: "#3C2E10",
              boxShadow: "0 10px 26px -10px rgba(201,161,75,0.45)",
            }}
          >
            Register Now
          </a>
          <button
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
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
          </div>
        </div>
      )}
    </header>
  );
}
