"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, Check, ChevronDown, ChevronRight, Loader2, Printer,
  RotateCcw, Search, AlertTriangle, GripVertical, Eye, EyeOff,
} from "lucide-react";
import { CONFERENCE } from "@/components/landing/tokens";

// The speaker book: one page per presenter with their slot, session title,
// description, three learning objectives and bio.
//
// Everything is editable before it prints. The database holds what each
// presenter typed into their own form, which is the right starting point and
// the wrong finishing point: abstracts arrive at wildly different lengths,
// objectives arrive as one run-on line, and a couple of people always leave a
// field blank. Edits here stay in this browser and never touch the presenter's
// record, so shaping the printed page cannot rewrite what someone submitted.

const STORAGE_KEY = "lcc.program-book.v1";

type ApiEntry = {
  id: string;
  presenterId: string;
  sessionCount: number;
  name: string;
  status: string;
  jobTitle: string;
  affiliation: string;
  pronouns: string;
  hasHeadshot: boolean;
  day: string;
  date: string;
  time: string;
  order: number;
  scheduledTitle: string;
  talkTitle: string;
  submittedTitle: string;
  description: string;
  bio: string;
  objectives: string[];
  sessionLength: string;
  qaLength: string;
  preferredDay: string;
  email: string;
};

/** The editable copy of an entry. Only these fields are ever printed. */
type Entry = {
  id: string;
  include: boolean;
  name: string;
  role: string;
  day: string;
  time: string;
  title: string;
  description: string;
  objectives: string[];
  bio: string;
  hasHeadshot: boolean;
  showHeadshot: boolean;
  // Kept for the editor's warnings, never printed.
  status: string;
  submittedTitle: string;
  order: number;
  /** How many sessions this person is on. Above one, the copy needs splitting. */
  sessionCount: number;
};

type Doc = {
  title: string;
  subtitle: string;
  cover: boolean;
  headshots: boolean;
  descriptions: boolean;
  objectives: boolean;
  bios: boolean;
  onePerPage: boolean;
  dayHeadings: boolean;
};

const DEFAULT_DOC: Doc = {
  title: "Speakers & Sessions",
  subtitle: CONFERENCE.name,
  cover: true,
  headshots: true,
  descriptions: true,
  objectives: true,
  bios: true,
  onePerPage: true,
  dayHeadings: true,
};

function roleLine(e: ApiEntry): string {
  return [e.jobTitle, e.affiliation].filter(Boolean).join(", ");
}

function toEntry(e: ApiEntry): Entry {
  return {
    id: e.id,
    include: true,
    name: e.name,
    role: roleLine(e),
    day: [e.day, e.date].filter(Boolean).join(" · "),
    time: e.time,
    title: e.talkTitle,
    description: e.description,
    objectives: [e.objectives[0] || "", e.objectives[1] || "", e.objectives[2] || ""],
    bio: e.bio,
    hasHeadshot: e.hasHeadshot,
    showHeadshot: e.hasHeadshot,
    status: e.status,
    submittedTitle: e.submittedTitle,
    order: e.order,
    sessionCount: e.sessionCount,
  };
}

export default function ProgramBookBuilder() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [doc, setDoc] = useState<Doc>(DEFAULT_DOC);
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async (fresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/presenters/program-book");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not load the presenters.");
      const base: Entry[] = (j.entries as ApiEntry[]).map(toEntry);

      if (fresh) {
        setEntries(base);
        setDoc(DEFAULT_DOC);
        return;
      }
      // Overlay whatever was edited last time, by id, so a presenter added
      // since then still appears with their database copy intact.
      let stored: { doc?: Doc; entries?: Entry[] } | null = null;
      try {
        stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      } catch {
        stored = null;
      }
      if (stored?.doc) setDoc({ ...DEFAULT_DOC, ...stored.doc });
      if (stored?.entries?.length) {
        const byId = new Map(stored.entries.map((s) => [s.id, s]));
        setEntries(base.map((b) => {
          const s = byId.get(b.id);
          return s ? { ...b, ...s, hasHeadshot: b.hasHeadshot, status: b.status, submittedTitle: b.submittedTitle, sessionCount: b.sessionCount } : b;
        }));
      } else {
        setEntries(base);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the presenters.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Persist as you type. Losing twenty minutes of edits to a stray refresh is
  // the kind of thing that makes someone give up on the tool.
  useEffect(() => {
    if (loading || !entries.length) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ doc, entries }));
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
      } catch { /* a full quota is not worth interrupting the work for */ }
    }, 500);
    return () => clearTimeout(t);
  }, [doc, entries, loading]);

  const patch = useCallback((id: string, fields: Partial<Entry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...fields } : e)));
  }, []);

  const setObjective = useCallback((id: string, i: number, value: string) => {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== id) return e;
      const objectives = [...e.objectives];
      objectives[i] = value;
      return { ...e, objectives };
    }));
  }, []);

  const move = useCallback((id: string, dir: -1 | 1) => {
    setEntries((prev) => {
      const i = prev.findIndex((e) => e.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const included = useMemo(() => entries.filter((e) => e.include), [entries]);
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((e) => `${e.name} ${e.title}`.toLowerCase().includes(needle));
  }, [entries, q]);

  // What is missing, counted before anything is printed rather than discovered
  // in the printout.
  const gaps = useMemo(() => {
    let noTime = 0, noDescription = 0, noBio = 0, thinObjectives = 0;
    const twice = new Set<string>();
    for (const e of included) {
      if (!e.time.trim()) noTime += 1;
      if (!e.description.trim()) noDescription += 1;
      if (!e.bio.trim()) noBio += 1;
      if (e.objectives.filter((o) => o.trim()).length < 3) thinObjectives += 1;
      if (e.sessionCount > 1) twice.add(e.name);
    }
    return { noTime, noDescription, noBio, thinObjectives, twice: [...twice] };
  }, [included]);

  const gapCount = gaps.noTime + gaps.noDescription + gaps.noBio + gaps.thinObjectives + gaps.twice.length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm py-20 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading presenters&hellip;
      </div>
    );
  }

  return (
    <>
      <PrintStyles />

      <div className="no-print">
        <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <div>
            <Link href="/presenters" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-3.5 h-3.5" /> Presenters
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1 inline-flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#0E5566]" /> Speaker book
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Every confirmed presenter with their slot, session title, description, learning objectives and
              bio. Edit anything here first; changes stay in this browser and never touch a presenter&rsquo;s
              record. When it reads right, print it or save it as a PDF.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saved && (
              <span className="text-[11px] font-semibold text-emerald-600 inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm("Discard your edits and reload every field from the database?")) load(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">{error}</div>
        )}

        {gapCount > 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="text-[13px] font-bold text-amber-900 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Gaps in what will print
            </div>
            <ul className="mt-1.5 text-[12.5px] text-amber-800 space-y-0.5">
              {gaps.noTime > 0 && <li>{gaps.noTime} without a speaking time. Nobody matched them to a slot in the program, so type it in.</li>}
              {gaps.thinObjectives > 0 && <li>{gaps.thinObjectives} with fewer than three learning objectives.</li>}
              {gaps.noDescription > 0 && <li>{gaps.noDescription} without a session description.</li>}
              {gaps.noBio > 0 && <li>{gaps.noBio} without a bio.</li>}
              {gaps.twice.length > 0 && (
                <li>
                  {gaps.twice.join(", ")} {gaps.twice.length === 1 ? "is" : "are"} on the program more than
                  once, so {gaps.twice.length === 1 ? "they have" : "they each have"} a page per session. Both
                  start from the same submitted description and objectives, so edit each one to its own
                  session or the book repeats itself.
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
          {/* Editor */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">The document</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Title">
                  <input value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Subtitle">
                  <input value={doc.subtitle} onChange={(e) => setDoc({ ...doc, subtitle: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                <Toggle checked={doc.cover} onChange={(v) => setDoc({ ...doc, cover: v })} label="Cover page" />
                <Toggle checked={doc.dayHeadings} onChange={(v) => setDoc({ ...doc, dayHeadings: v })} label="Day headings" />
                <Toggle checked={doc.headshots} onChange={(v) => setDoc({ ...doc, headshots: v })} label="Headshots" />
                <Toggle checked={doc.descriptions} onChange={(v) => setDoc({ ...doc, descriptions: v })} label="Descriptions" />
                <Toggle checked={doc.objectives} onChange={(v) => setDoc({ ...doc, objectives: v })} label="Objectives" />
                <Toggle checked={doc.bios} onChange={(v) => setDoc({ ...doc, bios: v })} label="Bios" />
                <Toggle checked={doc.onePerPage} onChange={(v) => setDoc({ ...doc, onePerPage: v })} label="One speaker per page" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Find a speaker"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0E5566]/20"
                />
              </div>
              <span className="text-[12px] font-semibold text-slate-500 whitespace-nowrap">
                {included.length} of {entries.length} in
              </span>
            </div>

            <div className="space-y-2">
              {visible.map((e) => {
                const open = openId === e.id;
                const missing = !e.time.trim() || !e.description.trim() || !e.bio.trim() || e.objectives.filter((o) => o.trim()).length < 3;
                return (
                  <div key={e.id} className={`bg-white rounded-2xl border shadow-sm ${e.include ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => patch(e.id, { include: !e.include })}
                        title={e.include ? "In the document. Click to leave them out." : "Left out. Click to include them."}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${e.include ? "bg-[#0E5566] text-white" : "bg-slate-100 text-slate-400"}`}
                      >
                        {e.include ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => setOpenId(open ? null : e.id)} className="flex-1 min-w-0 text-left">
                        <div className="text-[13.5px] font-bold text-slate-900 truncate">
                          {e.name}
                          {e.sessionCount > 1 && (
                            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 align-middle">
                              {e.sessionCount} sessions
                            </span>
                          )}
                        </div>
                        <div className="text-[11.5px] text-slate-500 truncate">
                          {e.time || <span className="text-amber-600 font-semibold">No time set</span>}
                          {e.title ? ` · ${e.title}` : ""}
                        </div>
                      </button>
                      {missing && e.include && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <div className="flex flex-col shrink-0">
                        <button type="button" onClick={() => move(e.id, -1)} className="text-slate-300 hover:text-slate-600 leading-none" title="Move up">
                          <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                        </button>
                        <button type="button" onClick={() => move(e.id, 1)} className="text-slate-300 hover:text-slate-600 leading-none" title="Move down">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button type="button" onClick={() => setOpenId(open ? null : e.id)} className="text-slate-400 shrink-0">
                        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>

                    {open && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label="Name as printed">
                            <input value={e.name} onChange={(ev) => patch(e.id, { name: ev.target.value })} className={inputClass} />
                          </Field>
                          <Field label="Role and organization">
                            <input value={e.role} onChange={(ev) => patch(e.id, { role: ev.target.value })} className={inputClass} />
                          </Field>
                          <Field label="Day">
                            <input value={e.day} onChange={(ev) => patch(e.id, { day: ev.target.value })} placeholder="Day 1 · Saturday, August 15" className={inputClass} />
                          </Field>
                          <Field label="Speaking time">
                            <input value={e.time} onChange={(ev) => patch(e.id, { time: ev.target.value })} placeholder="10:50 AM – 12:00 PM" className={inputClass} />
                          </Field>
                        </div>
                        <Field label="Presentation title">
                          <input value={e.title} onChange={(ev) => patch(e.id, { title: ev.target.value })} className={inputClass} />
                        </Field>
                        {e.submittedTitle && e.submittedTitle !== e.title && (
                          <p className="text-[11px] text-slate-500 -mt-1.5">
                            They submitted it as &ldquo;{e.submittedTitle}&rdquo;.{" "}
                            <button type="button" onClick={() => patch(e.id, { title: e.submittedTitle })} className="font-semibold text-[#0066B3]">
                              Use theirs
                            </button>
                          </p>
                        )}
                        <Field label="Description">
                          <textarea value={e.description} onChange={(ev) => patch(e.id, { description: ev.target.value })} rows={5} className={inputClass} />
                        </Field>
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Learning objectives</div>
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="flex items-start gap-2 mb-1.5">
                              <span className="w-5 h-5 mt-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                              <textarea
                                value={e.objectives[i]}
                                onChange={(ev) => setObjective(e.id, i, ev.target.value)}
                                rows={2}
                                placeholder={`Objective ${i + 1}`}
                                className={inputClass}
                              />
                            </div>
                          ))}
                        </div>
                        <Field label="Bio">
                          <textarea value={e.bio} onChange={(ev) => patch(e.id, { bio: ev.target.value })} rows={6} className={inputClass} />
                        </Field>
                        {e.hasHeadshot && (
                          <Toggle checked={e.showHeadshot} onChange={(v) => patch(e.id, { showHeadshot: v })} label="Include their headshot" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {!visible.length && (
                <div className="text-center text-[13px] text-slate-400 py-10">Nobody matches that search.</div>
              )}
            </div>
          </div>

          {/* Live preview of exactly what prints */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 inline-flex items-center gap-1.5">
              <GripVertical className="w-3 h-3" /> Preview
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-200/60 p-3 max-h-[78vh] overflow-auto">
              {/* Shown as actual letter sheets at reduced zoom, so page breaks
                  are visible here rather than discovered in the printout. */}
              <div style={{ zoom: 0.62 }}>
                <BookDocument doc={doc} entries={included} sheet />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The real thing. Hidden on screen, and the only thing on paper. */}
      <div className="print-only">
        <BookDocument doc={doc} entries={included} />
      </div>
    </>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E5566]/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded accent-[#0E5566]" />
      <span className="text-[12.5px] font-medium text-slate-700">{label}</span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// The document
// ---------------------------------------------------------------------------

const P = {
  ink: "#0B1F25",
  soft: "#3A5560",
  muted: "#6B7F87",
  gold: "#C9A14B",
  goldSoft: "#EBDCB6",
  teal: "#0E5566",
  rule: "#E3DAC6",
  serif: "Georgia, 'Times New Roman', serif",
};

/**
 * `sheet` draws each page as a letter-sized white sheet on a grey desk, for the
 * on-screen preview. Printing uses the same component with it off, so the paper
 * and the preview can never drift apart.
 */
function BookDocument({ doc, entries, sheet = false }: { doc: Doc; entries: Entry[]; sheet?: boolean }) {
  // A day heading prints once, above the first speaker of that day.
  let lastDay = "";
  const sheetStyle: React.CSSProperties = sheet
    ? { width: 816, minHeight: 1056, margin: "0 auto 18px", background: "#fff", boxShadow: "0 2px 12px rgba(11,31,37,0.16)" }
    : {};
  return (
    <div className="book" style={{ fontFamily: P.serif, color: P.ink, background: sheet ? "transparent" : "#fff" }}>
      {doc.cover && <Cover doc={doc} count={entries.length} sheetStyle={sheetStyle} />}
      {entries.map((e, i) => {
        const dayLabel = doc.dayHeadings && e.day && e.day !== lastDay ? e.day : "";
        if (e.day) lastDay = e.day;
        return (
          <SpeakerPage
            key={e.id}
            entry={e}
            doc={doc}
            dayLabel={dayLabel}
            breakBefore={doc.onePerPage && (i > 0 || doc.cover)}
            sheetStyle={doc.onePerPage ? sheetStyle : {}}
          />
        );
      })}
      {!entries.length && (
        <div className="page" style={{ padding: "0.9in", textAlign: "center", color: P.muted, ...sheetStyle }}>
          Nobody is included yet. Turn a speaker on with the eye button.
        </div>
      )}
    </div>
  );
}

function Cover({ doc, count, sheetStyle }: { doc: Doc; count: number; sheetStyle: React.CSSProperties }) {
  return (
    <section className="page cover" style={{ breakAfter: "page", padding: "1.1in 0.9in", textAlign: "center", ...sheetStyle }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${P.gold}, ${P.goldSoft}, ${P.gold})`, marginBottom: 48 }} />
      <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: P.gold, fontWeight: 700 }}>
        {doc.subtitle}
      </div>
      <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: "22px 0 0", fontWeight: 400 }}>{doc.title}</h1>
      <div style={{ margin: "26px auto 0", width: 70, height: 1, background: P.gold }} />
      <div style={{ marginTop: 26, fontSize: 15, color: P.soft }}>
        August 15 &amp; 16, 2026 &middot; Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: P.muted }}>
        {count} {count === 1 ? "presenter" : "presenters"}
      </div>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${P.gold}, ${P.goldSoft}, ${P.gold})`, marginTop: 48 }} />
    </section>
  );
}

function SpeakerPage({ entry, doc, dayLabel, breakBefore, sheetStyle }: {
  entry: Entry; doc: Doc; dayLabel: string; breakBefore: boolean; sheetStyle: React.CSSProperties;
}) {
  const objectives = entry.objectives.map((o) => o.trim()).filter(Boolean);
  const showShot = doc.headshots && entry.showHeadshot && entry.hasHeadshot;

  return (
    <section
      className="page speaker"
      style={{
        breakBefore: breakBefore ? "page" : "auto",
        breakInside: doc.onePerPage ? "auto" : "avoid",
        padding: doc.onePerPage ? "0.85in 0.9in" : "0.45in 0.9in",
        borderTop: doc.onePerPage ? "none" : `1px solid ${P.rule}`,
        ...sheetStyle,
      }}
    >
      {dayLabel && (
        <div style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: P.gold, fontWeight: 700, marginBottom: 18 }}>
          {dayLabel}
        </div>
      )}

      <div style={{ display: "flex", gap: 22, alignItems: "flex-start" }}>
        {showShot && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/presenters/headshot/${entry.id}`}
            alt=""
            style={{
              width: 112, height: 112, objectFit: "cover", borderRadius: 6,
              border: `1px solid ${P.rule}`, flexShrink: 0,
            }}
          />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          {entry.time && (
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: P.teal, fontWeight: 700 }}>
              {entry.time}
            </div>
          )}
          <h2 style={{ fontSize: 25, lineHeight: 1.2, margin: "6px 0 0", fontWeight: 700 }}>{entry.name}</h2>
          {entry.role && (
            <div style={{ fontSize: 13, color: P.muted, marginTop: 3, fontStyle: "italic" }}>{entry.role}</div>
          )}
          {entry.title && (
            <div style={{ fontSize: 17, lineHeight: 1.35, color: P.ink, marginTop: 12, fontWeight: 700 }}>
              {entry.title}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: P.gold, opacity: 0.55, margin: "20px 0 0" }} />

      {doc.descriptions && entry.description && (
        <Block label="About the session">
          <Paragraphs text={entry.description} />
        </Block>
      )}

      {doc.objectives && objectives.length > 0 && (
        <Block label="Learning objectives">
          <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
            {objectives.map((o, i) => (
              <li key={i} style={{ display: "flex", gap: 11, marginBottom: 7, fontSize: 13.5, lineHeight: 1.55, color: P.soft }}>
                <span style={{ color: P.gold, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                <span>{o}</span>
              </li>
            ))}
          </ol>
        </Block>
      )}

      {doc.bios && entry.bio && (
        <Block label="About the presenter">
          <Paragraphs text={entry.bio} />
        </Block>
      )}
    </section>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 20, breakInside: "avoid" }}>
      <div style={{ fontSize: 9.5, letterSpacing: "0.26em", textTransform: "uppercase", color: P.gold, fontWeight: 700, marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Paragraphs({ text }: { text: string }) {
  const paras = text.split(/\r?\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} style={{ fontSize: 13.5, lineHeight: 1.62, color: P.soft, margin: i ? "9px 0 0" : 0 }}>
          {p}
        </p>
      ))}
    </>
  );
}

// Letter paper, comfortable margins, and no browser headers competing with the
// gold rules. The preview on screen is the same component, so what is on the
// page is what comes out of the printer.
function PrintStyles() {
  return (
    <style>{`
      .print-only { display: none; }
      @media print {
        @page { size: letter portrait; margin: 0; }
        html, body { background: #fff !important; }
        body * { visibility: hidden; }
        .print-only, .print-only * { visibility: visible; }
        .print-only { display: block; position: absolute; inset: 0; width: 100%; }
        .no-print { display: none !important; }
        .book { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page { page-break-inside: auto; }
      }
    `}</style>
  );
}
