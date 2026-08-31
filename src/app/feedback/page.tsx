"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MessageSquareText, Upload, Loader2, RefreshCw, Copy, Check, EyeOff, Eye,
  ChevronDown, ChevronRight, ExternalLink,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { parseCsv, type QuestionStats } from "@/lib/feedback";

// Importing and reading attendee feedback.
//
// The flow is paste, map, import, fix, share: paste the spreadsheet export,
// say what each column is, import, assign whatever could not be matched, then
// copy each presenter's share link. Cross-presenter comparison lives on this
// page and nowhere else.

type ColumnRole = "ignore" | "session" | "rating" | "comment" | "timestamp";

type AdminData = {
  total: number;
  byPresenter: {
    presenter: { id: string; name: string; talkTitle: string | null };
    responseCount: number;
    questions: QuestionStats[];
    commentRows: { responseId: string; question: string; text: string; hidden: boolean }[];
  }[];
  unmatched: { label: string; count: number }[];
  links: Record<string, string>;
};

export default function FeedbackAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin" || role === "developer";

  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  // Import state.
  const [csv, setCsv] = useState("");
  const [mode, setMode] = useState<"perRow" | "perColumn">("perRow");
  const [roles, setRoles] = useState<Record<string, ColumnRole>>({});
  const [columnOwner, setColumnOwner] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback");
      const j = await res.json();
      if (res.ok) setData(j);
      else setNote(j.error || "Could not load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated") void load();
  }, [status, router, load]);

  const header = useMemo(() => {
    if (!csv.trim()) return [];
    try { return (parseCsv(csv)[0] || []).map((h) => h.trim()).filter(Boolean); } catch { return []; }
  }, [csv]);

  // First guesses, correctable: a column whose values are mostly 1-to-5 is a
  // rating, long text is a comment, "timestamp" is the timestamp, and the one
  // that mentions session or presentation names the session.
  useEffect(() => {
    if (!header.length) { setRoles({}); return; }
    let rows: string[][] = [];
    try { rows = parseCsv(csv).slice(1, 30); } catch { rows = []; }
    const guess: Record<string, ColumnRole> = {};
    header.forEach((h, i) => {
      const hl = h.toLowerCase();
      const values = rows.map((r) => (r[i] || "").trim()).filter(Boolean);
      const numericish = values.length > 0 && values.every((v) => /^\d(\.\d+)?( |$)/.test(v) || /\((\d)\)$/.test(v));
      if (hl.includes("timestamp") || hl === "date") guess[h] = "timestamp";
      // Identity columns are never shared onward, whatever they contain.
      else if (/\b(name|email|e-mail|phone)\b/.test(hl)) guess[h] = "ignore";
      else if (hl.includes("session") || hl.includes("presentation") || hl.includes("which talk")) guess[h] = "session";
      else if (numericish) guess[h] = "rating";
      // Any text column with real sentences is probably a comment. Guessing
      // too many is harmless: the admin flips a select, and empty answers are
      // never shown anyway.
      else if (values.some((v) => v.length > 25 || v.split(" ").length > 3) || /comment|suggest|feedback|like|improve/.test(hl)) guess[h] = "comment";
      else guess[h] = "ignore";
    });
    setRoles(guess);
  }, [header, csv]);

  async function runImport() {
    setImporting(true);
    setNote(null);
    try {
      const ratingColumns = header.filter((h) => roles[h] === "rating");
      const commentColumns = header.filter((h) => roles[h] === "comment");
      const timestampColumn = header.find((h) => roles[h] === "timestamp");
      let mapping: Record<string, unknown>;
      if (mode === "perRow") {
        const sessionColumn = header.find((h) => roles[h] === "session");
        if (!sessionColumn) { setNote("Mark one column as the session name first."); setImporting(false); return; }
        mapping = { sessionColumn, ratingColumns, commentColumns, timestampColumn };
      } else {
        // Group each mapped column under the presenter the admin assigned it to.
        const byPresenter = new Map<string, { ratingColumns: string[]; commentColumns: string[] }>();
        for (const h of [...ratingColumns, ...commentColumns]) {
          const owner = columnOwner[h];
          if (!owner) { setNote(`"${h}" has no presenter assigned yet.`); setImporting(false); return; }
          if (!byPresenter.has(owner)) byPresenter.set(owner, { ratingColumns: [], commentColumns: [] });
          byPresenter.get(owner)![roles[h] === "rating" ? "ratingColumns" : "commentColumns"].push(h);
        }
        const names = new Map((data?.byPresenter || []).map((b) => [b.presenter.id, b.presenter.talkTitle || b.presenter.name]));
        mapping = {
          timestampColumn,
          perPresenterColumns: Array.from(byPresenter.entries()).map(([presenterId, cols]) => ({
            presenterId, label: names.get(presenterId) || presenterId, ...cols,
          })),
        };
      }
      const res = await fetch("/api/feedback/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, replace: true, mapping }),
      });
      const j = await res.json();
      setNote(res.ok
        ? `Imported ${j.imported} responses: ${j.matched} matched to a presenter, ${j.unmatched} to assign below.`
        : (j.error || "Import failed."));
      if (res.ok) { setCsv(""); await load(); }
    } catch {
      setNote("Network error during import.");
    } finally {
      setImporting(false);
    }
  }

  async function assign(sessionLabel: string, presenterId: string) {
    const res = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assign: { sessionLabel, presenterId: presenterId || null } }),
    });
    if (res.ok) await load();
  }

  async function toggleHide(responseId: string, question: string, hidden: boolean) {
    const res = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hide: { responseId, question, hidden } }),
    });
    if (res.ok) await load();
  }

  async function copyLink(id: string, url: string) {
    try { await navigator.clipboard.writeText(url); setCopied(id); setTimeout(() => setCopied(null), 2000); } catch {}
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
              <MessageSquareText className="w-3.5 h-3.5" /> Session feedback
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">Attendee feedback</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Paste the feedback spreadsheet, map its columns, and each presenter gets a private page
              with their numbers and every comment. Only this page compares sessions to each other.
            </p>

            {isAdmin && (
              <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#0E5566]" /> Import responses
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  In Google Sheets: File, Download, Comma Separated Values, then paste the whole file here.
                  Importing replaces what was imported before, so re-importing as more forms arrive is safe.
                </p>
                <textarea
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                  placeholder="Timestamp,Which session did you attend?,How useful was it? ..."
                  rows={5}
                  className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-[12.5px] font-mono focus:outline-none focus:ring-2 focus:ring-[#0E5566]/20"
                />

                {header.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[12px] font-bold text-slate-700">This form&hellip;</span>
                      <label className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-600">
                        <input type="radio" checked={mode === "perRow"} onChange={() => setMode("perRow")} className="accent-[#0E5566]" />
                        asks each person about one session (a column names it)
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-600">
                        <input type="radio" checked={mode === "perColumn"} onChange={() => setMode("perColumn")} className="accent-[#0E5566]" />
                        asks about several sessions in one form (columns per session)
                      </label>
                    </div>
                    <div className="mt-3 rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                      {header.map((h) => (
                        <div key={h} className="px-3 py-2 flex items-center gap-3">
                          <span className="flex-1 min-w-0 text-[12.5px] text-slate-700 truncate" title={h}>{h}</span>
                          <select
                            value={roles[h] || "ignore"}
                            onChange={(e) => setRoles((r) => ({ ...r, [h]: e.target.value as ColumnRole }))}
                            className="text-[12px] rounded-lg border border-slate-200 px-2 py-1 bg-white"
                          >
                            <option value="ignore">Ignore</option>
                            {mode === "perRow" && <option value="session">Names the session</option>}
                            <option value="rating">Rating (1 to 5)</option>
                            <option value="comment">Comment</option>
                            <option value="timestamp">Timestamp</option>
                          </select>
                          {mode === "perColumn" && (roles[h] === "rating" || roles[h] === "comment") && (
                            <select
                              value={columnOwner[h] || ""}
                              onChange={(e) => setColumnOwner((o) => ({ ...o, [h]: e.target.value }))}
                              className="text-[12px] rounded-lg border border-slate-200 px-2 py-1 bg-white max-w-[220px]"
                            >
                              <option value="">Whose session?</option>
                              {(data?.byPresenter || []).map((b) => (
                                <option key={b.presenter.id} value={b.presenter.id}>{b.presenter.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => void runImport()}
                      disabled={importing}
                      className="mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50 bg-gradient-to-r from-[#0E5566] to-[#0066B3]"
                    >
                      {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Import (replaces previous import)
                    </button>
                  </div>
                )}
                {note && <div className="mt-3 text-[12.5px] font-semibold text-[#0E5566]">{note}</div>}
              </div>
            )}

            {data && data.unmatched.length > 0 && (
              <div className="mt-6 bg-amber-50 rounded-2xl border border-amber-200 p-5">
                <div className="text-sm font-bold text-amber-900">Responses that need a presenter</div>
                <p className="text-xs text-amber-800/80 mt-1">
                  These session names did not match anyone closely enough to trust. Pick who each one
                  belongs to; every response with that label follows.
                </p>
                <div className="mt-3 space-y-2">
                  {data.unmatched.map((u) => (
                    <div key={u.label} className="flex items-center gap-3 flex-wrap">
                      <span className="text-[13px] text-slate-800 font-semibold">&ldquo;{u.label}&rdquo;</span>
                      <span className="text-[11.5px] text-slate-500">{u.count} response{u.count === 1 ? "" : "s"}</span>
                      <select
                        defaultValue=""
                        onChange={(e) => e.target.value && void assign(u.label, e.target.value)}
                        className="text-[12px] rounded-lg border border-amber-300 px-2 py-1 bg-white"
                      >
                        <option value="">Assign to&hellip;</option>
                        {data.byPresenter.map((b) => (
                          <option key={b.presenter.id} value={b.presenter.id}>{b.presenter.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center gap-2 justify-center text-slate-500 text-sm py-16">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading&hellip;
              </div>
            ) : data && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900">
                    {data.total} response{data.total === 1 ? "" : "s"} on file
                  </div>
                  <button onClick={() => void load()} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-slate-600 border border-slate-200 bg-white inline-flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>

                {data.byPresenter.filter((b) => b.responseCount > 0).map((b) => {
                  const isOpen = open === b.presenter.id;
                  const overall = b.questions.length
                    ? b.questions.reduce((a, q) => a + q.mean, 0) / b.questions.length
                    : null;
                  return (
                    <div key={b.presenter.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <button onClick={() => setOpen(isOpen ? null : b.presenter.id)} className="w-full px-5 py-4 flex items-center gap-3 text-left">
                        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-bold text-slate-900 truncate">{b.presenter.name}</div>
                          <div className="text-[12px] text-slate-500 truncate">{b.presenter.talkTitle || ""}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[15px] font-bold text-slate-800">{overall !== null ? overall.toFixed(2) : "–"}</div>
                          <div className="text-[11px] text-slate-400">{b.responseCount} response{b.responseCount === 1 ? "" : "s"}</div>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 border-t border-slate-100">
                          {data.links[b.presenter.id] && (
                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                              <span className="text-[12px] font-bold text-slate-700">Share link:</span>
                              <code className="text-[11.5px] bg-slate-50 border border-slate-200 rounded px-2 py-1">{data.links[b.presenter.id]}</code>
                              <button onClick={() => void copyLink(b.presenter.id, data.links[b.presenter.id])}
                                      className="px-2 py-1 rounded-lg text-[11.5px] font-bold text-[#0E5566] border border-slate-200 bg-white inline-flex items-center gap-1">
                                {copied === b.presenter.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied === b.presenter.id ? "Copied" : "Copy"}
                              </button>
                              <a href={data.links[b.presenter.id]} target="_blank" rel="noopener noreferrer"
                                 className="px-2 py-1 rounded-lg text-[11.5px] font-bold text-slate-600 border border-slate-200 bg-white inline-flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Preview
                              </a>
                            </div>
                          )}
                          <table className="mt-4 w-full text-[12.5px]">
                            <thead>
                              <tr className="text-left text-[10.5px] uppercase tracking-wider text-slate-400">
                                <th className="py-1 pr-3">Question</th>
                                <th className="py-1 pr-3">Avg</th>
                                <th className="py-1 pr-3">Median</th>
                                <th className="py-1 pr-3">SD</th>
                                <th className="py-1 pr-3">4 to 5</th>
                                <th className="py-1">n</th>
                              </tr>
                            </thead>
                            <tbody>
                              {b.questions.map((q) => (
                                <tr key={q.question} className="border-t border-slate-100">
                                  <td className="py-1.5 pr-3 text-slate-700">{q.question}</td>
                                  <td className="py-1.5 pr-3 font-bold text-slate-900">{q.mean.toFixed(2)}</td>
                                  <td className="py-1.5 pr-3">{q.median}</td>
                                  <td className="py-1.5 pr-3">{q.sd === null ? "–" : q.sd.toFixed(2)}</td>
                                  <td className="py-1.5 pr-3">{Math.round(q.topBox * 100)}%</td>
                                  <td className="py-1.5">{q.n}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {b.commentRows.length > 0 && (
                            <div className="mt-4 space-y-1.5">
                              <div className="text-[10.5px] uppercase tracking-wider text-slate-400 font-bold">Comments</div>
                              {b.commentRows.map((c, i) => (
                                <div key={`${c.responseId}-${c.question}-${i}`}
                                     className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${c.hidden ? "border-rose-200 bg-rose-50/60" : "border-slate-150 bg-slate-50/60"}`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[10.5px] text-slate-400">{c.question}</div>
                                    <div className={`text-[13px] leading-relaxed ${c.hidden ? "text-rose-800 line-through" : "text-slate-700"}`}>{c.text}</div>
                                  </div>
                                  <button
                                    onClick={() => void toggleHide(c.responseId, c.question, !c.hidden)}
                                    title={c.hidden ? "Show on their page again" : "Hide from their page"}
                                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white"
                                  >
                                    {c.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
