"use client";

import { useMemo, useState } from "react";
import {
  X, ChevronRight, ChevronLeft, Search, Check, Loader2, Clock, UserPlus,
} from "lucide-react";
import {
  CONFERENCE_DAYS, SESSION_KINDS, DURATION_PRESETS, kindMeta,
  chicagoInstant, addMinutesIso, formatTime, formatDuration,
  dayIdOf, toTimeInput, durationMinutes, parseLengthToMinutes,
} from "@/lib/schedule";

export type SchedulePresenter = {
  id: string;
  name: string;
  talkTitle: string | null;
  sessionLength: string | null;
  status: string;
  jobTitle?: string | null;
  affiliation?: string | null;
};

export type ScheduleSessionLite = {
  id: string;
  title: string;
  kind: string;
  description: string | null;
  presenterName: string | null;
  presenterId: string | null;
  presenterIds?: string[];
  startTime: string;
  endTime: string;
};

// A presenter on a session, either linked to a presenter record (id set) or a
// free-typed guest name (id null).
type Chip = { id: string | null; name: string };

export default function SessionComposer({
  onClose, onSaved, presenters, existing, defaultDayId, defaultStartHHMM,
}: {
  onClose: () => void;
  onSaved: () => void;
  presenters: SchedulePresenter[];
  existing?: ScheduleSessionLite;
  defaultDayId?: string;
  defaultStartHHMM?: string;
}) {
  const isEdit = !!existing;
  const [step, setStep] = useState<"details" | "time">("details");

  const [kind, setKind] = useState(existing?.kind || "session");
  const [title, setTitle] = useState(existing?.title || "");
  const [chips, setChips] = useState<Chip[]>(() => {
    if (!existing) return [];
    const ids = existing.presenterIds?.length ? existing.presenterIds : (existing.presenterId ? [existing.presenterId] : []);
    const out: Chip[] = [];
    for (const id of ids) {
      const p = presenters.find((pp) => pp.id === id);
      if (p) out.push({ id, name: p.name });
    }
    for (const n of (existing.presenterName || "").split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean)) {
      if (out.some((c) => c.name.toLowerCase() === n.toLowerCase())) continue;
      const p = presenters.find((pp) => pp.name.toLowerCase() === n.toLowerCase());
      out.push({ id: p?.id || null, name: n });
    }
    return out;
  });
  const [description, setDescription] = useState(existing?.description || "");

  const [dayId, setDayId] = useState(existing ? dayIdOf(existing.startTime) : (defaultDayId || CONFERENCE_DAYS[0].id));
  const [startHHMM, setStartHHMM] = useState(existing ? toTimeInput(existing.startTime) : (defaultStartHHMM || "09:30"));
  const [duration, setDuration] = useState(existing ? durationMinutes(existing.startTime, existing.endTime) : 60);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startIso = chicagoInstant(dayId, startHHMM);
  const endIso = addMinutesIso(startIso, duration);

  const sortedPresenters = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    return [...presenters]
      .filter((p) => (q ? (p.name + " " + (p.talkTitle || "")).toLowerCase().includes(q) : true))
      .sort((a, b) => (a.status === "confirmed" ? -1 : 0) - (b.status === "confirmed" ? -1 : 0))
      .slice(0, 30);
  }, [presenters, pickerQuery]);

  function addPresenter(p: SchedulePresenter) {
    if (chips.some((c) => c.id === p.id || c.name.toLowerCase() === p.name.toLowerCase())) return;
    const first = chips.length === 0;
    setChips((cur) => [...cur, { id: p.id, name: p.name }]);
    if (first) {
      if (!title.trim() && p.talkTitle) setTitle(p.talkTitle);
      const mins = parseLengthToMinutes(p.sessionLength);
      if (mins && !isEdit) setDuration(mins);
    }
    setPickerQuery("");
  }
  function addManualName(raw: string) {
    const name = raw.trim();
    if (!name) return;
    if (!chips.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setChips((cur) => [...cur, { id: null, name }]);
    }
    setPickerQuery("");
  }
  function removeChip(idx: number) {
    setChips((cur) => cur.filter((_, i) => i !== idx));
  }

  async function save() {
    setError(null);
    if (!title.trim()) { setStep("details"); setError("Give the session a title."); return; }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(), kind, description: description.trim() || null,
        presenterName: chips.map((c) => c.name).join(", ") || null,
        presenterId: chips.find((c) => c.id)?.id || null,
        presenterIds: chips.filter((c) => c.id).map((c) => c.id),
        startTime: startIso, endTime: endIso,
      };
      const res = await fetch(isEdit ? `/api/schedule/${existing!.id}` : "/api/schedule", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const meta = kindMeta(kind);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 speaker-overlay-in" onClick={onClose}>
      <div
        className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden speaker-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full shrink-0" style={{ background: meta.accent }} />

        {/* Header + stepper */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <div className="flex-1">
            <div className="text-sm font-extrabold text-slate-900">{isEdit ? "Edit session" : "Add a session"}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Step {step === "details" ? "1" : "2"} of 2, {step === "details" ? "Details" : "Time"}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <StepDot active={step === "details"} done={step === "time"} />
            <StepDot active={step === "time"} done={false} />
          </div>
          <button onClick={onClose} className="ml-1 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1">
          {step === "details" ? (
            <div className="space-y-5">
              {/* Kind */}
              <div>
                <Label>Type</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SESSION_KINDS.map((k) => {
                    const on = kind === k.id;
                    return (
                      <button
                        key={k.id} type="button" onClick={() => setKind(k.id)}
                        className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all"
                        style={on
                          ? { background: k.soft, color: k.accent, borderColor: k.accent }
                          : { background: "#fff", color: "#64748b", borderColor: "#e2e8f0" }}
                      >
                        {k.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <Label>Title</Label>
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Promoting Health Equity Through Language Access"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
                />
              </div>

              {/* Presenter(s), multi-select */}
              <div>
                <Label>Presenter(s) <span className="font-normal text-slate-400">(optional)</span></Label>

                {chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {chips.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[#0E5566]/[0.07] border border-[#0E5566]/15 text-[12.5px] font-semibold text-[#0E5566]">
                        <span className={"w-1.5 h-1.5 rounded-full " + (c.id ? "bg-emerald-500" : "bg-slate-300")} title={c.id ? "Linked to a presenter" : "Typed name"} />
                        {c.name}
                        <button type="button" onClick={() => removeChip(i)} className="ml-0.5 w-4 h-4 inline-flex items-center justify-center rounded-full text-[#0E5566]/60 hover:bg-[#0E5566]/15 hover:text-[#0E5566]">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {!pickerOpen ? (
                  <button
                    type="button" onClick={() => setPickerOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#0E5566] bg-[#0E5566]/[0.05] border border-dashed border-[#0E5566]/25 hover:bg-[#0E5566]/[0.08]"
                  >
                    <UserPlus className="w-4 h-4" /> {chips.length ? "Add another presenter" : "Add presenter(s)"}
                  </button>
                ) : (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        autoFocus value={pickerQuery}
                        onChange={(e) => setPickerQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && pickerQuery.trim()) { e.preventDefault(); addManualName(pickerQuery); } }}
                        placeholder="Search the list, or type a name…"
                        className="flex-1 text-sm outline-none bg-transparent"
                      />
                      <button type="button" onClick={() => { setPickerOpen(false); setPickerQuery(""); }} className="text-xs font-semibold text-slate-400 hover:text-slate-700">Done</button>
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
                      {sortedPresenters.map((p) => {
                        const added = chips.some((c) => c.id === p.id);
                        return (
                          <button
                            key={p.id} type="button" onClick={() => (added ? removeChip(chips.findIndex((c) => c.id === p.id)) : addPresenter(p))}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2.5"
                          >
                            <span className={"w-4 h-4 shrink-0 rounded border flex items-center justify-center " + (added ? "bg-[#0E5566] border-[#0E5566]" : "border-slate-300")}>
                              {added && <Check className="w-3 h-3 text-white" />}
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="text-[13px] font-semibold text-slate-800 truncate">{p.name}</span>
                                {p.status === "confirmed" && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1">Confirmed</span>}
                              </span>
                              {p.talkTitle && <span className="block text-[12px] text-slate-500 truncate">{p.talkTitle}</span>}
                            </span>
                          </button>
                        );
                      })}
                      {pickerQuery.trim() && !presenters.some((p) => p.name.toLowerCase() === pickerQuery.trim().toLowerCase()) && (
                        <button type="button" onClick={() => addManualName(pickerQuery)} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 text-[#0E5566]">
                          <UserPlus className="w-4 h-4 shrink-0" />
                          <span className="text-[13px] font-semibold">Add “{pickerQuery.trim()}” as a guest name</span>
                        </button>
                      )}
                      {sortedPresenters.length === 0 && !pickerQuery.trim() && (
                        <div className="px-3 py-6 text-center text-xs text-slate-400">Type a name to add a presenter.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Day */}
              <div>
                <Label>Day</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONFERENCE_DAYS.map((d) => {
                    const on = dayId === d.id;
                    return (
                      <button
                        key={d.id} type="button" onClick={() => setDayId(d.id)}
                        className={"text-left px-4 py-3 rounded-xl border transition-all " + (on ? "border-[#0066B3] bg-[#0066B3]/[0.04] ring-1 ring-[#0066B3]/20" : "border-slate-200 hover:bg-slate-50")}
                      >
                        <div className="text-[13px] font-bold text-slate-800">{d.label}</div>
                        <div className="text-[11px] text-slate-400">{fmtRange(d.start, d.end)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start + duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Starts</Label>
                  <input
                    type="time" value={startHHMM} onChange={(e) => setStartHHMM(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
                  />
                </div>
                <div>
                  <Label>Length</Label>
                  <input
                    type="number" min={5} step={5} value={duration}
                    onChange={(e) => setDuration(Math.max(5, Number(e.target.value) || 5))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 -mt-2">
                {DURATION_PRESETS.map((m) => (
                  <button
                    key={m} type="button" onClick={() => setDuration(m)}
                    className={"px-2.5 py-1 rounded-lg text-[12px] font-semibold border transition-colors " + (duration === m ? "bg-[#0E5566] text-white border-[#0E5566]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}
                  >
                    {formatDuration(m)}
                  </button>
                ))}
              </div>

              {/* Live preview */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#0E5566]" />
                <span className="text-sm font-bold text-slate-800">{formatTime(startIso)} – {formatTime(endIso)}</span>
                <span className="text-xs text-slate-400">· {formatDuration(duration)}</span>
              </div>

              {/* Description */}
              <div>
                <Label>Description / notes <span className="font-normal text-slate-400">(optional)</span></Label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  placeholder="Anything shown alongside the session…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none resize-none"
                />
              </div>
            </div>
          )}

          {error && <div className="mt-4 text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          {step === "time" ? (
            <button onClick={() => setStep("details")} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <span />}

          {step === "details" ? (
            <button
              onClick={() => { if (!title.trim()) { setError("Give the session a title."); return; } setError(null); setStep("time"); }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={save} disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {isEdit ? "Save changes" : "Add to schedule"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold tracking-wide uppercase text-slate-500 mb-2">{children}</div>;
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return <span className={"w-6 h-1.5 rounded-full transition-colors " + (active ? "bg-[#0E5566]" : done ? "bg-[#0E5566]/40" : "bg-slate-200")} />;
}

function fmtRange(start: string, end: string): string {
  const f = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  return `${f(start)} – ${f(end)}`;
}
