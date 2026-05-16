"use client";

import { useMemo, useState } from "react";
import { X, Check, Copy, Send, AlertCircle, Mail } from "lucide-react";
import {
  ROLE_OPTIONS, SESSION_LENGTHS, QA_LENGTHS, PREFERRED_DAY,
} from "@/lib/presenters";
import { presenterInviteEmail } from "@/lib/mail-templates";
import { parseResponse } from "@/lib/api";
import {
  SoftInput, SoftTextarea, EmailPreview,
} from "./inline-fields";

export type InviteEditable = {
  id: string;
  name: string;
  email: string;
  affiliation: string | null;
  role: string | null;
  sessionFormat: string | null;
  sessionLength: string | null;
  qaLength: string | null;
  sessionTrack: string | null;
  preferredDay: string | null;
  talkTitle: string | null;
  talkAbstract: string | null;
  learningObjectives: string | null;
  honorariumAmount: number | null;
  travelReimbursement: number | null;
};

export function InviteComposer({
  onClose, onCreated, existing,
}: {
  onClose: () => void;
  onCreated: () => void;
  existing?: InviteEditable;
}) {
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name || "");
  const [email, setEmail] = useState(existing?.email || "");
  const [affiliation, setAffiliation] = useState(existing?.affiliation || "");

  const [role, setRole] = useState(existing?.role || "");
  const [sessionFormat, setSessionFormat] = useState(existing?.sessionFormat || "");
  const [sessionLength, setSessionLength] = useState(existing?.sessionLength || "");
  const [qaLength, setQaLength] = useState(existing?.qaLength || "");
  const [sessionTrack, setSessionTrack] = useState(existing?.sessionTrack || "");
  const [preferredDay, setPreferredDay] = useState(existing?.preferredDay || "");

  const [talkTitle, setTalkTitle] = useState(existing?.talkTitle || "");
  const [talkAbstract, setTalkAbstract] = useState(existing?.talkAbstract || "");
  const [learningObjectives, setLearningObjectives] = useState(existing?.learningObjectives || "");

  const [honorariumAmount, setHonorariumAmount] = useState(existing?.honorariumAmount?.toString() || "");
  const [travelReimbursement, setTravelReimbursement] = useState(existing?.travelReimbursement?.toString() || "");

  const [customMessage, setCustomMessage] = useState("");
  const [sendNow, setSendNow] = useState(!isEdit);

  const STEPS = [
    { id: "recipient", label: "Recipient" },
    { id: "session", label: "Session" },
    { id: "extras", label: "Talk & money" },
  ] as const;
  type StepId = (typeof STEPS)[number]["id"];
  const [step, setStep] = useState<StepId>("recipient");
  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;
  const goNext = () => setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)].id);
  const goBack = () => setStep(STEPS[Math.max(stepIndex - 1, 0)].id);
  const canAdvance = step === "recipient" ? !!(name.trim() && email.trim()) : true;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [view, setView] = useState<"compose" | "preview">("compose");

  const canSubmit = !!(name.trim() && email.trim()) && !busy;

  const previewHtml = useMemo(() => {
    return presenterInviteEmail({
      name,
      url: "https://conference.aalb.org/presenters/confirm/preview-link",
      customMessage: customMessage || undefined,
      role: role || undefined,
      sessionFormat: sessionFormat || undefined,
    });
  }, [name, customMessage, role, sessionFormat]);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        name, affiliation: affiliation || null,
        role: role || null,
        sessionFormat: sessionFormat || null,
        sessionLength: sessionLength || null,
        qaLength: qaLength || null,
        sessionTrack: sessionTrack || null,
        preferredDay: preferredDay || null,
        talkTitle: talkTitle || null,
        talkAbstract: talkAbstract || null,
        learningObjectives: learningObjectives || null,
        honorariumAmount: honorariumAmount ? Number(honorariumAmount) : null,
        travelReimbursement: travelReimbursement ? Number(travelReimbursement) : null,
      };
      if (!isEdit) {
        payload.email = email;
        payload.customMessage = customMessage;
        payload.sendNow = sendNow;
      }
      const res = await fetch(isEdit ? `/api/presenters/${existing!.id}` : "/api/presenters", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (isEdit) {
        const { ok, error } = await parseResponse(res);
        if (!ok) throw new Error(error || "Failed");
        onCreated();
        onClose();
        return;
      }
      const { ok, data, error } = await parseResponse<{ id: string; url: string }>(res);
      if (!ok || !data) throw new Error(error || "Failed");
      setCreatedUrl(data.url);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to invite");
    } finally {
      setBusy(false);
    }
  }

  const firstName = name.trim().split(" ")[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-6xl bg-white rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[96vh] flex flex-col">
        <div className="h-1.5 w-full flex shrink-0">
          <div className="w-1/2 bg-[#0E5566]" />
          <div className="w-1/2 bg-[#0066B3]" />
        </div>

        <div className="px-7 py-5 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {isEdit ? "Edit invitation" : "Compose invitation"}
            </div>
            <div className="text-sm text-slate-500 mt-0.5">
              {isEdit
                ? "Changes apply immediately. Resend from the detail page to email an update."
                : "Type the invitation as if you were writing it. The preview updates as you go."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setView("compose")}
                className={"px-3 py-1.5 rounded-md " + (view === "compose" ? "bg-white shadow-sm text-slate-900" : "text-slate-600")}
              >
                Compose
              </button>
              <button
                type="button"
                onClick={() => setView("preview")}
                className={"px-3 py-1.5 rounded-md " + (view === "preview" ? "bg-white shadow-sm text-slate-900" : "text-slate-600")}
              >
                Preview
              </button>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {createdUrl ? (
          <div className="p-10 max-w-xl mx-auto space-y-6">
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white mb-4"
                style={{ background: "linear-gradient(135deg, #0E5566, #0066B3)" }}
              >
                <Check className="w-7 h-7" />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {sendNow ? `Invitation sent to ${firstName || name || "your presenter"}` : "Presenter saved"}
              </div>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {sendNow
                  ? "We emailed them a personal portal link. They can accept, suggest adjustments, or decline from there."
                  : "Send them their personal portal link whenever you are ready."}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="text-[11px] font-semibold tracking-widest uppercase text-slate-500 mb-2">Their personal portal</div>
              <div className="flex items-center gap-2">
                <input readOnly value={createdUrl} className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono" />
                <button
                  onClick={() => navigator.clipboard.writeText(createdUrl)}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(to right, #0E5566, #0066B3)" }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className={"md:w-1/2 md:border-r md:border-slate-100 flex flex-col bg-slate-50/30 " + (view === "preview" ? "hidden md:flex" : "flex")}>
              <div className="flex-1 overflow-y-auto px-8 py-10">
                {error && (
                  <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#0E5566]">2026 Lurie Children&rsquo;s and AALB Conference</div>
                  <div className="text-[11px] text-slate-400 mt-1">True Language Access: Yesterday, Today, and Tomorrow</div>
                </div>

                <ComposerStepper steps={STEPS} current={step} onJump={(s) => { const i = STEPS.findIndex(x => x.id === s); if (i <= stepIndex) setStep(s); }} />

                {step === "recipient" && (
                  <div className="space-y-5 mt-6">
                    <ComposerSection title="Recipient" subtitle="Who you are inviting. The required fields are marked.">
                      <div className="group focus-within:bg-white bg-slate-50/80 rounded-2xl p-5 transition-all border border-transparent focus-within:border-[#0066B3]/30 focus-within:shadow-sm flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 ring-1 ring-slate-200 shrink-0 flex items-center justify-center text-slate-400 text-xl font-bold">
                          {(name.trim().charAt(0) || "?").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Their full name"
                              className="flex-1 bg-transparent text-lg font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none"
                            />
                            {!name && <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="their.email@example.org"
                              className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                            />
                            {!email && <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />}
                          </div>
                          <input
                            type="text"
                            value={affiliation}
                            onChange={(e) => setAffiliation(e.target.value)}
                            placeholder="Their organisation, optional"
                            className="w-full bg-transparent text-xs text-slate-500 placeholder:text-slate-400 outline-none"
                          />
                        </div>
                      </div>
                    </ComposerSection>

                    {!isEdit && (
                      <ComposerSection title="A personal note" subtitle="Appears highlighted at the top of their email. Skip and the email is still warm.">
                        <SoftTextarea
                          value={customMessage}
                          onChange={setCustomMessage}
                          rows={3}
                          placeholder="Looking forward to having you back this year."
                        />
                      </ComposerSection>
                    )}
                  </div>
                )}

                {step === "session" && (
                  <div className="space-y-5 mt-6">
                    <ComposerSection title="Role" subtitle="What you are inviting them to do.">
                      <ChipRow value={role} setValue={setRole} options={ROLE_OPTIONS} allowCustom />
                    </ComposerSection>

                    <ComposerSection title="Length" subtitle="How long the session runs.">
                      <ChipRow value={sessionLength} setValue={setSessionLength} options={SESSION_LENGTHS} allowCustom />
                    </ComposerSection>

                    <ComposerSection title="Q and A" subtitle="Time set aside for audience questions.">
                      <ChipRow value={qaLength} setValue={setQaLength} options={QA_LENGTHS} allowCustom />
                    </ComposerSection>

                    <ComposerSection title="Day" subtitle="The conference runs August 15 and 16, 2026.">
                      <ChipRow value={preferredDay} setValue={setPreferredDay} options={PREFERRED_DAY} />
                    </ComposerSection>

                    <ComposerSection title="Track and format" subtitle="Only if they apply.">
                      <div className="space-y-3">
                        <SoftInput value={sessionTrack} onChange={setSessionTrack} placeholder="Track or theme (e.g. Medical interpreting)" />
                        <SoftInput value={sessionFormat} onChange={setSessionFormat} placeholder="Format (Workshop, panel, breakout…)" />
                      </div>
                    </ComposerSection>
                  </div>
                )}

                {step === "extras" && (
                  <div className="space-y-5 mt-6">
                    <ComposerSection title="Proposed talk details" subtitle="A starting point — the presenter can refine or replace in their portal.">
                      <div className="space-y-3">
                        <SoftInput value={talkTitle} onChange={setTalkTitle} placeholder="A draft working title" />
                        <SoftTextarea value={talkAbstract} onChange={setTalkAbstract} rows={3} placeholder="The talk in a paragraph or two…" />
                        <SoftTextarea value={learningObjectives} onChange={setLearningObjectives} rows={3} placeholder="What attendees will take away…" />
                      </div>
                    </ComposerSection>

                    <ComposerSection title="Compensation" subtitle='Leave both blank and compensation is unmentioned. They see "up to $X" for travel.'>
                      <div className="text-base leading-loose text-slate-600 font-medium">
                        Pay them{" "}
                        <span className="inline-flex items-center">
                          <span className="text-slate-400 mr-0.5">$</span>
                          <input
                            type="number"
                            min={0}
                            value={honorariumAmount}
                            onChange={(e) => setHonorariumAmount(e.target.value)}
                            placeholder="300"
                            className="bg-transparent border-b border-dashed border-slate-300 px-1 py-0.5 text-base focus:border-[#0066B3] outline-none placeholder:text-slate-400 text-[#0E5566] font-semibold"
                            style={{ width: "6ch" }}
                          />
                        </span>
                        {" "}after the event, and cover up to{" "}
                        <span className="inline-flex items-center">
                          <span className="text-slate-400 mr-0.5">$</span>
                          <input
                            type="number"
                            min={0}
                            value={travelReimbursement}
                            onChange={(e) => setTravelReimbursement(e.target.value)}
                            placeholder="200"
                            className="bg-transparent border-b border-dashed border-slate-300 px-1 py-0.5 text-base focus:border-[#0066B3] outline-none placeholder:text-slate-400 text-[#0E5566] font-semibold"
                            style={{ width: "6ch" }}
                          />
                        </span>
                        {" "}in travel receipts.
                      </div>
                    </ComposerSection>
                  </div>
                )}
              </div>
            </div>

            <div className={"flex-1 " + (view === "compose" ? "hidden md:block" : "block")}>
              <EmailPreview
                html={previewHtml}
                caption={
                  <span className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    What {firstName || "they"} will receive
                    <span className="ml-auto text-slate-400">to: {email || "email pending"}</span>
                  </span>
                }
              />
            </div>
          </div>
        )}

        {!createdUrl && (
          <div className="border-t border-slate-100 shrink-0 bg-white">
            <div className="px-7 py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {isLastStep && !isEdit ? (
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendNow}
                    onChange={(e) => setSendNow(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0066B3] focus:ring-[#0066B3]"
                  />
                  Email it now
                </label>
              ) : (
                <div className="text-xs text-slate-500">Step {stepIndex + 1} of {STEPS.length}{isEdit ? " · Updates apply immediately" : ""}</div>
              )}
              <div className="flex items-center gap-2 justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900">Cancel</button>
                {!isFirstStep && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
                  >
                    Back
                  </button>
                )}
                {!isLastStep ? (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canAdvance}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: canAdvance ? "linear-gradient(to right, #0E5566, #0066B3)" : "#94a3b8" }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: canSubmit ? "linear-gradient(to right, #0E5566, #0066B3)" : "#94a3b8" }}
                  >
                    {busy ? "Working…" : isEdit ? "Save changes" : sendNow ? (<>Send invitation <Send className="w-4 h-4" /></>) : "Save invitation"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComposerStepper({
  steps, current, onJump,
}: {
  steps: readonly { id: string; label: string }[];
  current: string;
  onJump: (id: string) => void;
}) {
  const currentIndex = steps.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const reachable = i <= currentIndex;
        return (
          <div key={s.id} className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => reachable && onJump(s.id)}
              disabled={!reachable}
              className={
                "flex items-center gap-2 min-w-0 transition-colors " +
                (reachable ? "cursor-pointer" : "cursor-not-allowed opacity-50")
              }
            >
              <span
                className={
                  "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-all " +
                  (active
                    ? "bg-[#0066B3] text-white ring-4 ring-[#0066B3]/15"
                    : done
                    ? "bg-[#0E5566] text-white"
                    : "bg-slate-100 text-slate-400")
                }
              >
                {done && !active ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span
                className={
                  "text-xs font-semibold truncate " +
                  (active ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400")
                }
              >
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && <div className={"flex-1 h-px " + (done ? "bg-[#0E5566]" : "bg-slate-200")} />}
          </div>
        );
      })}
    </div>
  );
}

function ComposerSection({
  title, subtitle, children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

function ChipRow({
  value, setValue, options, allowCustom,
}: {
  value: string;
  setValue: (v: string) => void;
  options: readonly string[];
  allowCustom?: boolean;
}) {
  const [customMode, setCustomMode] = useState(!!value && !options.includes(value));
  const [draft, setDraft] = useState(value && !options.includes(value) ? value : "");
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => { setValue(active ? "" : o); setCustomMode(false); }}
            className={
              "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all " +
              (active
                ? "bg-[#0066B3] text-white border-[#0066B3] shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50")
            }
          >
            {o}
          </button>
        );
      })}
      {allowCustom && (
        customMode ? (
          <span className="inline-flex items-center gap-1">
            <input
              autoFocus
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setValue(e.target.value); }}
              onBlur={() => { if (!draft.trim()) setCustomMode(false); }}
              placeholder="Type a custom value"
              className="px-3 py-1.5 text-sm bg-white border border-[#0066B3] rounded-lg outline-none focus:ring-2 focus:ring-[#0066B3]/15 placeholder:text-slate-400"
              style={{ width: `${Math.max((draft || "Type a custom value").length + 1, 18)}ch` }}
            />
            <button
              type="button"
              onClick={() => { setDraft(""); setValue(""); setCustomMode(false); }}
              className="text-slate-400 hover:text-rose-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setCustomMode(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700"
          >
            + Custom
          </button>
        )
      )}
    </div>
  );
}
