"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Lightbulb, FileText, Sparkles, User, Mic, Pencil, Check, X,
  Image as ImageIcon, Upload, Plus,
} from "lucide-react";
import {
  C, WizardShell, StepFrame, Question, TextInput, TextArea, Pill,
  PrimaryButton, InlineError, Hint, useEnterKey,
} from "@/components/funnel/Wizard";

type Form = {
  name: string; email: string; phone: string; affiliation: string;
  jobTitle: string; pronouns: string; bio: string;
  talkTitle: string; talkAbstract: string; learningObjectives: string;
  sessionFormat: string; sessionLength: string; sessionTrack: string; preferredDay: string;
  presenterMessage: string; headshotDataUrl: string; headshotName: string;
};

const EMPTY: Form = {
  name: "", email: "", phone: "", affiliation: "", jobTitle: "", pronouns: "",
  bio: "", talkTitle: "", talkAbstract: "", learningObjectives: "",
  sessionFormat: "", sessionLength: "", sessionTrack: "", preferredDay: "",
  presenterMessage: "", headshotDataUrl: "", headshotName: "",
};

const FORMATS = ["Talk", "Panel", "Workshop", "Fireside chat", "Lightning"];
const LENGTHS = ["20 min", "30 min", "45 min", "60 min", "90 min"];
const TRACKS = ["Clinical practice", "Interpreter training", "Policy and access", "Technology", "Patient and family voice", "Research and outcomes"];
const DAYS = ["August 15", "August 16", "Either day"];

const STEPS = ["Your idea", "The pitch", "Format", "About you", "Review"];
const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function ProposalFunnel() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function goBack() {
    setError(null);
    if (step === 0) { router.push("/"); return; }
    setStep((s) => s - 1);
  }

  function pickHeadshot(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Please choose a photo under 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      set("headshotDataUrl", result);
      set("headshotName", file.name);
    };
    reader.readAsDataURL(file);
  }

  const next = useCallback(() => {
    setError(null);
    if (step === 0 && !form.talkTitle.trim()) {
      setError("Give your session a working title — you can refine it later.");
      return;
    }
    if (step === 1 && !form.talkAbstract.trim()) {
      setError("A few sentences about your session helps us review it.");
      return;
    }
    if (step === 3) {
      if (!form.name.trim()) { setError("Please share your name."); return; }
      if (!emailOk(form.email)) { setError("Please share a valid email so we can reach you."); return; }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, form]);

  async function submit() {
    setError(null);
    if (!form.name.trim() || !emailOk(form.email) || !form.talkTitle.trim() || !form.talkAbstract.trim()) {
      setError("Something required is missing. Use Edit to fix it.");
      return;
    }
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
      setError("Network hiccup. Please try again.");
      setSubmitting(false);
    }
  }

  useEnterKey(next, step === 0 || step === 3);

  return (
    <WizardShell eyebrow="Call for Proposals" current={step} total={STEPS.length} onBack={goBack}>
      {/* STEP 0 — the idea (title first) */}
      {step === 0 && (
        <StepFrame stepKey={0}>
          <Question
            title={<>What&rsquo;s your idea?</>}
            sub="Start with a working title. This is the work you want to bring to the conference — we review every proposal and reply within two weeks."
          />
          <TextInput
            label="Working title"
            required
            autoFocus
            value={form.talkTitle}
            onChange={(v) => set("talkTitle", v)}
            placeholder="e.g. Teach-Back That Actually Works Across Languages"
          />
          <InlineError message={error} />
          <div className="mt-7">
            <PrimaryButton onClick={next}>Continue</PrimaryButton>
          </div>
          <Hint>Press Enter ↵ to continue</Hint>
        </StepFrame>
      )}

      {/* STEP 1 — abstract */}
      {step === 1 && (
        <StepFrame stepKey={1}>
          <Question
            title={<>Tell us about it.</>}
            sub={<>What is <em style={{ color: C.inkSoft }}>{form.talkTitle || "your session"}</em> about, who is it for, and why now?</>}
          />
          <TextArea
            label="Abstract"
            required
            autoFocus
            rows={6}
            value={form.talkAbstract}
            onChange={(v) => set("talkAbstract", v)}
            placeholder="A few sentences. Paint the picture for our review team."
          />
          <div className="mt-4">
            <TextArea
              label="Three things attendees will leave with"
              hint="optional"
              rows={3}
              value={form.learningObjectives}
              onChange={(v) => set("learningObjectives", v)}
              placeholder="One per line."
            />
          </div>
          <InlineError message={error} />
          <div className="mt-7">
            <PrimaryButton onClick={next}>Continue</PrimaryButton>
          </div>
        </StepFrame>
      )}

      {/* STEP 2 — format */}
      {step === 2 && (
        <StepFrame stepKey={2}>
          <Question title={<>Shape your session.</>} sub="Pick what fits best. Nothing here is binding — it just helps us build the schedule." />
          <div className="space-y-6 wiz-stagger">
            <PillGroup label="Session format" value={form.sessionFormat} options={FORMATS} onChange={(v) => set("sessionFormat", v)} />
            <PillGroup label="Length" value={form.sessionLength} options={LENGTHS} onChange={(v) => set("sessionLength", v)} />
            <PillGroup label="Best-fit track" value={form.sessionTrack} options={TRACKS} onChange={(v) => set("sessionTrack", v)} />
            <PillGroup label="Preferred day" value={form.preferredDay} options={DAYS} onChange={(v) => set("preferredDay", v)} />
          </div>
          <div className="mt-8">
            <PrimaryButton onClick={next}>Continue</PrimaryButton>
          </div>
        </StepFrame>
      )}

      {/* STEP 3 — about you (required: name + email; rest progressive) */}
      {step === 3 && (
        <StepFrame stepKey={3}>
          <Question title={<>And you are?</>} sub="Just a name and email to start. Add the rest if you'd like — it's all optional." />
          <div className="space-y-3">
            <TextInput label="Full name" required autoFocus value={form.name} onChange={(v) => set("name", v)} />
            <TextInput label="Email" required type="email" inputMode="email" value={form.email} onChange={(v) => set("email", v)} placeholder="you@example.org" />
          </div>

          {!showMore ? (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold transition-colors hover:bg-black/[0.02]"
              style={{ color: C.teal, border: `1.5px dashed ${C.teal}44` }}
            >
              <Plus className="w-4 h-4" /> Add your affiliation, photo, and bio
            </button>
          ) : (
            <div className="mt-4 space-y-3 wiz-step-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextInput label="Affiliation" value={form.affiliation} onChange={(v) => set("affiliation", v)} placeholder="Hospital, university, or independent" />
                <TextInput label="Role or title" value={form.jobTitle} onChange={(v) => set("jobTitle", v)} />
                <TextInput label="Pronouns" value={form.pronouns} onChange={(v) => set("pronouns", v)} placeholder="she/her, he/him, they/them" />
                <TextInput label="Phone" type="tel" inputMode="tel" value={form.phone} onChange={(v) => set("phone", v)} />
              </div>
              <Headshot
                dataUrl={form.headshotDataUrl}
                fileName={form.headshotName}
                onPick={() => fileRef.current?.click()}
                onClear={() => { set("headshotDataUrl", ""); set("headshotName", ""); }}
              />
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickHeadshot(f); }} />
              <TextArea label="Short bio" hint="optional" rows={3} value={form.bio} onChange={(v) => set("bio", v)} placeholder="A sentence or two. Who you are, what you focus on." />
            </div>
          )}

          <InlineError message={error} />
          <div className="mt-7">
            <PrimaryButton onClick={next}>Continue to review</PrimaryButton>
          </div>
        </StepFrame>
      )}

      {/* STEP 4 — review & submit */}
      {step === 4 && (
        <StepFrame stepKey={4}>
          <Question title={<>Ready to send?</>} sub="Here's what lands on our review desk." />

          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: `1.5px solid ${C.hairline}`, boxShadow: "0 18px 44px -28px rgba(11,31,37,0.3)" }}>
            <div className="p-5" style={{ borderBottom: `1px solid ${C.hairline}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="text-[11px] font-bold tracking-wider uppercase" style={{ color: C.gold }}>Proposal</div>
                <button onClick={() => setStep(0)} className="inline-flex items-center gap-1 text-[12px] font-semibold shrink-0" style={{ color: C.teal }}>
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>
              <h3 className="font-serif-display text-[21px] font-bold leading-snug mt-1" style={{ color: C.ink }}>
                {form.talkTitle || "Untitled session"}
              </h3>
              {form.talkAbstract && (
                <p className="mt-2 text-[13px] leading-relaxed line-clamp-3" style={{ color: C.muted }}>{form.talkAbstract}</p>
              )}
              {(form.sessionFormat || form.sessionLength || form.sessionTrack || form.preferredDay) && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {[form.sessionFormat, form.sessionLength, form.sessionTrack, form.preferredDay].filter(Boolean).map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: C.teal + "0E", color: C.inkSoft, border: `1px solid ${C.teal}22` }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 flex items-center gap-3">
              {form.headshotDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.headshotDataUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: C.teal + "12", color: C.teal }}>
                  <User className="w-5 h-5" />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{form.name || "—"}</div>
                <div className="text-[12px] truncate" style={{ color: C.muted }}>
                  {[form.jobTitle, form.affiliation].filter(Boolean).join(" · ") || form.email}
                </div>
              </div>
              <button onClick={() => setStep(3)} className="inline-flex items-center gap-1 text-[12px] font-semibold shrink-0" style={{ color: C.teal }}>
                <Pencil className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>

          <div className="mt-4">
            <TextArea label="Anything else for the program team?" hint="optional" rows={3} value={form.presenterMessage} onChange={(v) => set("presenterMessage", v)} placeholder="Scheduling notes, co-presenters, accessibility needs — anything that doesn't fit above." />
          </div>

          <InlineError message={error} />
          <div className="mt-6">
            <PrimaryButton onClick={submit} loading={submitting} icon={Sparkles}>Submit proposal</PrimaryButton>
          </div>
          <Hint>
            We&rsquo;ll email a confirmation the moment this lands, and reply within two weeks.<br />
            Questions? <a className="font-semibold" style={{ color: C.teal }} href="mailto:contact@aalb.org">contact@aalb.org</a>.
          </Hint>
        </StepFrame>
      )}
    </WizardShell>
  );
}

function PillGroup({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[13px] font-semibold mb-2.5 ml-0.5" style={{ color: C.inkSoft }}>{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Pill key={opt} selected={value === opt} onClick={() => onChange(value === opt ? "" : opt)}>{opt}</Pill>
        ))}
      </div>
    </div>
  );
}

function Headshot({ dataUrl, fileName, onPick, onClear }: {
  dataUrl: string; fileName: string; onPick: () => void; onClear: () => void;
}) {
  if (dataUrl) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white" style={{ border: `1.5px solid ${C.hairline}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate" style={{ color: C.ink }}>{fileName || "Selected"}</div>
          <div className="text-[11px]" style={{ color: C.muted }}>Looking good.</div>
        </div>
        <button type="button" onClick={onClear} className="p-1.5 rounded-md hover:bg-black/[0.04]" style={{ color: C.mutedSoft }} aria-label="Remove photo">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }
  return (
    <button type="button" onClick={onPick}
      className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed transition-colors hover:bg-black/[0.02]"
      style={{ borderColor: C.hairline }}>
      <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.teal + "14", color: C.teal }}>
        <ImageIcon className="w-4 h-4" />
      </span>
      <span className="flex-1 text-left">
        <span className="block text-[13px] font-semibold" style={{ color: C.ink }}>Add a headshot</span>
        <span className="block text-[11px]" style={{ color: C.muted }}>JPG, PNG, or WebP. Under 5 MB.</span>
      </span>
      <Upload className="w-4 h-4" style={{ color: C.mutedSoft }} />
    </button>
  );
}
