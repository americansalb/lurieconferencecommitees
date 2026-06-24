"use client";

import { useState } from "react";
import { X, Mail, Loader2, Check, Plus } from "lucide-react";

export default function BroadcastComposer({
  recipientIds, recipientLabel, onClose, onSent,
}: {
  recipientIds: string[];
  recipientLabel: string;
  onClose: () => void;
  onSent: (sent: number, failed: number) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCta, setShowCta] = useState(false);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!subject.trim() || !body.trim()) { setError("Add a subject and a message."); return; }
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/attendees/broadcast", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: recipientIds, subject, body, ctaUrl: showCta ? ctaUrl : undefined, ctaLabel: showCta ? ctaLabel : undefined }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Could not send."); setSending(false); return; }
      onSent(j.sent || 0, j.failed || 0);
    } catch {
      setError("Network error. Please try again.");
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5" style={{ background: "#0E5566" }} />
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 inline-flex items-center gap-2"><Mail className="w-4 h-4" /> Email attendees</h2>
            <p className="text-xs text-slate-500 mt-0.5">Sending to <strong className="text-slate-700">{recipientLabel}</strong>. Each gets a branded email, personally greeted.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3">
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="An update for the conference" className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Message</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} placeholder={"Write your update here.\n\nIt's sent with the conference header, your name, and a sign-off."} className="mt-1 w-full px-3 py-2.5 text-sm leading-relaxed border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" />
          </label>

          {showCta ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Button label (e.g. View agenda)" className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500" />
              <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://…" inputMode="url" className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500" />
            </div>
          ) : (
            <button onClick={() => setShowCta(true)} className="text-xs font-semibold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add a button (optional)</button>
          )}

          {error && <div className="text-sm text-rose-600">{error}</div>}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button onClick={send} disabled={sending} className="px-5 py-2 rounded-lg text-sm font-bold text-white shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50" style={{ background: "#0E5566" }}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Send to {recipientIds.length}
          </button>
        </div>
      </div>
    </div>
  );
}
