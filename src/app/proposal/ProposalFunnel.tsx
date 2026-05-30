"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, FileText, Settings2, Mic, ArrowRight, Check, Loader2,
  AlertCircle, ChevronLeft, Upload, X, Image as ImageIcon, Sparkles,
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
  name: string;
  email: string;
  phone: string;
  affiliation: string;
  jobTitle: string;
  pronouns: string;
  bio: string;
  talkTitle: string;
  talkAbstract: string;
  learningObjectives: string;
  sessionFormat: string;
  sessionLength: string;
  sessionTrack: string;
  preferredDay: string;
  presenterMessage: string;
  headshotDataUrl: string;
  headshotName: string;
};

const EMPTY: Form = {
  name: "", email: "", phone: "", affiliation: "", jobTitle: "", pronouns: "",
  bio: "", talkTitle: "", talkAbstract: "", learningObjectives: "",
  sessionFormat: "", sessionLength: "", sessionTrack: "", preferredDay: "",
  presenterMessage: "",
  headshotDataUrl: "", headshotName: "",
};

const FORMATS = ["Talk", "Panel", "Workshop", "Fireside chat", "Lightning"];
const LENGTHS = ["20 min", "30 min", "45 min", "60 min", "90 min"];
const TRACKS = [
  "Clinical practice", "Interpreter training", "Policy and access",
  "Technology", "Patient and family voice", "Research and outcomes",
];
const DAYS = ["August 15", "August 16", "Either day"];

export default function ProposalFunnel() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  async function submit() {
    setError(null);
    if (!form.name.trim()) return setError("Please share your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Please share a valid email so we can reach you.");
    if (!form.talkTitle.trim()) return setError("Give your proposal a working title.");
    if (!form.talkAbstract.trim()) return setError("An abstract helps us review.");

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

  return (
    <div className="min-h-screen" style={{ background: PAPER }}>
      {/* Hero band */}
      <div
        className="relative overflow-hidden text-white"
        style={{ background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)` }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,161,75,0.18) 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white mb-6">
            <ChevronLeft className="w-3 h-3" /> Back to the conference
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.22em] uppercase mb-5 border"
            style={{
              color: "#F4E9CD",
              borderColor: "rgba(201,161,75,0.45)",
              background: "rgba(201,161,75,0.08)",
            }}>
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            Call for Proposals
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight">
            Share your voice.
          </h1>
          <p className="mt-3 text-white/75 text-sm sm:text-base max-w-xl mx-auto">
            Tell us about the work you want to present. We review on a rolling basis and reply within two weeks.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6 pb-20">
        <div
          className="bg-white rounded-2xl border overflow-hidden"
          style={{ borderColor: HAIRLINE, boxShadow: "0 24px 60px -28px rgba(11,31,37,0.20)" }}
        >
          <Section number="1" title="About you" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full name" required value={form.name} onChange={(v) => update("name", v)} className="sm:col-span-2" />
              <Field label="Email" required type="email" value={form.email} onChange={(v) => update("email", v)} />
              <Field label="Phone" type="tel" value={form.phone} onChange={(v) => update("phone", v)} />
              <Field label="Affiliation" placeholder="Hospital, university, company, or independent" value={form.affiliation} onChange={(v) => update("affiliation", v)} className="sm:col-span-2" />
              <Field label="Role or title" value={form.jobTitle} onChange={(v) => update("jobTitle", v)} />
              <Field label="Pronouns" placeholder="she/her, he/him, they/them" value={form.pronouns} onChange={(v) => update("pronouns", v)} />
            </div>

            <div className="mt-4">
              <Headshot
                dataUrl={form.headshotDataUrl}
                fileName={form.headshotName}
                onPick={() => fileRef.current?.click()}
                onClear={() => { update("headshotDataUrl", ""); update("headshotName", ""); }}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickHeadshot(f); }}
              />
            </div>

            <div className="mt-4">
              <TextArea
                label="Short bio (optional)"
                placeholder="A sentence or two. Who you are, what you focus on."
                value={form.bio}
                onChange={(v) => update("bio", v)}
                rows={2}
              />
            </div>
          </Section>

          <Section number="2" title="Your proposal" icon={FileText}>
            <Field label="Working title" required placeholder="What would you call this session?" value={form.talkTitle} onChange={(v) => update("talkTitle", v)} />
            <div className="mt-4">
              <TextArea
                label="Abstract"
                required
                placeholder="What is the session about, who is it for, why now."
                value={form.talkAbstract}
                onChange={(v) => update("talkAbstract", v)}
                rows={6}
              />
            </div>
            <div className="mt-4">
              <TextArea
                label="Three things attendees will leave with (optional)"
                placeholder="One per line."
                value={form.learningObjectives}
                onChange={(v) => update("learningObjectives", v)}
                rows={3}
              />
            </div>
          </Section>

          <Section number="3" title="Format" icon={Settings2}>
            <Pills label="Session format" value={form.sessionFormat} options={FORMATS} onChange={(v) => update("sessionFormat", v)} />
            <Pills label="Length"         value={form.sessionLength} options={LENGTHS}  onChange={(v) => update("sessionLength", v)} />
            <Pills label="Best fit track" value={form.sessionTrack}  options={TRACKS}   onChange={(v) => update("sessionTrack", v)} />
            <Pills label="Preferred day"  value={form.preferredDay}  options={DAYS}     onChange={(v) => update("preferredDay", v)} />
          </Section>

          <Section number="4" title="Anything else?" icon={Mic}>
            <TextArea
              label="Note to the program team (optional)"
              placeholder="Anything that does not fit above."
              value={form.presenterMessage}
              onChange={(v) => update("presenterMessage", v)}
              rows={3}
            />

            {error && (
              <div className="mt-5 px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm inline-flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold text-base text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${BLUE} 100%)` }}
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting</>
                : <>Submit proposal <ArrowRight className="w-4 h-4" /></>}
            </button>

            <p className="mt-3 text-center text-[11px]" style={{ color: MUTED }}>
              We will send you a confirmation as soon as this lands.
            </p>
          </Section>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: MUTED }}>
          Questions? Email{" "}
          <a className="font-semibold" style={{ color: TEAL }} href="mailto:contact@aalb.org">contact@aalb.org</a>.
        </p>
      </div>
    </div>
  );
}

function Section({
  number, title, icon: Icon, children,
}: {
  number: string;
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 sm:p-8" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
      <div className="flex items-center gap-3 mb-5">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center font-serif-display text-sm font-bold tabular-nums shrink-0"
          style={{ background: GOLD + "22", color: GOLD }}
        >
          {number}
        </span>
        <h2 className="font-serif-display text-xl font-bold flex items-center gap-2" style={{ color: INK }}>
          <Icon className="w-4 h-4" style={{ color: TEAL }} />
          {title}
        </h2>
      </div>
      {children}
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
        className="mt-1 w-full px-3 py-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-600 resize-y"
        style={{ borderColor: HAIRLINE }}
      />
    </label>
  );
}

function Pills({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</div>
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
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ border: `1px solid ${HAIRLINE}`, background: PAPER }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
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
      className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed transition-colors hover:border-teal-500 hover:bg-teal-50/30"
      style={{ borderColor: HAIRLINE }}
    >
      <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: TEAL + "15", color: TEAL }}>
        <ImageIcon className="w-4 h-4" />
      </span>
      <span className="flex-1 text-left">
        <span className="block text-[13px] font-semibold" style={{ color: INK }}>Add a headshot (optional)</span>
        <span className="block text-[11px]" style={{ color: MUTED }}>JPG, PNG, or WebP. Under 5 MB.</span>
      </span>
      <Upload className="w-4 h-4" style={{ color: MUTED }} />
    </button>
  );
}
