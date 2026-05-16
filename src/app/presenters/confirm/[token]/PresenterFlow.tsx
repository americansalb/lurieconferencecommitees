"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Check, ChevronLeft, ChevronRight, X, Upload, AlertCircle, Loader2,
  ArrowRight, ExternalLink, Sparkles,
} from "lucide-react";
import { parseResponse } from "@/lib/api";
import { PolicyContent } from "./policy-content";

type Fields = Record<string, string | boolean | null | undefined>;

export type Initial = {
  id: string;
  email: string;
  name: string;
  affiliation: string | null;
  jobTitle: string | null;
  pronouns: string | null;
  phone: string | null;
  role: string | null;
  talkTitle: string | null;
  talkAbstract: string | null;
  sessionFormat: string | null;
  sessionTrack: string | null;
  sessionLength: string | null;
  qaLength: string | null;
  coPresenters: string | null;
  preferredDay: string | null;
  learningObjectives: string | null;
  honorariumAmount: number | null;
  travelReimbursement: number | null;
  presenterMessage: string | null;
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
  agreedToCe: boolean;
  agreedToHeadshot: boolean;
  status: string;
  requestedChanges?: string | null;
};

type Step = 0 | 1 | 2 | 3;
const ACCEPT_STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "About you" },
  { id: 2, label: "The day" },
  { id: 3, label: "Confirm" },
];

const TEAL = "#0E5566";
const BLUE = "#0066B3";

export default function PresenterFlow({
  token, initial, headshotUrl,
}: {
  token: string;
  initial: Initial;
  headshotUrl: string | null;
}) {
  const [step, setStep] = useState<Step>(0);
  const [decision, setDecision] = useState<"accept" | "request_changes" | "decline" | null>(() => {
    if (initial.status === "confirmed" || initial.status === "tentative") return "accept";
    if (initial.status === "declined") return "decline";
    if (initial.status === "changes_requested") return "request_changes";
    return null;
  });
  const [fields, setFields] = useState<Fields>(() => ({ ...initial }));
  const [arrival, setArrival] = useState(initial.travelArrival ? initial.travelArrival.slice(0, 10) : "");
  const [departure, setDeparture] = useState(initial.travelDeparture ? initial.travelDeparture.slice(0, 10) : "");
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(headshotUrl);
  const [pendingHeadshot, setPendingHeadshot] = useState<string | null>(null);
  const [completion, setCompletion] = useState<"confirmed" | "tentative" | "declined" | "changes" | null>(() => {
    if (initial.status === "confirmed") return "confirmed";
    if (initial.status === "tentative") return "tentative";
    if (initial.status === "declined") return "declined";
    if (initial.status === "changes_requested") return "changes";
    return null;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPolicy, setShowPolicy] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const firstName = useMemo(() => (initial.name || "").split(" ")[0] || initial.name, [initial.name]);

  const set = useCallback(<K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((f) => ({ ...f, [key]: value }));
  }, []);

  const persist = useCallback(async (action: "save" | "submit" | "tentative" | "decline" | "request_changes") => {
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
      const { ok, error } = await parseResponse(res);
      if (!ok) throw new Error(error || "Something went wrong");
      if (action === "submit") setCompletion("confirmed");
      if (action === "tentative") setCompletion("tentative");
      if (action === "decline") setCompletion("declined");
      if (action === "request_changes") setCompletion("changes");
      if (pendingHeadshot) setPendingHeadshot(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  }, [token, fields, arrival, departure, pendingHeadshot]);

  const goTo = useCallback(async (next: Step, opts: { save?: boolean } = { save: true }) => {
    if (opts.save) {
      const ok = await persist("save");
      if (!ok) return;
    }
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 180);
  }, [persist]);

  const onHeadshot = useCallback((file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      setError("Photo must be under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPendingHeadshot(dataUrl);
      setHeadshotPreview(dataUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const saveForLater = useCallback(async () => {
    const ok = await persist("save");
    if (ok) {
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    }
  }, [persist]);

  // Edit mode after completion
  const editAfterCompletion = useCallback(() => {
    setCompletion(null);
    setStep(1);
  }, []);

  if (completion) {
    return (
      <CompletionScreen
        firstName={firstName}
        mode={completion}
        onEdit={completion === "confirmed" || completion === "tentative" ? editAfterCompletion : undefined}
      />
    );
  }

  const visibleSteps = decision === "accept" ? ACCEPT_STEPS : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex flex-col">
      <BrandBar />

      {visibleSteps.length > 0 && step >= 1 && step <= 3 && (
        <ProgressStrip
          steps={visibleSteps}
          current={step}
          onJump={(s) => {
            if (s < step) goTo(s);
          }}
        />
      )}

      <main className="flex-1 flex flex-col items-stretch">
        <div className={"flex-1 flex flex-col transition-all duration-200 ease-out " + (transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0")}>
          {step === 0 && (
            <HeroScreen
              initial={initial}
              firstName={firstName}
              decision={decision}
              setDecision={setDecision}
              onAccept={() => goTo(1, { save: false })}
              onShowPolicy={() => setShowPolicy(true)}
              persist={persist}
              fields={fields}
              set={set}
              saving={saving}
            />
          )}
          {step === 1 && (
            <AboutYouPage
              fields={fields}
              set={set}
              headshotPreview={headshotPreview}
              onPick={onHeadshot}
              onClear={() => { setHeadshotPreview(null); setPendingHeadshot(null); }}
              error={error}
              onContinue={() => goTo(2)}
              onBack={() => goTo(0, { save: false })}
            />
          )}
          {step === 2 && (
            <TheDayPage
              fields={fields}
              set={set}
              arrival={arrival}
              setArrival={setArrival}
              departure={departure}
              setDeparture={setDeparture}
              onContinue={() => goTo(3)}
              onBack={() => goTo(1)}
            />
          )}
          {step === 3 && (
            <ConfirmScreen
              initial={initial}
              fields={fields}
              set={set}
              firstName={firstName}
              headshotPreview={headshotPreview}
              onShowPolicy={() => setShowPolicy(true)}
              onSubmit={() => persist("submit")}
              onTentative={() => persist("tentative")}
              onBack={() => goTo(2, { save: false })}
              saving={saving}
              error={error}
            />
          )}
        </div>

        {step >= 1 && step <= 3 && (
          <div className="px-6 py-4 text-center">
            <button
              type="button"
              onClick={saveForLater}
              disabled={saving}
              className="text-xs font-medium text-slate-400 hover:text-slate-700 disabled:opacity-40"
            >
              {saving ? <span className="inline-flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span> : "Save and finish later"}
            </button>
          </div>
        )}
      </main>

      {savedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          Saved. We&apos;ll email a reminder if you don&apos;t return.
        </div>
      )}

      {showPolicy && <PolicyDrawer onClose={() => setShowPolicy(false)} />}
    </div>
  );
}

function BrandBar() {
  return (
    <div className="h-1.5 w-full flex shrink-0">
      <div className="w-1/2 bg-[#0E5566]" />
      <div className="w-1/2 bg-[#0066B3]" />
    </div>
  );
}

function ProgressStrip({
  steps, current, onJump,
}: {
  steps: { id: Step; label: string }[];
  current: Step;
  onJump: (s: Step) => void;
}) {
  return (
    <div className="px-6 py-4 border-b border-slate-100 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <div className="text-xs font-semibold text-slate-500 tracking-wider uppercase shrink-0">
          Step {steps.findIndex((s) => s.id === current) + 1} of {steps.length}
        </div>
        <div className="flex-1 flex items-center gap-1.5">
          {steps.map((s) => {
            const idx = steps.findIndex((x) => x.id === s.id);
            const currentIdx = steps.findIndex((x) => x.id === current);
            const done = idx < currentIdx;
            const active = s.id === current;
            const clickable = idx < currentIdx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => clickable && onJump(s.id)}
                disabled={!clickable}
                title={s.label}
                className="flex-1 h-1.5 rounded-full transition-all overflow-hidden bg-slate-200 disabled:cursor-default"
              >
                <div
                  className={"h-full transition-all duration-500 " + (done ? "w-full" : active ? "w-1/2" : "w-0")}
                  style={{ background: `linear-gradient(to right, ${TEAL}, ${BLUE})` }}
                />
              </button>
            );
          })}
        </div>
        <div className="text-xs font-medium text-slate-700 shrink-0 hidden sm:block">
          {steps[steps.findIndex((s) => s.id === current)]?.label}
        </div>
      </div>
    </div>
  );
}

function ScreenShell({
  eyebrow,
  heading,
  subhead,
  children,
  footer,
  wide,
}: {
  eyebrow?: string;
  heading: string;
  subhead?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col px-6 py-10 sm:py-16">
      <div className={"mx-auto w-full " + (wide ? "max-w-3xl" : "max-w-xl")}>
        {eyebrow && (
          <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#0E5566] mb-3">{eyebrow}</div>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">{heading}</h1>
        {subhead && <p className="mt-3 text-base text-slate-500 leading-relaxed max-w-lg">{subhead}</p>}
        <div className="mt-8 sm:mt-10">{children}</div>
        {footer && <div className="mt-10">{footer}</div>}
      </div>
    </div>
  );
}

function PrimaryButton({
  onClick, disabled, children, type = "button",
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: disabled ? "#94a3b8" : `linear-gradient(to right, ${TEAL}, ${BLUE})` }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  onClick, children, icon: Icon, side = "left",
}: {
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  side?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
    >
      {Icon && side === "left" && <Icon className="w-4 h-4" />}
      {children}
      {Icon && side === "right" && <Icon className="w-4 h-4" />}
    </button>
  );
}

function FooterRow({
  back, primary,
}: {
  back?: { onClick: () => void; label?: string };
  primary: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        {back && (
          <GhostButton onClick={back.onClick} icon={ChevronLeft}>
            {back.label || "Back"}
          </GhostButton>
        )}
      </div>
      <div>{primary}</div>
    </div>
  );
}

function HeroScreen({
  initial, firstName, decision, setDecision, onAccept, onShowPolicy, persist, fields, set, saving,
}: {
  initial: Initial;
  firstName: string;
  decision: "accept" | "request_changes" | "decline" | null;
  setDecision: (d: "accept" | "request_changes" | "decline" | null) => void;
  onAccept: () => void;
  onShowPolicy: () => void;
  persist: (action: "decline" | "request_changes") => Promise<boolean>;
  fields: Fields;
  set: (k: keyof Fields, v: Fields[keyof Fields]) => void;
  saving: boolean;
}) {
  const hasAssignment =
    !!(initial.sessionLength || initial.sessionFormat || initial.role || initial.qaLength ||
      initial.preferredDay || initial.sessionTrack || initial.talkTitle);

  const sentence = (() => {
    const which = initial.sessionFormat || initial.role;
    if (!which) return hasAssignment ? "A speaker — final details to come." : "The program team is finalising the details with you.";
    const article = /^[aeiou]/i.test(which) ? "an" : "a";
    const noun = which.toLowerCase();
    const length = initial.sessionLength ? `${initial.sessionLength.toLowerCase()} ` : "";
    const qa = initial.qaLength ? ` with ${initial.qaLength.toLowerCase()} for Q and A` : "";
    const day = initial.preferredDay ? ` on ${initial.preferredDay}` : "";
    return `${capitalize(article)} ${length}${noun}${qa}${day}.`;
  })();

  return (
    <div className="flex-1 flex flex-col px-6 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#0E5566] mb-3 inline-flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Presenter invitation
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.05]">
          Hello, {firstName}.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl">
          The 2026 Lurie Children&rsquo;s and AALB Conference — <em>True Language Access: Yesterday, Today, and Tomorrow</em> — on August 15 and 16, 2026, at Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago.
        </p>

        <div
          className="mt-8 rounded-3xl overflow-hidden shadow-sm"
          style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)" }}
        >
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${TEAL}, ${BLUE})` }} />
          <div className="p-8">
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#0E5566] mb-3">You are invited as</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">{sentence}</div>

            {(initial.talkTitle || initial.talkAbstract) && (
              <div className="mt-6 space-y-2">
                {initial.talkTitle && (
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Working title.</span> {initial.talkTitle}
                  </div>
                )}
                {initial.talkAbstract && (
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{initial.talkAbstract}</div>
                )}
              </div>
            )}

            {(initial.honorariumAmount != null || initial.travelReimbursement != null) && (
              <div className="mt-6 flex flex-wrap gap-2">
                {initial.honorariumAmount != null && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-[#0E5566]">
                    ${initial.honorariumAmount.toLocaleString("en-US")} honorarium
                  </span>
                )}
                {initial.travelReimbursement != null && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-[#0E5566]">
                    up to ${initial.travelReimbursement.toLocaleString("en-US")} travel
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your reply</h2>
            <button
              type="button"
              onClick={onShowPolicy}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0066B3] hover:text-[#004F8C]"
            >
              Read the presenter policy <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <ReplyCard
              tone="primary"
              label="Accept"
              desc="I&rsquo;ll be there. Walk me through the bio, photo, and logistics."
              active={decision === "accept"}
              onClick={() => setDecision("accept")}
            />
            <ReplyCard
              tone="neutral"
              label="Discuss first"
              desc="I have questions or want adjustments before I commit."
              active={decision === "request_changes"}
              onClick={() => setDecision("request_changes")}
            />
            <ReplyCard
              tone="muted"
              label="Cannot attend"
              desc="I can&rsquo;t make it. Decline with an optional note."
              active={decision === "decline"}
              onClick={() => setDecision("decline")}
            />
          </div>

          {decision === "accept" && (
            <div className="mt-6 flex justify-end">
              <PrimaryButton onClick={onAccept}>
                Continue <ChevronRight className="w-4 h-4" />
              </PrimaryButton>
            </div>
          )}

          {decision === "request_changes" && (
            <RequestChangesPanel
              value={(fields.requestedChanges as string) || ""}
              setValue={(v) => set("requestedChanges", v)}
              onSend={() => persist("request_changes")}
              saving={saving}
            />
          )}

          {decision === "decline" && (
            <DeclinePanel
              value={(fields.declineReason as string) || ""}
              setValue={(v) => set("declineReason", v)}
              onSend={() => persist("decline")}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ReplyCard({
  tone, label, desc, active, onClick,
}: {
  tone: "primary" | "neutral" | "muted";
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  const accentBg = tone === "primary"
    ? `linear-gradient(to right, ${TEAL}, ${BLUE})`
    : tone === "neutral"
    ? "linear-gradient(to right, #f59e0b, #d97706)"
    : "linear-gradient(to right, #94a3b8, #64748b)";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "text-left p-5 rounded-2xl bg-white border transition-all relative overflow-hidden " +
        (active
          ? "shadow-md ring-2 ring-offset-2 ring-[#0066B3]/30 border-transparent -translate-y-0.5"
          : "border-slate-200 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5")
      }
    >
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: accentBg }} />
      <div className="text-base font-bold text-slate-900 pt-1">{label}</div>
      <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{desc}</div>
    </button>
  );
}

function RequestChangesPanel({
  value, setValue, onSend, saving,
}: {
  value: string;
  setValue: (v: string) => void;
  onSend: () => Promise<boolean>;
  saving: boolean;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/40 p-6">
      <div className="text-base font-semibold text-slate-900">What would you like to discuss?</div>
      <p className="text-sm text-slate-500 mt-1">Ask any questions, share constraints, or propose changes. The program team will reply directly.</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        placeholder="For example: questions about format, length, or compensation; a request to move days; clarification on the policy terms."
        className="mt-4 w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 outline-none transition-all placeholder:text-slate-400"
      />
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || saving}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0E5566] hover:bg-[#0A3F4D] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Sending…" : "Send to the program team"}
        </button>
      </div>
    </div>
  );
}

function DeclinePanel({
  value, setValue, onSend, saving,
}: {
  value: string;
  setValue: (v: string) => void;
  onSend: () => Promise<boolean>;
  saving: boolean;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/40 p-6">
      <div className="text-base font-semibold text-slate-900">Sorry to hear that.</div>
      <p className="text-sm text-slate-500 mt-1">A short note helps us plan. Optional.</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Schedule conflict, traveling, other commitments…"
        className="mt-4 w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 outline-none transition-all placeholder:text-slate-400"
      />
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSend}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-700 hover:bg-slate-800 disabled:opacity-40"
        >
          {saving ? "Sending…" : "Submit decline"}
        </button>
      </div>
    </div>
  );
}

function SectionCard({
  title, subtitle, optional, children,
}: {
  title: string;
  subtitle?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
          {optional && <span className="text-[11px] font-medium text-slate-400">Optional</span>}
        </div>
        {subtitle && <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function SectionInput({
  value, onChange, placeholder, type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: "text" | "email" | "url" | "tel" | "date";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 text-base bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 outline-none transition-all placeholder:text-slate-400"
    />
  );
}

function SectionTextarea({
  value, onChange, placeholder, rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 text-base bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 outline-none transition-all placeholder:text-slate-400 leading-relaxed"
    />
  );
}

function AboutYouPage({
  fields, set, headshotPreview, onPick, onClear, error, onContinue, onBack,
}: {
  fields: Fields;
  set: (k: keyof Fields, v: Fields[keyof Fields]) => void;
  headshotPreview: string | null;
  onPick: (file: File) => void;
  onClear: () => void;
  error: string | null;
  onContinue: () => void;
  onBack: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showLinks, setShowLinks] = useState(!!(fields.websiteUrl || fields.linkedinUrl || fields.twitterHandle));
  const bio = (fields.bio as string) || "";
  const canContinue = !!bio.trim() && !!headshotPreview;

  return (
    <div className="flex-1 px-6 py-10 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#0E5566] mb-3">Step 1 of 3</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">About you</h1>
        <p className="mt-3 text-base text-slate-500 leading-relaxed max-w-lg">
          We use this in the program, on the website, and in your introduction on the day. Required: a short bio and a photo.
        </p>

        <div className="mt-8 space-y-5">
          <SectionCard
            title="Your bio"
            subtitle="A couple of sentences in the third person. The program team can polish it later."
          >
            <SectionTextarea
              value={bio}
              onChange={(v) => set("bio", v)}
              placeholder="Dr. Jordan Smith leads the pediatric language access program at…"
              rows={5}
            />
          </SectionCard>

          <SectionCard
            title="Your photo"
            subtitle="A recent, clear shot of your face. A phone selfie is perfectly fine — we can swap in something better later if needed."
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) onPick(f);
                }}
                onClick={() => inputRef.current?.click()}
                className={
                  "w-36 h-36 rounded-full overflow-hidden flex items-center justify-center cursor-pointer transition-all relative shrink-0 " +
                  (dragging
                    ? "ring-4 ring-[#0066B3]/30 scale-105"
                    : headshotPreview
                    ? "ring-2 ring-slate-200"
                    : "ring-2 ring-dashed ring-slate-300 hover:ring-[#0066B3]/40")
                }
                style={{ background: headshotPreview ? "transparent" : "linear-gradient(135deg, #f8fafc, #f0f9ff)" }}
              >
                {headshotPreview ? (
                  <img src={headshotPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center px-2">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <div className="text-[11px] font-medium text-slate-600">Drop or click</div>
                  </div>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPick(f);
                }}
              />
              <div className="flex-1 text-sm text-slate-500 leading-relaxed">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-sm font-medium text-[#0066B3] hover:text-[#004F8C]"
                  >
                    {headshotPreview ? "Replace" : "Upload"}
                  </button>
                  {headshotPreview && (
                    <>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={onClear}
                        className="text-sm font-medium text-slate-400 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
                <p className="mt-2 text-[12px] text-slate-400">Maximum 4 MB. PNG, JPG, or WebP.</p>
                {error && (
                  <p className="mt-2 text-[12px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {error}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="How you'll appear"
            subtitle="This becomes the line under your name in the program."
            optional
          >
            <div className="space-y-2">
              <SectionInput value={(fields.jobTitle as string) || ""} onChange={(v) => set("jobTitle", v)} placeholder="Job title (e.g. Director of language services)" />
              <SectionInput value={(fields.affiliation as string) || ""} onChange={(v) => set("affiliation", v)} placeholder="Affiliation (Lurie Children's, Northwestern, AALB…)" />
              <SectionInput value={(fields.pronouns as string) || ""} onChange={(v) => set("pronouns", v)} placeholder="Pronouns (she/her, they/them)" />
              <SectionInput value={(fields.phone as string) || ""} onChange={(v) => set("phone", v)} placeholder="Phone (only used Aug 15 & 16)" type="tel" />
            </div>

            <div className="mt-4">
              {!showLinks ? (
                <button
                  type="button"
                  onClick={() => setShowLinks(true)}
                  className="text-sm font-medium text-slate-500 hover:text-[#0066B3]"
                >
                  + Add links (website, LinkedIn, Twitter)
                </button>
              ) : (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <SectionInput value={(fields.websiteUrl as string) || ""} onChange={(v) => set("websiteUrl", v)} placeholder="Website (https://…)" type="url" />
                  <SectionInput value={(fields.linkedinUrl as string) || ""} onChange={(v) => set("linkedinUrl", v)} placeholder="LinkedIn (https://…)" type="url" />
                  <SectionInput value={(fields.twitterHandle as string) || ""} onChange={(v) => set("twitterHandle", v)} placeholder="Twitter or X (@handle)" />
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="mt-10">
          <FooterRow
            back={{ onClick: onBack }}
            primary={
              <PrimaryButton onClick={onContinue} disabled={!canContinue}>
                Continue <ChevronRight className="w-4 h-4" />
              </PrimaryButton>
            }
          />
          {!canContinue && (
            <p className="mt-3 text-xs text-slate-400 text-right">A bio and a photo are required to continue.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TheDayPage({
  fields, set, arrival, setArrival, departure, setDeparture, onContinue, onBack,
}: {
  fields: Fields;
  set: (k: keyof Fields, v: Fields[keyof Fields]) => void;
  arrival: string;
  setArrival: (s: string) => void;
  departure: string;
  setDeparture: (s: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 px-6 py-10 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#0E5566] mb-3">Step 2 of 3</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">The day</h1>
        <p className="mt-3 text-base text-slate-500 leading-relaxed max-w-lg">
          Logistics for August 15 and 16. All of this is optional — skip whatever does not apply.
        </p>

        <div className="mt-8 space-y-5">
          <SectionCard
            title="Tech and A/V"
            subtitle="Anything beyond a microphone, projector, and standard audio. We will follow up to confirm."
            optional
          >
            <SectionTextarea
              value={(fields.avNotes as string) || ""}
              onChange={(v) => set("avNotes", v)}
              placeholder="Live demo with internet, a second display, a slide clicker, Mac dongle…"
              rows={3}
            />
          </SectionCard>

          <SectionCard
            title="Accessibility"
            subtitle="ASL, captioning, mobility, seating, lighting — anything that helps you do your best work."
            optional
          >
            <SectionTextarea
              value={(fields.accessibilityNeeds as string) || ""}
              onChange={(v) => set("accessibilityNeeds", v)}
              placeholder=""
              rows={3}
            />
          </SectionCard>

          <SectionCard
            title="Food and allergies"
            subtitle="So we plan meals you can actually eat."
            optional
          >
            <div className="space-y-2">
              <SectionInput
                value={(fields.dietary as string) || ""}
                onChange={(v) => set("dietary", v)}
                placeholder="Dietary preferences (vegetarian, kosher, halal, gluten free…)"
              />
              <SectionInput
                value={(fields.allergies as string) || ""}
                onChange={(v) => set("allergies", v)}
                placeholder="Allergies (peanuts, shellfish, latex…)"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Emergency contact"
            subtitle="Used only during the event if we need to reach someone for you."
            optional
          >
            <SectionInput
              value={(fields.emergencyContact as string) || ""}
              onChange={(v) => set("emergencyContact", v)}
              placeholder="Sam Smith (spouse) +1 555 555 0123"
            />
          </SectionCard>

          <SectionCard
            title="Travel"
            subtitle="Skip if you are local or already arranged."
            optional
          >
            <div className="text-lg sm:text-xl leading-loose text-slate-700 font-medium">
              Arriving <InlineDate value={arrival} onChange={setArrival} />
              {arrival && departure ? "," : "."}
              {(arrival || departure) && (
                <>
                  {" "}leaving <InlineDate value={departure} onChange={setDeparture} />.
                </>
              )}
            </div>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <BigToggle
                checked={!!fields.needsHotel}
                label="Help with hotel booking"
                desc="We can suggest a partner hotel near the venue."
                onToggle={() => set("needsHotel", !fields.needsHotel)}
              />
              <BigToggle
                checked={!!fields.needsParking}
                label="Parking pass for the venue"
                desc="We will reserve a spot for you on the day."
                onToggle={() => set("needsParking", !fields.needsParking)}
              />
            </div>
          </SectionCard>
        </div>

        <div className="mt-10">
          <FooterRow
            back={{ onClick: onBack }}
            primary={
              <PrimaryButton onClick={onContinue}>
                Continue <ChevronRight className="w-4 h-4" />
              </PrimaryButton>
            }
          />
        </div>
      </div>
    </div>
  );
}

function InlineDate({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const hasValue = !!value;
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        "inline-block align-baseline bg-transparent outline-none border-b-2 border-dashed transition-colors px-1 -mb-0.5 " +
        (hasValue
          ? "border-[#0066B3]/40 text-[#0E5566] font-semibold focus:border-[#0066B3]"
          : "border-slate-300 text-slate-400 focus:border-[#0066B3] focus:text-[#0E5566]")
      }
    />
  );
}

function BigToggle({
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
        "text-left p-5 rounded-2xl border transition-all " +
        (checked
          ? "bg-[#0066B3]/5 border-[#0066B3]/30 ring-1 ring-[#0066B3]/15"
          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40")
      }
    >
      <div className="flex items-center gap-3">
        <div
          className={
            "w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all " +
            (checked ? "bg-[#0066B3] text-white" : "bg-white border border-slate-300")
          }
        >
          {checked && <Check className="w-3.5 h-3.5" />}
        </div>
        <div className="text-base font-semibold text-slate-900">{label}</div>
      </div>
      <div className="mt-2 text-xs text-slate-500 leading-relaxed">{desc}</div>
    </button>
  );
}

function ConfirmScreen({
  initial, fields, set, firstName, headshotPreview, onShowPolicy, onSubmit, onTentative, onBack, saving, error,
}: {
  initial: Initial;
  fields: Fields;
  set: (k: keyof Fields, v: Fields[keyof Fields]) => void;
  firstName: string;
  headshotPreview: string | null;
  onShowPolicy: () => void;
  onSubmit: () => Promise<boolean>;
  onTentative: () => Promise<boolean>;
  onBack: () => void;
  saving: boolean;
  error: string | null;
}) {
  const canSubmit = !!fields.agreedToTerms && !!headshotPreview;
  const missing: string[] = [];
  if (!headshotPreview) missing.push("a photo");
  if (!fields.agreedToTerms) missing.push("the participation confirmation");

  return (
    <ScreenShell
      wide
      eyebrow="Step 3 of 3"
      heading={`Ready to lock it in, ${firstName}?`}
      subhead="Review, agree, and submit."
      footer={
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}
          {!canSubmit && missing.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Still need {missing.join(" and ")} above.</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <GhostButton onClick={onBack} icon={ChevronLeft}>Back</GhostButton>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onTentative}
                disabled={!canSubmit || saving}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-[#0E5566] bg-white border border-[#0E5566] hover:bg-[#0E5566]/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm tentatively
              </button>
              <PrimaryButton onClick={onSubmit} disabled={!canSubmit || saving}>
                {saving ? "Submitting…" : "Confirm participation"} <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-100">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
            {headshotPreview ? (
              <img src={headshotPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-500 text-xl font-bold">{firstName.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 text-base truncate">{initial.name}</div>
            <div className="text-xs text-slate-500 truncate">{initial.email}</div>
            {(initial.role || initial.sessionLength) && (
              <div className="text-xs text-slate-600 mt-1 truncate">
                {[initial.sessionFormat || initial.role, initial.sessionLength].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        </div>

        <label className="block p-5 rounded-2xl border border-[#0066B3]/25 bg-[#0066B3]/5 cursor-pointer hover:bg-[#0066B3]/8 transition-colors">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={!!fields.agreedToTerms}
              onChange={(e) => set("agreedToTerms", e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0066B3] focus:ring-[#0066B3]"
            />
            <span className="text-sm text-slate-700 leading-relaxed">
              I confirm I will participate in the 2026 Lurie Children&rsquo;s and AALB Conference on August 15 and 16, 2026, in person, and the details above are accurate.
            </span>
          </div>
        </label>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">Permissions you can grant</div>
          <p className="text-xs text-slate-500 -mt-2">All optional. Toggle anything you are comfortable with.</p>
          <SoftToggle
            checked={!!fields.agreedToRecord}
            label="My session may be recorded and shared with registered attendees"
            onToggle={() => set("agreedToRecord", !fields.agreedToRecord)}
          />
          <SoftToggle
            checked={!!fields.agreedToPhoto}
            label="My photo and likeness may be used for event marketing and social media"
            onToggle={() => set("agreedToPhoto", !fields.agreedToPhoto)}
          />
          <SoftToggle
            checked={!!fields.agreedToCe}
            label="My session may be offered for continuing education credit afterward"
            onToggle={() => set("agreedToCe", !fields.agreedToCe)}
          />
        </div>

        <div>
          <textarea
            value={(fields.presenterMessage as string) || ""}
            onChange={(e) => set("presenterMessage", e.target.value)}
            rows={3}
            placeholder="Any final questions or notes for the program team? (optional)"
            className="w-full px-4 py-3 text-base bg-slate-50/60 border border-transparent rounded-xl focus:bg-white focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 outline-none transition-all placeholder:text-slate-400 leading-relaxed"
          />
          <p className="mt-2 text-[11px] text-slate-400">If you have open questions, choose Confirm tentatively below instead.</p>
        </div>

        <div className="text-xs text-slate-400">
          By submitting, you acknowledge the{" "}
          <button type="button" onClick={onShowPolicy} className="text-[#0066B3] font-semibold hover:underline inline-flex items-center gap-1">
            full presenter policy <ExternalLink className="w-3 h-3" />
          </button>
          {" "}covering participation, intellectual property, photography, recording, and reimbursement terms.
        </div>
      </div>
    </ScreenShell>
  );
}

function CompletionScreen({
  firstName, mode, onEdit,
}: {
  firstName: string;
  mode: "confirmed" | "tentative" | "declined" | "changes";
  onEdit?: () => void;
}) {
  const config = {
    confirmed: {
      eyebrow: "You're in",
      title: `Thank you, ${firstName}.`,
      body: "You're confirmed for August 15 and 16. We've emailed you a copy. The program team will be in touch with next steps.",
      celebrate: true,
    },
    tentative: {
      eyebrow: "Tentative",
      title: `Got it, ${firstName}.`,
      body: "We've noted your tentative confirmation. The program team will follow up on your open questions before finalising.",
      celebrate: true,
    },
    declined: {
      eyebrow: "Reply received",
      title: `Thanks for letting us know, ${firstName}.`,
      body: "We've recorded your response. We hope to work with you on a future event.",
      celebrate: false,
    },
    changes: {
      eyebrow: "Sent to the team",
      title: `Got it, ${firstName}.`,
      body: "Your request is with the program team. We'll reply directly to discuss adjustments.",
      celebrate: false,
    },
  }[mode];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <BrandBar />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center py-20">
          {config.celebrate && (
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-8"
              style={{ background: `linear-gradient(135deg, ${TEAL}, ${BLUE})` }}
            >
              <Check className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
          )}
          <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#0E5566] mb-3">{config.eyebrow}</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">{config.title}</h1>
          <p className="mt-5 text-base text-slate-500 leading-relaxed">{config.body}</p>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="mt-10 text-sm font-medium text-[#0066B3] hover:text-[#004F8C]"
            >
              Edit my details
            </button>
          )}
          <div className="mt-16 text-xs text-slate-400">
            2026 Lurie Children&rsquo;s and AALB Conference
          </div>
        </div>
      </main>
    </div>
  );
}

function PolicyDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${TEAL}, ${BLUE})` }} />
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#0E5566]">Presenter policy</div>
            <div className="font-semibold text-slate-900 mt-0.5">2026 Lurie Children&rsquo;s and AALB Conference</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-7 py-6 text-sm text-slate-700 leading-relaxed space-y-5">
          <PolicyContent />
        </div>
        <div className="px-7 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: `linear-gradient(to right, ${TEAL}, ${BLUE})` }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SoftToggle({
  checked, label, onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        "text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all w-full " +
        (checked
          ? "bg-[#0066B3]/5 border-[#0066B3]/30 ring-1 ring-[#0066B3]/15"
          : "bg-white border-slate-200 hover:border-slate-300")
      }
    >
      <div
        className={
          "w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all " +
          (checked ? "bg-[#0066B3] text-white" : "bg-white border border-slate-300")
        }
      >
        {checked && <Check className="w-3.5 h-3.5" />}
      </div>
      <span className="text-sm text-slate-900 font-medium">{label}</span>
    </button>
  );
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
