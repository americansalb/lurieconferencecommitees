"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Download, X } from "lucide-react";
import { TOKENS } from "./tokens";
import { PROGRAM_DAYS, PROGRAM_NOTE, type SessionKind } from "./program-data";

// Compact Program section: two small day summaries and two actions — a
// lightbox with the complete schedule (so nobody leaves the page to see it)
// and the official PDF. Deliberately short; the schedule itself lives in the
// modal, not the page flow.

const KIND_CHIP: Record<SessionKind, { label: string; bg: string; fg: string }> = {
  session: { label: "Session", bg: "#E8F1F3", fg: "#0E5566" },
  panel: { label: "Panel", bg: "#E4EEFB", fg: "#1D5FA8" },
  keynote: { label: "Keynote", bg: "#F7EDD6", fg: "#8A6A20" },
  registration: { label: "Sign-in", bg: "#E5F3EC", fg: "#20714C" },
  networking: { label: "Networking", bg: "#FBE7ED", fg: "#A83A5B" },
  lunch: { label: "Lunch", bg: "#FCEEDF", fg: "#A8641D" },
  break: { label: "Break", bg: "#EEF0F2", fg: "#5A6B75" },
};

export default function ProgramBlock() {
  const [open, setOpen] = useState(false);

  return (
    <section id="program" className="relative py-24 sm:py-28 overflow-hidden" style={{ background: `linear-gradient(180deg, #FFFFFF 0%, ${TOKENS.paper} 100%)` }}>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Eyebrow>Program</Eyebrow>
          <h2 className="mt-6 text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight" style={{ color: TOKENS.ink }}>
            Two days, planned to the minute.
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: TOKENS.muted }}>
            {PROGRAM_NOTE}
          </p>
        </div>

        {/* One small card per day: date, hours, and the headline moments. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-4xl mx-auto mb-9">
          {PROGRAM_DAYS.map((day) => {
            const highlights = day.sessions
              .filter((s) => s.kind === "keynote" || s.kind === "panel")
              .concat(day.sessions.filter((s) => s.kind === "session" && s.who && !/RSVP/.test(s.who || "")))
              .slice(0, 3)
              .sort((a, b) => day.sessions.indexOf(a) - day.sessions.indexOf(b));
            const talkCount = day.sessions.filter((s) => ["session", "panel", "keynote"].includes(s.kind) && s.who && !/RSVP/.test(s.who || "")).length;
            return (
              <div key={day.label} className="rounded-2xl bg-white p-6 text-left" style={{ border: `1px solid ${TOKENS.hairline}`, boxShadow: "0 10px 26px -16px rgba(11,31,37,0.14)" }}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-[11px] font-bold tracking-[0.26em] uppercase" style={{ color: TOKENS.gold }}>{day.label}</div>
                  <div className="text-[12px] font-semibold" style={{ color: TOKENS.mutedSoft }}>{day.hours}</div>
                </div>
                <h3 className="mt-1.5 text-[19px] font-bold tracking-tight" style={{ color: TOKENS.ink }}>{day.date}</h3>
                <ul className="mt-4 space-y-2.5">
                  {highlights.map((s) => (
                    <li key={s.title} className="flex gap-2.5 text-[13.5px] leading-snug" style={{ color: TOKENS.inkSoft }}>
                      <span className="mt-[7px] block h-1 w-1 rounded-full shrink-0" style={{ background: TOKENS.gold }} />
                      <span><span className="font-semibold">{s.time}</span> · {s.title}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-[12.5px] font-semibold" style={{ color: TOKENS.mutedSoft }}>
                  {talkCount} talks and panels, plus networking and meals
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${TOKENS.tealDark} 0%, ${TOKENS.teal} 100%)`, boxShadow: "0 12px 28px -12px rgba(14,68,86,0.45)" }}
          >
            <CalendarDays className="w-4 h-4" /> View the full schedule
          </button>
          <a
            href="/program.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold bg-white transition-colors"
            style={{ border: `1.5px solid ${TOKENS.teal}`, color: TOKENS.teal }}
          >
            <Download className="w-4 h-4" /> Program PDF
          </a>
        </div>
      </div>

      {open && <ProgramModal onClose={() => setOpen(false)} />}
    </section>
  );
}

function ProgramModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [dayIdx, setDayIdx] = useState(0);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;
  const day = PROGRAM_DAYS[dayIdx];

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Full conference schedule"
    >
      <div
        className="relative bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: title, day tabs, PDF link, close. */}
        <div className="shrink-0 px-5 sm:px-7 pt-5 pb-4" style={{ borderBottom: `1px solid ${TOKENS.hairline}` }}>
          <div className="flex items-center justify-between gap-3 pr-10">
            <div>
              <div className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: TOKENS.gold }}>Full Schedule</div>
              <div className="mt-0.5 text-[13px]" style={{ color: TOKENS.muted }}>{PROGRAM_NOTE}</div>
            </div>
            <a href="/program.pdf" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: TOKENS.teal }}>
              <Download className="w-3.5 h-3.5" /> PDF
            </a>
          </div>
          <div className="mt-3.5 flex gap-2">
            {PROGRAM_DAYS.map((d, i) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setDayIdx(i)}
                className="px-4 py-2 rounded-full text-[13px] font-bold transition-colors"
                style={i === dayIdx
                  ? { background: TOKENS.teal, color: "#fff" }
                  : { background: "#F1F5F6", color: TOKENS.muted }}
              >
                {d.label} · {d.date.split(",")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* The schedule itself. */}
        <div className="overflow-y-auto px-5 sm:px-7 py-4">
          <div className="text-[15px] font-bold mb-3" style={{ color: TOKENS.ink }}>
            {day.date} <span className="font-semibold text-[13px]" style={{ color: TOKENS.mutedSoft }}>· {day.hours}</span>
          </div>
          <ul>
            {day.sessions.map((s) => {
              const chip = KIND_CHIP[s.kind];
              const isKeynote = s.kind === "keynote";
              return (
                <li
                  key={`${s.time}-${s.title}`}
                  className="flex gap-3 sm:gap-4 py-3 px-2 sm:px-3 rounded-xl"
                  style={isKeynote
                    ? { background: "#FBF4E2", border: "1px solid #EAD9AE", margin: "6px 0" }
                    : { borderBottom: `1px solid ${TOKENS.hairline}` }}
                >
                  <div className="w-[74px] sm:w-[84px] shrink-0 pt-0.5">
                    <div className="text-[13px] font-bold tabular-nums" style={{ color: TOKENS.ink }}>{s.time}</div>
                    <div className="text-[11px] tabular-nums" style={{ color: TOKENS.mutedSoft }}>to {s.end}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold leading-snug" style={{ color: TOKENS.ink }}>{s.title}</div>
                    {s.who && <div className="mt-0.5 text-[12.5px] leading-snug" style={{ color: TOKENS.muted }}>{s.who}</div>}
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase" style={{ background: chip.bg, color: chip.fg }}>
                      {chip.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="py-4 text-center text-[12px]" style={{ color: TOKENS.mutedSoft }}>
            Sessions and times may shift slightly as the program is finalized.
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center bg-white/85 backdrop-blur text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="w-8 h-px" style={{ background: TOKENS.gold }} />
      <span className="text-[10px] font-bold tracking-[0.32em] uppercase" style={{ color: TOKENS.gold }}>
        {children}
      </span>
      <span className="w-8 h-px" style={{ background: TOKENS.gold }} />
    </div>
  );
}
