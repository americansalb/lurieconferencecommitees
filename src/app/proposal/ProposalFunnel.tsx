"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, ArrowLeft, Check, Loader2, AlertCircle,
  ChevronLeft, Upload, X, Image as ImageIcon,
} from "lucide-react";

const TEAL = "#0E4456";
const TEAL_DEEP = "#0C3B4B";
const BLUE = "#2A8FCC";
const GOLD = "#C9A14B";
const PAPER = "#FAFBFC";
const INK = "#0B1F25";
const MUTED = "#5A6E76";
const HAIRLINE = "#E6EBEE";

type Form = {
  name: string; email: string; phone: string;
  affiliation: string; jobTitle: string; pronouns: string;
  bio: string; websiteUrl: string; linkedinUrl: string;
  talkTitle: string; talkAbstract: string; learningObjectives: string;
  sessionFormat: string; sessionLength: string;
  sessionTrack: string; preferredDay: string;
  coPresenters: string; presenterMessage: string;
  headshotDataUrl: string; headshotName: string;
};

const EMPTY: Form = {
  name: "", email: "", phone: "", affiliation: "", jobTitle: "", pronouns: "",
  bio: "", websiteUrl: "", linkedinUrl: "",
  talkTitle: "", talkAbstract: "", learningObjectives: "",
  sessionFormat: "", sessionLength: "", sessionTrack: "", preferredDay: "",
  coPresenters: "", presenterMessage: "",
  headshotDataUrl: "", headshotName: "",
};

const FORMATS = ["Talk", "Panel", "Workshop", "Fireside chat", "Lightning"];
const LENGTHS = ["20 min", "30 min", "45 min", "60 min", "90 min"];
const TRACKS = [
  "Clinical practice", "Interpreter training", "Policy and access",
  "Technology", "Patient and family voice", "Research and outcomes",
];
const DAYS = ["August 15", "August 16", "Either day"];

const STEPS = [
  { key: "you",     title: "About you",       sub: "Who's behind the talk?" },
  { key: "idea",    title: "Your idea",       sub: "What do you want to say?" },
  { key: "shape",   title: "Shape of it",     sub: "Format, length, fit." },
  { key: "review",  title: "Read it back",    sub: "One last look before we send it in." },
] as const;

type StepKey = typeof STEPS[number]["key"];

export default function ProposalFunnel() {
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const step = STEPS[stepIdx];

  function update<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function pickHeadshot(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Please choose a photo under 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      update("headshotDataUrl", result);
      update("headshotName", file.name);
    };
    reader.readAsDataURL(file);
  }

  function validateStep(key: StepKey): string | null {
    if (key === "you") {
      if (!form.name.trim()) return "Tell us your name first.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "We need a valid email so we can reach you.";
      return null;
    }
    if (key === "idea") {
      if (!form.talkTitle.trim()) return "Give your proposal a working title.";
      if (!form.talkAbstract.trim()) return "An abstract is needed for review.";
      return null;
    }
    return null;
  }

  function next() {
    const err = validateStep(step.key);
    if (err) { setError(err); return; }
    setError(null);
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setError(null);
    setStepIdx((i) => Math.max(i - 1, 0));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/presenters/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Could not submit. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/proposal/success/${json.token}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const wordCount = useMemo(() => form.talkAbstract.trim() ? form.talkAbstract.trim().split(/\s+/).length : 0, [form.talkAbstract]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: PAPER }}>
      {/* Top progress bar */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-white/85 border-b" style={{ borderColor: HAIRLINE }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase" style={{ color: MUTED }}>
            <ChevronLeft className="w-3 h-3" /> Conference
          </Link>
          <div className="flex-1 max-w-xs mx-auto">
            <ProgressDots current={stepIdx} total={STEPS.length} />
          </div>
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: MUTED }}>
            {String(stepIdx + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-2xl">
          {/* Step header */}
          <div className="text-center mb-8 sm:mb-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.24em] uppercase mb-4"
              style={{ background: GOLD + "1F", color: GOLD }}
            >
              Step {stepIdx + 1} of {STEPS.length}
            </div>
            <h1 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: INK }}>
              {step.title}
            </h1>
            <p className="mt-3 text-sm sm:text-base" style={{ color: MUTED }}>{step.sub}</p>
          </div>

          {/* Step body */}
          <div
            className="bg-white rounded-2xl p-6 sm:p-8 border"
            style={{ borderColor: HAIRLINE, boxShadow: "0 20px 60px -28px rgba(11,31,37,0.18)" }}
          >
            {step.key === "you"    && <StepYou    form={form} update={update} fileRef={fileRef} onPick={pickHeadshot} />}
            {step.key === "idea"   && <StepIdea   form={form} update={update} wordCount={wordCount} />}
            {step.key === "shape"  && <StepShape  form={form} update={update} />}
            {step.key === "review" && <StepReview form={form} />}

            {error && (
              <div className="mt-6 px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm inline-flex items-start gap-2 w-full">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-3">
            {stepIdx > 0 ? (
              <button
                onClick={back}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-white border transition-colors"
                style={{ borderColor: HAIRLINE, color: INK }}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <span />
            )}

            {stepIdx < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${BLUE} 100%)`, boxShadow: `0 10px 24px -10px ${TEAL}99` }}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white shadow-lg transition-all disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, #E8C56F 0%, ${GOLD} 100%)`, color: "#3C2E10", boxShadow: "0 10px 26px -10px rgba(201,161,75,0.55)" }}
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  : <>Send proposal <ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickHeadshot(f); }}
          />

          <p className="mt-8 text-center text-[11px]" style={{ color: MUTED }}>
            Reviewed on a rolling basis. We reply within two weeks. Questions to{" "}
            <a href="mailto:contact@aalb.org" className="font-semibold" style={{ color: TEAL }}>contact@aalb.org</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- Steps ----------

function StepYou({
  form, update, fileRef, onPick,
}: {
  form: Form;
  update: <K extends keyof Form>(k: K, v: Form[K]) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onPick: (f: File) => Promise<void>;
}) {
  return (
    <div className="space-y-5">
      {/* Headshot up top as the warm welcome */}
      <Headshot
        dataUrl={form.headshotDataUrl}
        fileName={form.headshotName}
        onPick={() => fileRef.current?.click()}
        onClear={() => { update("headshotDataUrl", ""); update("headshotName", ""); }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name" required value={form.name} onChange={(v) => update("name", v)} className="sm:col-span-2" />
        <Field label="Email" required type="email" value={form.email} onChange={(v) => update("email", v)} />
        <Field label="Phone" type="tel" value={form.phone} onChange={(v) => update("phone", v)} />
        <Field label="Affiliation" placeholder="Hospital, university, company, or independent" value={form.affiliation} onChange={(v) => update("affiliation", v)} className="sm:col-span-2" />
        <Field label="Role or title" value={form.jobTitle} onChange={(v) => update("jobTitle", v)} />
        <Field label="Pronouns" placeholder="she/her, he/him, they/them" value={form.pronouns} onChange={(v) => update("pronouns", v)} />
      </div>

      <TextArea
        label="Short bio (optional)"
        placeholder="A few sentences. Who you are, what you focus on."
        value={form.bio}
        onChange={(v) => update("bio", v)}
        rows={3}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Website" placeholder="https://" value={form.websiteUrl} onChange={(v) => update("websiteUrl", v)} />
        <Field label="LinkedIn" placeholder="linkedin.com/in/..." value={form.linkedinUrl} onChange={(v) => update("linkedinUrl", v)} />
      </div>
    </div>
  );
}

function StepIdea({
  form, update, wordCount,
}: {
  form: Form;
  update: <K extends keyof Form>(k: K, v: Form[K]) => void;
  wordCount: number;
}) {
  const over = wordCount > 500;
  return (
    <div className="space-y-6">
      <BigField
        label="Working title"
        placeholder="What would you call this session?"
        value={form.talkTitle}
        onChange={(v) => update("talkTitle", v)}
        required
      />

      <div>
        <TextArea
          label="Abstract"
          required
          placeholder="200 to 400 words. What's the session about, who's it for, why now."
          value={form.talkAbstract}
          onChange={(v) => update("talkAbstract", v)}
          rows={8}
        />
        <div className="mt-1 text-[11px] text-right" style={{ color: over ? "#dc2626" : MUTED }}>
          {wordCount} / 500 words
        </div>
      </div>

      <TextArea
        label="Three things attendees will leave with"
        placeholder="One per line."
        value={form.learningObjectives}
        onChange={(v) => update("learningObjectives", v)}
        rows={4}
      />
    </div>
  );
}

function StepShape({
  form, update,
}: {
  form: Form;
  update: <K extends keyof Form>(k: K, v: Form[K]) => void;
}) {
  return (
    <div className="space-y-7">
      <PillGroup label="Format"          value={form.sessionFormat} options={FORMATS} onChange={(v) => update("sessionFormat", v)} />
      <PillGroup label="Length"          value={form.sessionLength} options={LENGTHS} onChange={(v) => update("sessionLength", v)} />
      <PillGroup label="Best fit track"  value={form.sessionTrack}  options={TRACKS}  onChange={(v) => update("sessionTrack", v)} />
      <PillGroup label="Preferred day"   value={form.preferredDay}  options={DAYS}    onChange={(v) => update("preferredDay", v)} />

      <Field
        label="Co-presenters (optional)"
        placeholder="Names and affiliations, one per line."
        value={form.coPresenters}
        onChange={(v) => update("coPresenters", v)}
      />

      <TextArea
        label="Note to the program team (optional)"
        placeholder="Anything that doesn't fit above. Constraints, prior work, video links."
        value={form.presenterMessage}
        onChange={(v) => update("presenterMessage", v)}
        rows={3}
      />
    </div>
  );
}

function StepReview({ form }: { form: Form }) {
  const Row = ({ label, value }: { label: string; value: string | null | undefined }) =>
    value ? (
      <div className="py-3 grid grid-cols-[140px_1fr] gap-4" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
        <div className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: MUTED }}>{label}</div>
        <div className="text-sm leading-relaxed" style={{ color: INK }}>{value}</div>
      </div>
    ) : null;

  return (
    <div>
      {/* Title card */}
      <div className="text-center pb-5 mb-1">
        {form.headshotDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.headshotDataUrl} alt="" className="w-16 h-16 rounded-full object-cover mx-auto mb-3 ring-1 ring-slate-200" />
        )}
        <div className="text-[10px] font-bold tracking-[0.28em] uppercase mb-2" style={{ color: GOLD }}>Your proposal</div>
        <h3 className="font-serif-display text-2xl sm:text-3xl font-bold leading-tight" style={{ color: INK }}>
          {form.talkTitle || "Untitled"}
        </h3>
        <div className="mt-2 text-sm" style={{ color: MUTED }}>by {form.name}</div>
      </div>

      {/* Abstract */}
      {form.talkAbstract && (
        <div
          className="rounded-xl p-4 mb-4 text-sm leading-relaxed"
          style={{ background: PAPER, borderLeft: `3px solid ${GOLD}`, color: INK }}
        >
          {form.talkAbstract.split("\n").map((line, i) => (
            <p key={i} className="mb-2 last:mb-0">{line}</p>
          ))}
        </div>
      )}

      {form.learningObjectives && (
        <div className="mb-2">
          <div className="text-[10px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: MUTED }}>Takeaways</div>
          <ul className="text-sm space-y-1" style={{ color: INK }}>
            {form.learningObjectives.split("\n").filter(Boolean).map((line, i) => (
              <li key={i} className="flex gap-2"><span style={{ color: GOLD }}>·</span> {line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <Row label="Format"         value={form.sessionFormat} />
        <Row label="Length"         value={form.sessionLength} />
        <Row label="Track"          value={form.sessionTrack} />
        <Row label="Preferred day"  value={form.preferredDay} />
        <Row label="Co-presenters"  value={form.coPresenters} />
        <Row label="Affiliation"    value={form.affiliation} />
        <Row label="Role"           value={form.jobTitle} />
        <Row label="Email"          value={form.email} />
        <Row label="Phone"          value={form.phone} />
      </div>

      {form.presenterMessage && (
        <div className="mt-5 rounded-lg p-3 text-sm" style={{ background: PAPER, color: MUTED }}>
          <div className="text-[10px] font-bold tracking-[0.22em] uppercase mb-1" style={{ color: MUTED }}>Note to program team</div>
          {form.presenterMessage}
        </div>
      )}
    </div>
  );
}

// ---------- Building blocks ----------

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all"
            style={{
              flex: active ? "1 1 36px" : "0 0 12px",
              background: done ? TEAL : active ? GOLD : HAIRLINE,
              boxShadow: active ? `0 0 10px ${GOLD}99` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, required, type, className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: MUTED }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </span>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-600"
        style={{ borderColor: HAIRLINE }}
      />
    </label>
  );
}

function BigField({
  label, value, onChange, placeholder, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: MUTED }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full font-serif-display text-2xl sm:text-3xl font-bold tracking-tight border-b-2 bg-transparent outline-none pb-2 transition-colors focus:border-teal-600"
        style={{ borderColor: HAIRLINE, color: INK }}
      />
    </label>
  );
}

function TextArea({
  label, value, onChange, placeholder, required, rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: MUTED }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        className="mt-1 w-full px-3 py-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-600 resize-y leading-relaxed"
        style={{ borderColor: HAIRLINE }}
      />
    </label>
  );
}

function PillGroup({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-wide uppercase mb-2.5" style={{ color: MUTED }}>{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(selected ? "" : opt)}
              className="px-3.5 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                background: selected ? TEAL : "white",
                color: selected ? "white" : INK,
                border: `1px solid ${selected ? TEAL : HAIRLINE}`,
                boxShadow: selected ? `0 6px 16px -8px ${TEAL}99` : undefined,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Headshot({
  dataUrl, fileName, onPick, onClear,
}: {
  dataUrl: string;
  fileName: string;
  onPick: () => void;
  onClear: () => void;
}) {
  if (dataUrl) {
    return (
      <div className="flex items-center gap-4 p-3 rounded-xl border" style={{ borderColor: HAIRLINE, background: PAPER }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: INK }}>{fileName || "Selected"}</div>
          <div className="text-[11px]" style={{ color: MUTED }}>Looking good.</div>
        </div>
        <button type="button" onClick={onClear} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700" aria-label="Remove photo">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onPick}
      className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-colors hover:border-teal-500 hover:bg-teal-50/30"
      style={{ borderColor: HAIRLINE }}
    >
      <span className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: TEAL + "15", color: TEAL }}>
        <ImageIcon className="w-5 h-5" />
      </span>
      <span className="flex-1 text-left">
        <span className="block text-sm font-semibold" style={{ color: INK }}>Add a headshot (optional)</span>
        <span className="block text-xs" style={{ color: MUTED }}>JPG or PNG, under 5 MB. We&rsquo;ll use it in the program.</span>
      </span>
      <Upload className="w-4 h-4" style={{ color: MUTED }} />
    </button>
  );
}
