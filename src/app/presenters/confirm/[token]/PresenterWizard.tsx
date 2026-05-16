"use client";

import { useMemo, useRef, useState } from "react";
import {
  Check, ChevronLeft, ChevronRight, Upload, X, AlertCircle,
  Calendar, MapPin, Clock, Users, FileText, MessageSquare, DollarSign, Mic,
  ExternalLink,
} from "lucide-react";
import { parseResponse } from "@/lib/api";

type Fields = Record<string, string | boolean | null | undefined>;

type Initial = {
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

const STEPS = ["Invitation", "About you", "Logistics", "Confirm"] as const;

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
  const [decision, setDecision] = useState<"accept" | "request_changes" | "decline" | null>(
    initial.status === "confirmed" || initial.status === "tentative" ? "accept" :
    initial.status === "declined" ? "decline" :
    initial.status === "changes_requested" ? "request_changes" : null
  );
  const [fields, setFields] = useState<Fields>(() => ({ ...initial }));
  const [arrival, setArrival] = useState(initial.travelArrival ? initial.travelArrival.slice(0, 10) : "");
  const [departure, setDeparture] = useState(initial.travelDeparture ? initial.travelDeparture.slice(0, 10) : "");
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(headshotUrl);
  const [pendingHeadshot, setPendingHeadshot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completion, setCompletion] = useState<"confirmed" | "tentative" | "declined" | "changes" | null>(
    initial.status === "confirmed" ? "confirmed" :
    initial.status === "tentative" ? "tentative" :
    initial.status === "declined" ? "declined" :
    initial.status === "changes_requested" ? "changes" : null
  );
  const [error, setError] = useState<string | null>(null);
  const [showPolicy, setShowPolicy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const firstName = useMemo(() => (initial.name || "").split(" ")[0] || initial.name, [initial.name]);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function persist(action: "save" | "submit" | "tentative" | "decline" | "request_changes") {
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

  if (completion) return <CompletionCard name={firstName} mode={completion} />;

  return (
    <div className="min-h-screen bg-white">
      <BrandBar />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <Header firstName={firstName} />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <Stepper current={step} decision={decision} />

          <div className="px-6 sm:px-10 py-8 sm:py-10">
            {error && (
              <div className="mb-6 flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {step === 0 && (
              <InvitationStep
                initial={initial}
                decision={decision}
                setDecision={setDecision}
                declineReason={(fields.declineReason as string) || ""}
                setDeclineReason={(v) => set("declineReason", v)}
                requestedChangesText={(fields.requestedChanges as string) || ""}
                setRequestedChangesText={(v) => set("requestedChanges", v)}
                onDecline={() => persist("decline")}
                onRequestChanges={() => persist("request_changes")}
                onAcceptContinue={() => setStep(1)}
                onShowPolicy={() => setShowPolicy(true)}
              />
            )}

            {step === 1 && decision === "accept" && (
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

            {step === 2 && decision === "accept" && (
              <LogisticsStep
                fields={fields}
                set={set}
                arrival={arrival}
                setArrival={setArrival}
                departure={departure}
                setDeparture={setDeparture}
              />
            )}

            {step === 3 && decision === "accept" && (
              <ConfirmStep
                fields={fields}
                set={set}
                initial={initial}
                arrival={arrival}
                departure={departure}
                headshotPreview={headshotPreview}
                onShowPolicy={() => setShowPolicy(true)}
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

            {step > 0 && decision === "accept" && (
              <FooterNav
                step={step}
                saving={saving}
                canSubmit={!!fields.agreedToTerms && !!fields.agreedToHeadshot}
                onBack={back}
                onNext={next}
                onSaveDraft={() => persist("save")}
                onSubmit={() => persist("submit")}
                onTentative={() => persist("tentative")}
              />
            )}
          </div>
        </div>
      </div>

      {showPolicy && <PolicyDialog onClose={() => setShowPolicy(false)} />}
    </div>
  );
}

function BrandBar() {
  return (
    <div className="h-2 w-full flex">
      <div className="w-1/2 bg-[#0E5566]" />
      <div className="w-1/2 bg-[#0066B3]" />
    </div>
  );
}

function Header({ firstName }: { firstName: string }) {
  return (
    <div className="mb-8">
      <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
        Presenter portal
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-2">
        Welcome, {firstName}.
      </h1>
      <p className="text-slate-500 mt-3 max-w-xl text-[15px] leading-relaxed">
        The 2026 Lurie Children&apos;s and AALB Conference. True Language Access: Yesterday, Today, and Tomorrow.
      </p>
    </div>
  );
}

function Stepper({ current, decision }: { current: number; decision: string | null }) {
  const visible = decision === "accept" ? STEPS.length : 1;
  return (
    <div className="px-6 sm:px-10 pt-6">
      <div className="flex items-center gap-2">
        {STEPS.slice(0, visible).map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all " +
                  (done
                    ? "bg-[#0E5566] text-white"
                    : active
                    ? "bg-[#0066B3] text-white ring-4 ring-[#0066B3]/15"
                    : "bg-slate-100 text-slate-400")
                }
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <div className={"text-xs font-semibold " + (active ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400")}>
                {label}
              </div>
              {i < visible - 1 && <div className={"flex-1 h-px " + (done ? "bg-[#0E5566]" : "bg-slate-200")} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InvitationStep({
  initial,
  decision,
  setDecision,
  declineReason,
  setDeclineReason,
  requestedChangesText,
  setRequestedChangesText,
  onDecline,
  onRequestChanges,
  onAcceptContinue,
  onShowPolicy,
}: {
  initial: Initial;
  decision: "accept" | "request_changes" | "decline" | null;
  setDecision: (d: "accept" | "request_changes" | "decline" | null) => void;
  declineReason: string;
  setDeclineReason: (s: string) => void;
  requestedChangesText: string;
  setRequestedChangesText: (s: string) => void;
  onDecline: () => Promise<boolean>;
  onRequestChanges: () => Promise<boolean>;
  onAcceptContinue: () => void;
  onShowPolicy: () => void;
}) {
  const hasAnyAssignment =
    !!(initial.sessionLength || initial.sessionFormat || initial.role || initial.qaLength ||
      initial.preferredDay || initial.sessionTrack || initial.talkTitle);
  const headline =
    [initial.sessionLength, initial.sessionFormat || initial.role].filter(Boolean).join(" ") ||
    initial.role || (hasAnyAssignment ? "A presenter" : "Specifics being finalized");
  const showCompensation = initial.honorariumAmount != null || initial.travelReimbursement != null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your invitation</h2>
        <p className="mt-1.5 text-sm text-slate-500">Here is what we are asking. Review the details, then choose how to respond.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-[#0E5566] to-[#0066B3] text-white">
          <div className="text-[11px] font-semibold tracking-[0.2em] uppercase opacity-90">You are invited to participate as</div>
          <div className="text-xl font-bold mt-1">
            {headline}
            {initial.sessionTrack ? `, ${initial.sessionTrack}` : ""}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {initial.talkTitle && <DetailRow icon={FileText} label="Working title" value={initial.talkTitle} />}
          {initial.talkAbstract && <DetailRow icon={MessageSquare} label="Abstract" value={initial.talkAbstract} multiline />}
          {initial.qaLength && <DetailRow icon={Mic} label="Q and A" value={initial.qaLength} />}
          {initial.preferredDay && <DetailRow icon={Calendar} label="Day" value={initial.preferredDay} />}
          {initial.coPresenters && <DetailRow icon={Users} label="Co presenters" value={initial.coPresenters} />}
          {initial.learningObjectives && <DetailRow icon={Check} label="Learning objectives" value={initial.learningObjectives} multiline />}
          <DetailRow icon={MapPin} label="Venue" value="Lurie Children's, Chicago" />
          <DetailRow icon={Clock} label="Conference dates" value="August 15 and 16, 2026" />
          {!hasAnyAssignment && (
            <div className="px-6 py-4 bg-slate-50 text-sm text-slate-600 leading-relaxed">
              Specifics like role, length, and day are being finalized by the program team. You can accept now and we will confirm details together, or use Request adjustments below to start that conversation first.
            </div>
          )}
        </div>

        {showCompensation && (
          <div className="px-6 py-5 bg-slate-50 border-t border-slate-200">
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 mb-3">Compensation</div>
            <div className="grid sm:grid-cols-2 gap-3">
              {initial.honorariumAmount != null && (
                <CompCard
                  label="Honorarium"
                  value={`$${initial.honorariumAmount.toLocaleString("en-US")}`}
                  caption="Paid after participation"
                />
              )}
              {initial.travelReimbursement != null && (
                <CompCard
                  label="Travel reimbursement"
                  value={`up to $${initial.travelReimbursement.toLocaleString("en-US")}`}
                  caption="Receipts required"
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
        <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 mb-3">Before you respond</div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Accepting commits you to attending in person on August 15 and 16, 2026, providing a high resolution headshot, and the terms in our presenter policy. The wizard that follows collects your bio, headshot, optional logistics, and the consents you wish to grant.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <button
            type="button"
            onClick={onShowPolicy}
            className="inline-flex items-center gap-1.5 font-semibold text-[#0066B3] hover:text-[#004F8C]"
          >
            Read the full presenter policy <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-slate-400">Covers participation, intellectual property, photography, recording, honorarium, and reimbursement terms.</span>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 mb-3">How would you like to respond</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <DecisionCard
            active={decision === "accept"}
            tone="primary"
            label="Accept"
            desc="Move forward and provide your details."
            onClick={() => setDecision("accept")}
          />
          <DecisionCard
            active={decision === "request_changes"}
            tone="neutral"
            label="Questions or adjustments"
            desc="Open a conversation before deciding. Use this for clarifications or changes."
            onClick={() => setDecision("request_changes")}
          />
          <DecisionCard
            active={decision === "decline"}
            tone="muted"
            label="Cannot attend"
            desc="Decline politely with an optional note."
            onClick={() => setDecision("decline")}
          />
        </div>
      </div>

      {decision === "accept" && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onAcceptContinue}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {decision === "request_changes" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
          <div className="text-sm font-semibold text-slate-900">What would you like to discuss?</div>
          <p className="text-xs text-slate-500 mt-1">Ask any questions, share constraints, or propose changes. Our program team will reply directly.</p>
          <textarea
            value={requestedChangesText}
            onChange={(e) => setRequestedChangesText(e.target.value)}
            rows={5}
            placeholder="For example: questions about format, length, or compensation; a request to move to a different day; a proposed alternate topic; clarification on the policy terms."
            className={inputClass + " mt-3 bg-white"}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onRequestChanges}
              disabled={!requestedChangesText.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#0E5566] hover:bg-[#0A3F4D] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send to program team
            </button>
          </div>
        </div>
      )}

      {decision === "decline" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5">
          <div className="text-sm font-semibold text-slate-900">Sorry to hear that.</div>
          <p className="text-xs text-slate-500 mt-1">A short note helps us plan. Optional.</p>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
            placeholder="Schedule conflict, traveling, other commitments, etc."
            className={inputClass + " mt-3 bg-white"}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onDecline}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800"
            >
              Submit decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CompCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
        <DollarSign className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-2xl font-bold text-[#0E5566] mt-1">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{caption}</div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, multiline }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; multiline?: boolean }) {
  return (
    <div className="px-6 py-4 grid grid-cols-[24px_140px_1fr] gap-4 items-start">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5" />
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={"text-sm text-slate-900 " + (multiline ? "whitespace-pre-wrap leading-relaxed" : "")}>{value}</div>
    </div>
  );
}

function DecisionCard({
  active, tone, label, desc, onClick,
}: {
  active: boolean;
  tone: "primary" | "neutral" | "muted";
  label: string;
  desc: string;
  onClick: () => void;
}) {
  const ringColor =
    tone === "primary" ? "ring-[#0066B3]/30 border-[#0066B3]" :
    tone === "neutral" ? "ring-amber-500/20 border-amber-400" :
    "ring-rose-500/20 border-rose-400";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "text-left p-4 rounded-xl border transition-all " +
        (active
          ? `bg-white ring-2 shadow-sm ${ringColor}`
          : "bg-white border-slate-200 hover:border-slate-300")
      }
    >
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      <div className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</div>
    </button>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">About you</h2>
        <p className="mt-1.5 text-sm text-slate-500">This is what attendees and our marketing materials will use.</p>
      </div>

      <Field label="Bio" required hint="Two to four sentences in the third person.">
        <textarea
          value={(fields.bio as string) || ""}
          onChange={(e) => set("bio", e.target.value)}
          rows={5}
          placeholder="Dr. Jordan Smith leads the pediatric language access program at..."
          className={inputClass}
        />
      </Field>

      <div className="grid sm:grid-cols-[160px_1fr] gap-6 items-start">
        <div>
          <Label text="Headshot" required />
          <div className="mt-2 aspect-square rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center relative">
            {headshotPreview ? (
              <img src={headshotPreview} alt="Headshot preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-400 text-xs text-center px-2">No photo</div>
            )}
            {headshotPreview && (
              <button
                type="button"
                onClick={clearHeadshot}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 hover:bg-white shadow flex items-center justify-center text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onPickHeadshot}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
          >
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl bg-[#0066B3]/5 border border-[#0066B3]/20 px-4 py-3">
            <div className="text-xs font-semibold text-[#0066B3] uppercase tracking-wider">Quality requirements</div>
            <ul className="mt-2 text-sm text-slate-700 space-y-1 list-disc list-inside">
              <li>High resolution, at least 1200 pixels on the long side</li>
              <li>Color, professional, head and shoulders</li>
              <li>Neutral or simple background</li>
              <li>PNG, JPG, or WebP under 4 MB</li>
            </ul>
            <div className="text-xs text-slate-500 mt-2">
              If you do not have one ready, you can upload later. We use this for the program, website, signage, and social media.
            </div>
          </div>
          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50/60">
            <input
              type="checkbox"
              checked={!!fields.agreedToHeadshot}
              onChange={(e) => set("agreedToHeadshot", e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0066B3] focus:ring-[#0066B3]"
            />
            <span className="text-sm text-slate-700">
              I will provide a high resolution headshot that meets these requirements, by upload above or by sending it to the program team before July 1, 2026.
            </span>
          </label>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Job title" optional>
          <input type="text" value={(fields.jobTitle as string) || ""} onChange={(e) => set("jobTitle", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Affiliation" optional>
          <input type="text" value={(fields.affiliation as string) || ""} onChange={(e) => set("affiliation", e.target.value)} className={inputClass} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Pronouns" optional>
          <input type="text" value={(fields.pronouns as string) || ""} onChange={(e) => set("pronouns", e.target.value)} placeholder="she/her, they/them" className={inputClass} />
        </Field>
        <Field label="Phone for event week" optional>
          <input type="tel" value={(fields.phone as string) || ""} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Website" optional>
          <input type="url" value={(fields.websiteUrl as string) || ""} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://" className={inputClass} />
        </Field>
        <Field label="LinkedIn" optional>
          <input type="url" value={(fields.linkedinUrl as string) || ""} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://" className={inputClass} />
        </Field>
        <Field label="Twitter or X" optional>
          <input type="text" value={(fields.twitterHandle as string) || ""} onChange={(e) => set("twitterHandle", e.target.value)} placeholder="@handle" className={inputClass} />
        </Field>
      </div>
    </div>
  );
}

function LogisticsStep({
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Logistics</h2>
        <p className="mt-1.5 text-sm text-slate-500">All optional. Skip anything that does not apply.</p>
      </div>

      <Field label="Tech and A/V notes" optional hint="Anything beyond a microphone, projector, and audio. We will follow up to confirm.">
        <textarea
          value={(fields.avNotes as string) || ""}
          onChange={(e) => set("avNotes", e.target.value)}
          rows={3}
          placeholder="Live demo with internet, second display, Mac dongle, slide clicker, etc."
          className={inputClass}
        />
      </Field>

      <Field label="Accessibility needs" optional hint="ASL, captioning, mobility, seating, lighting. Anything that helps you do your best work.">
        <textarea
          value={(fields.accessibilityNeeds as string) || ""}
          onChange={(e) => set("accessibilityNeeds", e.target.value)}
          rows={2}
          className={inputClass}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Dietary preferences" optional>
          <input
            type="text"
            value={(fields.dietary as string) || ""}
            onChange={(e) => set("dietary", e.target.value)}
            placeholder="Vegetarian, kosher, halal, gluten free"
            className={inputClass}
          />
        </Field>
        <Field label="Allergies" optional>
          <input
            type="text"
            value={(fields.allergies as string) || ""}
            onChange={(e) => set("allergies", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="text-sm font-semibold text-slate-900">Travel</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Arriving" optional>
            <input type="date" value={arrival} onChange={(e) => setArrival(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Departing" optional>
            <input type="date" value={departure} onChange={(e) => setDeparture(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Toggle
            checked={!!fields.needsHotel}
            label="Help with hotel booking"
            onToggle={() => set("needsHotel", !fields.needsHotel)}
          />
          <Toggle
            checked={!!fields.needsParking}
            label="Parking pass for the venue"
            onToggle={() => set("needsParking", !fields.needsParking)}
          />
        </div>
      </div>

      <Field label="Emergency contact" optional hint="Name, relationship, phone. Used only during the event if needed.">
        <input
          type="text"
          value={(fields.emergencyContact as string) || ""}
          onChange={(e) => set("emergencyContact", e.target.value)}
          placeholder="Sam Smith (spouse) +1 555 555 0123"
          className={inputClass}
        />
      </Field>
    </div>
  );
}

function ConfirmStep({
  fields, set, initial, arrival, departure, headshotPreview, onShowPolicy,
}: {
  fields: Fields;
  set: (k: keyof Fields, v: Fields[keyof Fields]) => void;
  initial: Initial;
  arrival: string;
  departure: string;
  headshotPreview: string | null;
  onShowPolicy: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Confirm</h2>
        <p className="mt-1.5 text-sm text-slate-500">Review, agree, and submit.</p>
      </div>

      <div className="grid sm:grid-cols-[80px_1fr] gap-4 items-center bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="w-20 h-20 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center">
          {headshotPreview ? (
            <img src={headshotPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-400 text-2xl font-semibold">{initial.name.charAt(0)}</span>
          )}
        </div>
        <div>
          <div className="font-semibold text-slate-900">{initial.name}</div>
          <div className="text-xs text-slate-500">{initial.email}</div>
          <div className="text-xs text-slate-700 mt-1">
            {[initial.sessionLength, initial.sessionFormat || initial.role].filter(Boolean).join(" ") || "Presentation"}
            {initial.talkTitle ? `, ${initial.talkTitle}` : ""}
          </div>
        </div>
      </div>

      <Summary
        items={[
          { label: "Bio", value: fields.bio as string },
          { label: "Headshot", value: headshotPreview ? "Provided" : null },
          { label: "Job title", value: fields.jobTitle as string },
          { label: "Affiliation", value: fields.affiliation as string },
          { label: "A/V notes", value: fields.avNotes as string },
          { label: "Accessibility", value: fields.accessibilityNeeds as string },
          { label: "Dietary", value: fields.dietary as string },
          { label: "Travel", value: [arrival, departure].filter(Boolean).join(" to ") },
        ]}
      />

      <div className="space-y-3">
        <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500">Required</div>

        <label className="flex items-start gap-3 p-4 rounded-xl border border-[#0066B3]/30 bg-[#0066B3]/5 cursor-pointer">
          <input
            type="checkbox"
            checked={!!fields.agreedToTerms}
            onChange={(e) => set("agreedToTerms", e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0066B3] focus:ring-[#0066B3]"
          />
          <span className="text-sm text-slate-700">
            I confirm I will participate in the 2026 Lurie Children&apos;s and AALB Conference on August 15 and 16, 2026, in person, and the details above are accurate.
          </span>
        </label>

        <label className="flex items-start gap-3 p-4 rounded-xl border border-[#0066B3]/30 bg-[#0066B3]/5 cursor-pointer">
          <input
            type="checkbox"
            checked={!!fields.agreedToHeadshot}
            onChange={(e) => set("agreedToHeadshot", e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0066B3] focus:ring-[#0066B3]"
          />
          <span className="text-sm text-slate-700">
            I will provide a high resolution headshot that meets the published quality requirements.
          </span>
        </label>

        <div className="text-xs text-slate-500 px-1">
          By submitting, you also acknowledge the{" "}
          <button type="button" onClick={onShowPolicy} className="text-[#0066B3] font-semibold hover:underline inline-flex items-center gap-1">
            full presenter policy <ExternalLink className="w-3 h-3" />
          </button>
          {" "}covering participation, intellectual property, photography, recording, and reimbursement terms.
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500">Optional permissions</div>
        <Toggle
          checked={!!fields.agreedToRecord}
          label="My session may be recorded and shared with registered attendees"
          onToggle={() => set("agreedToRecord", !fields.agreedToRecord)}
        />
        <Toggle
          checked={!!fields.agreedToPhoto}
          label="My photo and likeness may be used for event marketing and social media"
          onToggle={() => set("agreedToPhoto", !fields.agreedToPhoto)}
        />
        <Toggle
          checked={!!fields.agreedToCe}
          label="My session may be offered for continuing education credit afterward"
          onToggle={() => set("agreedToCe", !fields.agreedToCe)}
        />
      </div>

      <Field label="Questions or notes for the program team" optional hint="Anything you would like us to know or follow up on. If you have open questions, choose Confirm tentatively below.">
        <textarea
          value={(fields.presenterMessage as string) || ""}
          onChange={(e) => set("presenterMessage", e.target.value)}
          rows={3}
          className={inputClass}
        />
      </Field>
    </div>
  );
}

function FooterNav({
  step, saving, canSubmit, onBack, onNext, onSaveDraft, onSubmit, onTentative,
}: {
  step: number;
  saving: boolean;
  canSubmit: boolean;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onTentative: () => void;
}) {
  const isLast = step === STEPS.length - 1;
  return (
    <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={saving}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
        {!isLast && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40"
          >
            Save and finish later
          </button>
        )}
        {!isLast ? (
          <button
            type="button"
            onClick={onNext}
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm disabled:opacity-50"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onTentative}
              disabled={saving || !canSubmit}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0E5566] bg-white border border-[#0E5566] hover:bg-[#0E5566]/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm tentatively
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving || !canSubmit}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0E5566] hover:bg-[#0A3F4D] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Submitting..." : "Confirm participation"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Summary({ items }: { items: { label: string; value: string | null | undefined }[] }) {
  const filled = items.filter((i) => i.value);
  if (filled.length === 0) {
    return <div className="text-sm text-slate-400 italic">Nothing optional was filled in. That is fine.</div>;
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
      {filled.map((i) => (
        <div key={i.label} className="px-4 py-3 grid grid-cols-3 gap-3 text-sm">
          <div className="text-slate-500">{i.label}</div>
          <div className="col-span-2 text-slate-900 truncate">{i.value}</div>
        </div>
      ))}
    </div>
  );
}

function CompletionCard({ name, mode }: { name: string; mode: "confirmed" | "tentative" | "declined" | "changes" }) {
  const config = {
    confirmed: {
      label: "Confirmed",
      title: `Thank you, ${name}.`,
      body: "Your participation is confirmed. We have emailed you a copy. Our program team will be in touch with next steps.",
      accent: "text-[#0066B3]",
    },
    tentative: {
      label: "Tentative",
      title: `Got it, ${name}.`,
      body: "We have noted your tentative confirmation. Our program team will follow up on the questions you raised before final confirmation.",
      accent: "text-sky-700",
    },
    declined: {
      label: "Response received",
      title: `Thanks for letting us know, ${name}.`,
      body: "We have recorded your response. We hope to work with you on a future event.",
      accent: "text-slate-500",
    },
    changes: {
      label: "Request received",
      title: `Got it, ${name}.`,
      body: "Your request has been sent to the program team. We will follow up directly to discuss adjustments.",
      accent: "text-amber-700",
    },
  }[mode];

  return (
    <div className="min-h-screen bg-white">
      <BrandBar />
      <div className="max-w-md mx-auto px-5 py-24 text-center">
        <div className={"text-[11px] font-semibold tracking-[0.2em] uppercase " + config.accent}>
          {config.label}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mt-3">{config.title}</h1>
        <p className="mt-4 text-slate-600 leading-relaxed">{config.body}</p>
        <div className="mt-10 text-xs text-slate-400">
          2026 Lurie Children&apos;s and AALB Conference
        </div>
      </div>
    </div>
  );
}

function PolicyDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">Presenter policy</div>
            <div className="font-semibold text-slate-900 mt-0.5">2026 Lurie Children&apos;s and AALB Conference</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 text-sm text-slate-700 leading-relaxed space-y-4">
          <PolicyContent />
        </div>
        <div className="px-6 py-3 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#0E5566] hover:bg-[#0A3F4D]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PolicyContent() {
  return (
    <>
      <Section title="1. Participation">
        Acceptance of an invitation is a commitment to be present in person on the dates and at the times communicated by the program team. Substantial changes to your assigned format, length, day, or content require advance written approval from the program team. Failure to appear without timely notice may forfeit any honorarium and may affect future invitations.
      </Section>
      <Section title="2. Content and intellectual property">
        You retain ownership of your original presentation materials. You grant Lurie Children&apos;s and the American Association of Latino Behavioralists (AALB) a non exclusive, worldwide, royalty free license to record, reproduce, transmit, distribute, and publicly display your presentation and likeness for the purposes of the conference, post conference education, accreditation, marketing, and archival use. You represent that you have the right to grant this license and that your materials do not infringe any third party rights. You will provide attribution to the conference in any external publication of these materials.
      </Section>
      <Section title="3. Photography, video, and audio">
        The conference will produce photography and audio or video recordings of public sessions. By accepting this invitation you consent to the capture and editorial use of your image, voice, and remarks for educational, promotional, and historical purposes by Lurie Children&apos;s and AALB and their authorized partners. Specific opt in permissions for session recording, social media use, and continuing education credit are collected separately in the portal.
      </Section>
      <Section title="4. Continuing education credit">
        If you opt in to continuing education use, you authorize the conference to register your session with applicable accrediting bodies, distribute approved post session materials, and provide attendee assessment data. You agree to meet documentation timelines that the program team will share, including learning objectives, references, and disclosures of any commercial relationships.
      </Section>
      <Section title="5. Disclosure of conflicts">
        You will disclose in writing any financial relationships with commercial interests relevant to your presentation. The program team may require modifications to mitigate identified conflicts, consistent with applicable accreditation standards.
      </Section>
      <Section title="6. Honorarium and reimbursement">
        Any honorarium offered is stated in your invitation and is paid following the conference, subject to United States tax withholding and reporting requirements. Travel reimbursement, when offered, is capped at the amount stated in your invitation, requires original itemized receipts, and follows the conference reimbursement guidelines that the program team will share. Government employees are responsible for compliance with their agency&apos;s ethics rules, including any limits or required pre approvals on honoraria, gifts, and travel.
      </Section>
      <Section title="7. Code of conduct">
        Presenters agree to abide by the conference code of conduct, including respect for attendees, staff, and venue personnel, accessibility requirements, and the conference&apos;s policies prohibiting harassment and discrimination. The program team may decline to platform any presenter found in violation.
      </Section>
      <Section title="8. Cancellation and withdrawal">
        If circumstances change after acceptance, notify the program team in writing as soon as possible. Withdrawals after July 1, 2026 may be limited to substitution by mutual agreement, and may forfeit any honorarium previously committed.
      </Section>
      <Section title="9. Privacy">
        Information you provide in this portal is used by the conference organizers to plan, communicate, and document the event, and is shared with vendors only as needed to deliver event services. Honorarium and reimbursement records are retained as required by tax and audit policies.
      </Section>
      <Section title="10. Governing terms">
        These terms are governed by the laws of the State of Illinois without regard to conflict of laws principles. Disputes will be resolved in the state or federal courts of Cook County, Illinois. If any provision is held unenforceable, the remaining provisions remain in effect. Questions about this policy may be directed to the program team at the address used to send your invitation.
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-semibold text-slate-900 mb-1">{title}</div>
      <div className="text-slate-600">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none transition-all placeholder:text-slate-300";

function Label({ text, required, optional }: { text: string; required?: boolean; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-700">{text}</span>
      {required && <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Required</span>}
      {optional && <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Optional</span>}
    </div>
  );
}

function Field({
  label, required, optional, hint, children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label text={label} required={required} optional={optional} />
      {children}
      {hint && <div className="text-[11px] text-slate-400 leading-relaxed">{hint}</div>}
    </div>
  );
}

function Toggle({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
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
