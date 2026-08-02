"use client";

import { useMemo, useState } from "react";
import { Search, Mail, Send, MapPin, Monitor, Check, Eye, ArrowDownWideNarrow, Clock, FileDown } from "lucide-react";
import {
  ATTENDEE_STEP_LABELS, ATTENDEE_SOURCE_LABELS, AttendeeStep,
  attendeeStep, attendeeStepMoment, attendeeSource,
} from "@/lib/attendees";
import { fmtElapsed, medianLabel, countedClickAt } from "@/lib/engagement";
import { ALUMNI_SUBJECT_VARIANTS, STUDENT_SUBJECT_VARIANTS, CMI_SUBJECT_VARIANTS } from "@/lib/subject-variants";

export type Attendee = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  affiliation: string | null;
  attendanceMode: string | null;
  status: string;
  paid: boolean;
  guideSentAt?: string | null;
  // Present on every row from the API; declared so the page can mirror the
  // server's send filter exactly when it counts guide coverage.
  isTest?: boolean;
  unsubscribedAt?: string | null;
  finalPriceCents: number | null;
  discountPercent: number;
  invitedById?: string | null;
  invitedAt: string | null;
  lastSentAt: string | null;
  viewedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  inviteTemplate?: string | null;
  subjectVariant?: string | null;
  cohort?: string | null;
  cohortOrder?: number | null;
  notes?: string | null;
  nudgeCount?: number;
  lastNudgedAt?: string | null;
  // Set when they're attending under a partner's table rather than as an
  // individual registration. compFromSponsor means one of that partner's
  // included tickets.
  sponsor?: { id: string; companyName: string } | null;
  compFromSponsor?: boolean;
};

// "1st reminder", "2nd reminder", "3rd reminder", "4 reminders".
function reminderLabel(n: number): string {
  if (n === 1) return "1st reminder";
  if (n === 2) return "2nd reminder";
  if (n === 3) return "3rd reminder";
  return `${n} reminders`;
}

// The AALB-community relationship badge, derived from the invite template. Only
// shown for the three community framings; regular invitees get no badge. Gold
// for alumni (certificate holders), teal for current students, slate for former.
const RELATIONSHIP_BADGE: Record<string, { label: string; className: string }> = {
  alumni: { label: "Alumnus", className: "bg-amber-50 text-amber-800 border-amber-200" },
  student: { label: "AALB student", className: "bg-teal-50 text-teal-700 border-teal-200" },
  "former-student": { label: "Former student", className: "bg-slate-100 text-slate-600 border-slate-200" },
  cmi: { label: "NBCMI CMI", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  chicago: { label: "Chicago invite", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

// The funnel, left to right, in plain language. Each card owns one or more of
// the precise steps; the row badge still shows the exact step (Emailed vs
// Opened) so nothing is hidden, the cards just group for the headline count.
const STEP_CARDS: {
  key: string; label: string; sub: string; accent: string; steps: AttendeeStep[]; hero?: boolean;
}[] = [
  { key: "queued",      label: "Not emailed", sub: "queued, not sent",     accent: "#64748b", steps: ["queued"] },
  { key: "emailed",     label: "Emailed",     sub: "sent, awaiting reply", accent: "#0284c7", steps: ["emailed", "opened"] },
  { key: "registering", label: "Registering", sub: "started, not paid",    accent: "#d97706", steps: ["registering"] },
  { key: "attending",   label: "Attending",   sub: "paid, coming",         accent: "#16a34a", steps: ["attending"], hero: true },
  { key: "declined",    label: "Declined",    sub: "not coming",           accent: "#64748b", steps: ["declined"] },
];

function shortDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AttendeesView({
  attendees, onOpenDetail, onCompose, onSendPortal, onQueueInvites, onSendInvitesNow, onNudge, onSendGuide,
}: {
  attendees: Attendee[];
  onOpenDetail: (id: string) => void;
  onCompose: (ids: string[]) => void;
  onSendPortal: (ids: string[]) => void;
  onQueueInvites: (ids: string[]) => void;
  onSendInvitesNow: (ids: string[]) => void;
  onNudge: (ids: string[]) => void;
  onSendGuide: (ids: string[]) => void;
}) {
  const [cardFilter, setCardFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "invited" | "organic">("all");
  const [modeFilter, setModeFilter] = useState<"all" | "in-person" | "virtual">("all");
  const [relFilter, setRelFilter] = useState<string>("all");
  const [cohortFilter, setCohortFilter] = useState<string>("all");
  const [sortNewestSession, setSortNewestSession] = useState(false);
  const [clickedOnly, setClickedOnly] = useState(false);
  // "Has the guide" / "still needs it", so a send can be checked afterwards
  // instead of taken on trust.
  const [guideFilter, setGuideFilter] = useState<"all" | "sent" | "unsent">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // The training sessions present in the loaded list, newest (highest cohort
  // number) first, for the session filter dropdown. Only AALB students carry a
  // cohort, so this stays empty until the roster is loaded.
  const cohorts = useMemo(() => {
    const seen = new Map<string, number>();
    for (const a of attendees) {
      if (!a.cohort) continue;
      if (!seen.has(a.cohort)) seen.set(a.cohort, a.cohortOrder ?? -1);
    }
    return Array.from(seen.entries())
      .sort((x, y) => y[1] - x[1])
      .map(([c]) => c);
  }, [attendees]);
  // Whether any community members (alumni/student/former) are loaded, so the
  // relationship filter only appears once there's something to filter.
  const hasCommunity = useMemo(
    () => attendees.some((a) => a.inviteTemplate && RELATIONSHIP_BADGE[a.inviteTemplate]),
    [attendees]
  );

  // Engagement: "delivered" is when the invite was sent (we have no SMTP
  // delivery receipt), "clicked" is when they first loaded their invite link.
  // A click under ~45s after the send is discounted as our own test open.
  const deliveredOf = (a: Attendee) => a.invitedAt || a.lastSentAt;
  const clickAt = (a: Attendee) => countedClickAt(deliveredOf(a), a.viewedAt);
  const everSent = useMemo(() => attendees.filter((a) => deliveredOf(a)), [attendees]);
  const clickedPeople = useMemo(() => attendees.filter((a) => clickAt(a)), [attendees]);
  const clickLatencies = useMemo(() => clickedPeople
    .map((a) => {
      const d = deliveredOf(a);
      const c = clickAt(a);
      return d && c ? new Date(c).getTime() - new Date(d).getTime() : NaN;
    })
    .filter((ms) => Number.isFinite(ms) && ms >= 0), [clickedPeople]);
  const clickRate = everSent.length ? Math.round((clickedPeople.length / everSent.length) * 100) : 0;

  // Subject-line A/B (alumni only): sent vs clicked per variant, so we can see
  // which line actually earns opens.
  const abRows = useMemo(() => {
    const rows = ALUMNI_SUBJECT_VARIANTS.map((v) => ({ id: v.id, label: v.label, example: v.make("Alex"), sent: 0, clicked: 0 }));
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const a of attendees) {
      if (a.inviteTemplate !== "alumni" || !a.subjectVariant) continue;
      if (!(a.invitedAt || a.lastSentAt)) continue;
      const r = byId.get(a.subjectVariant);
      if (!r) continue;
      r.sent++;
      if (clickAt(a)) r.clicked++;
    }
    return rows;
  }, [attendees]);
  const abSent = abRows.reduce((n, r) => n + r.sent, 0);

  // Same A/B readout for the student / former-student career-first set. Note:
  // sends made before this set existed used the alumni lines, so early numbers
  // here reflect the re-send onward, not the original blast.
  const stuRows = useMemo(() => {
    const rows = STUDENT_SUBJECT_VARIANTS.map((v) => ({ id: v.id, label: v.label, example: v.make("Alex"), sent: 0, clicked: 0 }));
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const a of attendees) {
      if ((a.inviteTemplate !== "student" && a.inviteTemplate !== "former-student") || !a.subjectVariant) continue;
      if (!(a.invitedAt || a.lastSentAt)) continue;
      const r = byId.get(a.subjectVariant);
      if (!r) continue;
      r.sent++;
      if (clickAt(a)) r.clicked++;
    }
    return rows;
  }, [attendees]);
  const stuSent = stuRows.reduce((n, r) => n + r.sent, 0);

  // And for the NBCMI registry cold list.
  const cmiRows = useMemo(() => {
    const rows = CMI_SUBJECT_VARIANTS.map((v) => ({ id: v.id, label: v.label, example: v.make("Alex"), sent: 0, clicked: 0 }));
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const a of attendees) {
      if (a.inviteTemplate !== "cmi" || !a.subjectVariant) continue;
      if (!(a.invitedAt || a.lastSentAt)) continue;
      const r = byId.get(a.subjectVariant);
      if (!r) continue;
      r.sent++;
      if (clickAt(a)) r.clicked++;
    }
    return rows;
  }, [attendees]);
  const cmiSent = cmiRows.reduce((n, r) => n + r.sent, 0);

  // One pass: tag every attendee with its precise step, then tally per card.
  const stepOf = useMemo(() => {
    const m = new Map<string, AttendeeStep>();
    for (const a of attendees) m.set(a.id, attendeeStep(a));
    return m;
  }, [attendees]);

  const cardCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const card of STEP_CARDS) c[card.key] = 0;
    for (const a of attendees) {
      const step = stepOf.get(a.id)!;
      const card = STEP_CARDS.find((cd) => cd.steps.includes(step));
      if (card) c[card.key]++;
    }
    return c;
  }, [attendees, stepOf]);

  const activeCard = STEP_CARDS.find((c) => c.key === cardFilter) || null;

  const filtered = useMemo(() => {
    const list = attendees.filter((a) => {
      // The Clicked view is an engagement report, not a funnel step: it gathers
      // everyone who clicked, regardless of which card they sit in now.
      if (clickedOnly) {
        if (!clickAt(a)) return false;
      } else if (activeCard && !activeCard.steps.includes(stepOf.get(a.id)!)) {
        return false;
      }
      if (sourceFilter !== "all" && attendeeSource(a) !== sourceFilter) return false;
      if (modeFilter !== "all" && a.attendanceMode !== modeFilter) return false;
      if (relFilter !== "all" && a.inviteTemplate !== relFilter) return false;
      if (cohortFilter !== "all" && a.cohort !== cohortFilter) return false;
      if (guideFilter === "sent" && !a.guideSentAt) return false;
      if (guideFilter === "unsent" && a.guideSentAt) return false;
      if (search) {
        const s = search.toLowerCase();
        if (![a.firstName, a.lastName, a.email, a.affiliation].some((v) => v?.toLowerCase().includes(s))) return false;
      }
      return true;
    });
    if (clickedOnly) {
      list.sort((a, b) => new Date(clickAt(b) || 0).getTime() - new Date(clickAt(a) || 0).getTime());
    } else if (sortNewestSession) {
      // Newest training session first (highest cohort number). People with no
      // cohort sink to the bottom; ties fall back to most-recently added.
      list.sort((a, b) => {
        const ao = a.cohortOrder ?? -1;
        const bo = b.cohortOrder ?? -1;
        if (bo !== ao) return bo - ao;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return list;
  }, [attendees, activeCard, sourceFilter, modeFilter, relFilter, cohortFilter, guideFilter, clickedOnly, sortNewestSession, search, stepOf]);

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
  // How many of the selected are not-yet-emailed ("queued"): those are the ones
  // "Queue invites" will actually schedule, so we label the button with it.
  const statusById = new Map(attendees.map((a) => [a.id, a.status]));
  const notEmailedSelected = selectedIds.reduce((n, id) => n + (statusById.get(id) === "queued" ? 1 : 0), 0);
  // Selected people in the started-not-paid bucket: the ones a reminder
  // actually reaches (the server skips everyone else and reports it).
  const nudgeableSelected = selectedIds.reduce((n, id) => n + (stepOf.get(id) === "registering" ? 1 : 0), 0);
  // Selected people who have paid: the only ones the guide goes to, since it
  // is a document about turning up rather than about signing up.
  const paidById = new Map(attendees.map((a) => [a.id, a.paid]));
  const guideableSelected = selectedIds.reduce((n, id) => n + (paidById.get(id) ? 1 : 0), 0);

  return (
    <div>
      {/* The funnel, left to right. Click any bucket to filter to it. */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {STEP_CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            sub={card.sub}
            value={cardCounts[card.key]}
            accent={card.accent}
            big={card.hero}
            active={cardFilter === card.key}
            onClick={() => setCardFilter(cardFilter === card.key ? "all" : card.key)}
          />
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, org…" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" />
          </div>
          <Segmented value={sourceFilter} onChange={(v) => setSourceFilter(v as typeof sourceFilter)} options={[["all", "All sources"], ["invited", "Added"], ["organic", "Signed up"]]} />
          <Segmented value={modeFilter} onChange={(v) => setModeFilter(v as typeof modeFilter)} options={[["all", "All"], ["in-person", "In-person"], ["virtual", "Virtual"]]} />
          {hasCommunity && (
            <Segmented
              value={relFilter}
              onChange={setRelFilter}
              options={[["all", "Everyone"], ["alumni", "Alumni"], ["student", "Students"], ["former-student", "Former"], ["cmi", "NBCMI"]]}
            />
          )}
          {cohorts.length > 0 && (
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              title="Filter to one AALB training session"
              className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-2 text-slate-600 outline-none focus:border-teal-500 bg-white"
            >
              <option value="all">All sessions</option>
              {cohorts.map((c) => (
                <option key={c} value={c}>Session {c}</option>
              ))}
            </select>
          )}
          {cohorts.length > 0 && (
            <button
              onClick={() => setSortNewestSession((v) => !v)}
              title="Sort so the most recent training sessions are at the top"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold border rounded-lg px-3 py-2 transition-colors ${sortNewestSession ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              <ArrowDownWideNarrow className="w-3.5 h-3.5" /> Newest session
            </button>
          )}
          <button
            onClick={() => setClickedOnly((v) => !v)}
            title="Show everyone who clicked their invite link, with delivered-vs-clicked timing"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold border rounded-lg px-3 py-2 transition-colors ${clickedOnly ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <Eye className="w-3.5 h-3.5" /> Clicked
          </button>
          <button
            onClick={() => setGuideFilter((v) => (v === "all" ? "sent" : v === "sent" ? "unsent" : "all"))}
            title="Cycle: everyone, only those who have been sent the conference guide, only those who have not"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold border rounded-lg px-3 py-2 transition-colors ${guideFilter !== "all" ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <FileDown className="w-3.5 h-3.5" />
            {guideFilter === "sent" ? "Guide sent" : guideFilter === "unsent" ? "No guide yet" : "Guide"}
          </button>
        </div>

        {/* Engagement report: delivered vs clicked, shown when Clicked is on */}
        {clickedOnly && (
          <div className="px-4 py-3 border-b border-violet-100 bg-violet-50/40 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-violet-700">
              <Eye className="w-3.5 h-3.5" /> Engagement
            </div>
            <EngStat label="Delivered" value={everSent.length.toString()} />
            <EngStat label="Clicked" value={clickedPeople.length.toString()} accent="#7C3AED" />
            <EngStat label="Click rate" value={`${clickRate}%`} accent="#7C3AED" />
            <EngStat label="Median time to click" value={medianLabel(clickLatencies)} />
            <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
              Delivered = when the invite was sent. Time to click is measured from that.
            </span>
          </div>
        )}

        {/* Subject-line A/B (alumni): click rate per subject line */}
        {clickedOnly && abSent > 0 && (
          <div className="px-4 py-3 border-b border-slate-100 bg-white">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Alumni subject lines &middot; click rate</div>
            <div className="space-y-1">
              {abRows.filter((r) => r.sent > 0).sort((a, b) => (b.clicked / b.sent) - (a.clicked / a.sent)).map((r) => {
                const rate = r.sent ? Math.round((r.clicked / r.sent) * 100) : 0;
                return (
                  <div key={r.id} className="flex items-center gap-3 text-xs py-0.5">
                    <span className="w-16 shrink-0 font-bold text-slate-700">{r.label}</span>
                    <span className="flex-1 min-w-0 text-slate-500 truncate" title={r.example}>{r.example.replace(/^Alex,\s*/, "")}</span>
                    <span className="shrink-0 text-slate-400 tabular-nums">{r.clicked}/{r.sent}</span>
                    <span className="w-10 shrink-0 text-right font-bold tabular-nums" style={{ color: "#7C3AED" }}>{rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subject-line A/B (students): the career-first set used from the re-send onward */}
        {clickedOnly && stuSent > 0 && (
          <div className="px-4 py-3 border-b border-slate-100 bg-white">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Student subject lines &middot; click rate</div>
            <div className="space-y-1">
              {stuRows.filter((r) => r.sent > 0).sort((a, b) => (b.clicked / b.sent) - (a.clicked / a.sent)).map((r) => {
                const rate = r.sent ? Math.round((r.clicked / r.sent) * 100) : 0;
                return (
                  <div key={r.id} className="flex items-center gap-3 text-xs py-0.5">
                    <span className="w-16 shrink-0 font-bold text-slate-700">{r.label}</span>
                    <span className="flex-1 min-w-0 text-slate-500 truncate" title={r.example}>{r.example.replace(/^Alex,\s*/, "")}</span>
                    <span className="shrink-0 text-slate-400 tabular-nums">{r.clicked}/{r.sent}</span>
                    <span className="w-10 shrink-0 text-right font-bold tabular-nums" style={{ color: "#0E5566" }}>{rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subject-line A/B (NBCMI registry) */}
        {clickedOnly && cmiSent > 0 && (
          <div className="px-4 py-3 border-b border-slate-100 bg-white">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">NBCMI subject lines &middot; click rate</div>
            <div className="space-y-1">
              {cmiRows.filter((r) => r.sent > 0).sort((a, b) => (b.clicked / b.sent) - (a.clicked / a.sent)).map((r) => {
                const rate = r.sent ? Math.round((r.clicked / r.sent) * 100) : 0;
                return (
                  <div key={r.id} className="flex items-center gap-3 text-xs py-0.5">
                    <span className="w-16 shrink-0 font-bold text-slate-700">{r.label}</span>
                    <span className="flex-1 min-w-0 text-slate-500 truncate" title={r.example}>{r.example.replace(/^Alex,\s*/, "")}</span>
                    <span className="shrink-0 text-slate-400 tabular-nums">{r.clicked}/{r.sent}</span>
                    <span className="w-10 shrink-0 text-right font-bold tabular-nums" style={{ color: "#7C5C10" }}>{rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active-filter hint so it's obvious what the list is showing */}
        {(activeCard || sourceFilter !== "all" || modeFilter !== "all" || relFilter !== "all" || cohortFilter !== "all" || guideFilter !== "all" || sortNewestSession || clickedOnly || search) && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-600">Showing:</span>
            {activeCard && <Pill>{activeCard.label} · {activeCard.sub}</Pill>}
            {sourceFilter !== "all" && <Pill>{sourceFilter === "invited" ? "Added by us" : "Signed up themselves"}</Pill>}
            {guideFilter !== "all" && <Pill>{guideFilter === "sent" ? "Guide sent" : "No guide yet"}</Pill>}
            {modeFilter !== "all" && <Pill>{modeFilter === "virtual" ? "Virtual" : "In-person"}</Pill>}
            {relFilter !== "all" && <Pill>{RELATIONSHIP_BADGE[relFilter]?.label || relFilter}</Pill>}
            {cohortFilter !== "all" && <Pill>Session {cohortFilter}</Pill>}
            {sortNewestSession && <Pill>Newest session first</Pill>}
            {clickedOnly && <Pill>Clicked their link</Pill>}
            {search && <Pill>“{search}”</Pill>}
            <button onClick={() => { setCardFilter("all"); setSourceFilter("all"); setModeFilter("all"); setRelFilter("all"); setCohortFilter("all"); setGuideFilter("all"); setSortNewestSession(false); setClickedOnly(false); setSearch(""); }} className="ml-auto font-semibold text-slate-500 hover:text-slate-800">Clear all</button>
          </div>
        )}

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="px-4 py-2.5 bg-teal-50 border-b border-teal-100 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-teal-800">{selectedIds.length} selected</span>
            {notEmailedSelected > 0 && (
              <button onClick={() => onSendInvitesNow(selectedIds)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0E5566] text-white inline-flex items-center gap-1.5" title="Send the invite to the selected not-yet-emailed people RIGHT NOW — no queue, no waiting (up to 100 per click; others are skipped)">
                <Send className="w-3.5 h-3.5" /> Send invites now ({notEmailedSelected.toLocaleString()})
              </button>
            )}
            {notEmailedSelected > 0 && (
              <button onClick={() => onQueueInvites(selectedIds)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 inline-flex items-center gap-1.5" title="Schedule invites for the not-yet-emailed people into the paced queue instead — they drip out one at a time over the working day">
                <Clock className="w-3.5 h-3.5" /> Queue instead ({notEmailedSelected.toLocaleString()})
              </button>
            )}
            {nudgeableSelected > 0 && (
              <button onClick={() => onNudge(selectedIds)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white inline-flex items-center gap-1.5" style={{ background: "#B45309" }} title="Send the finish-registration reminder to the selected started-not-paid people RIGHT NOW (up to 100 per click; others are skipped). Bumps their reminder count.">
                <Send className="w-3.5 h-3.5" /> Send reminder now ({nudgeableSelected.toLocaleString()})
              </button>
            )}
            {guideableSelected > 0 && (
              <button onClick={() => onSendGuide(selectedIds)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white inline-flex items-center gap-1.5" style={{ background: "#0E4A57" }} title="Email the personalized conference guide to the paid people in your selection, right now. Each PDF is built for that person: their registration, check-in times, and the dietary and access needs we hold for them.">
                <FileDown className="w-3.5 h-3.5" /> Send guide ({guideableSelected.toLocaleString()})
              </button>
            )}
            <button onClick={() => onCompose(selectedIds)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 inline-flex items-center gap-1.5" title="Write and send a one-off message now (capped at 100 for deliverability)"><Mail className="w-3.5 h-3.5" /> Email them</button>
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
              const step = stepOf.get(a.id)!;
              const cfg = ATTENDEE_STEP_LABELS[step];
              const moment = attendeeStepMoment(a);
              const source = attendeeSource(a);
              const sel = selected.has(a.id);
              const when = step === "attending" && a.finalPriceCents != null
                ? `$${(a.finalPriceCents / 100).toFixed(2)}`
                : moment.iso ? `${moment.verb} ${shortDate(moment.iso)}` : moment.verb;
              return (
                <li key={a.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer ${sel ? "bg-teal-50/40" : ""}`} onClick={() => onOpenDetail(a.id)}>
                  <div onClick={(e) => { e.stopPropagation(); toggle(a.id); }}><Checkbox checked={sel} onChange={() => {}} /></div>
                  {/* Colored dot = step, so the eye can scan state down the column */}
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.dot }} title={cfg.blurb} />
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                    {(a.firstName[0] + (a.lastName[0] || "")).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                      {a.firstName} {a.lastName}
                      {a.inviteTemplate && RELATIONSHIP_BADGE[a.inviteTemplate] && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${RELATIONSHIP_BADGE[a.inviteTemplate].className}`}>
                          {RELATIONSHIP_BADGE[a.inviteTemplate].label}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-slate-500 bg-slate-100">{ATTENDEE_SOURCE_LABELS[source]}</span>
                      {a.sponsor && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 shrink-0"
                          title={a.compFromSponsor
                            ? `Attending on an included ticket from ${a.sponsor.companyName}`
                            : `Registered through ${a.sponsor.companyName}'s team link`}
                        >
                          {a.sponsor.companyName}{a.compFromSponsor ? " · comp" : ""}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{a.email}{a.affiliation && ` · ${a.affiliation}`}{a.cohort && ` · Session ${a.cohort}`}</div>
                    {clickedOnly && clickAt(a) && (
                      <div className="mt-0.5 text-[11px] text-violet-700 truncate">
                        {deliveredOf(a)
                          ? <>Delivered {shortDate(deliveredOf(a))} · clicked {fmtElapsed(deliveredOf(a), clickAt(a))} later · {new Date(clickAt(a)!).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</>
                          : <>Clicked {new Date(clickAt(a)!).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</>}
                      </div>
                    )}
                  </div>
                  {a.attendanceMode && (
                    <span className="text-[11px] text-slate-500 hidden sm:inline-flex items-center gap-1">
                      {a.attendanceMode === "virtual" ? <Monitor className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      {a.attendanceMode === "in-person" ? "In-person" : "Virtual"}
                    </span>
                  )}
                  <div className="flex flex-col items-end gap-1 shrink-0 w-[104px]">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-full">{when}</span>
                    {(a.nudgeCount || 0) > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 truncate max-w-full" title={`Finish-registration reminder${(a.nudgeCount || 0) > 1 ? "s" : ""} sent`}>
                        {reminderLabel(a.nudgeCount || 0)}{a.lastNudgedAt ? ` ${shortDate(a.lastNudgedAt)}` : ""}
                      </span>
                    )}
                    {a.guideSentAt && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-teal-50 text-teal-700 border-teal-200 truncate max-w-full"
                        title={`Conference guide emailed ${new Date(a.guideSentAt).toLocaleString()}`}
                      >
                        Guide {shortDate(a.guideSentAt)}
                      </span>
                    )}
                  </div>
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
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
        <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{label}</div>
      </div>
      <div className={`${big ? "text-3xl" : "text-2xl"} font-extrabold mt-1`} style={{ color: accent }}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</div>
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 font-semibold text-slate-600">{children}</span>;
}

// Compact inline stat for the engagement band (label over value, no card).
function EngStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="leading-tight">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{label}</div>
      <div className="text-lg font-extrabold" style={{ color: accent || "#0f172a" }}>{value}</div>
    </div>
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
