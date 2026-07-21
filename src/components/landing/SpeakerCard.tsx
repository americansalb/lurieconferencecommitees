"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, X } from "lucide-react";
import { TOKENS } from "./tokens";
import type { Speaker } from "./speakers-data";

// Initials for the photo fallback, so a speaker still gets a clean, branded
// card before their headshot file is dropped in /public/speakers/.
function initials(name: string) {
  const parts = name.replace(/[^A-Za-z\s]/g, "").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
}

// One speaker card. The card itself stays compact (clamped bio preview); the
// full bio opens in a lightbox modal so a long bio never blows out the grid.
export default function SpeakerCard({ speaker, accent }: { speaker: Speaker; accent: string }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const s = speaker;
  const isLong = s.bio.length > 180;

  return (
    <>
      <article
        className="group relative flex h-full flex-col rounded-3xl bg-white border overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
        style={{
          borderColor: TOKENS.hairline,
          boxShadow: "0 14px 36px -18px rgba(11,31,37,0.20), 0 2px 6px -3px rgba(11,31,37,0.06)",
        }}
      >
        <div className="h-1.5 w-full shrink-0" style={{ background: accent }} />

        <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
          {s.photo && !imgError ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.photo}
                alt={s.name}
                loading="lazy"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                style={{ background: "linear-gradient(180deg, transparent 0%, rgba(11,31,37,0.10) 100%)" }}
              />
            </>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accent}14 0%, ${accent}30 100%)` }}
            >
              <span className="text-6xl font-bold tracking-tight" style={{ color: accent }}>{initials(s.name)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3.5 sm:p-7">
          <h3 className="text-[15px] sm:text-[21px] font-bold leading-tight tracking-tight" style={{ color: TOKENS.ink }}>
            {s.name}
            {s.credentials ? (
              <span className="font-semibold hidden sm:inline" style={{ color: TOKENS.mutedSoft }}>, <span className="whitespace-nowrap">{s.credentials}</span></span>
            ) : null}
          </h3>

          <span className="mt-2 mb-2 sm:mt-3 sm:mb-3.5 block h-[3px] w-9 rounded-full" style={{ background: accent }} />

          {/* The session title is the headline when we have it: what they're
              presenting matters more to attendees than their job title. Shown
              in full, never truncated — a cut-off talk title is worse than an
              uneven card. On phones the compact two-across cards show only
              name and role; the talk and bio live in the tap-open modal. */}
          {s.talk && (
            <div className="hidden sm:block mb-2.5 text-[15px] font-semibold italic leading-snug" style={{ color: TOKENS.ink }}>
              &ldquo;{s.talk}&rdquo;
            </div>
          )}

          {/* Reserve two lines for the title so one-line and two-line titles
              don't stagger the org/bio baselines across the row. */}
          <div className="sm:min-h-[2.75em] text-[10px] sm:text-[12.5px] font-bold uppercase tracking-wide leading-snug line-clamp-2" style={{ color: accent }} title={s.title}>
            {s.title}
          </div>
          <div className="mt-0.5 text-[11px] sm:text-[13px] leading-snug line-clamp-2" style={{ color: TOKENS.muted }}>
            {s.org}
          </div>

          {/* The visibility class lives on a wrapper: sm:block on the <p>
              itself would override the -webkit-box display that line-clamp
              needs, un-clamping every bio. */}
          <div className="hidden sm:block">
            <p className="mt-4 text-[14px] leading-relaxed line-clamp-3" style={{ color: TOKENS.inkSoft }}>
              {s.bio}
            </p>
          </div>

          {/* On phones the button is the only path to the talk and bio, so it
              always shows there; on desktop only when the bio is clamped. */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`mt-auto pt-2 sm:pt-3 inline-flex items-center gap-1 self-start text-[11px] sm:text-[13px] font-bold tracking-wide hover:gap-1.5 transition-all${isLong ? "" : " sm:hidden"}`}
            style={{ color: accent }}
          >
            Read full bio
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </article>

      {open && <SpeakerModal speaker={s} accent={accent} onClose={() => setOpen(false)} />}
    </>
  );
}

// The keynote feature: a full-width card above the grid, on the brand's deep
// teal, so the headliner and their organization read at a glance instead of
// as one more tile. Reuses the same full-bio modal as the grid cards.
export function KeynoteCard({ speaker }: { speaker: Speaker }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const s = speaker;
  const GOLD = "#C9A14B";

  return (
    <>
      <article
        className="relative rounded-3xl overflow-hidden text-white"
        style={{
          background: `linear-gradient(135deg, ${TOKENS.teal} 0%, ${TOKENS.tealDeep} 100%)`,
          boxShadow: "0 24px 60px -24px rgba(12,59,75,0.55), 0 4px 12px -6px rgba(11,31,37,0.2)",
        }}
      >
        {/* Gold keynote rail across the top, echoing the letterhead rule. */}
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, #9C7A2E 0%, #F4E9CD 50%, #9C7A2E 100%)` }}
        />
        <div className="flex flex-col sm:flex-row">
          <div className="relative sm:w-[38%] lg:w-[32%] shrink-0 bg-slate-800">
            {s.photo && !imgError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={s.photo}
                alt={s.name}
                onError={() => setImgError(true)}
                className="w-full h-72 sm:h-full object-cover"
              />
            ) : (
              <div className="w-full h-72 sm:h-full flex items-center justify-center bg-white/10">
                <span className="text-7xl font-bold tracking-tight text-white/80">{initials(s.name)}</span>
              </div>
            )}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none hidden sm:block"
              style={{ background: `linear-gradient(90deg, transparent 70%, ${TOKENS.tealDeep}55 100%)` }}
            />
          </div>

          <div className="flex-1 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2.5">
              <span className="w-8 h-px" style={{ background: GOLD }} />
              <span className="text-[11px] font-bold tracking-[0.32em] uppercase" style={{ color: "#F4E9CD" }}>
                Keynote Speaker
              </span>
              <span className="w-8 h-px" style={{ background: GOLD }} />
            </div>

            <h3 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              {s.name}
              {s.credentials ? <span className="font-semibold text-white/60">, {s.credentials}</span> : null}
            </h3>

            {/* The organization is the headline credential: give it real size. */}
            <div className="mt-3 text-xl sm:text-2xl font-semibold" style={{ color: "#F4E9CD" }}>
              {s.org}
            </div>
            <div className="mt-1 text-[13px] font-bold uppercase tracking-wide text-white/70">
              {s.title}
            </div>

            {s.talk && (
              <div className="mt-5 text-lg sm:text-xl font-semibold italic leading-snug text-white max-w-2xl">
                &ldquo;{s.talk}&rdquo;
              </div>
            )}

            <p className="mt-5 text-[15px] leading-relaxed text-white/85 line-clamp-3 max-w-2xl">
              {s.bio}
            </p>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-6 inline-flex items-center gap-1.5 self-start px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:gap-2.5"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(244,233,205,0.45)", color: "#F4E9CD" }}
            >
              Read full bio <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>

      {open && <SpeakerModal speaker={s} accent={TOKENS.teal} onClose={() => setOpen(false)} />}
    </>
  );
}

function SpeakerModal({ speaker: s, accent, onClose }: { speaker: Speaker; accent: string; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);
  useEffect(() => setMounted(true), []);

  // Lock body scroll and wire up Escape-to-close while the modal is open.
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

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm speaker-overlay-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${s.name}, full biography`}
    >
      <div
        className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col sm:flex-row speaker-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo: banner on mobile, side column on desktop. */}
        <div className="relative sm:w-[42%] shrink-0 bg-slate-100">
          {s.photo && !imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={s.photo} alt={s.name} onError={() => setImgError(true)} className="w-full h-56 sm:h-full object-cover" />
          ) : (
            <div
              className="w-full h-56 sm:h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accent}14 0%, ${accent}30 100%)` }}
            >
              <span className="text-7xl font-bold tracking-tight" style={{ color: accent }}>{initials(s.name)}</span>
            </div>
          )}
          <div className="absolute inset-x-0 top-0 h-1.5 sm:hidden" style={{ background: accent }} />
        </div>

        {/* Accent rail between photo and text on desktop. */}
        <div className="hidden sm:block w-1.5 shrink-0" style={{ background: accent }} />

        <div className="flex-1 p-7 sm:p-9 overflow-y-auto">
          <h3 className="text-2xl font-bold tracking-tight pr-8" style={{ color: TOKENS.ink }}>
            {s.name}
            {s.credentials ? (
              <span className="font-semibold" style={{ color: TOKENS.mutedSoft }}>, <span className="whitespace-nowrap">{s.credentials}</span></span>
            ) : null}
          </h3>
          <div className="mt-2 text-[12.5px] font-bold uppercase tracking-wide" style={{ color: accent }}>
            {s.title}
          </div>
          <div className="text-[13.5px]" style={{ color: TOKENS.muted }}>{s.org}</div>

          {s.talk && (
            <div className="mt-4 text-[16px] font-semibold italic leading-snug" style={{ color: TOKENS.ink }}>
              &ldquo;{s.talk}&rdquo;
            </div>
          )}

          <div className="mt-5 mb-5 h-px w-full" style={{ background: TOKENS.hairline }} />

          <p className="text-[15px] leading-relaxed" style={{ color: TOKENS.inkSoft }}>
            {s.bio}
          </p>
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
