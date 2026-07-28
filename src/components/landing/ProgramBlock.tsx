import { Download, Award } from "lucide-react";
import { TOKENS } from "./tokens";
import { PROGRAM_DAYS, PROGRAM_NOTE, CEU_TOTAL_LABEL, CEU_PENDING_NOTE, formatCeu, type SessionKind } from "./program-data";

// Program section: the complete two-day schedule rendered directly on the
// page — one column per day on desktop, stacked on phones — so nobody has to
// click anything to see the agenda. The official PDF stays one tap away.

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
  return (
    <section id="program" className="relative pt-12 sm:pt-16 pb-24 sm:pb-28 overflow-hidden" style={{ background: `linear-gradient(180deg, #FFFFFF 0%, ${TOKENS.paper} 100%)` }}>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Eyebrow>Program</Eyebrow>
          <h2 className="mt-6 text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight" style={{ color: TOKENS.ink }}>
            Two full days of talks, panels, and workshops.
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: TOKENS.muted }}>
            {PROGRAM_NOTE}
          </p>
          <div
            className="mt-6 inline-flex items-center gap-2.5 rounded-full px-5 py-2.5"
            style={{ background: "#FBF4E2", border: "1px solid #EAD9AE" }}
          >
            <Award className="w-4 h-4 shrink-0" style={{ color: TOKENS.gold }} />
            <span className="text-[13.5px] font-bold" style={{ color: "#6B5316" }}>
              {CEU_TOTAL_LABEL} of CEUs across both days
            </span>
            <span className="text-[11px] font-bold tracking-wide uppercase rounded-full px-2 py-0.5" style={{ background: "#F3E4BF", color: "#8A6A20" }}>
              Pending
            </span>
          </div>
        </div>

        {/* The whole schedule, in the open: one card per day. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start mb-6">
          {PROGRAM_DAYS.map((day) => (
            <div key={day.label} className="rounded-2xl bg-white text-left" style={{ border: `1px solid ${TOKENS.hairline}`, boxShadow: "0 10px 26px -16px rgba(11,31,37,0.14)" }}>
              <div className="px-4 sm:px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${TOKENS.hairline}` }}>
                <div className="text-[11px] font-bold tracking-[0.26em] uppercase" style={{ color: TOKENS.gold }}>{day.label}</div>
                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <h3 className="text-[19px] font-bold tracking-tight" style={{ color: TOKENS.ink }}>{day.date}</h3>
                  <div className="text-[12px] font-semibold shrink-0" style={{ color: TOKENS.mutedSoft }}>{day.hours}</div>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold" style={{ color: "#8A6A20" }}>
                  <Award className="w-3.5 h-3.5" /> {day.ceuLabel}
                </div>
              </div>
              <ul className="px-2 sm:px-3 py-2">
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
                      <div className="shrink-0 pt-0.5 text-right">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase" style={{ background: chip.bg, color: chip.fg }}>
                          {chip.label}
                        </span>
                        {s.ceuMinutes ? (
                          <div className="mt-1 text-[11px] font-bold tabular-nums whitespace-nowrap" style={{ color: "#8A6A20" }}>
                            {formatCeu(s.ceuMinutes)} CEU
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-[12.5px] mb-2 max-w-2xl mx-auto leading-relaxed" style={{ color: TOKENS.mutedSoft }}>
          {CEU_PENDING_NOTE}
        </p>
        <p className="text-center text-[12.5px] mb-9" style={{ color: TOKENS.mutedSoft }}>
          Sessions and times may shift slightly as the program is finalized.
        </p>

        <div className="flex justify-center">
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
    </section>
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
