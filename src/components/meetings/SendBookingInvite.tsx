"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Send, AlertCircle, Check, CalendarClock, Users } from "lucide-react";

type Member = { id: string; name: string; email: string; timezone: string; hasAvailability: boolean };
type Presenter = { id: string; name: string; email: string };

// Compose and send a booking invite. Recipient can be a proposed presenter
// (picked from a list) or any manual name/email. One or more member calendars
// are pooled; the invitee books a time and gets a Zoom link.
export default function SendBookingInvite({
  presenters, onClose, onSent,
}: {
  presenters: Presenter[];
  onClose: () => void;
  onSent: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [mode, setMode] = useState<"presenter" | "manual">(presenters.length ? "presenter" : "manual");
  const [presenterId, setPresenterId] = useState<string>(presenters[0]?.id || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [duration, setDuration] = useState(30);
  const [title, setTitle] = useState("Conversation about your proposal");
  const [message, setMessage] = useState("");

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/meetings/members");
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members || []);
        }
      } finally {
        setLoadingMembers(false);
      }
    })();
  }, []);

  function toggleMember(id: string) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  const chosenPresenter = presenters.find((p) => p.id === presenterId);

  async function send() {
    const inviteeName = mode === "presenter" ? (chosenPresenter?.name || "") : name.trim();
    const inviteeEmail = mode === "presenter" ? (chosenPresenter?.email || "") : email.trim();
    if (!inviteeName || !inviteeEmail) { setResult({ ok: false, message: "Add who you're inviting." }); return; }
    if (selected.length === 0) { setResult({ ok: false, message: "Select at least one member calendar." }); return; }

    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/meetings/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteeName, inviteeEmail,
          presenterId: mode === "presenter" ? presenterId : undefined,
          memberIds: selected, durationMin: duration,
          title: title.trim() || null, message: message.trim() || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setResult({ ok: true, message: `Invite sent to ${inviteeEmail}.` });
        setTimeout(onSent, 900);
      } else {
        setResult({ ok: false, message: json.error || "Could not send the invite." });
      }
    } catch {
      setResult({ ok: false, message: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }

  const noAvailabilityWarning = members.length > 0 && !members.some((m) => m.hasAvailability);

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0E5566] to-[#0066B3] flex items-center justify-center shrink-0">
            <CalendarClock className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold text-slate-900">Send a booking invite</div>
            <div className="text-xs text-slate-500">They&rsquo;ll pick a time and get a Zoom link</div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Recipient */}
          <div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 w-fit mb-2">
              {presenters.length > 0 && (
                <Tab active={mode === "presenter"} onClick={() => setMode("presenter")}>Proposed presenter</Tab>
              )}
              <Tab active={mode === "manual"} onClick={() => setMode("manual")}>Someone else</Tab>
            </div>
            {mode === "presenter" ? (
              <select
                value={presenterId}
                onChange={(e) => setPresenterId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
              >
                {presenters.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.email}</option>)}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
                  className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.org" type="email"
                  className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none" />
              </div>
            )}
          </div>

          {/* Member calendars */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold tracking-wide uppercase text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Whose calendars to pool</span>
              {selected.length > 0 && <span className="text-[11px] text-slate-400">{selected.length} selected</span>}
            </div>
            {loadingMembers ? (
              <div className="py-4 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    disabled={!m.hasAvailability}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all ${
                      selected.includes(m.id) ? "border-[#0066B3] bg-[#0066B3]/5" : "border-slate-200 hover:border-slate-300"
                    } ${!m.hasAvailability ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${selected.includes(m.id) ? "bg-[#0066B3] border-[#0066B3]" : "border-slate-300"}`}>
                      {selected.includes(m.id) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-slate-800 truncate">{m.name}</span>
                      <span className="block text-[11px] text-slate-400">{m.hasAvailability ? m.timezone : "No availability set"}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5">Times from everyone selected are pooled; whoever is free hosts.</p>
          </div>

          {/* Duration + title */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold tracking-wide uppercase text-slate-500">Length</span>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none">
                {[15, 30, 45, 60].map((d) => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold tracking-wide uppercase text-slate-500">Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none" />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-500">Personal note <span className="font-medium normal-case tracking-normal text-slate-400">optional</span></span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="A line or two shown on the booking page."
              className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none resize-none" />
          </label>

          {noAvailabilityWarning && (
            <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              No one has set availability yet. Set yours under &ldquo;My availability&rdquo; first.
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4 flex items-center gap-3">
          {result && (
            <div className={`flex items-center gap-1.5 text-sm font-medium ${result.ok ? "text-emerald-600" : "text-rose-600"}`}>
              {result.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} <span>{result.message}</span>
            </div>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={send} disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send invite
          </button>
        </div>
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
      {children}
    </button>
  );
}
