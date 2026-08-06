"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, Check, ChevronDown, ChevronRight, Loader2, Printer,
  RotateCcw, Search, AlertTriangle, GripVertical, Eye, EyeOff, Users, Combine, Split,
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
  /**
   * The id of the entry this one shares a page with. Co-presenters submit the
   * same session twice, once each, and printing that twice reads as a mistake:
   * the same title, the same description, the same objectives, on consecutive
   * pages. Combined, they get one page with both headshots, one set of session
   * copy, and a bio each.
   */
  combinedWith: string | null;
  /** Kept so a combine can only be offered between people in the same slot. */
  presenterId: string;
};

/** A page: one presenter, or several who share a session. */
type Group = { lead: Entry; others: Entry[] };

function groupEntries(list: Entry[]): Group[] {
  const ids = new Set(list.map((e) => e.id));
  // A partner whose lead was switched off falls back to its own page rather
  // than vanishing from the book.
  const isFolded = (e: Entry) => !!e.combinedWith && ids.has(e.combinedWith);
  return list
    .filter((e) => !isFolded(e))
    .map((lead) => ({ lead, others: list.filter((o) => o.combinedWith === lead.id) }));
}

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
    combinedWith: null,
    presenterId: e.presenterId,
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

  // Fold one entry into another's page, or pull it back out.
  const combine = useCallback((id: string, leadId: string | null) => {
    setEntries((prev) => prev.map((e) => {
      if (e.id === id) return { ...e, combinedWith: leadId };
      // Nothing may hang off an entry that has just become a partner itself.
      if (leadId && e.combinedWith === id) return { ...e, combinedWith: leadId };
      return e;
    }));
  }, []);

  /**
   * Who else is on this exact slot and could share the page. Same scheduled
   * session, different person, and neither already folded into someone else.
   */
  const partnerFor = useCallback((e: Entry): Entry | null => {
    if (e.combinedWith || e.order >= 9999) return null;
    return entries.find((o) =>
      o.id !== e.id && o.include && o.order === e.order &&
      o.presenterId !== e.presenterId && !o.combinedWith &&
      !entries.some((x) => x.combinedWith === o.id)
    ) || null;
  }, [entries]);

  const pendingPairs = useMemo(() => {
    const seen = new Set<string>();
    const pairs: [Entry, Entry][] = [];
    for (const e of entries) {
      if (!e.include || seen.has(e.id)) continue;
      const p = partnerFor(e);
      if (p && !seen.has(p.id)) {
        pairs.push([e, p]);
        seen.add(e.id);
        seen.add(p.id);
      }
    }
    return pairs;
  }, [entries, partnerFor]);

  const combineAll = useCallback(() => {
    setEntries((prev) => {
      const next = [...prev];
      const taken = new Set<string>();
      for (const e of next) {
        if (!e.include || e.combinedWith || taken.has(e.id) || e.order >= 9999) continue;
        const p = next.find((o) =>
          o.id !== e.id && o.include && o.order === e.order &&
          o.presenterId !== e.presenterId && !o.combinedWith && !taken.has(o.id)
        );
        if (!p) continue;
        taken.add(e.id);
        taken.add(p.id);
        const i = next.indexOf(p);
        next[i] = { ...p, combinedWith: e.id };
      }
      return next;
    });
  }, []);

  const included = useMemo(() => entries.filter((e) => e.include), [entries]);
  const groups = useMemo(() => groupEntries(included), [included]);
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
    return { noTime, noDescription, noBio, thinObjectives, twice: Array.from(twice) };
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

        {pendingPairs.length > 0 && (
          <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-sky-900 inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Co-presenters on the same session
              </div>
              <p className="text-[12.5px] text-sky-800 mt-1">
                {pendingPairs.map(([a, b]) => `${a.name} and ${b.name}`).join("; ")}.{" "}
                {pendingPairs.length === 1 ? "They share" : "Each pair shares"} one session, so right now the
                book prints the same title, description and objectives twice. Put {pendingPairs.length === 1 ? "them" : "each pair"} on one
                page with both headshots and a bio each.
              </p>
            </div>
            <button
              type="button"
              onClick={combineAll}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-white bg-sky-700 hover:bg-sky-800"
            >
              <Combine className="w-3.5 h-3.5" /> Combine {pendingPairs.length > 1 ? `all ${pendingPairs.length}` : ""}
            </button>
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
                const lead = e.combinedWith ? entries.find((x) => x.id === e.combinedWith) : null;
                const partners = entries.filter((x) => x.combinedWith === e.id);
                const candidate = partnerFor(e);
                // A folded partner only contributes their name, role, bio and
                // headshot, so the shared-copy warnings do not apply to them.
                const missing = lead
                  ? !e.bio.trim()
                  : !e.time.trim() || !e.description.trim() || !e.bio.trim() || e.objectives.filter((o) => o.trim()).length < 3;
                return (
                  <div
                    key={e.id}
                    className={`bg-white rounded-2xl border shadow-sm ${e.include ? "border-slate-200" : "border-slate-100 opacity-60"} ${lead ? "ml-6 border-l-4 border-l-sky-300" : ""}`}
                  >
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
                          {lead ? (
                            <span className="text-sky-700 font-semibold">Sharing {lead.name}&rsquo;s page</span>
                          ) : (
                            <>
                              {e.time || <span className="text-amber-600 font-semibold">No time set</span>}
                              {e.title ? ` · ${e.title}` : ""}
                              {partners.length > 0 && (
                                <span className="text-sky-700 font-semibold">
                                  {" "}&middot; with {partners.map((x) => x.name).join(", ")}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </button>
                      {candidate && (
                        <button
                          type="button"
                          onClick={() => combine(candidate.id, e.id)}
                          title={`Put ${candidate.name} on this page: both headshots, one title, description and set of objectives, and a bio each.`}
                          className="shrink-0 text-[10.5px] font-bold px-2 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 inline-flex items-center gap-1"
                        >
                          <Combine className="w-3 h-3" /> Combine
                        </button>
                      )}
                      {lead && (
                        <button
                          type="button"
                          onClick={() => combine(e.id, null)}
                          title="Give them their own page again"
                          className="shrink-0 text-[10.5px] font-bold px-2 py-1 rounded-lg bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1"
                        >
                          <Split className="w-3 h-3" /> Separate
                        </button>
                      )}
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
                          {!lead && (
                            <>
                              <Field label="Day">
                                <input value={e.day} onChange={(ev) => patch(e.id, { day: ev.target.value })} placeholder="Day 1 · Saturday, August 15" className={inputClass} />
                              </Field>
                              <Field label="Speaking time">
                                <input value={e.time} onChange={(ev) => patch(e.id, { time: ev.target.value })} placeholder="10:50 AM – 12:00 PM" className={inputClass} />
                              </Field>
                            </>
                          )}
                        </div>
                        {lead && (
                          <p className="text-[11.5px] text-sky-700 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
                            The time, title, description and objectives for this page come from{" "}
                            <strong>{lead.name}</strong>. Edit them there. What this person adds here is their
                            name, role, headshot and bio.
                          </p>
                        )}
                        {!lead && (
                        <Field label="Presentation title">
                          <input value={e.title} onChange={(ev) => patch(e.id, { title: ev.target.value })} className={inputClass} />
                        </Field>
                        )}
                        {!lead && e.submittedTitle && e.submittedTitle !== e.title && (
                          <p className="text-[11px] text-slate-500 -mt-1.5">
                            They submitted it as &ldquo;{e.submittedTitle}&rdquo;.{" "}
                            <button type="button" onClick={() => patch(e.id, { title: e.submittedTitle })} className="font-semibold text-[#0066B3]">
                              Use theirs
                            </button>
                          </p>
                        )}
                        {!lead && (
                        <Field label="Description">
                          <textarea value={e.description} onChange={(ev) => patch(e.id, { description: ev.target.value })} rows={5} className={inputClass} />
                        </Field>
                        )}
                        {!lead && (
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
                        )}
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
                <BookDocument doc={doc} groups={groups} sheet />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The real thing. Hidden on screen, and the only thing on paper. */}
      <div className="print-only">
        <BookDocument doc={doc} groups={groups} />
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

// The two host brands carry the document: AALB's dark teal for structure,
// Lurie Children's light blue for the accents that sit on top of it. Gold is
// kept back to a single hairline, so the page reads as the conference's rather
// than as a certificate.
const P = {
  ink: "#0B1F25",
  soft: "#33505B",
  muted: "#6B7F87",
  teal: "#0E5566",
  tealDark: "#0E4456",
  tealSoft: "#E6EEF0",
  blue: "#2A8FCC",
  blueDeep: "#1E6FA2",
  blueSoft: "#E6F2FB",
  gold: "#C9A14B",
  rule: "#DCE5E8",
  serif: "Georgia, 'Times New Roman', serif",
};

/**
 * `sheet` draws each page as a letter-sized white sheet on a grey desk, for the
 * on-screen preview. Printing uses the same component with it off, so the paper
 * and the preview can never drift apart.
 *//**
 * `sheet` draws each page as a letter-sized white sheet on a grey desk, for the
 * on-screen preview. Printing uses the same component with it off, so the paper
 * and the preview can never drift apart.
 */
function BookDocument({ doc, groups, sheet = false }: { doc: Doc; groups: Group[]; sheet?: boolean }) {
  // A day heading prints once, above the first page of that day.
  let lastDay = "";
  const sheetStyle: React.CSSProperties = sheet
    ? { width: 816, minHeight: 1056, margin: "0 auto 18px", background: "#fff", boxShadow: "0 2px 12px rgba(11,31,37,0.16)" }
    : {};
  const people = groups.reduce((n, g) => n + 1 + g.others.length, 0);
  return (
    <div className="book" style={{ fontFamily: P.serif, color: P.ink, background: sheet ? "transparent" : "#fff" }}>
      {doc.cover && <Cover doc={doc} count={people} sheetStyle={sheetStyle} />}
      {groups.map((g, i) => {
        const dayLabel = doc.dayHeadings && g.lead.day && g.lead.day !== lastDay ? g.lead.day : "";
        if (g.lead.day) lastDay = g.lead.day;
        return (
          <SpeakerPage
            key={g.lead.id}
            group={g}
            doc={doc}
            dayLabel={dayLabel}
            breakBefore={doc.onePerPage && (i > 0 || doc.cover)}
            sheetStyle={doc.onePerPage ? sheetStyle : {}}
          />
        );
      })}
      {!groups.length && (
        <div className="page" style={{ padding: "0.9in", textAlign: "center", color: P.muted, ...sheetStyle }}>
          Nobody is included yet. Turn a speaker on with the eye button.
        </div>
      )}
    </div>
  );
}

/** The teal-to-blue band that carries both hosts' colours across the page. */
function BrandRule({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: 4,
        background: `linear-gradient(90deg, ${P.tealDark} 0%, ${P.teal} 38%, ${P.blue} 78%, ${P.blueSoft} 100%)`,
        ...style,
      }}
    />
  );
}

function Cover({ doc, count, sheetStyle }: { doc: Doc; count: number; sheetStyle: React.CSSProperties }) {
  return (
    <section className="page cover" style={{ breakAfter: "page", padding: "1.1in 0.9in", textAlign: "center", ...sheetStyle }}>
      <BrandRule style={{ marginBottom: 46 }} />
      <div style={{ fontSize: 10.5, letterSpacing: "0.3em", textTransform: "uppercase", color: P.blueDeep, fontWeight: 700 }}>
        {doc.subtitle}
      </div>
      <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: "22px 0 0", fontWeight: 400, color: P.tealDark }}>{doc.title}</h1>
      <div style={{ margin: "26px auto 0", width: 76, height: 2, background: P.blue }} />
      <div style={{ marginTop: 26, fontSize: 15, color: P.soft }}>
        August 15 &amp; 16, 2026 &middot; Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: P.muted }}>
        {count} {count === 1 ? "presenter" : "presenters"}
      </div>
      <BrandRule style={{ marginTop: 46 }} />
      <div style={{ marginTop: 10, height: 1, background: P.gold, opacity: 0.5 }} />
    </section>
  );
}

function SpeakerPage({ group, doc, dayLabel, breakBefore, sheetStyle }: {
  group: Group; doc: Doc; dayLabel: string; breakBefore: boolean; sheetStyle: React.CSSProperties;
}) {
  const { lead, others } = group;
  const people = [lead, ...others];
  const objectives = lead.objectives.map((o) => o.trim()).filter(Boolean);
  const withShots = people.filter((p) => doc.headshots && p.showHeadshot && p.hasHeadshot);
  const shared = people.length > 1;

  return (
    <section
      className="page speaker"
      style={{
        breakBefore: breakBefore ? "page" : "auto",
        breakInside: doc.onePerPage ? "auto" : "avoid",
        padding: doc.onePerPage ? "0.8in 0.9in" : "0.45in 0.9in",
        borderTop: doc.onePerPage ? "none" : `1px solid ${P.rule}`,
        ...sheetStyle,
      }}
    >
      {dayLabel && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9.5, letterSpacing: "0.28em", textTransform: "uppercase", color: P.blueDeep, fontWeight: 700 }}>
            {dayLabel}
          </div>
          <BrandRule style={{ height: 2, marginTop: 7 }} />
        </div>
      )}

      {lead.time && (
        <div
          style={{
            display: "inline-block", background: P.tealSoft, color: P.tealDark,
            fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700,
            padding: "5px 11px", borderRadius: 3,
          }}
        >
          {lead.time}
        </div>
      )}

      {/* Co-presenters sit side by side, each under their own headshot, so the
          page reads as one session with two people rather than two pages that
          happen to repeat each other. */}
      <div
        style={{
          display: "flex",
          gap: shared ? 28 : 22,
          alignItems: "flex-start",
          marginTop: 14,
        }}
      >
        {people.map((p, i) => {
          const shot = doc.headshots && p.showHeadshot && p.hasHeadshot;
          return (
            <div key={p.id} style={{ display: "flex", gap: 16, alignItems: "flex-start", flex: shared ? 1 : "0 1 auto", minWidth: 0 }}>
              {shot && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/presenters/headshot/${p.presenterId}`}
                  alt=""
                  style={{
                    width: shared ? 92 : 112, height: shared ? 92 : 112, objectFit: "cover",
                    borderRadius: 4, border: `2px solid ${i === 0 ? P.teal : P.blue}`, flexShrink: 0,
                  }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: shared ? 20 : 25, lineHeight: 1.2, fontWeight: 700, color: P.tealDark }}>
                  {p.name}
                </div>
                {p.role && (
                  <div style={{ fontSize: shared ? 11.5 : 13, color: P.muted, marginTop: 4, fontStyle: "italic", lineHeight: 1.4 }}>
                    {p.role}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {/* Without a single headshot the row would hug the left edge oddly. */}
        {!withShots.length && !shared && <div style={{ flex: 1 }} />}
      </div>

      {lead.title && (
        <div style={{ fontSize: 17.5, lineHeight: 1.35, color: P.ink, marginTop: 18, fontWeight: 700 }}>
          {lead.title}
        </div>
      )}

      <div style={{ height: 2, background: `linear-gradient(90deg, ${P.teal} 0%, ${P.blue} 100%)`, margin: "16px 0 0", opacity: 0.9 }} />

      {doc.descriptions && lead.description && (
        <Block label="About the session">
          <Paragraphs text={lead.description} />
        </Block>
      )}

      {doc.objectives && objectives.length > 0 && (
        <Block label="Learning objectives">
          <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
            {objectives.map((o, i) => (
              <li key={i} style={{ display: "flex", gap: 11, marginBottom: 8, fontSize: 13.5, lineHeight: 1.55, color: P.soft }}>
                <span
                  style={{
                    flexShrink: 0, width: 19, height: 19, borderRadius: 10, background: P.blueSoft,
                    color: P.blueDeep, fontSize: 10.5, fontWeight: 700, textAlign: "center",
                    lineHeight: "19px", marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <span>{o}</span>
              </li>
            ))}
          </ol>
        </Block>
      )}

      {doc.bios && people.some((p) => p.bio.trim()) && (
        <Block label={shared ? "About the presenters" : "About the presenter"}>
          {people.filter((p) => p.bio.trim()).map((p, i) => (
            <div key={p.id} style={{ marginTop: i ? 14 : 0, breakInside: "avoid" }}>
              {shared && (
                <div style={{ fontSize: 12.5, fontWeight: 700, color: P.teal, marginBottom: 4 }}>{p.name}</div>
              )}
              <Paragraphs text={p.bio} />
            </div>
          ))}
        </Block>
      )}
    </section>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 20, breakInside: "avoid" }}>
      <div style={{ fontSize: 9.5, letterSpacing: "0.24em", textTransform: "uppercase", color: P.blueDeep, fontWeight: 700, marginBottom: 8 }}>
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
