"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Pause, Play, Rocket, Zap, Check } from "lucide-react";

type Policy = {
  maxPerHour: number; maxPerDay: number;
  minGapSeconds: number; maxGapSeconds: number;
  sendStartHour: number; sendEndHour: number;
  sendDays: number[]; sendTimezone: string;
};
type Status = {
  counts: Record<string, number>;
  nextScheduledFor: string | null;
  sentLast24h: number;
  sentLastHour?: number;
  policy: Policy;
  paused: boolean;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function QueueSettingsModal({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [perHour, setPerHour] = useState(10);
  const [perDay, setPerDay] = useState(60);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sendN, setSendN] = useState(10);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const r = await fetch("/api/admin/email-queue");
    if (!r.ok) return;
    const s: Status = await r.json();
    setStatus(s);
    setPerHour(s.policy.maxPerHour); setPerDay(s.policy.maxPerDay);
    setStartHour(s.policy.sendStartHour); setEndHour(s.policy.sendEndHour);
    setDays(s.policy.sendDays);
  }
  useEffect(() => { refresh(); }, []);

  async function patch(body: Record<string, unknown>, label: string) {
    setBusy(label); setMsg(null);
    try {
      await fetch("/api/admin/email-queue", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      await refresh(); onChanged?.();
    } finally { setBusy(null); }
  }
  async function saveSettings() {
    await patch({ policy: { maxPerHour: perHour, maxPerDay: perDay, sendStartHour: startHour, sendEndHour: endHour, sendDays: days } }, "save");
    setMsg("Settings saved.");
  }
  async function flush(limit: number, label: string) {
    setBusy(label); setMsg(null);
    try {
      const r = await fetch("/api/admin/email-queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force: true, limit }) });
      const j = await r.json();
      setMsg(`Released ${j.sent ?? 0} now${j.failed ? `, ${j.failed} failed` : ""}.`);
      await refresh(); onChanged?.();
    } finally { setBusy(null); }
  }

  const pending = status?.counts.pending || 0;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-3 z-10">
          <div className="flex-1">
            <div className="text-sm font-extrabold text-slate-900">Sending queue</div>
            <div className="text-xs text-slate-500">Throttle how fast invites go out, or release a batch now.</div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
        </div>

        {!status ? (
          <div className="p-12 text-center text-slate-400 text-sm"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={"w-2.5 h-2.5 rounded-full shrink-0 " + (status.paused ? "bg-amber-400" : "bg-emerald-500")} />
                <div className="text-sm min-w-0">
                  <div className="font-bold text-slate-900">{pending} queued{status.paused ? " · paused" : ""}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {status.sentLastHour ?? 0} sent in last hr · {status.sentLast24h} in 24h
                    {status.nextScheduledFor && !status.paused ? ` · next ${new Date(status.nextScheduledFor).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}
                  </div>
                </div>
              </div>
              <button onClick={() => patch({ paused: !status.paused }, "pause")} disabled={busy === "pause"} className={"shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border disabled:opacity-50 " + (status.paused ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                {status.paused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
              </button>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Release rate</div>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Emails per hour" value={perHour} onChange={setPerHour} />
                <NumField label="Emails per day" value={perDay} onChange={setPerDay} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">The background sender releases up to this many. Lower it for a gentle trickle; raise it to drain the queue faster.</p>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Sending window <span className="font-normal normal-case text-slate-400">({status.policy.sendTimezone})</span></div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">From</span>
                <HourSelect value={startHour} onChange={setStartHour} />
                <span className="text-slate-500">to</span>
                <HourSelect value={endHour} onChange={setEndHour} />
              </div>
              <div className="flex gap-1.5 mt-2.5">
                {DAY_LABELS.map((d, i) => {
                  const on = days.includes(i);
                  return (
                    <button key={i} type="button" onClick={() => setDays(on ? days.filter((x) => x !== i) : [...days, i].sort())}
                      className={"w-8 h-8 rounded-lg text-xs font-bold border transition-colors " + (on ? "bg-[#0E5566] text-white border-[#0E5566]" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50")}>
                      {d}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">New batches are scheduled only inside this window.</p>
            </div>

            <div className="flex items-center justify-end">
              <button onClick={saveSettings} disabled={busy === "save"} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] disabled:opacity-50 inline-flex items-center gap-1.5">
                {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save settings
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Release now <span className="font-normal normal-case text-slate-400">· skips the schedule &amp; rate limit</span></div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-lg border border-slate-200 overflow-hidden">
                  <input type="number" min={1} max={200} value={sendN} onChange={(e) => setSendN(Math.max(1, Math.min(200, parseInt(e.target.value || "1", 10))))} className="w-16 px-2 py-1.5 text-sm outline-none" />
                  <button onClick={() => flush(sendN, "n")} disabled={busy === "n" || pending === 0} className="px-3 py-1.5 text-xs font-bold bg-teal-50 text-teal-700 border-l border-slate-200 hover:bg-teal-100 disabled:opacity-50 inline-flex items-center gap-1.5">
                    {busy === "n" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Send next
                  </button>
                </div>
                <button onClick={() => flush(200, "all")} disabled={busy === "all" || pending === 0} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 inline-flex items-center gap-1.5">
                  {busy === "all" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />} Send all{pending > 0 ? ` (${pending > 200 ? "200+" : pending})` : ""}
                </button>
              </div>
            </div>

            {msg && <div className="text-xs font-semibold text-teal-700">{msg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <input type="number" min={1} value={value} onChange={(e) => onChange(Math.max(1, parseInt(e.target.value || "1", 10)))}
        className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" />
    </label>
  );
}

function HourSelect({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg outline-none bg-white">
      {Array.from({ length: 25 }).map((_, h) => <option key={h} value={h}>{fmtHour(h)}</option>)}
    </select>
  );
}
function fmtHour(h: number) {
  if (h === 0 || h === 24) return "12 AM";
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ap}`;
}
