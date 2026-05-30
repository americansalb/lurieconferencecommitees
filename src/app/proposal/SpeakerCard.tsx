"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Globe, Linkedin } from "lucide-react";
import type { Form } from "./useProposalForm";

const PAPER = "#FAFBFC";
const GOLD = "#C9A14B";
const GOLD_SOFT = "#F4E9CD";
const TEAL = "#0E4456";
const TEAL_DEEP = "#0C3B4B";
const INK = "#0B1F25";
const MUTED = "#5A6E76";
const MUTED_SOFT = "#8898A0";

// Fictional exemplar shown when nothing is filled. Replacing a real-feeling
// card is more inviting than building from a blank.
export const EXEMPLAR: Form = {
  name: "Maya Chen",
  email: "",
  phone: "",
  affiliation: "Lurie Children's Hospital of Chicago",
  jobTitle: "Senior Interpreter",
  pronouns: "she/her",
  bio: "Maya leads interpreter quality programs across the pediatric service line.",
  websiteUrl: "https://example.org",
  linkedinUrl: "https://linkedin.com/in/example",
  talkTitle: "A Field Guide to Asking Twice",
  talkAbstract:
    "Start typing on the left. This card becomes your speaker page if the program team books you. Treat the abstract like a paragraph in a magazine: tell us what the session is about, who needs to hear it, and why this year is when it should be said. We read these carefully, three times each.",
  learningObjectives:
    "How to design clinical encounters around clarification, not translation\nA tested rubric for when to interrupt and when to let language land\nWhy interpreters belong in the consent room, not the hallway",
  sessionFormat: "Talk",
  sessionLength: "30 min",
  sessionTrack: "Clinical practice",
  preferredDay: "August 15",
  coPresenters: "",
  presenterMessage: "",
  headshotDataUrl: "",
  headshotName: "",
};

type Props = {
  form: Form;
  isExemplar: boolean;
  shake?: boolean;
};

// Coerces a possibly-empty string to either the user's value or an italic
// muted placeholder. Used so empty fields never break layout.
function fallback(value: string | undefined, placeholder: string): { text: string; isPlaceholder: boolean } {
  const v = (value || "").trim();
  if (v) return { text: v, isPlaceholder: false };
  return { text: placeholder, isPlaceholder: true };
}

function splitLines(value: string): string[] {
  return (value || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function SpeakerCardInner({ form, isExemplar, shake }: Props) {
  const title = fallback(form.talkTitle, "Your working title");
  const abstract = fallback(form.talkAbstract, "Your abstract will compose itself here as you type on the left.");
  const name = fallback(form.name, "Your name");
  const role = [form.jobTitle, form.affiliation].filter(Boolean).join(", ");
  const objectives = splitLines(form.learningObjectives);
  const coPresenters = splitLines(form.coPresenters);

  const titleWords = title.text.split(/\s+/).filter(Boolean);
  const titleWordCount = titleWords.length;
  const titleSize = titleWordCount > 8 ? "text-[28px] sm:text-[32px]" : titleWordCount > 5 ? "text-[32px] sm:text-[36px]" : "text-[36px] sm:text-[42px]";
  // Drop cap on the title only when the first WORD is at least 3 letters,
  // otherwise the "A" or "An" gets enlarged and looks orphaned.
  const titleDropCap =
    !title.isPlaceholder && titleWordCount > 5 && (titleWords[0]?.length ?? 0) >= 3;

  return (
    <motion.div
      animate={shake ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      className="relative mx-auto w-full max-w-[460px]"
    >
      {/* Outer paper card */}
      <div
        className="relative rounded-[20px] overflow-hidden"
        style={{
          background: PAPER,
          border: `1px solid ${GOLD_SOFT}`,
          boxShadow:
            "0 40px 100px -40px rgba(0,0,0,0.55), 0 18px 40px -22px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(201,161,75,0.10)",
        }}
      >
        {/* Inner ridge */}
        <div
          aria-hidden
          className="absolute inset-2.5 rounded-[14px] pointer-events-none"
          style={{ border: `0.5px solid rgba(201,161,75,0.18)` }}
        />

        <div className="relative px-8 pt-8 pb-9 sm:px-10 sm:pt-10 sm:pb-11">
          {/* Eyebrow strip */}
          <div className="flex items-center justify-center gap-2 mb-7">
            <span style={{ color: GOLD }}>[</span>
            <span
              className="text-[10px] font-bold tracking-[0.28em] uppercase"
              style={{ color: GOLD }}
            >
              2026 Lurie &times; AALB &middot; Speaker
            </span>
            <span style={{ color: GOLD }}>]</span>
          </div>

          {/* Headshot */}
          <div className="relative mx-auto w-[140px] h-[140px] mb-5">
            {/* Tinted teal disc behind */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{ background: `${TEAL}10` }}
            />
            {/* Gold double ring */}
            <div
              aria-hidden
              className="absolute -inset-1.5 rounded-full"
              style={{ border: `2px solid ${GOLD}` }}
            />
            <div
              aria-hidden
              className="absolute -inset-[2px] rounded-full"
              style={{ border: `1px solid ${GOLD_SOFT}` }}
            />
            <motion.div
              layoutId="speaker-headshot"
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{ background: PAPER }}
            >
              {form.headshotDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.headshotDataUrl}
                  alt="Speaker headshot"
                  className="w-full h-full object-cover"
                />
              ) : (
                <SilhouettePlaceholder />
              )}
            </motion.div>
            {form.pronouns && (
              <div
                className="absolute -bottom-1 right-0 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-white"
                style={{
                  color: INK,
                  border: `1px solid ${GOLD_SOFT}`,
                  boxShadow: "0 4px 10px -4px rgba(11,31,37,0.18)",
                }}
              >
                {form.pronouns}
              </div>
            )}
          </div>

          {/* Title */}
          <h2
            className={`font-serif-display font-bold leading-[1.05] tracking-tight text-center mb-3 ${titleSize}`}
            style={{ color: title.isPlaceholder ? MUTED_SOFT : INK, fontStyle: title.isPlaceholder ? "italic" : "normal" }}
          >
            {titleDropCap ? (
              <span>
                <span style={{ color: GOLD, fontSize: "1.35em", lineHeight: 1, marginRight: "0.05em" }}>
                  {title.text.charAt(0)}
                </span>
                {title.text.slice(1)}
              </span>
            ) : (
              title.text
            )}
          </h2>

          {/* Byline */}
          <div className="text-center mb-3">
            <span
              className="font-serif-display italic"
              style={{
                color: name.isPlaceholder ? MUTED_SOFT : INK,
                fontSize: 16,
              }}
            >
              by {name.text}
            </span>
            {role && (
              <span
                className="font-serif-display italic"
                style={{ color: MUTED, fontSize: 14 }}
              >
                {" "}&middot; {role}
              </span>
            )}
          </div>

          {coPresenters.length > 0 && (
            <div className="text-center mb-3 text-[12px]" style={{ color: MUTED }}>
              with {coPresenters.join(" · ")}
            </div>
          )}

          {/* Gold rule */}
          <div className="flex justify-center mb-5">
            <span
              className="block"
              style={{ width: 28, height: 1.5, background: GOLD }}
            />
          </div>

          {/* Abstract */}
          <p
            className="font-serif-display leading-[1.65] text-[15px] mb-6"
            style={{
              color: abstract.isPlaceholder ? MUTED_SOFT : INK,
              fontStyle: abstract.isPlaceholder ? "italic" : "normal",
              textAlign: "justify",
              hyphens: "auto",
            }}
          >
            {!abstract.isPlaceholder ? (
              <>
                <span
                  className="font-serif-display font-bold"
                  style={{
                    color: GOLD,
                    fontSize: 56,
                    lineHeight: "44px",
                    float: "left",
                    marginRight: 6,
                    marginTop: 4,
                    fontStyle: "normal",
                  }}
                >
                  {abstract.text.charAt(0)}
                </span>
                {abstract.text.slice(1)}
              </>
            ) : (
              abstract.text
            )}
          </p>

          {/* Bio */}
          {form.bio?.trim() && (
            <p
              className="text-[12px] leading-relaxed mb-6"
              style={{ color: MUTED }}
            >
              <span
                className="text-[10px] font-bold tracking-[0.22em] uppercase"
                style={{ color: GOLD }}
              >
                About &nbsp;
              </span>
              {form.bio.trim()}
            </p>
          )}

          {/* Takeaways */}
          {objectives.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: GOLD }}>[</span>
                <span
                  className="text-[10px] font-bold tracking-[0.26em] uppercase"
                  style={{ color: GOLD }}
                >
                  You&rsquo;ll leave with
                </span>
                <span style={{ color: GOLD }}>]</span>
              </div>
              <ul className="space-y-1.5">
                {objectives.slice(0, 4).map((line, i) => (
                  <li
                    key={i}
                    className="text-[13px] leading-relaxed pl-4 relative"
                    style={{ color: INK }}
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-[7px]"
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        background: GOLD,
                      }}
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
            {(form.sessionFormat || form.sessionLength) && (
              <Badge>
                {form.sessionFormat?.toUpperCase()}
                {form.sessionFormat && form.sessionLength && (
                  <span style={{ color: MUTED, margin: "0 6px" }}>&middot;</span>
                )}
                {form.sessionLength?.toUpperCase()}
              </Badge>
            )}
            {form.sessionTrack && <Badge>{form.sessionTrack}</Badge>}
            {form.preferredDay && <Badge>{form.preferredDay}</Badge>}
          </div>

          {/* Footer rail */}
          <div className="flex items-end justify-between pt-3" style={{ borderTop: `0.5px solid ${GOLD_SOFT}` }}>
            <div className="flex items-center gap-2.5 text-[11px]" style={{ color: MUTED }}>
              {form.websiteUrl && <Globe className="w-3.5 h-3.5" />}
              {form.linkedinUrl && <Linkedin className="w-3.5 h-3.5" />}
            </div>
            <div
              className="font-mono text-[9px] tracking-widest uppercase"
              style={{ color: MUTED_SOFT }}
            >
              N&deg; 026 &middot; CHI
            </div>
          </div>
        </div>
      </div>

      {/* Tag along the bottom */}
      {isExemplar && (
        <div
          className="mt-3 text-center text-[10px] font-bold tracking-[0.28em] uppercase"
          style={{ color: "rgba(244,233,205,0.55)" }}
        >
          [ Draft &middot; this becomes your card ]
        </div>
      )}
    </motion.div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[0.14em] uppercase"
      style={{
        color: INK,
        border: `1px solid ${GOLD}`,
        background: "white",
      }}
    >
      {children}
    </span>
  );
}

function SilhouettePlaceholder() {
  return (
    <svg
      viewBox="0 0 140 140"
      className="w-full h-full"
      style={{ background: `${TEAL_DEEP}08` }}
    >
      <g fill={MUTED_SOFT} opacity={0.45}>
        <circle cx="70" cy="56" r="22" />
        <path d="M28 130 C 28 95, 50 80, 70 80 C 90 80, 112 95, 112 130 Z" />
      </g>
    </svg>
  );
}

export const SpeakerCard = memo(SpeakerCardInner);
