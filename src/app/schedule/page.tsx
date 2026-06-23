"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CalendarRange, Plus, MousePointerClick, List, Trash2 } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import SessionComposer, { type SchedulePresenter, type ScheduleSessionLite } from "@/components/schedule/SessionComposer";
import {
  CONFERENCE_DAYS, SESSION_KINDS, kindMeta, formatTime, formatDuration,
  durationMinutes, dayIdOf, minutesOfDay, hourLabel, minutesToHHMM, chicagoInstant, addMinutesIso,
} from "@/lib/schedule";

const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const fmtMin = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const hh = Math.floor(m / 60), mm = m % 60;
  const ap = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
};

type SessionRow = ScheduleSessionLite & { createdAt: string };
type ComposerState = { existing?: ScheduleSessionLite; dayId?: string; startHHMM?: string };
type View = "calendar" | "agenda";

const PX_PER_MIN = 1.25;

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [presenters, setPresenters] = useState<SchedulePresenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [view, setView] = useState<View>("calendar");

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

  // Drag/resize on the calendar: optimistic local update, then PATCH. Reverts on
  // failure. Same conference day (vertical move only); use the editor to change days.
  async function reschedule(s: SessionRow, startMin: number, dur: number) {
    const dayId = dayIdOf(s.startTime);
    const startIso = chicagoInstant(dayId, minutesToHHMM(startMin));
    const endIso = addMinutesIso(startIso, dur);
    if (startIso === s.startTime && endIso === s.endTime) return;
    const prev = sessions;
    setSessions((cur) => cur.map((x) => (x.id === s.id ? { ...x, startTime: startIso, endTime: endIso } : x)));
    try {
      const res = await fetch(`/api/schedule/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime: startIso, endTime: endIso }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSessions(prev);
    }
  }

  const dayProps = {
    isAdmin,
    onAdd: (dayId: string, hhmm: string) => setComposer({ dayId, startHHMM: hhmm }),
    onEdit: (s: SessionRow) => setComposer({ existing: s }),
    onRemove: remove,
  };

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
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
                  <CalendarRange className="w-3.5 h-3.5" /> Schedule builder
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">Conference program</h1>
                <p className="text-sm text-slate-500 mt-1">{view === "calendar" ? "Both days at a glance, blocks sized by length." : "Both days as a clean running order."} {isAdmin && (view === "calendar" ? "Click a slot to add · drag a block to move · drag its bottom edge to resize." : "Click a row to edit.")}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="inline-flex items-center bg-slate-100 rounded-xl p-0.5">
                  <ViewBtn active={view === "calendar"} onClick={() => setView("calendar")} icon={<CalendarRange className="w-3.5 h-3.5" />} label="Calendar" />
                  <ViewBtn active={view === "agenda"} onClick={() => setView("agenda")} icon={<List className="w-3.5 h-3.5" />} label="Agenda" />
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
            </div>

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
              <div className="flex flex-col lg:flex-row gap-4 items-start">
                {CONFERENCE_DAYS.map((d) =>
                  view === "calendar" ? (
                    <CalendarDay key={d.id} day={d} sessions={byDay[d.id] || []} winStart={winStart} winEnd={winEnd} onReschedule={reschedule} {...dayProps} />
                  ) : (
                    <AgendaDay key={d.id} day={d} sessions={byDay[d.id] || []} {...dayProps} />
                  )
                )}
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

function ViewBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors " + (active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
      {icon} {label}
    </button>
  );
}

function DayHeader({ day, sessions }: { day: (typeof CONFERENCE_DAYS)[number]; sessions: SessionRow[] }) {
  const totalMins = sessions.reduce((a, s) => a + durationMinutes(s.startTime, s.endTime), 0);
  return (
    <div className="px-4 py-3 bg-gradient-to-r from-[#0E5566] to-[#0066B3] text-white">
      <div className="text-sm font-bold">{day.label}</div>
      <div className="text-[11px] text-white/70 mt-0.5">{sessions.length} session{sessions.length === 1 ? "" : "s"}{totalMins > 0 ? ` · ${formatDuration(totalMins)}` : ""}</div>
    </div>
  );
}

type DayProps = {
  day: (typeof CONFERENCE_DAYS)[number];
  sessions: SessionRow[];
  isAdmin: boolean;
  onAdd: (dayId: string, hhmm: string) => void;
  onEdit: (s: SessionRow) => void;
  onRemove: (id: string) => void;
};

function AgendaDay({ day, sessions, isAdmin, onAdd, onEdit, onRemove }: DayProps) {
  return (
    <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <DayHeader day={day} sessions={sessions} />
      {sessions.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <MousePointerClick className="w-6 h-6 mx-auto text-slate-300" />
          <div className="mt-2 text-[13px] font-medium text-slate-400">Nothing scheduled yet.</div>
          {isAdmin && <button onClick={() => onAdd(day.id, day.start)} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] shadow-sm"><Plus className="w-3.5 h-3.5" /> Add session</button>}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {sessions.map((s, i) => {
            const meta = kindMeta(s.kind);
            const dur = durationMinutes(s.startTime, s.endTime);
            const prev = sessions[i - 1];
            const gap = prev ? minutesOfDay(s.startTime) - minutesOfDay(prev.endTime) : 0;
            return (
              <Fragment key={s.id}>
                {prev && gap !== 0 && (
                  <div className={"px-4 py-1 text-center text-[10.5px] font-semibold " + (gap < 0 ? "text-rose-500 bg-rose-50/60" : "text-slate-300")}>
                    {gap < 0 ? `⚠ overlaps by ${formatDuration(-gap)}` : `· ${formatDuration(gap)} gap ·`}
                  </div>
                )}
                <div
                  onClick={() => isAdmin && onEdit(s)}
                  className={"group flex items-start gap-3 px-4 py-3 " + (isAdmin ? "cursor-pointer hover:bg-slate-50" : "")}
                >
                  <div className="w-14 shrink-0 text-right pt-0.5">
                    <div className="text-[12px] font-bold text-slate-700 leading-none">{formatTime(s.startTime)}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{formatTime(s.endTime)}</div>
                  </div>
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: meta.accent }} />
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wide" style={{ background: meta.soft, color: meta.accent }}>{meta.label}</span>
                    <div className="text-[14px] font-bold text-slate-900 leading-snug mt-1">{s.title}</div>
                    {s.presenterName && <div className="text-[12.5px] text-slate-500">{s.presenterName}</div>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">{formatDuration(dur)}</span>
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); onRemove(s.id); }} className="sm:opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-600 transition-opacity" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CalendarDay({ day, sessions, winStart, winEnd, isAdmin, onAdd, onEdit, onRemove, onReschedule }: DayProps & { winStart: number; winEnd: number; onReschedule: (s: SessionRow, startMin: number, dur: number) => void }) {
  const height = (winEnd - winStart) * PX_PER_MIN;
  const hours: number[] = [];
  for (let h = winStart / 60; h <= winEnd / 60; h++) hours.push(h);

  const [drag, setDrag] = useState<{ id: string; mode: "move" | "resize"; startMin: number; dur: number } | null>(null);
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; startY: number; origStartMin: number; origDur: number; curStartMin: number; curDur: number; moved: boolean } | null>(null);
  const lastDragEnd = useRef(0);

  function bgClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isAdmin) return;
    if (Date.now() - lastDragEnd.current < 250) return; // ignore the click that ends a drag
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const mins = clampN(winStart + Math.round((y / PX_PER_MIN) / 15) * 15, winStart, winEnd - 15);
    onAdd(day.id, minutesToHHMM(mins));
  }

  function pointerDown(e: React.PointerEvent, s: SessionRow, startMin: number, dur: number) {
    if (!isAdmin || e.button !== 0) return;
    const mode: "move" | "resize" = (e.target as HTMLElement).dataset?.resize === "1" ? "resize" : "move";
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { id: s.id, mode, startY: e.clientY, origStartMin: startMin, origDur: dur, curStartMin: startMin, curDur: dur, moved: false };
    setDrag({ id: s.id, mode, startMin, dur });
  }
  function pointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (Math.abs(dy) > 3) d.moved = true;
    const deltaMin = Math.round((dy / PX_PER_MIN) / 5) * 5;
    if (d.mode === "move") {
      d.curStartMin = clampN(d.origStartMin + deltaMin, winStart, winEnd - d.origDur);
    } else {
      d.curDur = clampN(d.origDur + deltaMin, 10, winEnd - d.origStartMin);
    }
    setDrag({ id: d.id, mode: d.mode, startMin: d.curStartMin, dur: d.curDur });
  }
  function pointerUp(s: SessionRow) {
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!d) return;
    if (!d.moved) { onEdit(s); return; }
    lastDragEnd.current = Date.now();
    onReschedule(s, d.curStartMin, d.curDur);
  }

  return (
    <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <DayHeader day={day} sessions={sessions} />
      <div className="relative" style={{ height }} onClick={bgClick}>
        {hours.map((h) => {
          const top = (h * 60 - winStart) * PX_PER_MIN;
          return (
            <div key={h} className="absolute left-0 right-0 border-t border-slate-100" style={{ top }}>
              <span className="absolute -top-2 left-2 text-[10px] font-medium text-slate-300 bg-white pr-1">{hourLabel(h)}</span>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
            <MousePointerClick className="w-6 h-6 text-slate-300" />
            <div className="mt-2 text-[13px] font-medium text-slate-400">{isAdmin ? "Click a time to add a session" : "Nothing scheduled yet"}</div>
          </div>
        )}

        <div className="absolute left-12 right-2 top-0 bottom-0">
          {sessions.map((s) => {
            const meta = kindMeta(s.kind);
            const isDragging = drag?.id === s.id;
            const startMin = isDragging ? drag!.startMin : minutesOfDay(s.startTime);
            const dur = isDragging ? drag!.dur : durationMinutes(s.startTime, s.endTime);
            const top = (startMin - winStart) * PX_PER_MIN;
            const h = Math.max(dur * PX_PER_MIN, 28);
            const compact = h < 50;
            return (
              <div
                key={s.id}
                onPointerDown={(e) => pointerDown(e, s, minutesOfDay(s.startTime), durationMinutes(s.startTime, s.endTime))}
                onPointerMove={pointerMove}
                onPointerUp={() => pointerUp(s)}
                onClick={(e) => e.stopPropagation()}
                className={"group absolute left-0 right-0 rounded-lg border-l-[3px] px-2.5 py-1.5 overflow-hidden shadow-sm " + (isAdmin ? "cursor-grab active:cursor-grabbing hover:shadow-md " : "") + (isDragging ? "ring-2 ring-[#0066B3] shadow-lg z-20" : "transition-[top,height] duration-150")}
                style={{ top, height: h - 3, background: meta.soft, borderColor: meta.accent, touchAction: isAdmin ? "none" : undefined }}
                title={s.title}
              >
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wide" style={{ color: meta.accent }}>{meta.label}</span>
                  <span className="text-[9.5px] text-slate-400">{fmtMin(startMin)}–{fmtMin(startMin + dur)}</span>
                  {isAdmin && (
                    <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRemove(s.id); }} className="ml-auto opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 text-[11px] font-bold leading-none" title="Remove">✕</button>
                  )}
                </div>
                <div className={"font-bold text-slate-900 mt-0.5 leading-tight " + (compact ? "text-[11px] truncate" : "text-[12.5px] line-clamp-2")}>{s.title}</div>
                {!compact && s.presenterName && <div className="text-[11px] text-slate-500 truncate mt-0.5">{s.presenterName}</div>}
                {isAdmin && h >= 34 && (
                  <div data-resize="1" className="absolute left-0 right-0 bottom-0 h-2.5 cursor-ns-resize flex items-end justify-center pb-0.5">
                    <div data-resize="1" className="h-1 w-8 rounded-full bg-slate-400/25 group-hover:bg-slate-400/60" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
