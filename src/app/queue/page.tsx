"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Mail, RefreshCw, Pause, Play, Shuffle, SlidersHorizontal, Loader2, Send, X, Award, Ticket, FlaskConical,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import QueueSettingsModal from "@/components/email/QueueSettingsModal";

type PendingItem = {
  id: string;
  to: string;
  subject: string;
  scheduledFor: string | null;
  recipientType: string;
  recipientId: string | null;
  attempts: number;
};

type QueueData = {
  counts: Record<string, number>;
  nextScheduledFor: string | null;
  sentLast24h: number;
  sentLastHour: number;
  policy: { maxPerHour: number; maxPerDay: number; minGapSeconds: number; maxGapSeconds: number; sendStartHour: number; sendEndHour: number; sendTimezone: string };
  paused: boolean;
  pending: PendingItem[];
};

const TYPE_META: Record<string, { label: string; cls: string; Icon: typeof Award }> = {
  sponsor: { label: "Sponsor", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Award },
  attendee: { label: "Attendee", cls: "bg-teal-50 text-teal-700 border-teal-200", Icon: Ticket },
  test: { label: "Test", cls: "bg-slate-100 text-slate-600 border-slate-200", Icon: FlaskConical },
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function EmailQueuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showSettings, setShowSettings] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "admin" || role === "developer";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/email-queue");
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  // While items are pending, refresh quietly; each GET also nudges the server to
  // drain anything now due.
  const pendingCount = data?.counts?.pending || 0;
  useEffect(() => {
    if (status !== "authenticated" || pendingCount <= 0) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [status, pendingCount, load]);

  function flash(msg: string) {
    setNote(msg);
    setTimeout(() => setNote(null), 8000);
  }

  async function togglePause() {
    if (!data) return;
    await fetch("/api/admin/email-queue", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paused: !data.paused }) });
    load();
  }

  async function shuffleAll() {
    setBusy("shuffle");
    try {
      const r = await fetch("/api/admin/email-queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "shuffle" }) });
      const j = await r.json().catch(() => ({}));
      flash(r.ok ? `Shuffled ${j.shuffled || 0} across the whole queue. Sponsors and attendees are now interleaved.` : (j.error || "Could not shuffle."));
    } finally {
      setBusy(null);
      load();
    }
  }

  async function refreshTemplates() {
    setBusy("refresh");
    try {
      const [a, s] = await Promise.all([
        fetch("/api/attendees/refresh-queue", { method: "POST" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/sponsors/refresh-queue", { method: "POST" }).then((r) => r.json()).catch(() => ({})),
      ]);
      flash(`Re-rendered ${(a.refreshed || 0)} attendee and ${(s.refreshed || 0)} sponsor invite${(a.refreshed || 0) + (s.refreshed || 0) === 1 ? "" : "s"} to the latest templates.`);
    } finally {
      setBusy(null);
      load();
    }
  }

  async function sendOne(id: string) {
    setRowBusy(id);
    try {
      await fetch("/api/admin/email-queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) });
    } finally {
      setRowBusy(null);
      load();
    }
  }

  async function cancelOne(id: string) {
    setRowBusy(id);
    try {
      await fetch("/api/admin/email-queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel", ids: [id] }) });
    } finally {
      setRowBusy(null);
      load();
    }
  }

  if (status === "loading" || (loading && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading queue…</div>
      </div>
    );
  }

  const pending = data?.pending || [];
  const typeCounts = pending.reduce<Record<string, number>>((acc, p) => ((acc[p.recipientType] = (acc[p.recipientType] || 0) + 1), acc), {});
  const shown = typeFilter === "all" ? pending : pending.filter((p) => p.recipientType === typeFilter);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Email Queue</h1>
                <p className="text-sm text-slate-500">Every paced send in one place — sponsors and attendees together, in the real send order.</p>
              </div>
              <button onClick={load} className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Reload
              </button>
            </div>

            {showSettings && <QueueSettingsModal onClose={() => setShowSettings(false)} onChanged={load} />}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              <Stat label="Pending" value={(data?.counts?.pending || 0).toString()} accent="#0066B3" />
              <Stat label="Sent (24h)" value={(data?.sentLast24h || 0).toString()} accent="#059669" />
              <Stat label="Sent (1h)" value={(data?.sentLastHour || 0).toString()} />
              <Stat label="Next send" value={data?.paused ? "Paused" : fmtTime(data?.nextScheduledFor || null)} accent={data?.paused ? "#D97706" : undefined} />
            </div>

            {/* Controls */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-1.5 text-sm font-bold ${data?.paused ? "text-amber-700" : "text-emerald-700"}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${data?.paused ? "bg-amber-400" : "bg-emerald-500 animate-pulse"}`} />
                  {data?.paused ? "Sending paused" : "Sending active"}
                </div>
                {isAdmin && (
                  <div className="ml-auto flex items-center gap-2 flex-wrap">
                    <button onClick={() => setShowSettings(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">
                      <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust pacing
                    </button>
                    <button onClick={refreshTemplates} disabled={busy !== null || pendingCount === 0} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50" title="Re-render every pending invite with the latest email template.">
                      {busy === "refresh" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh templates
                    </button>
                    <button onClick={shuffleAll} disabled={busy !== null || pendingCount < 2} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50" title="Randomize the order across the whole queue so sponsors and attendees interleave. Same schedule, new order.">
                      {busy === "shuffle" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />} Shuffle all
                    </button>
                    <button onClick={togglePause} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: data?.paused ? "#059669" : "#D97706" }}>
                      {data?.paused ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-3 text-[11px] text-slate-400">
                Drains oldest scheduled time first, across all types together. Pacing: max {data?.policy.maxPerHour}/hr, {data?.policy.maxPerDay}/day · {data?.policy.minGapSeconds}–{data?.policy.maxGapSeconds}s between sends · {data?.policy.sendStartHour}:00–{data?.policy.sendEndHour}:00 {data?.policy.sendTimezone}.
              </div>
              {note && <div className="mt-2 text-xs font-semibold text-teal-700">{note}</div>}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {([["all", "All"], ["sponsor", "Sponsors"], ["attendee", "Attendees"], ["test", "Test"]] as const).map(([k, label]) => {
                const count = k === "all" ? pending.length : (typeCounts[k] || 0);
                const active = typeFilter === k;
                if (k !== "all" && count === 0) return null;
                return (
                  <button key={k} onClick={() => setTypeFilter(k)} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                    {label}
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Pending list */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {shown.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-400">
                  {pending.length === 0 ? "The queue is empty. Nothing waiting to send." : "No items of this type."}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {shown.map((p, i) => {
                    const meta = TYPE_META[p.recipientType] || TYPE_META.test;
                    return (
                      <li key={p.id} className="flex items-center gap-3 px-4 py-3 group">
                        <span className="text-[11px] font-bold text-slate-300 w-6 shrink-0 text-right tabular-nums">{i + 1}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border shrink-0 ${meta.cls}`}>
                          <meta.Icon className="w-3 h-3" /> {meta.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{p.subject}</div>
                          <div className="text-xs text-slate-500 truncate">{p.to}{p.attempts > 0 && <span className="text-rose-500"> · {p.attempts} attempt{p.attempts === 1 ? "" : "s"}</span>}</div>
                        </div>
                        <div className="text-[11px] text-slate-400 shrink-0 hidden sm:block tabular-nums">{fmtTime(p.scheduledFor)}</div>
                        {isAdmin && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => sendOne(p.id)} disabled={rowBusy === p.id} className="text-[10px] font-bold px-2 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 inline-flex items-center gap-1 disabled:opacity-50" title="Send this one now">
                              {rowBusy === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Send
                            </button>
                            <button onClick={() => cancelOne(p.id)} disabled={rowBusy === p.id} className="text-[10px] font-bold px-2 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 inline-flex items-center gap-1 disabled:opacity-50" title="Cancel this send">
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {pending.length >= 500 && (
              <div className="mt-2 text-[11px] text-slate-400">Showing the first 500 pending items.</div>
            )}
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{label}</div>
      <div className="text-2xl font-extrabold mt-1" style={{ color: accent || "#0f172a" }}>{value}</div>
    </div>
  );
}
