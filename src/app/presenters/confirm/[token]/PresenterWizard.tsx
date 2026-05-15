"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Sparkles, User, Mic2, Plane,
  UtensilsCrossed, ClipboardCheck, Upload, X, CalendarDays, MapPin, AlertCircle,
} from "lucide-react";
import {
  SESSION_FORMATS, SESSION_LENGTHS, TRAVEL_MODES, PREFERRED_DAY,
} from "@/lib/presenters";

type Fields = Record<string, string | boolean | null | undefined>;

type Initial = {
  id: string;
  email: string;
  name: string;
  affiliation: string | null;
  jobTitle: string | null;
  pronouns: string | null;
  phone: string | null;
  talkTitle: string | null;
  talkAbstract: string | null;
  sessionFormat: string | null;
  sessionTrack: string | null;
  sessionLength: string | null;
  coPresenters: string | null;
  preferredDay: string | null;
  learningObjectives: string | null;
  bio: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  headshotMime: string | null;
  avNotes: string | null;
  needsMic: boolean;
  needsProjector: boolean;
  needsAudio: boolean;
  needsInternet: boolean;
  needsRecording: boolean;
  needsClicker: boolean;
  travelMode: string | null;
  travelOrigin: string | null;
  travelArrival: string | null;
  travelDeparture: string | null;
  needsHotel: boolean;
  hotelNotes: string | null;
  needsParking: boolean;
  dietary: string | null;
  allergies: string | null;
  accessibilityNeeds: string | null;
  emergencyContact: string | null;
  agreedToRecord: boolean;
  agreedToPhoto: boolean;
  agreedToTerms: boolean;
  status: string;
};

const STEPS = [
  { key: "welcome", label: "Welcome", icon: Sparkles },
  { key: "talk", label: "Your talk", icon: ClipboardCheck },
  { key: "about", label: "About you", icon: User },
  { key: "av", label: "Tech & A/V", icon: Mic2 },
  { key: "travel", label: "Travel", icon: Plane },
  { key: "logistics", label: "Logistics", icon: UtensilsCrossed },
  { key: "review", label: "Review", icon: CheckCircle2 },
] as const;

export default function PresenterWizard({
  token,
  initial,
  headshotUrl,
}: {
  token: string;
  initial: Initial;
  headshotUrl: string | null;
}) {
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Fields>(() => ({ ...initial }));
  const [arrival, setArrival] = useState(initial.travelArrival ? initial.travelArrival.slice(0, 10) : "");
  const [departure, setDeparture] = useState(initial.travelDeparture ? initial.travelDeparture.slice(0, 10) : "");
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(headshotUrl);
  const [pendingHeadshot, setPendingHeadshot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(initial.status === "confirmed");
  const [declined, setDeclined] = useState(initial.status === "declined");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const firstName = useMemo(() => (initial.name || "there").split(" ")[0], [initial.name]);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function persist(action: "save" | "submit" | "decline") {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/presenters/confirm/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          fields,
          travelArrival: arrival || null,
          travelDeparture: departure || null,
          headshot: pendingHeadshot ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      if (action === "submit") setSubmitted(true);
      if (action === "decline") setDeclined(true);
      if (pendingHeadshot) setPendingHeadshot(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onHeadshot(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      setError("Headshot must be under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPendingHeadshot(dataUrl);
      setHeadshotPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function next() {
    const ok = await persist("save");
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  if (submitted) return <SuccessCard name={firstName} mode="confirmed" />;
  if (declined) return <SuccessCard name={firstName} mode="declined" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <Header firstName={firstName} />

        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-200/60 overflow-hidden">
          <Stepper current={step} />

          <div className="px-6 sm:px-10 py-8 sm:py-10">
            {error && (
              <div className="mb-6 flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {step === 0 && <Welcome name={firstName} onDecline={() => persist("decline")} declineReason={fields.declineReason as string} setDeclineReason={(v) => set("declineReason", v)} />}
            {step === 1 && <TalkStep fields={fields} set={set} />}
            {step === 2 && (
              <AboutStep
                fields={fields}
                set={set}
                headshotPreview={headshotPreview}
                onPickHeadshot={() => fileRef.current?.click()}
                clearHeadshot={() => {
                  setHeadshotPreview(null);
                  setPendingHeadshot(null);
                }}
              />
            )}
            {step === 3 && <AvStep fields={fields} set={set} />}
            {step === 4 && (
              <TravelStep
                fields={fields}
                set={set}
                arrival={arrival}
                setArrival={setArrival}
                departure={departure}
                setDeparture={setDeparture}
              />
            )}
            {step === 5 && <LogisticsStep fields={fields} set={set} />}
            {step === 6 && (
              <ReviewStep
                fields={fields}
                set={set}
                arrival={arrival}
                departure={departure}
                headshotPreview={headshotPreview}
                email={initial.email}
              />
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onHeadshot(f);
              }}
            />

            <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={back}
                disabled={step === 0 || saving}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                {step < STEPS.length - 1 && step > 0 && (
                  <button
                    type="button"
                    onClick={() => persist("save")}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
                  >
                    Save & finish later
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-600/20 hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => persist("submit")}
                    disabled={saving || !fields.agreedToTerms}
                    className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md shadow-emerald-600/20 hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {saving ? "Submitting…" : "Confirm my participation"}
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

function Header({ firstName }: { firstName: string }) {
  return (
    <div className="mb-8 text-center">
      <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
        Presenter portal
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
        Welcome, {firstName} <span className="inline-block">👋</span>
      </h1>
      <p className="text-slate-500 mt-3 max-w-xl mx-auto">
        Confirm your details for the AALB Conference at Lurie Children&rsquo;s. Takes about 5 minutes. Auto-saves as you go.
      </p>
      <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 mt-3">
        <CalendarDays className="w-3.5 h-3.5" /> August 15&ndash;16, 2026
        <span className="mx-2">&middot;</span>
        <MapPin className="w-3.5 h-3.5" /> Chicago
      </div>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="px-4 sm:px-8 pt-6">
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < current;
          const active = i === current;
          return (
            <div key={s.key} className="flex flex-col items-center gap-1.5">
              <div
                className={
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all " +
                  (done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/30 scale-110"
                    : "bg-slate-100 text-slate-400")
                }
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div
                className={
                  "text-[10px] sm:text-[11px] font-medium text-center leading-tight " +
                  (active ? "text-slate-900" : "text-slate-400")
                }
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

function Welcome({
  name,
  onDecline,
  declineReason,
  setDeclineReason,
}: {
  name: string;
  onDecline: () => Promise<boolean>;
  declineReason: string | undefined;
  setDeclineReason: (v: string) => void;
}) {
  const [showDecline, setShowDecline] = useState(false);
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">A quick hello, {name}</h2>
      <p className="mt-3 text-slate-600 leading-relaxed">
        We&rsquo;re delighted to have you presenting at the AALB Conference at Lurie Children&rsquo;s on{" "}
        <strong>August 15&ndash;16, 2026</strong>. Click <strong>Continue</strong> to walk through your talk details, bio,
        tech needs, and travel — about 5 minutes total.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: ClipboardCheck, label: "Talk details", desc: "Title, abstract, format" },
          { icon: User, label: "About you", desc: "Bio, headshot, links" },
          { icon: Plane, label: "Travel & needs", desc: "A/V, dietary, accessibility" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <c.icon className="w-4 h-4 text-blue-600 mb-1" />
            <div className="text-sm font-semibold text-slate-900">{c.label}</div>
            <div className="text-xs text-slate-500">{c.desc}</div>
          </div>
        ))}
      </div>

      {!showDecline ? (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowDecline(true)}
            className="text-sm text-slate-400 hover:text-rose-600 underline-offset-2 hover:underline transition-colors"
          >
            Can&rsquo;t make it this year?
          </button>
        </div>
      ) : (
        <div className="mt-8 p-5 bg-rose-50/60 border border-rose-200 rounded-xl">
          <div className="text-sm font-semibold text-slate-900">We're sorry to hear that.</div>
          <p className="text-xs text-slate-500 mt-1">A short note helps us plan — and we&rsquo;ll keep you in mind for the future.</p>
          <textarea
            value={declineReason || ""}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
            placeholder="Optional — schedule conflict, traveling, etc."
            className="mt-3 w-full px-3 py-2 text-sm border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none bg-white"
          />
          <div className="mt-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowDecline(false)}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Never mind
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              Decline politely
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TalkStep({ fields, set }: { fields: Fields; set: (k: keyof Fields, v: Fields[keyof Fields]) => void }) {
  return (
    <StepShell title="Your talk" subtitle="Tell us what you'll be presenting. You can refine this later — but the title and abstract are what we'll publish.">
      <Field label="Talk title" required>
        <input
          type="text"
          value={(fields.talkTitle as string) || ""}
          onChange={(e) => set("talkTitle", e.target.value)}
          placeholder="The future of pediatric care delivery"
          className={inputClass}
        />
      </Field>
      <Field label="Abstract" hint="2–3 short paragraphs that help attendees decide to come.">
        <textarea
          value={(fields.talkAbstract as string) || ""}
          onChange={(e) => set("talkAbstract", e.target.value)}
          rows={6}
          placeholder="What's your talk about? Who's it for? What will they walk away with?"
          className={inputClass}
        />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Session format">
          <select
            value={(fields.sessionFormat as string) || ""}
            onChange={(e) => set("sessionFormat", e.target.value)}
            className={inputClass}
          >
            <option value="">Choose…</option>
            {SESSION_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Length you'd prefer">
          <select
            value={(fields.sessionLength as string) || ""}
            onChange={(e) => set("sessionLength", e.target.value)}
            className={inputClass}
          >
            <option value="">Choose…</option>
            {SESSION_LENGTHS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Track / theme">
          <input
            type="text"
            value={(fields.sessionTrack as string) || ""}
            onChange={(e) => set("sessionTrack", e.target.value)}
            placeholder="Clinical, Research, Tech, etc."
            className={inputClass}
          />
        </Field>
        <Field label="Preferred day">
          <select
            value={(fields.preferredDay as string) || ""}
            onChange={(e) => set("preferredDay", e.target.value)}
            className={inputClass}
          >
            <option value="">No preference</option>
            {PREFERRED_DAY.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Co-presenters (if any)" hint="Comma-separated. We'll reach out to them with their own portal link.">
        <input
          type="text"
          value={(fields.coPresenters as string) || ""}
          onChange={(e) => set("coPresenters", e.target.value)}
          placeholder="Jordan Smith, Dr. Alex Lee"
          className={inputClass}
        />
      </Field>
      <Field label="Learning objectives" hint="2–4 bullet points. What will attendees be able to do after your talk?">
        <textarea
          value={(fields.learningObjectives as string) || ""}
          onChange={(e) => set("learningObjectives", e.target.value)}
          rows={4}
          placeholder={"• Understand…\n• Apply…\n• Identify…"}
          className={inputClass}
        />
      </Field>
    </StepShell>
  );
}

function AboutStep({
  fields, set, headshotPreview, onPickHeadshot, clearHeadshot,
}: {
  fields: Fields;
  set: (k: keyof Fields, v: Fields[keyof Fields]) => void;
  headshotPreview: string | null;
  onPickHeadshot: () => void;
  clearHeadshot: () => void;
}) {
  return (
    <StepShell title="About you" subtitle="This is what attendees will see in the program. Headshot is optional but recommended.">
      <div className="grid sm:grid-cols-[160px_1fr] gap-6 items-start">
        <div>
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden flex items-center justify-center relative">
            {headshotPreview ? (
              <img src={headshotPreview} alt="Headshot preview" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-300" />
            )}
            {headshotPreview && (
              <button
                type="button"
                onClick={clearHeadshot}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-slate-600"
                aria-label="Remove headshot"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onPickHeadshot}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Upload headshot
          </button>
          <div className="mt-1 text-[10px] text-slate-400 text-center">PNG/JPG/WebP &middot; under 4 MB</div>
        </div>
        <div className="space-y-4">
          <Field label="Short bio" hint="2–4 sentences in the third person — this is what we'll print in the program.">
            <textarea
              value={(fields.bio as string) || ""}
              onChange={(e) => set("bio", e.target.value)}
              rows={5}
              placeholder="Dr. Jordan Smith leads the pediatric innovation lab at…"
              className={inputClass}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Job title">
              <input
                type="text"
                value={(fields.jobTitle as string) || ""}
                onChange={(e) => set("jobTitle", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Affiliation / organization">
              <input
                type="text"
                value={(fields.affiliation as string) || ""}
                onChange={(e) => set("affiliation", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Pronouns">
              <input
                type="text"
                value={(fields.pronouns as string) || ""}
                onChange={(e) => set("pronouns", e.target.value)}
                placeholder="she/her, they/them, …"
                className={inputClass}
              />
            </Field>
            <Field label="Phone (event-week only)">
              <input
                type="tel"
                value={(fields.phone as string) || ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 555 000 1234"
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Website">
          <input
            type="url"
            value={(fields.websiteUrl as string) || ""}
            onChange={(e) => set("websiteUrl", e.target.value)}
            placeholder="https://"
            className={inputClass}
          />
        </Field>
        <Field label="LinkedIn">
          <input
            type="url"
            value={(fields.linkedinUrl as string) || ""}
            onChange={(e) => set("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/…"
            className={inputClass}
          />
        </Field>
        <Field label="Twitter / X handle">
          <input
            type="text"
            value={(fields.twitterHandle as string) || ""}
            onChange={(e) => set("twitterHandle", e.target.value)}
            placeholder="@handle"
            className={inputClass}
          />
        </Field>
      </div>
    </StepShell>
  );
}

function AvStep({ fields, set }: { fields: Fields; set: (k: keyof Fields, v: Fields[keyof Fields]) => void }) {
  const toggles: { key: keyof Fields; label: string; desc: string }[] = [
    { key: "needsMic", label: "Wireless lavalier mic", desc: "Standard for all sessions" },
    { key: "needsProjector", label: "Projector + HDMI", desc: "Slides at 16:9, please" },
    { key: "needsAudio", label: "Audio playback", desc: "Sound from laptop" },
    { key: "needsInternet", label: "Reliable Wi-Fi", desc: "Live demo or web content" },
    { key: "needsRecording", label: "Session recorded", desc: "Shared with attendees afterward" },
    { key: "needsClicker", label: "Wireless slide clicker", desc: "We'll provide one" },
  ];
  return (
    <StepShell title="Tech & A/V" subtitle="Check what you'll need. Our tech team will reach out a week before with details and a soundcheck slot.">
      <div className="grid sm:grid-cols-2 gap-3">
        {toggles.map((t) => (
          <CheckCard
            key={String(t.key)}
            checked={!!fields[t.key]}
            label={t.label}
            desc={t.desc}
            onToggle={() => set(t.key, !fields[t.key])}
          />
        ))}
      </div>
      <Field label="Other A/V or tech notes">
        <textarea
          value={(fields.avNotes as string) || ""}
          onChange={(e) => set("avNotes", e.target.value)}
          rows={3}
          placeholder="Anything special — Mac dongle, second display, demo equipment, etc."
          className={inputClass}
        />
      </Field>
      <Field label="Accessibility needs we should plan for" hint="ASL, captioning, mobility, seating, lighting — anything that helps you do your best work.">
        <textarea
          value={(fields.accessibilityNeeds as string) || ""}
          onChange={(e) => set("accessibilityNeeds", e.target.value)}
          rows={3}
          className={inputClass}
        />
      </Field>
    </StepShell>
  );
}

function TravelStep({
  fields, set, arrival, setArrival, departure, setDeparture,
}: {
  fields: Fields;
  set: (k: keyof Fields, v: Fields[keyof Fields]) => void;
  arrival: string;
  setArrival: (s: string) => void;
  departure: string;
  setDeparture: (s: string) => void;
}) {
  return (
    <StepShell title="Travel" subtitle="Optional but helpful — helps us coordinate hotel blocks and ground transport.">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="How are you getting here?">
          <select
            value={(fields.travelMode as string) || ""}
            onChange={(e) => set("travelMode", e.target.value)}
            className={inputClass}
          >
            <option value="">Choose…</option>
            {TRAVEL_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="City / origin">
          <input
            type="text"
            value={(fields.travelOrigin as string) || ""}
            onChange={(e) => set("travelOrigin", e.target.value)}
            placeholder="Boston, MA"
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Arriving">
          <input type="date" value={arrival} onChange={(e) => setArrival(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Departing">
          <input type="date" value={departure} onChange={(e) => setDeparture(e.target.value)} className={inputClass} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <CheckCard
          checked={!!fields.needsHotel}
          label="Help with hotel booking"
          desc="We have a discounted block near the venue"
          onToggle={() => set("needsHotel", !fields.needsHotel)}
        />
        <CheckCard
          checked={!!fields.needsParking}
          label="Parking pass for the venue"
          desc="Underground garage at Lurie Children's"
          onToggle={() => set("needsParking", !fields.needsParking)}
        />
      </div>
      <Field label="Other travel notes" hint="Flight times, arrival logistics, ground transport — anything that helps.">
        <textarea
          value={(fields.hotelNotes as string) || ""}
          onChange={(e) => set("hotelNotes", e.target.value)}
          rows={3}
          className={inputClass}
        />
      </Field>
    </StepShell>
  );
}

function LogisticsStep({ fields, set }: { fields: Fields; set: (k: keyof Fields, v: Fields[keyof Fields]) => void }) {
  return (
    <StepShell title="Logistics" subtitle="Dietary, allergies, and your emergency contact. Confidential and only used during the event.">
      <Field label="Dietary preferences">
        <input
          type="text"
          value={(fields.dietary as string) || ""}
          onChange={(e) => set("dietary", e.target.value)}
          placeholder="Vegetarian, kosher, halal, gluten-free, etc."
          className={inputClass}
        />
      </Field>
      <Field label="Allergies or sensitivities" hint="We use this for catering — better to over-share.">
        <textarea
          value={(fields.allergies as string) || ""}
          onChange={(e) => set("allergies", e.target.value)}
          rows={2}
          className={inputClass}
        />
      </Field>
      <Field label="Emergency contact" hint="Name, relationship, and phone — used only if needed during the event.">
        <input
          type="text"
          value={(fields.emergencyContact as string) || ""}
          onChange={(e) => set("emergencyContact", e.target.value)}
          placeholder="Sam Smith (spouse) +1 555 555 0123"
          className={inputClass}
        />
      </Field>
      <div className="pt-2 space-y-3">
        <CheckCard
          checked={!!fields.agreedToRecord}
          label="I consent to my session being recorded"
          desc="Recordings are shared only with registered attendees."
          onToggle={() => set("agreedToRecord", !fields.agreedToRecord)}
        />
        <CheckCard
          checked={!!fields.agreedToPhoto}
          label="I consent to event photography"
          desc="May be used in AALB post-event materials."
          onToggle={() => set("agreedToPhoto", !fields.agreedToPhoto)}
        />
      </div>
    </StepShell>
  );
}

function ReviewStep({
  fields, set, arrival, departure, headshotPreview, email,
}: {
  fields: Fields;
  set: (k: keyof Fields, v: Fields[keyof Fields]) => void;
  arrival: string;
  departure: string;
  headshotPreview: string | null;
  email: string;
}) {
  const Row = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="py-2 grid grid-cols-3 gap-3 text-sm border-b border-slate-100 last:border-0">
      <div className="text-slate-500">{label}</div>
      <div className="col-span-2 text-slate-900">{value || <span className="text-slate-300">—</span>}</div>
    </div>
  );
  const yes = (b: unknown) => (b ? "Yes" : "No");
  return (
    <StepShell title="Review & confirm" subtitle="Make sure everything looks right. You can come back to this portal any time to update.">
      <div className="grid sm:grid-cols-[80px_1fr] gap-4 items-center bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="w-20 h-20 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center">
          {headshotPreview ? (
            <img src={headshotPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-slate-400" />
          )}
        </div>
        <div>
          <div className="font-semibold text-slate-900">{(fields.talkTitle as string) || <span className="text-slate-400">Talk title not set</span>}</div>
          <div className="text-xs text-slate-500 mt-0.5">{email}</div>
        </div>
      </div>

      <Section title="Talk">
        <Row label="Title" value={fields.talkTitle as string} />
        <Row label="Format" value={fields.sessionFormat as string} />
        <Row label="Length" value={fields.sessionLength as string} />
        <Row label="Track" value={fields.sessionTrack as string} />
        <Row label="Preferred day" value={fields.preferredDay as string} />
        <Row label="Co-presenters" value={fields.coPresenters as string} />
      </Section>
      <Section title="About">
        <Row label="Bio" value={fields.bio as string} />
        <Row label="Job title" value={fields.jobTitle as string} />
        <Row label="Affiliation" value={fields.affiliation as string} />
        <Row label="Pronouns" value={fields.pronouns as string} />
      </Section>
      <Section title="Tech & A/V">
        <Row label="Mic" value={yes(fields.needsMic)} />
        <Row label="Projector" value={yes(fields.needsProjector)} />
        <Row label="Audio" value={yes(fields.needsAudio)} />
        <Row label="Wi-Fi" value={yes(fields.needsInternet)} />
        <Row label="Record session" value={yes(fields.needsRecording)} />
        <Row label="Notes" value={fields.avNotes as string} />
      </Section>
      <Section title="Travel">
        <Row label="Mode" value={fields.travelMode as string} />
        <Row label="From" value={fields.travelOrigin as string} />
        <Row label="Arrives" value={arrival} />
        <Row label="Departs" value={departure} />
        <Row label="Hotel help" value={yes(fields.needsHotel)} />
        <Row label="Parking" value={yes(fields.needsParking)} />
      </Section>
      <Section title="Logistics">
        <Row label="Dietary" value={fields.dietary as string} />
        <Row label="Allergies" value={fields.allergies as string} />
        <Row label="Accessibility" value={fields.accessibilityNeeds as string} />
      </Section>

      <label className="flex items-start gap-3 p-4 mt-4 bg-blue-50/60 border border-blue-200 rounded-xl cursor-pointer">
        <input
          type="checkbox"
          checked={!!fields.agreedToTerms}
          onChange={(e) => set("agreedToTerms", e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-700">
          I confirm the details above are accurate and agree to present at the AALB Conference at Lurie Children&rsquo;s on August 15&ndash;16, 2026.
        </span>
      </label>
    </StepShell>
  );
}

function SuccessCard({ name, mode }: { name: string; mode: "confirmed" | "declined" }) {
  const confirmed = mode === "confirmed";
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/60 p-10 text-center">
        <div className={"w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 " + (confirmed ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500")}>
          {confirmed ? <CheckCircle2 className="w-9 h-9" /> : <ClipboardCheck className="w-9 h-9" />}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {confirmed ? `You're all set, ${name}!` : `Thanks for letting us know, ${name}.`}
        </h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          {confirmed
            ? "We've recorded your confirmation and sent you a copy by email. Our program team will be in touch with next steps."
            : "We've recorded your response. We hope to work with you on a future AALB event."}
        </p>
        <div className="mt-6 text-xs text-slate-400">
          AALB Conference at Lurie Children&rsquo;s &middot; August 15&ndash;16, 2026
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-6 text-center text-xs text-slate-400">
      AALB Conference at Lurie Children&rsquo;s &middot; Questions? Just reply to your invitation email.
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all placeholder:text-slate-300";

function Field({
  label, hint, required, children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700 tracking-wide">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <div className="text-[11px] text-slate-400 leading-relaxed">{hint}</div>}
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
        <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase mb-1">{title}</div>
      <div className="bg-white rounded-xl border border-slate-200 px-4">{children}</div>
    </div>
  );
}

function CheckCard({
  checked, label, desc, onToggle,
}: {
  checked: boolean;
  label: string;
  desc: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        "text-left flex items-start gap-3 p-4 rounded-xl border transition-all " +
        (checked
          ? "bg-blue-50/70 border-blue-300 ring-1 ring-blue-200"
          : "bg-white border-slate-200 hover:border-slate-300")
      }
    >
      <div
        className={
          "mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all " +
          (checked ? "bg-blue-600 text-white" : "bg-white border border-slate-300")
        }
      >
        {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
    </button>
  );
}
