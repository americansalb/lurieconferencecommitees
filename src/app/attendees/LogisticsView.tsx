"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Accessibility, Utensils, Car, Languages, MapPin, Monitor, RefreshCw,
  Download, AlertCircle, Users,
} from "lucide-react";

type Person = {
  id: string; name: string; email: string; affiliation: string | null;
  mode: string | null; attendDay: string | null; paid: boolean; note: string;
};
type Tag = { key: string; label: string; count: number };
type Summary = {
  total: number; inPerson: number; virtual: number; oneDay: number;
  oneDaySat: number; oneDaySun: number; modeUnset: number;
  parking: { asked: number; yes: number; no: number; unsure: number };
  accessibility: { people: Person[]; tags: Tag[] };
  dietary: { people: Person[]; tags: Tag[]; inPersonWithNotes: number };
  languages: { language: string; count: number }[];
  languagesAnswered: number;
};
export type Data = { registered: Summary; pending: Summary };

const TEAL = "#0E5566", AMBER = "#D97706", VIOLET = "#7C3AED", GREEN = "#059669";

function modeLabel(p: { mode: string | null; attendDay: string | null }): string {
  if (p.mode === "in-person") return "In person";
  if (p.mode === "virtual") {
    if (p.attendDay === "sat") return "Virtual · Sat only";
    if (p.attendDay === "sun") return "Virtual · Sun only";
    return "Virtual";
  }
  return "Not set";
}

function csvEscape(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function LogisticsView({ initial }: { initial?: Data }) {
  const [data, setData] = useState<Data | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [includePending, setIncludePending] = useState(false);

  const load = useCallback(async () => {
    // The dev harness injects fixed data and has no API to call.
    if (initial) return;
    setLoading(true);
    try {
      const r = await fetch("/api/attendees/logistics");
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [initial]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return <div className="text-sm text-slate-400 animate-pulse py-8">Loading accommodations…</div>;
  }
  if (!data) {
    return <div className="text-sm text-slate-500 py-8">Could not load logistics.</div>;
  }

  // The registered (paid) set is the planning number. Pending requests are
  // merged in only when explicitly asked for, and stay visually marked.
  const s = data.registered;
  const p = data.pending;
  const merge = <T,>(a: T[], b: T[]) => (includePending ? [...a, ...b] : a);
  const access = merge(s.accessibility.people, p.accessibility.people);
  const diet = merge(s.dietary.people, p.dietary.people);
  const total = includePending ? s.total + p.total : s.total;
  const inPerson = includePending ? s.inPerson + p.inPerson : s.inPerson;
  const virtual = includePending ? s.virtual + p.virtual : s.virtual;

  // Language tallies are per-set from the server; combine when including pending.
  const langMap = new Map<string, number>();
  for (const l of s.languages) langMap.set(l.language, l.count);
  if (includePending) for (const l of p.languages) langMap.set(l.language, (langMap.get(l.language) || 0) + l.count);
  const languages = Array.from(langMap.entries())
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language));

  const mergeTags = (a: Tag[], b: Tag[]) => {
    if (!includePending) return a;
    const m = new Map(a.map((t) => [t.key, { ...t }]));
    for (const t of b) {
      const e = m.get(t.key);
      if (e) e.count += t.count; else m.set(t.key, { ...t });
    }
    return Array.from(m.values()).sort((x, y) => y.count - x.count);
  };
  const accessTags = mergeTags(s.accessibility.tags, p.accessibility.tags);
  const dietTags = mergeTags(s.dietary.tags, p.dietary.tags);

  const parking = includePending
    ? {
        asked: s.parking.asked + p.parking.asked,
        yes: s.parking.yes + p.parking.yes,
        no: s.parking.no + p.parking.no,
        unsure: s.parking.unsure + p.parking.unsure,
      }
    : s.parking;

  function exportCsv() {
    const lines = ["Type,Name,Email,Organization,Attendance,Status,Request"];
    for (const a of access) {
      lines.push(["Accessibility", a.name, a.email, a.affiliation || "", modeLabel(a), a.paid ? "Registered" : "Not paid", a.note].map(csvEscape).join(","));
    }
    for (const d of diet) {
      lines.push(["Dietary", d.name, d.email, d.affiliation || "", modeLabel(d), d.paid ? "Registered" : "Not paid", d.note].map(csvEscape).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "conference-accommodations.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="text-sm text-slate-500">
          Based on <strong className="text-slate-900">{total}</strong> {includePending ? "registered + in-progress" : "registered"} attendee{total === 1 ? "" : "s"}
          {!includePending && p.total > 0 && (
            <span className="text-slate-400"> · {p.total} more started but haven&rsquo;t paid</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {p.total > 0 && (
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={includePending} onChange={(e) => setIncludePending(e.target.checked)} className="rounded border-slate-300" />
              Include not-yet-paid
            </label>
          )}
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
          </button>
        </div>
      </div>

      {/* Headline counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Stat label="In person" value={inPerson} Icon={MapPin} color={TEAL} sub="Need seats, food, parking" />
        <Stat label="Virtual" value={virtual} Icon={Monitor} color={VIOLET} sub={s.oneDay + (includePending ? p.oneDay : 0) > 0 ? `${s.oneDay + (includePending ? p.oneDay : 0)} one-day only` : "Both days"} />
        <Stat label="Accommodations" value={access.length} Icon={Accessibility} color={AMBER} sub="Individual requests" />
        <Stat label="Dietary notes" value={diet.length} Icon={Utensils} color={GREEN} sub={`${includePending ? s.dietary.inPersonWithNotes + p.dietary.inPersonWithNotes : s.dietary.inPersonWithNotes} attending in person`} />
      </div>

      {/* Accessibility — the section that matters most, verbatim */}
      <Card
        title="Accessibility accommodations"
        Icon={Accessibility}
        color={AMBER}
        count={access.length}
      >
        {accessTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {accessTags.map((t) => (
              <span key={t.key} className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200">
                {t.label} <span className="tabular-nums opacity-70">{t.count}</span>
              </span>
            ))}
          </div>
        )}
        {access.length === 0 ? (
          <Empty text="No accommodation requests yet." />
        ) : (
          <RequestList people={access} />
        )}
        <p className="mt-3 text-[11px] text-slate-400">
          Every request is shown in the attendee&rsquo;s own words. The tags above are a keyword scan for planning counts only, and can miss phrasing, so read the notes before finalizing arrangements.
        </p>
      </Card>

      {/* Dietary */}
      <Card title="Dietary needs" Icon={Utensils} color={GREEN} count={diet.length}>
        {dietTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {dietTags.map((t) => (
              <span key={t.key} className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200">
                {t.label} <span className="tabular-nums opacity-70">{t.count}</span>
              </span>
            ))}
          </div>
        )}
        {diet.length === 0 ? <Empty text="No dietary notes yet." /> : <RequestList people={diet} />}
      </Card>

      {/* Parking + languages side by side */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card title="Parking at Lurie Children's" Icon={Car} color={TEAL} count={parking.yes}>
          {parking.asked === 0 ? (
            <Empty text="No in-person attendees yet." />
          ) : (
            <div className="space-y-2">
              <Bar label="Yes, need parking" value={parking.yes} total={parking.asked} color={TEAL} />
              <Bar label="Not needed" value={parking.no} total={parking.asked} color="#94a3b8" />
              <Bar label="Not sure yet" value={parking.unsure} total={parking.asked} color="#cbd5e1" />
              <p className="text-[11px] text-slate-400 pt-1">
                Of {parking.asked} in-person attendee{parking.asked === 1 ? "" : "s"}. Attendees arrange their own parking; this is for guidance in the pre-event email.
              </p>
            </div>
          )}
        </Card>

        <Card title="Languages in the room" Icon={Languages} color={VIOLET} count={languages.length}>
          {languages.length === 0 ? (
            <Empty text="No languages recorded yet." />
          ) : (
            <>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {languages.map((l) => (
                  <Bar key={l.language} label={l.language} value={l.count} total={languages[0].count} color={VIOLET} />
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                {languages.length} distinct languages from {includePending ? s.languagesAnswered + p.languagesAnswered : s.languagesAnswered} attendee{(includePending ? s.languagesAnswered + p.languagesAnswered : s.languagesAnswered) === 1 ? "" : "s"} who listed them. Parsed from a free-text field, so spellings vary.
              </p>
            </>
          )}
        </Card>
      </div>

      {s.modeUnset > 0 && (
        <div className="mt-3 flex items-start gap-2 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {s.modeUnset} registered attendee{s.modeUnset === 1 ? " has" : "s have"} no attendance mode recorded, so they aren&rsquo;t counted in the in-person or virtual totals.
        </div>
      )}
    </div>
  );
}

function RequestList({ people }: { people: Person[] }) {
  return (
    <ul className="divide-y divide-slate-100 -my-1">
      {people.map((r) => (
        <li key={`${r.id}-${r.note.slice(0, 8)}`} className="py-2.5">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-900">{r.name}</span>
            <span className="text-xs text-slate-400">{r.email}</span>
            {r.affiliation && <span className="text-xs text-slate-400">· {r.affiliation}</span>}
            <span className="text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 bg-slate-100 text-slate-600">
              {modeLabel(r)}
            </span>
            {!r.paid && (
              <span className="text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                Not paid
              </span>
            )}
          </div>
          <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{r.note}</div>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, Icon, color, sub }: { label: string; value: number; Icon: typeof Users; color: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 inline-flex items-center gap-1">
        <Icon className="w-3 h-3" style={{ color }} /> {label}
      </div>
      <div className="text-2xl font-extrabold mt-1 tabular-nums" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Card({ title, Icon, color, count, children }: { title: string; Icon: typeof Users; color: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</span>
        {count != null && <span className="text-[11px] font-bold tabular-nums text-slate-400">{count}</span>}
      </div>
      {children}
    </div>
  );
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const w = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate text-slate-600 text-[13px]" title={label}>{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div style={{ width: `${w}%`, background: color }} className="h-full rounded-full" />
      </div>
      <span className="w-8 shrink-0 text-right tabular-nums font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-sm text-slate-400 py-2">{text}</div>;
}
