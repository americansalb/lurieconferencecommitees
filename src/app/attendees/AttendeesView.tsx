"use client";

import { useMemo, useState } from "react";
import { Search, Mail, Send, MapPin, Monitor, Check } from "lucide-react";
import {
  ATTENDEE_STAGE_LABELS, ATTENDEE_SOURCE_LABELS, AttendeeStage,
  attendeeStage, attendeeSource,
} from "@/lib/attendees";

export type Attendee = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  affiliation: string | null;
  attendanceMode: string | null;
  status: string;
  paid: boolean;
  finalPriceCents: number | null;
  discountPercent: number;
  invitedById?: string | null;
  invitedAt: string | null;
  lastSentAt: string | null;
  viewedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

type StageFilter = "all" | AttendeeStage;

export default function AttendeesView({
  attendees, onOpenDetail, onCompose, onSendPortal,
}: {
  attendees: Attendee[];
  onOpenDetail: (id: string) => void;
  onCompose: (ids: string[]) => void;
  onSendPortal: (ids: string[]) => void;
}) {
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "invited" | "organic">("all");
  const [modeFilter, setModeFilter] = useState<"all" | "in-person" | "virtual">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const counts = useMemo(() => {
    const c = { attending: 0, registered: 0, invited: 0, declined: 0, total: attendees.length };
    for (const a of attendees) c[attendeeStage(a)]++;
    return c;
  }, [attendees]);

  const filtered = useMemo(() => attendees.filter((a) => {
    if (stageFilter !== "all" && attendeeStage(a) !== stageFilter) return false;
    if (sourceFilter !== "all" && attendeeSource(a) !== sourceFilter) return false;
    if (modeFilter !== "all" && a.attendanceMode !== modeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (![a.firstName, a.lastName, a.email, a.affiliation].some((v) => v?.toLowerCase().includes(s))) return false;
    }
    return true;
  }), [attendees, stageFilter, sourceFilter, modeFilter, search]);

  const allShownSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));
  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) filtered.forEach((a) => next.delete(a.id));
      else filtered.forEach((a) => next.add(a.id));
      return next;
    });
  }
  function toggle(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  const selectedIds = Array.from(selected);

  return (
    <div>
      {/* Funnel stats — clickable filters. Attending is the hero. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <StatCard label="Attendees" sub="paid · coming" value={counts.attending} accent="#16a34a" big active={stageFilter === "attending"} onClick={() => setStageFilter(stageFilter === "attending" ? "all" : "attending")} />
        <StatCard label="Registering" sub="started, unpaid" value={counts.registered} accent="#d97706" active={stageFilter === "registered"} onClick={() => setStageFilter(stageFilter === "registered" ? "all" : "registered")} />
        <StatCard label="Invited" sub="awaiting reply" value={counts.invited} accent="#0284c7" active={stageFilter === "invited"} onClick={() => setStageFilter(stageFilter === "invited" ? "all" : "invited")} />
        <StatCard label="Declined" sub="not coming" value={counts.declined} accent="#64748b" active={stageFilter === "declined"} onClick={() => setStageFilter(stageFilter === "declined" ? "all" : "declined")} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, org…" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" />
          </div>
          <Segmented value={sourceFilter} onChange={(v) => setSourceFilter(v as typeof sourceFilter)} options={[["all", "All sources"], ["invited", "Invited"], ["organic", "Signed up"]]} />
          <Segmented value={modeFilter} onChange={(v) => setModeFilter(v as typeof modeFilter)} options={[["all", "All"], ["in-person", "In-person"], ["virtual", "Virtual"]]} />
        </div>

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="px-4 py-2.5 bg-teal-50 border-b border-teal-100 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-teal-800">{selectedIds.length} selected</span>
            <button onClick={() => onCompose(selectedIds)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0E5566] text-white inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email them</button>
            <button onClick={() => onSendPortal(selectedIds)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-teal-200 text-teal-700 inline-flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Send portal link</button>
            <button onClick={() => setSelected(new Set())} className="text-xs font-semibold text-slate-500 hover:text-slate-700 ml-auto">Clear</button>
          </div>
        )}

        {/* Select-all */}
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
            <Checkbox checked={allShownSelected} onChange={toggleAll} />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{filtered.length} {filtered.length === 1 ? "person" : "people"}</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            {attendees.length === 0 ? "No one here yet. Invite people or wait for sign-ups." : "No matches for these filters."}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((a) => {
              const stage = attendeeStage(a);
              const stageCfg = ATTENDEE_STAGE_LABELS[stage];
              const source = attendeeSource(a);
              const sel = selected.has(a.id);
              return (
                <li key={a.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer ${sel ? "bg-teal-50/40" : ""}`} onClick={() => onOpenDetail(a.id)}>
                  <div onClick={(e) => { e.stopPropagation(); toggle(a.id); }}><Checkbox checked={sel} onChange={() => {}} /></div>
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                    {(a.firstName[0] + (a.lastName[0] || "")).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                      {a.firstName} {a.lastName}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-slate-500 bg-slate-100">{ATTENDEE_SOURCE_LABELS[source]}</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">{a.email}{a.affiliation && ` · ${a.affiliation}`}</div>
                  </div>
                  {a.attendanceMode && (
                    <span className="text-[11px] text-slate-500 hidden sm:inline-flex items-center gap-1">
                      {a.attendanceMode === "virtual" ? <Monitor className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      {a.attendanceMode === "in-person" ? "In-person" : "Virtual"}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${stageCfg.color} shrink-0`}>{stageCfg.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, sub, value, accent, big, active, onClick }: { label: string; sub: string; value: number; accent: string; big?: boolean; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`text-left bg-white border rounded-xl p-3 shadow-sm transition-all ${active ? "ring-2" : "hover:border-slate-300"}`} style={{ borderColor: active ? accent : undefined, boxShadow: active ? `0 0 0 1px ${accent}` : undefined }}>
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{label}</div>
      <div className={`${big ? "text-3xl" : "text-2xl"} font-extrabold mt-1`} style={{ color: accent }}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</div>
    </button>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs">
      {options.map(([v, label], i) => (
        <button key={v} onClick={() => onChange(v)} className={`px-2.5 py-2 font-semibold transition-colors ${value === v ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-50"} ${i > 0 ? "border-l border-slate-200" : ""}`}>{label}</button>
      ))}
    </div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors" style={{ background: checked ? "#0E5566" : "white", borderColor: checked ? "#0E5566" : "#cbd5e1" }}>
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </button>
  );
}
