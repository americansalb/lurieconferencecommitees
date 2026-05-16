"use client";

import { useMemo, useState } from "react";
import { X, Check, Copy, FileText, DollarSign, MessageSquare, Send, AlertCircle, Mail } from "lucide-react";
import {
  ROLE_OPTIONS, SESSION_LENGTHS, QA_LENGTHS, PREFERRED_DAY,
} from "@/lib/presenters";
import { presenterInviteEmail } from "@/lib/mail-templates";
import { parseResponse } from "@/lib/api";
import {
  InlineTextSlot, InlineChip, OptionalBlock,
  SoftInput, SoftTextarea, Money, EmailPreview,
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

  const [openTalk, setOpenTalk] = useState(!!(existing?.talkTitle || existing?.talkAbstract || existing?.learningObjectives));
  const [openComp, setOpenComp] = useState(!!(existing?.honorariumAmount || existing?.travelReimbursement));
  const [openNote, setOpenNote] = useState(false);
  const [openTrack, setOpenTrack] = useState(!!existing?.sessionTrack);
  const [openFormat, setOpenFormat] = useState(!!existing?.sessionFormat);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [view, setView] = useState<"compose" | "preview">("compose");

  const canSubmit = !!(name.trim() && email.trim()) && !busy;

  const previewHtml = useMemo(() => {
    return presenterInviteEmail({
      name: name || "Your presenter",
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
        name, email, affiliation: affiliation || null,
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

  const firstName = (name || "your presenter").split(" ")[0];
  const article = role ? (/^[aeiou]/i.test(role) ? "an" : "a") : "a";

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
                {sendNow ? `Invitation sent to ${firstName}` : "Presenter saved"}
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

                <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100">
                  <div className="h-1 w-full" style={{ background: "linear-gradient(to right, #0E5566, #0066B3)" }} />
                  <div className="px-7 py-8 space-y-5">
                    <div>
                      <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#0E5566]">2026 Lurie Children&rsquo;s and AALB Conference</div>
                      <div className="text-[11px] text-slate-400 mt-1">True Language Access: Yesterday, Today, and Tomorrow</div>
                    </div>

                    <div className="pt-3">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-slate-400 text-base">To</span>
                        <InlineTextSlot value={name} setValue={setName} placeholder="Their name" size="lg" required />
                        <span className="text-slate-300 text-lg">·</span>
                        <InlineTextSlot value={email} setValue={setEmail} placeholder="email@example.org" type="email" required />
                      </div>
                      <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-slate-400 text-sm">From</span>
                        <InlineTextSlot value={affiliation} setValue={setAffiliation} placeholder="Their affiliation" size="sm" />
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="text-[15px] leading-loose text-slate-700">
                      Hello <span className="font-semibold text-slate-900">{firstName}</span>,
                      we would love to have you with us. We are inviting you as
                      {" "}{article}{" "}
                      <InlineChip
                        value={role}
                        setValue={setRole}
                        options={ROLE_OPTIONS}
                        emptyLabel="pick a role"
                        tone={role ? "neutral" : "warn"}
                      />
                      {(sessionLength || sessionFormat || !role) && (
                        <>
                          {" "}for{" "}
                          <InlineChip
                            value={sessionLength}
                            setValue={setSessionLength}
                            options={SESSION_LENGTHS}
                            emptyLabel="choose length"
                          />
                        </>
                      )}
                      {(qaLength || preferredDay) ? (
                        <>
                          {qaLength && (
                            <>
                              {" "}with{" "}
                              <InlineChip
                                value={qaLength}
                                setValue={setQaLength}
                                options={QA_LENGTHS}
                                emptyLabel="Q & A"
                              />
                              {" "}for Q and A
                            </>
                          )}
                          {preferredDay && (
                            <>
                              {" "}on{" "}
                              <InlineChip
                                value={preferredDay}
                                setValue={setPreferredDay}
                                options={PREFERRED_DAY}
                                emptyLabel="day"
                                allowCustom={false}
                              />
                            </>
                          )}
                          .
                        </>
                      ) : (
                        <>
                          .{" "}
                          <span className="inline-flex items-center gap-2 text-xs">
                            {!qaLength && (
                              <button type="button" onClick={() => setQaLength("10 minutes")} className="text-slate-400 hover:text-[#0066B3] underline decoration-dotted">
                                add Q & A
                              </button>
                            )}
                            {!preferredDay && (
                              <button type="button" onClick={() => setPreferredDay("Day 1, August 15")} className="text-slate-400 hover:text-[#0066B3] underline decoration-dotted">
                                pick a day
                              </button>
                            )}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {!openTrack && (
                        <button type="button" onClick={() => setOpenTrack(true)} className="text-xs font-medium text-slate-400 hover:text-[#0066B3] underline decoration-dotted">
                          + Add a track
                        </button>
                      )}
                      {!openFormat && (
                        <button type="button" onClick={() => setOpenFormat(true)} className="text-xs font-medium text-slate-400 hover:text-[#0066B3] underline decoration-dotted">
                          + Specify a format
                        </button>
                      )}
                    </div>

                    {(openTrack || openFormat) && (
                      <div className="text-base leading-loose text-slate-600 font-medium pt-1">
                        {openTrack && (
                          <span className="inline-flex items-center gap-1">
                            Track:{" "}
                            <SoftInput value={sessionTrack} onChange={setSessionTrack} placeholder="e.g. Medical interpreting" />
                            <button type="button" onClick={() => { setSessionTrack(""); setOpenTrack(false); }} className="text-slate-400 hover:text-rose-600 ml-1">
                              <X className="w-3.5 h-3.5" />
                            </button>
                            {openFormat && <span className="mx-2 text-slate-300">·</span>}
                          </span>
                        )}
                        {openFormat && (
                          <span className="inline-flex items-center gap-1">
                            Format:{" "}
                            <SoftInput value={sessionFormat} onChange={setSessionFormat} placeholder="Workshop, panel, breakout…" />
                            <button type="button" onClick={() => { setSessionFormat(""); setOpenFormat(false); }} className="text-slate-400 hover:text-rose-600 ml-1">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {!isEdit && (
                    <OptionalBlock
                      title="Add a personal note"
                      isOpen={openNote}
                      onOpen={() => setOpenNote(true)}
                      onRemove={() => { setOpenNote(false); setCustomMessage(""); }}
                      icon={MessageSquare}
                    >
                      <SoftTextarea
                        value={customMessage}
                        onChange={setCustomMessage}
                        rows={3}
                        placeholder="Looking forward to having you back this year."
                      />
                      <p className="text-[11px] text-slate-400">Appears highlighted at the top of their email.</p>
                    </OptionalBlock>
                  )}

                  <OptionalBlock
                    title="Propose talk details"
                    isOpen={openTalk}
                    onOpen={() => setOpenTalk(true)}
                    onRemove={() => { setOpenTalk(false); setTalkTitle(""); setTalkAbstract(""); setLearningObjectives(""); }}
                    icon={FileText}
                  >
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-slate-500 shrink-0">A draft title —</span>
                        <input
                          type="text"
                          value={talkTitle}
                          onChange={(e) => setTalkTitle(e.target.value)}
                          placeholder="they can refine it in their portal"
                          className="flex-1 bg-transparent border-b border-dashed border-slate-300 px-1 py-1 text-sm focus:border-[#0066B3] outline-none placeholder:text-slate-400"
                        />
                      </div>
                      <textarea
                        value={talkAbstract}
                        onChange={(e) => setTalkAbstract(e.target.value)}
                        rows={3}
                        placeholder="The talk in a paragraph or two…"
                        className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 outline-none transition-all placeholder:text-slate-400"
                      />
                      <textarea
                        value={learningObjectives}
                        onChange={(e) => setLearningObjectives(e.target.value)}
                        rows={3}
                        placeholder="What attendees will take away…"
                        className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </OptionalBlock>

                  <OptionalBlock
                    title="Add compensation"
                    isOpen={openComp}
                    onOpen={() => setOpenComp(true)}
                    onRemove={() => { setOpenComp(false); setHonorariumAmount(""); setTravelReimbursement(""); }}
                    icon={DollarSign}
                  >
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
                    <p className="text-[11px] text-slate-400 mt-2">They see &ldquo;up to $X&rdquo; for travel. Receipts required.</p>
                  </OptionalBlock>
                </div>
              </div>
            </div>

            <div className={"flex-1 " + (view === "compose" ? "hidden md:block" : "block")}>
              <EmailPreview
                html={previewHtml}
                caption={
                  <span className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    What {firstName} will receive
                    <span className="ml-auto text-slate-400">to: {email || "email pending"}</span>
                  </span>
                }
              />
            </div>
          </div>
        )}

        {!createdUrl && (
          <div className="border-t border-slate-100 shrink-0 bg-white">
            {!role && (
              <div className="px-7 pt-3 text-xs text-amber-700 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Without a role, the email will not mention what you are inviting them as.</span>
              </div>
            )}
            <div className="px-7 py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {!isEdit ? (
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
                <div className="text-xs text-slate-500">Updates apply immediately.</div>
              )}
              <div className="flex items-center gap-2 justify-end">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900">Cancel</button>
                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: canSubmit ? "linear-gradient(to right, #0E5566, #0066B3)" : "#94a3b8" }}
                >
                  {busy ? "Working…" : isEdit ? "Save changes" : sendNow ? (<>Send invitation <Send className="w-4 h-4" /></>) : "Save invitation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
