"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Check, Clock, CalendarOff, CalendarPlus } from "lucide-react";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Rule = { id?: string; weekday: number; startMin: number; endMin: number };
type Exception = { id: string; kind: "add" | "block"; startAt: string; endAt: string; note: string | null };

function minToTime(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

// A team member's availability: weekly recurring rules plus one-off
// add/block exceptions. Saves the weekly grid as a set; exceptions are
// individual add/delete.
export default function AvailabilityEditor() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [tz, setTz] = useState("America/Chicago");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meetings/availability");
      if (res.ok) {
        const d = await res.json();
        setRules(d.rules || []);
        setExceptions(d.exceptions || []);
        setTz(d.timezone || "America/Chicago");
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  function addRule(weekday: number) {
    setRules((r) => [...r, { weekday, startMin: 540, endMin: 720 }]);
    setSaved(false);
  }
  function updateRule(idx: number, patch: Partial<Rule>) {
    setRules((r) => r.map((rule, i) => i === idx ? { ...rule, ...patch } : rule));
    setSaved(false);
  }
  function removeRule(idx: number) {
    setRules((r) => r.filter((_, i) => i !== idx));
    setSaved(false);
  }

  async function saveRules() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/meetings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: rules.map((r) => ({ weekday: r.weekday, startMin: r.startMin, endMin: r.endMin })) }),
      });
      if (res.ok) { setSaved(true); await load(); }
    } finally {
      setSaving(false);
    }
  }

  const byDay = WEEKDAYS.map((_, wd) => rules.map((r, i) => ({ ...r, _i: i })).filter((r) => r.weekday === wd));

  return (
    <div className="space-y-6">
      {/* Weekly hours */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#0E5566]" /> Weekly hours</h3>
            <p className="text-xs text-slate-400 mt-0.5">Recurring times you&rsquo;re open, in your timezone ({tz.replace(/_/g, " ")}).</p>
          </div>
          <button onClick={saveRules} disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] shadow-sm disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
            {saved ? "Saved" : "Save hours"}
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-2">
            {WEEKDAYS.map((day, wd) => (
              <div key={wd} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-24 text-sm font-semibold text-slate-700 pt-1.5 shrink-0">{day}</div>
                <div className="flex-1 space-y-1.5">
                  {byDay[wd].length === 0 ? (
                    <span className="text-xs text-slate-300 italic pt-1.5 inline-block">Unavailable</span>
                  ) : byDay[wd].map((r) => (
                    <div key={r._i} className="flex items-center gap-2">
                      <input type="time" value={minToTime(r.startMin)} onChange={(e) => updateRule(r._i, { startMin: timeToMin(e.target.value) })}
                        className="px-2 py-1 text-sm border border-slate-200 rounded-md outline-none focus:border-[#0066B3]" />
                      <span className="text-slate-400 text-sm">–</span>
                      <input type="time" value={minToTime(r.endMin)} onChange={(e) => updateRule(r._i, { endMin: timeToMin(e.target.value) })}
                        className="px-2 py-1 text-sm border border-slate-200 rounded-md outline-none focus:border-[#0066B3]" />
                      <button onClick={() => removeRule(r._i)} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addRule(wd)} className="p-1.5 text-slate-400 hover:text-[#0E5566] shrink-0" title={`Add hours on ${day}`}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* One-off exceptions */}
      <ExceptionsSection exceptions={exceptions} onChange={load} />
    </div>
  );
}

function ExceptionsSection({ exceptions, onChange }: { exceptions: Exception[]; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<"block" | "add">("block");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!date) return;
    setBusy(true);
    try {
      const startAt = new Date(`${date}T${start}:00`);
      const endAt = new Date(`${date}T${end}:00`);
      const res = await fetch("/api/meetings/availability/exception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, startAt: startAt.toISOString(), endAt: endAt.toISOString() }),
      });
      if (res.ok) { setAdding(false); setDate(""); onChange(); }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch("/api/meetings/availability/exception", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    onChange();
  }

  function fmt(iso: string) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
  }

  return (
    <div className="pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Specific dates</h3>
          <p className="text-xs text-slate-400 mt-0.5">Add a one-off opening or block a date.</p>
        </div>
        <button onClick={() => setAdding((a) => !a)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0E5566] border border-slate-200 hover:bg-slate-50">
          <Plus className="w-3.5 h-3.5" /> Add date
        </button>
      </div>

      {adding && (
        <div className="rounded-xl border border-slate-200 p-3 mb-3 bg-slate-50/50">
          <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 w-fit mb-3 border border-slate-200">
            <button onClick={() => setKind("block")} className={`px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 ${kind === "block" ? "bg-rose-50 text-rose-600" : "text-slate-500"}`}><CalendarOff className="w-3.5 h-3.5" /> Block off</button>
            <button onClick={() => setKind("add")} className={`px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 ${kind === "add" ? "bg-emerald-50 text-emerald-600" : "text-slate-500"}`}><CalendarPlus className="w-3.5 h-3.5" /> Extra opening</button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-2 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-[#0066B3]" />
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="px-2 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-[#0066B3]" />
            <span className="text-slate-400 text-sm">–</span>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="px-2 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-[#0066B3]" />
            <button onClick={submit} disabled={busy || !date} className="px-3 py-1.5 rounded-md text-xs font-bold text-white bg-[#0E5566] disabled:opacity-50 inline-flex items-center gap-1">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save
            </button>
          </div>
        </div>
      )}

      {exceptions.length === 0 ? (
        <p className="text-xs text-slate-300 italic">No specific-date overrides.</p>
      ) : (
        <div className="space-y-1.5">
          {exceptions.map((ex) => (
            <div key={ex.id} className="flex items-center gap-2 text-sm">
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${ex.kind === "add" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                {ex.kind === "add" ? "Open" : "Block"}
              </span>
              <span className="text-slate-600">{fmt(ex.startAt)} – {fmt(ex.endAt)}</span>
              <button onClick={() => remove(ex.id)} className="p-1 text-slate-300 hover:text-rose-500 ml-auto"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
