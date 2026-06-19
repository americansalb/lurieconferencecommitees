"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CalendarRange, Plus, Pencil, Trash2, Clock, CalendarDays } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import SessionComposer, { type SchedulePresenter, type ScheduleSessionLite } from "@/components/schedule/SessionComposer";
import {
  CONFERENCE_DAYS, kindMeta, formatTime, formatDuration, durationMinutes, dayIdOf,
} from "@/lib/schedule";

type SessionRow = ScheduleSessionLite & { createdAt: string };

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [presenters, setPresenters] = useState<SchedulePresenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayId, setDayId] = useState<string>(CONFERENCE_DAYS[0].id);
  const [composer, setComposer] = useState<{ existing?: ScheduleSessionLite } | null>(null);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin" || role === "developer";

  const load = useCallback(async () => {
    setLoading(true);
    const [s, p] = await Promise.all([
      fetch("/api/schedule").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/presenters").then((r) => (r.ok ? r.json() : [])),
    ]);
    setSessions(Array.isArray(s) ? s : []);
    setPresenters(Array.isArray(p) ? p : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.replace("/login"); return; }
    load();
  }, [session, status, router, load]);

  const daySessions = useMemo(
    () => sessions
      .filter((s) => dayIdOf(s.startTime) === dayId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [sessions, dayId]
  );

  const totalMins = daySessions.reduce((acc, s) => acc + durationMinutes(s.startTime, s.endTime), 0);

  async function remove(id: string) {
    if (!confirm("Remove this session from the schedule?")) return;
    await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    load();
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
                  <CalendarRange className="w-3.5 h-3.5" /> Schedule builder
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">Conference program</h1>
                <p className="text-sm text-slate-500 mt-1">Build the single-track agenda for August 15 &amp; 16. Pull talks from your presenter list or add anything by hand.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setComposer({})}
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add session
                </button>
              )}
            </div>

            {/* Day tabs */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {CONFERENCE_DAYS.map((d) => {
                const on = dayId === d.id;
                const count = sessions.filter((s) => dayIdOf(s.startTime) === d.id).length;
                return (
                  <button
                    key={d.id} onClick={() => setDayId(d.id)}
                    className={"text-left px-4 py-3 rounded-2xl border transition-all " + (on ? "bg-white border-[#0066B3] ring-1 ring-[#0066B3]/20 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300")}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays className={"w-4 h-4 " + (on ? "text-[#0066B3]" : "text-slate-400")} />
                      <div className="text-sm font-bold text-slate-800">{d.label}</div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 ml-6">{fmtClock(d.start)}–{fmtClock(d.end)} · {count} session{count === 1 ? "" : "s"}</div>
                  </button>
                );
              })}
            </div>

            {/* Day summary */}
            {daySessions.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                <Clock className="w-3.5 h-3.5" />
                {daySessions.length} session{daySessions.length === 1 ? "" : "s"} · {formatDuration(totalMins)} of programming
              </div>
            )}

            {/* Timeline */}
            {loading ? (
              <div className="py-20 text-center text-sm text-slate-400">Loading schedule…</div>
            ) : daySessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-16 text-center">
                <CalendarRange className="w-8 h-8 mx-auto text-slate-300" />
                <div className="mt-3 text-sm font-semibold text-slate-600">Nothing scheduled yet for this day.</div>
                <div className="text-[13px] text-slate-400 mt-1">Add a keynote, a talk from your presenters, or a break to get started.</div>
                {isAdmin && (
                  <button onClick={() => setComposer({})} className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] shadow-sm">
                    <Plus className="w-4 h-4" /> Add the first session
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                {/* vertical rail */}
                <div className="absolute left-[64px] top-2 bottom-2 w-px bg-slate-200" aria-hidden />
                <div className="space-y-3">
                  {daySessions.map((s) => {
                    const meta = kindMeta(s.kind);
                    const mins = durationMinutes(s.startTime, s.endTime);
                    return (
                      <div key={s.id} className="relative flex gap-4 group">
                        {/* time gutter */}
                        <div className="w-14 shrink-0 text-right pt-3">
                          <div className="text-[12px] font-bold text-slate-700 leading-none">{formatTime(s.startTime)}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{formatTime(s.endTime)}</div>
                        </div>
                        {/* dot */}
                        <div className="relative shrink-0 w-2">
                          <span className="absolute left-1/2 -translate-x-1/2 top-4 w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{ background: meta.accent }} />
                        </div>
                        {/* card */}
                        <div className="flex-1 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                          <div className="flex">
                            <div className="w-1.5 shrink-0" style={{ background: meta.accent }} />
                            <div className="flex-1 p-4">
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ background: meta.soft, color: meta.accent }}>
                                    {meta.label}
                                  </span>
                                  <div className="text-[15px] font-bold text-slate-900 leading-snug">{s.title}</div>
                                  {s.presenterName && <div className="text-[13px] text-slate-500 mt-0.5">{s.presenterName}</div>}
                                  {s.description && <div className="text-[12.5px] text-slate-400 mt-1.5 line-clamp-2">{s.description}</div>}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-400 whitespace-nowrap pt-0.5">{formatDuration(mins)}</div>
                              </div>
                            </div>
                            {isAdmin && (
                              <div className="flex flex-col items-center justify-center gap-1 pr-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setComposer({ existing: s })} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-[#0066B3] hover:bg-[#0066B3]/5"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => remove(s.id)} title="Remove" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
        <MobileNav />
      </div>

      {composer && isAdmin && (
        <SessionComposer
          presenters={presenters}
          existing={composer.existing}
          defaultDayId={dayId}
          onClose={() => setComposer(null)}
          onSaved={() => { setComposer(null); load(); }}
        />
      )}
    </div>
  );
}

function fmtClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}
