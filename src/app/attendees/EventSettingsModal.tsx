"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Check, Video } from "lucide-react";

export default function EventSettingsModal({ onClose }: { onClose: () => void }) {
  const [joinUrl, setJoinUrl] = useState("");
  const [agendaUrl, setAgendaUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/event-settings").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d) { setJoinUrl(d.joinUrl || ""); setAgendaUrl(d.agendaUrl || "/schedule"); }
    }).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true); setSaved(false);
    try {
      await fetch("/api/admin/event-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ joinUrl, agendaUrl }) });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5" style={{ background: "#0E5566" }} />
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 inline-flex items-center gap-2"><Video className="w-4 h-4" /> Attendee portal</h2>
            <p className="text-xs text-slate-500 mt-0.5">Shown to paid attendees on their portal page.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        {loading ? (
          <div className="p-10 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <div className="p-5 space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Live join link (virtual attendees)</span>
              <input value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://zoom.us/j/…" inputMode="url" className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" />
              <span className="text-[11px] text-slate-400">Leave blank until you have it; the portal then says it&rsquo;ll be emailed before the event.</span>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Agenda link</span>
              <input value={agendaUrl} onChange={(e) => setAgendaUrl(e.target.value)} placeholder="/schedule" className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" />
            </label>
          </div>
        )}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-bold text-white shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50" style={{ background: "#0E5566" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}{saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
