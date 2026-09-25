"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Download, Loader2, ExternalLink, MessageSquareText, X } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import FeedbackTabs from "@/components/feedback/FeedbackTabs";
import { Distribution, Legend, SplitBar, TOP } from "@/components/feedback/RatingCharts";
import type {
  CompiledComment, CompiledConference, CompiledFeedback, CompiledSession,
} from "@/lib/feedback-compiled";

// Every imported form in one place, for the team: the whole conference first,
// then each session, with every comment. A side menu jumps anywhere, search
// runs across every comment, and sessions sort by program order, rating,
// responses or comments.
//
// Unlike a presenter's page, comments kept from the speaker are here, marked,
// because what attendees said about CEUs or the Zoom link is ours to act on.

type Sort = "program" | "rating" | "responses" | "comments";
type CommentFilter = "all" | "shown" | "kept";

const FIRST_COMMENTS = 6;

function fmt(n: number, digits = 1): string {
  return n.toFixed(digits).replace(/\.?0+$/, "");
}

/**
 * A form's name without what every form's name repeats: "13. 2026 Lurie
 * Children's & AALB Conference - General Conference Feedback (Responses) -
 * Form Responses 1" reads as "General Conference Feedback".
 */
function formLabel(name: string): string {
  const short = name
    .replace(/_/g, " ")
    .replace(/^\d+\.\s*/, "")
    .replace(/^2026\s+Lurie Children.?s\s*(?:&|and)?\s*AALB Conference\s*-\s*/i, "")
    .replace(/\s*\(Responses\)/i, "")
    .replace(/\s*-\s*Form Responses \d+$/i, "")
    .trim();
  return short || name;
}

function pct(share: number | null): string {
  return share === null ? "–" : `${Math.round(share * 100)}%`;
}

/** The text with every match of the search marked. */
function Marked({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const out: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  let at = 0;
  for (let i = lower.indexOf(q); i >= 0; i = lower.indexOf(q, i + q.length)) {
    out.push(text.slice(at, i), <mark key={i} className="bg-amber-200/80 text-inherit rounded px-0.5">{text.slice(i, i + q.length)}</mark>);
    at = i + q.length;
  }
  out.push(text.slice(at));
  return <>{out}</>;
}

function CommentItem({ c, scale, q, showQuestion, averaged }: {
  c: CompiledComment; scale: number; q: string; showQuestion: boolean;
  /** The score is that person's average over several rating questions. */
  averaged: boolean;
}) {
  const kept = c.status !== "shown";
  return (
    <li className={`pl-4 border-l-2 ${kept ? "border-rose-200" : ""}`} style={kept ? undefined : { borderColor: TOP }}>
      <p className={`text-[14px] leading-relaxed ${kept ? "text-slate-500" : "text-slate-800"}`}>
        <Marked text={c.text} q={q} />
      </p>
      <div className="mt-1 flex items-center gap-x-2 gap-y-1 flex-wrap text-[11.5px] text-slate-400">
        <span>Response {c.n}</span>
        {c.score !== null && <><span>&middot;</span><span>{averaged ? "average rating" : "rated"} {fmt(c.score)}/{scale}</span></>}
        {showQuestion && <><span>&middot;</span><span className="truncate max-w-[26rem]">{c.question}</span></>}
        {c.featured && <span className="px-1.5 rounded bg-amber-100 text-amber-800 font-semibold">Featured on their page</span>}
        {c.status === "offTopic" && (
          <span className="px-1.5 rounded bg-rose-50 text-rose-700 font-semibold">Kept from speaker: {c.reason}</span>
        )}
        {c.status === "hidden" && <span className="px-1.5 rounded bg-rose-50 text-rose-700 font-semibold">Hidden from speaker</span>}
      </div>
    </li>
  );
}

function CommentList({
  comments, scale, q, id, expanded, onToggle, showQuestion, averaged,
}: {
  comments: CompiledComment[]; scale: number; q: string; id: string;
  expanded: boolean; onToggle: (id: string) => void; showQuestion: boolean; averaged: boolean;
}) {
  if (!comments.length) return <p className="text-[13px] text-slate-400">No comments{q ? " match the search" : ""}.</p>;
  const all = expanded || !!q;
  const list = all ? comments : comments.slice(0, FIRST_COMMENTS);
  return (
    <>
      <ul className="space-y-4">
        {list.map((c, i) => <CommentItem key={`${c.n}-${c.question}-${i}`} c={c} scale={scale} q={q} showQuestion={showQuestion} averaged={averaged} />)}
      </ul>
      {!q && comments.length > FIRST_COMMENTS && (
        <button type="button" onClick={() => onToggle(id)}
                className="mt-4 text-[13px] font-semibold text-[#0E5566] hover:underline">
          {expanded ? "Show fewer" : `Show all ${comments.length} comments`}
        </button>
      )}
    </>
  );
}

function RatingSummary({ r }: { r: CompiledSession | CompiledConference }) {
  if (!r.pooled.length) return null;
  const multi = r.questions.length > 1;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
          <span className="text-[12.5px] font-semibold text-slate-600">
            {multi ? `Every 1-to-${r.scale} answer` : r.questions[0]?.question}
          </span>
          <Legend scale={r.scale} />
        </div>
        <Distribution values={r.pooled} scale={r.scale} compact />
      </div>
      <div className="space-y-4">
        {r.groups.length > 0 && (
          <div>
            <div className="text-[12.5px] font-semibold text-slate-600 mb-2">In the room and online</div>
            <div className="space-y-2.5">
              {r.groups.map((g) => (
                <div key={g.name}>
                  <div className="flex items-baseline justify-between text-[12.5px]">
                    <span className="text-slate-700">{g.name}</span>
                    <span className="text-slate-500 tabular-nums">
                      <span className="font-semibold text-slate-900">{fmt(g.mean)}</span>/{r.scale} &middot; {g.values.length}
                    </span>
                  </div>
                  <div className="mt-1"><SplitBar values={g.values} scale={r.scale} /></div>
                </div>
              ))}
            </div>
          </div>
        )}
        {multi && (
          <div>
            <div className="text-[12.5px] font-semibold text-slate-600 mb-2">Question by question</div>
            <div className="space-y-2.5">
              {r.questions.map((q) => (
                <div key={q.question}>
                  <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                    <span className="text-slate-700">{q.question}</span>
                    <span className="shrink-0 text-slate-500 tabular-nums">
                      <span className="font-semibold text-slate-900">{fmt(q.mean)}</span>/{q.scale} &middot; {q.n}
                    </span>
                  </div>
                  <div className="mt-1"><SplitBar values={q.values} scale={q.scale} /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AllFeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<CompiledFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("program");
  const [filter, setFilter] = useState<CommentFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.replace("/login"); return; }
    fetch("/api/feedback/compiled")
      .then(async (res) => {
        const j = await res.json();
        if (res.ok) setData(j); else setError(j.error || "Could not load feedback.");
      })
      .catch(() => setError("Could not load feedback."));
  }, [session, status, router]);

  const toggle = (id: string) => setExpanded((cur) => {
    const next = new Set(cur);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const q = query.trim().toLowerCase();
  const passes = (c: CompiledComment) =>
    filter === "all" || (filter === "shown" ? c.status === "shown" : c.status !== "shown");

  // Sessions after sort, filter and search. A session whose title or
  // presenter matches keeps all its comments; otherwise only matching ones.
  const sessions = useMemo(() => {
    if (!data) return [];
    const sorted = data.sessions.slice().sort((a, b) => {
      if (sort === "rating") return ((b.overall ?? 0) / b.scale) - ((a.overall ?? 0) / a.scale);
      if (sort === "responses") return b.responses - a.responses;
      if (sort === "comments") return b.comments.length - a.comments.length;
      return (a.forms[0] || a.title).localeCompare(b.forms[0] || b.title, undefined, { numeric: true, sensitivity: "base" });
    });
    return sorted
      .map((s) => {
        const hit = !!q && (s.title.toLowerCase().includes(q) || s.presenters.some((p) => p.name.toLowerCase().includes(q)));
        const comments = s.comments.filter((c) => passes(c)
          && (!q || hit || c.text.toLowerCase().includes(q) || c.question.toLowerCase().includes(q)));
        return { s, comments, visible: !q || hit || comments.length > 0 };
      })
      .filter((x) => x.visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sort, q, filter]);

  const conference = useMemo(() => (data?.conference || []).map((c) => {
    const hit = !!q && c.form.toLowerCase().includes(q);
    const comments = c.comments.filter((x) => !q || hit || x.text.toLowerCase().includes(q) || x.question.toLowerCase().includes(q));
    return { c, comments, visible: !q || hit || comments.length > 0 };
  }).filter((x) => x.visible), [data, q]);

  const matchCount = q
    ? sessions.reduce((a, x) => a + x.comments.length, 0) + conference.reduce((a, x) => a + x.comments.length, 0)
    : 0;

  if (status === "loading" || (!data && !error)) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  const navLink = "block truncate rounded-lg px-2.5 py-1.5 text-[13px] text-slate-600 hover:bg-white hover:text-slate-900";

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
              <MessageSquareText className="w-3.5 h-3.5" /> Session feedback
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">All feedback</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Every imported form in one place: the conference as a whole, then each session with every
              comment, including the ones kept from speakers.
            </p>
            <FeedbackTabs active="all" />

            {error && <div className="mt-6 text-sm font-semibold text-rose-700">{error}</div>}

            {data && data.totals.responses === 0 && (
              <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
                Nothing imported yet. Upload forms under Import and manage.
              </div>
            )}

            {data && data.totals.responses > 0 && (
              <>
                <div className="lg:sticky top-0 z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 mt-5 bg-slate-50/95 backdrop-blur border-b border-slate-200/70">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[220px] max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search every comment, session and presenter"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#0E5566]/20"
                      />
                      {query && (
                        <button type="button" onClick={() => setQuery("")} title="Clear"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <select value={filter} onChange={(e) => setFilter(e.target.value as CommentFilter)}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-700">
                      <option value="all">All comments</option>
                      <option value="shown">Only what speakers see</option>
                      <option value="kept">Only comments kept from speakers</option>
                    </select>
                    <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-700">
                      <option value="program">Sessions in program order</option>
                      <option value="rating">Highest rated first</option>
                      <option value="responses">Most responses first</option>
                      <option value="comments">Most comments first</option>
                    </select>
                    <a href="/api/feedback/compiled?format=csv"
                       className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:border-slate-300">
                      <Download className="w-4 h-4" /> Download everything (CSV)
                    </a>
                  </div>
                  {q && (
                    <div className="mt-2 text-[12.5px] text-slate-500">
                      {matchCount} comment{matchCount === 1 ? "" : "s"} match &ldquo;{query.trim()}&rdquo;
                      {" "}in {sessions.length + conference.length} place{sessions.length + conference.length === 1 ? "" : "s"}.
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
                  <aside className="hidden lg:block">
                    <nav className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
                      <a href="#overview" className={`${navLink} font-semibold`}>Overview</a>
                      {conference.length > 0 && (
                        <>
                          <div className="mt-4 mb-1 px-2.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Whole conference</div>
                          {conference.map(({ c }, i) => (
                            <a key={c.form} href={`#conference-${i}`} className={navLink} title={c.form}>{formLabel(c.form)}</a>
                          ))}
                        </>
                      )}
                      <div className="mt-4 mb-1 px-2.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                        Sessions ({sessions.length})
                      </div>
                      {sessions.map(({ s }) => (
                        <a key={s.id} href={`#session-${s.id}`} className={`${navLink} flex items-center gap-2`} title={s.title}>
                          <span className="truncate flex-1">{s.title}</span>
                          {s.overall !== null && (
                            <span className="shrink-0 text-[11.5px] text-slate-400 tabular-nums">{fmt(s.overall)}</span>
                          )}
                        </a>
                      ))}
                    </nav>
                  </aside>

                  <div className="min-w-0 space-y-6">
                    <select
                      className="lg:hidden w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13.5px]"
                      value=""
                      onChange={(e) => { if (e.target.value) window.location.hash = e.target.value; }}
                    >
                      <option value="">Jump to&hellip;</option>
                      <option value="overview">Overview</option>
                      {conference.map(({ c }, i) => <option key={c.form} value={`conference-${i}`}>Whole conference: {formLabel(c.form)}</option>)}
                      {sessions.map(({ s }) => <option key={s.id} value={`session-${s.id}`}>{s.title}</option>)}
                    </select>

                    <section id="overview" className="scroll-mt-28 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
                      <h2 className="text-[18px] font-semibold text-slate-900">Overview</h2>
                      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          ["Forms", data.totals.forms],
                          ["Responses", data.totals.responses],
                          ["Sessions rated", data.totals.sessions],
                          ["Comments", data.totals.comments],
                        ].map(([label, value]) => (
                          <div key={label as string}>
                            <dt className="text-[12px] text-slate-500">{label}</dt>
                            <dd className="text-[26px] font-semibold text-slate-900 leading-tight">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      {data.unassigned > 0 && (
                        <p className="mt-4 text-[12.5px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          {data.unassigned} session response{data.unassigned === 1 ? " is" : "s are"} not assigned to a presenter yet,
                          so {data.unassigned === 1 ? "it is" : "they are"} not below. Assign them under Import and manage.
                        </p>
                      )}

                      {sessions.length > 0 && (
                        <div className="mt-6 overflow-x-auto">
                          <table className="w-full text-[13px]">
                            <thead>
                              <tr className="text-left text-[11.5px] text-slate-400 border-b border-slate-200">
                                <th className="py-2 pr-3 font-semibold">Session</th>
                                {([["responses", "Responses"], ["rating", "Average"], ["comments", "Comments"]] as [Sort, string][]).map(([key, label]) => (
                                  <th key={key} className={`py-2 pr-3 font-semibold whitespace-nowrap ${key === "comments" ? "hidden sm:table-cell" : ""}`}>
                                    <button type="button" onClick={() => setSort(key)}
                                            className={sort === key ? "text-slate-900" : "hover:text-slate-700"}>
                                      {label}{sort === key ? " ↓" : ""}
                                    </button>
                                  </th>
                                ))}
                                <th className="py-2 font-semibold whitespace-nowrap hidden sm:table-cell">Top two</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sessions.map(({ s }) => (
                                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                    onClick={() => { window.location.hash = `session-${s.id}`; }}>
                                  <td className="py-2.5 pr-3">
                                    <div className="font-semibold text-slate-800">{s.title}</div>
                                    <div className="text-[11.5px] text-slate-500">{s.presenters.map((p) => p.name).join(", ")}</div>
                                  </td>
                                  <td className="py-2.5 pr-3 tabular-nums text-slate-700">{s.responses}</td>
                                  <td className="py-2.5 pr-3 whitespace-nowrap">
                                    {s.overall !== null ? (
                                      <div className="flex items-center gap-2">
                                        <span className="tabular-nums font-semibold text-slate-900 w-9">{fmt(s.overall)}</span>
                                        <span className="text-slate-400 text-[11.5px] w-6 hidden sm:inline">/{s.scale}</span>
                                        <div className="w-24 hidden sm:block"><SplitBar values={s.pooled} scale={s.scale} /></div>
                                      </div>
                                    ) : <span className="text-slate-400">&ndash;</span>}
                                  </td>
                                  <td className="py-2.5 pr-3 tabular-nums text-slate-700 hidden sm:table-cell">{s.comments.length}</td>
                                  <td className="py-2.5 tabular-nums text-slate-700 hidden sm:table-cell">{pct(s.topTwo)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="mt-2 text-[11.5px] text-slate-400">
                            Averages are on each form&rsquo;s own scale; &ldquo;Highest rated&rdquo; compares them as a share of the scale.
                            Top two is the share of ratings at the top two points (9 or 10, or 4 or 5).
                          </p>
                        </div>
                      )}
                    </section>

                    {conference.map(({ c, comments }, i) => {
                      const questions = Array.from(new Set(comments.map((x) => x.question)));
                      return (
                        <section key={c.form} id={`conference-${i}`} className="scroll-mt-28 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#0E5566]">Whole conference</div>
                          <h2 className="mt-1 text-[18px] font-semibold text-slate-900"><Marked text={formLabel(c.form)} q={q} /></h2>
                          <p className="mt-1 text-[13px] text-slate-500">
                            {c.responses} response{c.responses === 1 ? "" : "s"}
                            {c.overall !== null && <> &middot; average <span className="font-semibold text-slate-800">{fmt(c.overall)}</span>/{c.scale} &middot; {pct(c.topTwo)} rated {c.scale - 1} or {c.scale}</>}
                          </p>
                          <div className="mt-5"><RatingSummary r={c} /></div>

                          {c.choices.length > 0 && (
                            <div className="mt-6 grid gap-6 md:grid-cols-2">
                              {c.choices.map((t) => {
                                const top = Math.max(1, ...t.options.map((o) => o.count));
                                return (
                                  <div key={t.question}>
                                    <div className="text-[13px] font-semibold text-slate-800">{t.question}</div>
                                    <div className="text-[11.5px] text-slate-500">{t.n} answered</div>
                                    <div className="mt-2 space-y-1.5">
                                      {t.options.slice(0, 12).map((o) => (
                                        <div key={o.label} className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-3 text-[12.5px]"
                                             title={`${o.count} of ${t.n}`}>
                                          <div className="min-w-0">
                                            <div className="text-slate-700 truncate">{o.label}</div>
                                            <div className="mt-0.5 h-2 rounded-r bg-slate-100">
                                              <div className="h-2 rounded-r" style={{ width: `${(o.count / top) * 100}%`, background: TOP }} />
                                            </div>
                                          </div>
                                          <div className="text-right tabular-nums text-slate-500">
                                            <span className="font-semibold text-slate-800">{o.count}</span> &middot; {Math.round((o.count / Math.max(1, t.n)) * 100)}%
                                          </div>
                                        </div>
                                      ))}
                                      {t.options.length > 12 && (
                                        <div className="text-[11.5px] text-slate-400">and {t.options.length - 12} more in the CSV</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {questions.length > 0 && (
                            <div className="mt-6 space-y-6">
                              {questions.map((question) => {
                                const id = `conference-${i}-${question}`;
                                return (
                                  <div key={question}>
                                    <h3 className="text-[13px] font-semibold text-slate-800 mb-3">
                                      {question} <span className="font-normal text-slate-400">({comments.filter((x) => x.question === question).length})</span>
                                    </h3>
                                    <CommentList comments={comments.filter((x) => x.question === question)} scale={c.scale} q={q}
                                                 id={id} expanded={expanded.has(id)} onToggle={toggle} showQuestion={false}
                                                 averaged={c.questions.filter((x) => x.scale === c.scale).length > 1} />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      );
                    })}

                    {sessions.map(({ s, comments }) => {
                      const keptCount = s.comments.filter((c) => c.status !== "shown").length;
                      return (
                        <section key={s.id} id={`session-${s.id}`} className="scroll-mt-28 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="min-w-0">
                              <h2 className="text-[18px] font-semibold text-slate-900 leading-snug"><Marked text={s.title} q={q} /></h2>
                              <div className="mt-1 flex items-center gap-x-3 gap-y-1 flex-wrap text-[13px] text-slate-600">
                                {s.presenters.map((p) => (
                                  <a key={p.id} href={p.link} target="_blank" rel="noopener noreferrer"
                                     className="inline-flex items-center gap-1 hover:text-[#0E5566]" title="Open their feedback page">
                                    <Marked text={p.name} q={q} /> <ExternalLink className="w-3 h-3 text-slate-400" />
                                  </a>
                                ))}
                              </div>
                              <div className="mt-0.5 text-[11.5px] text-slate-400 truncate max-w-[40rem]" title={s.forms.join(", ")}>
                                {s.forms.map(formLabel).join(", ")}
                              </div>
                            </div>
                            {s.overall !== null && (
                              <div className="text-right">
                                <div className="text-[34px] leading-none font-semibold text-slate-900">
                                  {fmt(s.overall)}<span className="text-[15px] font-normal text-slate-400">/{s.scale}</span>
                                </div>
                                <div className="mt-1 text-[11.5px] text-slate-500">
                                  {s.responses} responses &middot; {pct(s.topTwo)} rated {s.scale - 1} or {s.scale}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-5"><RatingSummary r={s} /></div>

                          <div className="mt-6">
                            <h3 className="text-[13px] font-semibold text-slate-800 mb-3">
                              Comments <span className="font-normal text-slate-400">
                                ({s.comments.length}{keptCount ? `, ${keptCount} kept from the speaker` : ""})
                              </span>
                            </h3>
                            <CommentList comments={comments} scale={s.scale} q={q} id={s.id}
                                         expanded={expanded.has(s.id)} onToggle={toggle}
                                         showQuestion={new Set(s.comments.map((c) => c.question)).size > 1}
                                         averaged={s.questions.filter((x) => x.scale === s.scale).length > 1} />
                          </div>
                        </section>
                      );
                    })}

                    {q && sessions.length === 0 && conference.length === 0 && (
                      <p className="text-center text-slate-500 py-10">Nothing matches &ldquo;{query.trim()}&rdquo;.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
