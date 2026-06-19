"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CalendarRange, Plus, MousePointerClick } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import SessionComposer, { type SchedulePresenter, type ScheduleSessionLite } from "@/components/schedule/SessionComposer";
import {
  CONFERENCE_DAYS, SESSION_KINDS, kindMeta, formatTime, formatDuration,
  durationMinutes, dayIdOf, minutesOfDay, hourLabel,
} from "@/lib/schedule";

type SessionRow = ScheduleSessionLite & { createdAt: string };
type ComposerState = { existing?: ScheduleSessionLite; dayId?: string; startHHMM?: string };

const PX_PER_MIN = 1.25;

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [presenters, setPresenters] = useState<SchedulePresenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState<ComposerState | null>(null);

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

  // Shared time window so both days line up; expands to fit any out-of-hours session.
  const [winStart, winEnd] = useMemo(() => {
    let s = 8 * 60;
    let e = 18 * 60 + 30;
    for (const x of sessions) {
      s = Math.min(s, Math.floor(minutesOfDay(x.startTime) / 60) * 60);
      e = Math.max(e, Math.ceil(minutesOfDay(x.endTime) / 60) * 60);
    }
    return [s, e];
  }, [sessions]);

  const byDay = useMemo(() => {
    const map: Record<string, SessionRow[]> = {};
    for (const d of CONFERENCE_DAYS) map[d.id] = [];
    for (const x of sessions) {
      const id = dayIdOf(x.startTime);
      if (map[id]) map[id].push(x);
    }
    for (const id in map) map[id].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return map;
  }, [sessions]);

  const usedKinds = useMemo(() => {
    const set = new Set(sessions.map((s) => s.kind));
    return SESSION_KINDS.filter((k) => set.has(k.id));
  }, [sessions]);

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
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
                  <CalendarRange className="w-3.5 h-3.5" /> Schedule builder
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">Conference program</h1>
                <p className="text-sm text-slate-500 mt-1">Both days at a glance — blocks are sized by length. {isAdmin && "Click a slot to add, a block to edit."}</p>
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

            {/* Legend */}
            {usedKinds.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4">
                {usedKinds.map((k) => (
                  <span key={k.id} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: k.accent }} /> {k.label}
                  </span>
                ))}
              </div>
            )}

            {loading ? (
              <div className="py-20 text-center text-sm text-slate-400">Loading schedule…</div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-4">
                {CONFERENCE_DAYS.map((d) => (
                  <DayColumn
                    key={d.id}
                    day={d}
                    sessions={byDay[d.id] || []}
                    winStart={winStart}
                    winEnd={winEnd}
                    isAdmin={isAdmin}
                    onAdd={(dayId, hhmm) => setComposer({ dayId, startHHMM: hhmm })}
                    onEdit={(s) => setComposer({ existing: s })}
                    onRemove={remove}
                  />
                ))}
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
          defaultDayId={composer.dayId || CONFERENCE_DAYS[0].id}
          defaultStartHHMM={composer.startHHMM}
          onClose={() => setComposer(null)}
          onSaved={() => { setComposer(null); load(); }}
        />
      )}
    </div>
  );
}

function DayColumn({
  day, sessions, winStart, winEnd, isAdmin, onAdd, onEdit, onRemove,
}: {
  day: (typeof CONFERENCE_DAYS)[number];
  sessions: SessionRow[];
  winStart: number;
  winEnd: number;
  isAdmin: boolean;
  onAdd: (dayId: string, hhmm: string) => void;
  onEdit: (s: SessionRow) => void;
  onRemove: (id: string) => void;
}) {
  const height = (winEnd - winStart) * PX_PER_MIN;
  const hours: number[] = [];
  for (let h = winStart / 60; h <= winEnd / 60; h++) hours.push(h);
  const totalMins = sessions.reduce((a, s) => a + durationMinutes(s.startTime, s.endTime), 0);

  function bgClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isAdmin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let mins = winStart + Math.round((y / PX_PER_MIN) / 15) * 15;
    mins = Math.max(winStart, Math.min(winEnd - 15, mins));
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    onAdd(day.id, `${hh}:${mm}`);
  }

  return (
    <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-gradient-to-r from-[#0E5566] to-[#0066B3] text-white">
        <div className="text-sm font-bold">{day.label}</div>
        <div className="text-[11px] text-white/70 mt-0.5">
          {sessions.length} session{sessions.length === 1 ? "" : "s"}{totalMins > 0 ? ` · ${formatDuration(totalMins)}` : ""}
        </div>
      </div>

      <div className="relative" style={{ height }} onClick={bgClick}>
        {/* Hour gridlines + labels */}
        {hours.map((h) => {
          const top = (h * 60 - winStart) * PX_PER_MIN;
          return (
            <div key={h} className="absolute left-0 right-0 border-t border-slate-100" style={{ top }}>
              <span className="absolute -top-2 left-2 text-[10px] font-medium text-slate-300 bg-white pr-1">{hourLabel(h)}</span>
            </div>
          );
        })}

        {/* Empty-day hint */}
        {sessions.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
            <MousePointerClick className="w-6 h-6 text-slate-300" />
            <div className="mt-2 text-[13px] font-medium text-slate-400">{isAdmin ? "Click a time to add a session" : "Nothing scheduled yet"}</div>
          </div>
        )}

        {/* Session blocks */}
        <div className="absolute left-12 right-2 top-0 bottom-0">
          {sessions.map((s) => {
            const meta = kindMeta(s.kind);
            const startMin = minutesOfDay(s.startTime);
            const dur = durationMinutes(s.startTime, s.endTime);
            const top = (startMin - winStart) * PX_PER_MIN;
            const h = Math.max(dur * PX_PER_MIN, 28);
            const compact = h < 50;
            return (
              <div
                key={s.id}
                onClick={(e) => { e.stopPropagation(); if (isAdmin) onEdit(s); }}
                className={"group absolute left-0 right-0 rounded-lg border-l-[3px] px-2.5 py-1.5 overflow-hidden shadow-sm transition-all " + (isAdmin ? "cursor-pointer hover:shadow-md hover:-translate-y-px" : "")}
                style={{ top, height: h - 3, background: meta.soft, borderColor: meta.accent }}
                title={s.title}
              >
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wide" style={{ color: meta.accent }}>{meta.label}</span>
                  <span className="text-[9.5px] text-slate-400">{formatTime(s.startTime)}–{formatTime(s.endTime)}</span>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(s.id); }}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 text-[11px] font-bold leading-none"
                      title="Remove"
                    >✕</button>
                  )}
                </div>
                <div className={"font-bold text-slate-900 mt-0.5 leading-tight " + (compact ? "text-[11px] truncate" : "text-[12.5px] line-clamp-2")}>{s.title}</div>
                {!compact && s.presenterName && <div className="text-[11px] text-slate-500 truncate mt-0.5">{s.presenterName}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
