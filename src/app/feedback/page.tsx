"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MessageSquareText, Upload, Loader2, RefreshCw, Copy, Check, EyeOff, Eye,
  ChevronDown, ChevronRight, ExternalLink, FileSpreadsheet, Trash2, BarChart3, Send, Star,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { parseCsv, matchSessionLabel, type QuestionStats } from "@/lib/feedback";

// Importing and reading attendee feedback.
//
// The flow is paste, map, import, fix, share: paste the spreadsheet export,
// say what each column is, import, assign whatever could not be matched, then
// copy each presenter's share link. Cross-presenter comparison lives on this
// page and nowhere else.

type ColumnRole = "ignore" | "session" | "rating" | "comment" | "timestamp" | "segment";

type AdminData = {
  total: number;
  overall: { responses: number; sessionsRated: number; questions: QuestionStats[] };
  sources: { name: string; responses: number; matched: number }[];
  byPresenter: {
    presenter: { id: string; name: string; talkTitle: string | null; email: string; feedbackSentAt: string | null };
    responseCount: number;
    questions: QuestionStats[];
    commentRows: {
      responseId: string; question: string; text: string;
      hidden: boolean; featured: boolean; suggested: boolean;
      /** Why it looks like it is not about the speaker, if it does. */
      offTopic: string | null; kept: boolean; autoHidden: boolean;
    }[];
    /** The comment their email will quote: the first one featured. */
    emailQuote: string | null;
  }[];
  unmatched: { label: string; count: number }[];
  offTopic: {
    presenterId: string; presenterName: string; responseId: string;
    question: string; text: string; reason: string; kept: boolean;
  }[];
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
  const [sourceName, setSourceName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [loadedFile, setLoadedFile] = useState<string | null>(null);
  // Most of our forms are one per session, named only in the file name, so
  // that is the default; the other two shapes are for combined forms.
  const [mode, setMode] = useState<"onePresenter" | "perRow" | "perColumn">("onePresenter");
  const [formPresenter, setFormPresenter] = useState("");
  const [guessedPresenter, setGuessedPresenter] = useState("");
  const [roles, setRoles] = useState<Record<string, ColumnRole>>({});
  const [columnOwner, setColumnOwner] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Emailing presenters their feedback. Ticks start on everyone with feedback
  // who has not been sent it yet; the team adjusts from there.
  const [ticks, setTicks] = useState<Set<string>>(new Set());
  const [ticksReady, setTicksReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendNote, setSendNote] = useState<string | null>(null);
  useEffect(() => {
    if (!data || ticksReady) return;
    setTicks(new Set(data.byPresenter.filter((b) => b.responseCount > 0 && !b.presenter.feedbackSentAt).map((b) => b.presenter.id)));
    setTicksReady(true);
  }, [data, ticksReady]);

  async function sendFeedback(ids: string[], test: boolean) {
    if (!ids.length) { setSendNote("Tick at least one presenter."); return; }
    if (!test) {
      const names = ids.map((id) => data?.byPresenter.find((b) => b.presenter.id === id)?.presenter.name).filter(Boolean);
      const who = names.length === 1 ? names[0] : `${names.length} presenters`;
      if (!window.confirm(`Email ${who} their feedback link now?`)) return;
    }
    setSending(true);
    setSendNote(null);
    try {
      const res = await fetch("/api/feedback/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, mode: "all", test }),
      });
      const j = await res.json();
      if (!res.ok) setSendNote(j.error || "Sending failed.");
      else if (test) setSendNote(j.sent ? `Test sent to ${j.recipients[0]}.` : "Nothing to send a test of.");
      else {
        setSendNote(`Sent ${j.sent}${j.failed ? `, ${j.failed} failed (${j.failures.map((f: { email: string }) => f.email).join(", ")})` : ""}.`);
        setTicks((t) => { const next = new Set(t); ids.forEach((id) => next.delete(id)); return next; });
        await load();
      }
    } catch {
      setSendNote("Network error while sending.");
    } finally {
      setSending(false);
    }
  }

  async function markSent(id: string, sent: boolean) {
    const res = await fetch("/api/feedback/send", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, sent }),
    });
    if (res.ok) {
      if (sent) setTicks((t) => { const next = new Set(t); next.delete(id); return next; });
      await load();
    }
  }

  // Reading the file here rather than posting it keeps the import route on one
  // JSON shape, and the mapping step needs the text in hand anyway.
  async function takeFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setNote(`"${file.name}" is not a CSV. In Google Sheets use File, Download, Comma Separated Values.`);
      return;
    }
    const text = await file.text();
    const name = file.name.replace(/\.csv$/i, "");
    setCsv(text);
    setLoadedFile(file.name);
    setSourceName(name);
    // The file name is the only place these forms say whose session it was
    // ("... Lessons from the Department of Justice ... - Michael"), so take a
    // first guess from it. Shown in a dropdown, so a wrong guess is one click.
    const targets = (data?.byPresenter || []).map((b) => ({
      presenterId: b.presenter.id, name: b.presenter.name, talkTitle: b.presenter.talkTitle,
    }));
    const guess = matchSessionLabel(name.replace(/_/g, " "), targets) || "";
    setFormPresenter(guess);
    setGuessedPresenter(guess);
    setNote(null);
  }

  async function deleteSource(name: string) {
    if (!window.confirm(`Remove "${name}" and all its responses? The other forms are untouched.`)) return;
    const res = await fetch(`/api/feedback?sourceName=${encodeURIComponent(name)}`, { method: "DELETE" });
    if (res.ok) { setNote(`Removed "${name}".`); await load(); }
  }

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
    // Wait for the session to resolve before judging it. On a statically
    // rendered page the first client render can report unauthenticated before
    // the session request finishes, and redirecting on that bounces a
    // signed-in admin to the login screen.
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    void load();
  }, [session, status, router, load]);

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
      // "5", "10 - Excellent", "Excellent (5)". Never a long number like an
      // ID, which is why it stops at two digits.
      const numericish = values.length > 0 && values.every((v) => /^\d{1,2}(\.\d+)?( |$)/.test(v) || /\((\d{1,2})\)$/.test(v));
      // Multiple choice repeats itself ("CCHI", "Yes, I agree"); comments do not.
      const repetitive = values.length >= 5 && new Set(values).size / values.length < 0.5;
      if (hl.includes("timestamp") || hl === "date") guess[h] = "timestamp";
      // "Did you attend in-person or virtually?": lets the presenter see how
      // the session landed in the room against online.
      else if (/in[- ]person|virtual/.test(hl) && h.length < 100 && !Object.values(guess).includes("segment")) guess[h] = "segment";
      // Identity columns are never shared onward, whatever they contain.
      else if (/\b(name|email|e-mail|phone)\b/.test(hl)) guess[h] = "ignore";
      // Short headers only: a long consent statement that mentions "each
      // presentation" is not the question naming the session.
      else if (h.length < 80 && (hl.includes("session") || hl.includes("presentation") || hl.includes("which talk"))) guess[h] = "session";
      else if (numericish) guess[h] = "rating";
      // Any text column with real sentences is probably a comment. Guessing
      // too many is harmless: the admin flips a select, and empty answers are
      // never shown anyway.
      else if (/comment|suggest|feedback|like|improve/.test(hl)) guess[h] = "comment";
      else if (!repetitive && values.some((v) => v.length > 25 || v.split(" ").length > 3)) guess[h] = "comment";
      else guess[h] = "ignore";
    });
    setRoles(guess);
    // A column naming the session means a combined form; otherwise it is one
    // session's own form.
    setMode(Object.values(guess).includes("session") ? "perRow" : "onePresenter");
  }, [header, csv]);

  async function runImport() {
    setImporting(true);
    setNote(null);
    try {
      const ratingColumns = header.filter((h) => roles[h] === "rating");
      const commentColumns = header.filter((h) => roles[h] === "comment");
      const timestampColumn = header.find((h) => roles[h] === "timestamp");
      const segmentColumn = header.find((h) => roles[h] === "segment");
      let mapping: Record<string, unknown>;
      if (mode === "onePresenter") {
        if (!formPresenter) { setNote("Choose whose session this form is for."); setImporting(false); return; }
        if (!ratingColumns.length && !commentColumns.length) { setNote("Mark at least one column as a rating or a comment."); setImporting(false); return; }
        mapping = { presenterId: formPresenter, ratingColumns, commentColumns, timestampColumn, segmentColumn };
      } else if (mode === "perRow") {
        const sessionColumn = header.find((h) => roles[h] === "session");
        if (!sessionColumn) { setNote("Mark one column as the session name first."); setImporting(false); return; }
        mapping = { sessionColumn, ratingColumns, commentColumns, timestampColumn, segmentColumn };
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
          segmentColumn,
          perPresenterColumns: Array.from(byPresenter.entries()).map(([presenterId, cols]) => ({
            presenterId, label: names.get(presenterId) || presenterId, ...cols,
          })),
        };
      }
      const res = await fetch("/api/feedback/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, sourceName, mapping }),
      });
      const j = await res.json();
      setNote(res.ok
        ? `"${j.sourceName}": ${j.imported} responses, ${j.matched} matched to a presenter${j.unmatched ? `, ${j.unmatched} to assign below` : ""}.`
        : (j.error || "Import failed."));
      if (res.ok) { setCsv(""); setSourceName(""); setLoadedFile(null); setShowPaste(false); setFormPresenter(""); await load(); }
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

  async function setKept(responseId: string, question: string, kept: boolean) {
    const res = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keep: { responseId, question, kept } }),
    });
    if (res.ok) await load();
  }

  async function toggleFeature(responseId: string, question: string, featured: boolean) {
    const res = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature: { responseId, question, featured } }),
    });
    if (res.ok) await load();
    else setNote((await res.json().catch(() => ({}))).error || "Could not change that.");
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
              Upload every feedback form, map its columns once, and each presenter gets a private page
              with their own numbers and every comment. The overall picture and the comparison between
              sessions live here and nowhere else.
            </p>

            {isAdmin && (
              <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#0E5566]" /> Import responses
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Upload as many forms as you have. Each is kept separately, and uploading the same form
                  again replaces only that form as more responses arrive.
                </p>

                {/* The upload is the main thing on this card, not a button beside a
                    text box. Drop a file anywhere in the zone or click it. */}
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); void takeFiles(e.dataTransfer.files); }}
                  className={`mt-4 flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
                    dragging ? "border-[#0066B3] bg-[#0066B3]/5" : loadedFile ? "border-emerald-300 bg-emerald-50/50" : "border-slate-300 bg-slate-50/70 hover:border-[#0E5566] hover:bg-[#0E5566]/[0.03]"
                  }`}
                >
                  <input type="file" accept=".csv,text/csv" className="hidden"
                         onChange={(e) => { void takeFiles(e.target.files); e.target.value = ""; }} />
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${loadedFile ? "bg-emerald-100" : "bg-white border border-slate-200"}`}>
                    {loadedFile
                      ? <Check className="w-7 h-7 text-emerald-600" />
                      : <FileSpreadsheet className="w-7 h-7 text-[#0E5566]" />}
                  </div>
                  {loadedFile ? (
                    <>
                      <div className="mt-3 text-[15px] font-bold text-slate-900">{loadedFile}</div>
                      <div className="text-[12.5px] text-slate-500 mt-0.5">
                        {Math.max(0, parseCsv(csv).length - 1)} responses read. Check the columns below, then import.
                        Click here to pick a different file.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mt-3 text-[15px] font-bold text-slate-900">Upload a feedback form (CSV)</div>
                      <div className="text-[13px] text-slate-500 mt-1">Drag the file here, or click to choose it</div>
                      <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3]">
                        <Upload className="w-4 h-4" /> Choose a CSV file
                      </div>
                      <div className="text-[11.5px] text-slate-400 mt-3">
                        From Google Sheets: File, then Download, then Comma Separated Values (.csv)
                      </div>
                    </>
                  )}
                </label>

                {(loadedFile || csv) && (
                  <label className="mt-3 flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-slate-600 shrink-0">Call this form</span>
                    <input
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="Saturday sessions"
                      className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0E5566]/20"
                    />
                  </label>
                )}

                {!loadedFile && (
                  <button type="button" onClick={() => setShowPaste((v) => !v)}
                          className="mt-3 text-[12px] font-semibold text-slate-500 hover:text-[#0E5566] underline decoration-dotted">
                    {showPaste ? "Hide the paste box" : "Or paste the data instead"}
                  </button>
                )}
                {showPaste && !loadedFile && (
                  <textarea
                    value={csv}
                    onChange={(e) => setCsv(e.target.value)}
                    placeholder="Timestamp,Which session did you attend?,How useful was it? ..."
                    rows={5}
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-[12.5px] font-mono focus:outline-none focus:ring-2 focus:ring-[#0E5566]/20"
                  />
                )}

                {header.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[12px] font-bold text-slate-700">This form&hellip;</span>
                      <label className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-600">
                        <input type="radio" checked={mode === "onePresenter"} onChange={() => setMode("onePresenter")} className="accent-[#0E5566]" />
                        is about one session
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-600">
                        <input type="radio" checked={mode === "perRow"} onChange={() => setMode("perRow")} className="accent-[#0E5566]" />
                        covers several sessions, and a column says which
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-600">
                        <input type="radio" checked={mode === "perColumn"} onChange={() => setMode("perColumn")} className="accent-[#0E5566]" />
                        has separate questions for each session
                      </label>
                    </div>
                    {mode === "onePresenter" && (
                      <label className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-bold text-slate-700 shrink-0">Whose session</span>
                        <select
                          value={formPresenter}
                          onChange={(e) => setFormPresenter(e.target.value)}
                          className={`flex-1 min-w-[220px] text-[13px] rounded-lg border px-2 py-1.5 bg-white ${formPresenter ? "border-slate-200" : "border-amber-300"}`}
                        >
                          <option value="">Choose the presenter</option>
                          {(data?.byPresenter || []).map((b) => (
                            <option key={b.presenter.id} value={b.presenter.id}>
                              {b.presenter.name}{b.presenter.talkTitle ? `: ${b.presenter.talkTitle}` : ""}
                            </option>
                          ))}
                        </select>
                        {formPresenter && formPresenter === guessedPresenter && (
                          <span className="text-[11.5px] text-slate-400">Guessed from the file name. Change it if it is wrong.</span>
                        )}
                      </label>
                    )}
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
                            <option value="rating">Rating (number)</option>
                            <option value="comment">Comment</option>
                            <option value="timestamp">Timestamp</option>
                            <option value="segment">In person or virtual</option>
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
                      Import this form
                    </button>
                  </div>
                )}
                {note && <div className="mt-3 text-[12.5px] font-semibold text-[#0E5566]">{note}</div>}

                {data && data.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Forms on file</div>
                    <div className="mt-2 space-y-1.5">
                      {data.sources.map((src) => (
                        <div key={src.name} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[13px] font-semibold text-slate-800 truncate flex-1 min-w-0">{src.name}</span>
                          <span className="text-[11.5px] text-slate-500 shrink-0">
                            {src.responses} response{src.responses === 1 ? "" : "s"}
                            {src.matched < src.responses ? ` · ${src.responses - src.matched} unassigned` : ""}
                          </span>
                          <button onClick={() => void deleteSource(src.name)}
                                  title="Remove this form and its responses"
                                  className="shrink-0 p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {data && data.offTopic.length > 0 && (() => {
              const held = data.offTopic.filter((c) => !c.kept);
              const shown = data.offTopic.filter((c) => c.kept);
              return (
                <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="text-sm font-bold text-slate-900">
                    Comments not about the speaker
                    <span className="ml-2 text-[12px] font-semibold text-slate-400">{held.length} kept from speakers</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                    Comments about CEUs, the camera rule, Zoom, the room, registration and the like are left off the
                    speaker&rsquo;s page, their spreadsheet and their email automatically. Their rating still counts;
                    the comment is just blank for them, with nothing to say it was there. If one is actually about the
                    talk, show it to the speaker.
                  </p>
                  <div className="mt-3 rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-[28rem] overflow-y-auto">
                    {[...held, ...shown].map((c) => (
                      <div key={`${c.responseId}-${c.question}`} className={`px-3 py-2.5 flex items-start gap-3 ${c.kept ? "bg-emerald-50/50" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-700">{c.presenterName}</span>
                            <span className="px-1.5 rounded bg-slate-100 text-slate-600 font-semibold">{c.reason}</span>
                            {c.kept && <span className="px-1.5 rounded bg-emerald-100 text-emerald-800 font-bold">Shown to speaker</span>}
                          </div>
                          <div className="mt-0.5 text-[13px] leading-relaxed text-slate-700">{c.text}</div>
                        </div>
                        <button
                          onClick={() => void setKept(c.responseId, c.question, !c.kept)}
                          className="shrink-0 px-2.5 py-1 rounded-lg text-[11.5px] font-bold border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        >
                          {c.kept ? "Keep from speaker" : "Show to speaker"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

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

                {data.overall.questions.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-[#0E5566]" /> The conference overall
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Every answer across every session, pooled. {data.overall.responses} response
                      {data.overall.responses === 1 ? "" : "s"} covering {data.overall.sessionsRated} session
                      {data.overall.sessionsRated === 1 ? "" : "s"}. Presenters never see this; their pages
                      show only their own numbers.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {data.overall.questions.map((q) => (
                        <div key={q.question} className="rounded-xl border border-slate-150 bg-slate-50/60 px-4 py-3">
                          <div className="text-[12.5px] font-semibold text-slate-700">{q.question}</div>
                          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                            <span className="text-[22px] font-bold text-slate-900">{q.mean.toFixed(2)}</span>
                            <span className="text-[11.5px] text-slate-500">
                              median {q.median} · SD {q.sd === null ? "–" : q.sd.toFixed(2)} ·{" "}
                              out of {q.scale} · {Math.round(q.topBox * 100)}% rated {q.scale - 1} or {q.scale} · {q.n} answer{q.n === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="mt-2 flex gap-1">
                            {q.distribution.map((d) => (
                              <div key={d.value} className="flex-1 text-center" title={`${d.count} rated ${d.value}`}>
                                <div className="h-10 flex items-end">
                                  <div className="w-full rounded-t"
                                       style={{ height: `${Math.max(4, Math.round((d.count / q.n) * 100))}%`, background: "linear-gradient(180deg,#0066B3,#0E5566)" }} />
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{d.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.byPresenter.some((b) => b.responseCount > 0) && (() => {
                  const withFeedback = data.byPresenter.filter((b) => b.responseCount > 0);
                  const ticked = withFeedback.filter((b) => ticks.has(b.presenter.id)).map((b) => b.presenter.id);
                  const setAll = (ids: string[]) => setTicks(new Set(ids));
                  const small = "px-2.5 py-1 rounded-lg text-[11.5px] font-bold border border-slate-200 bg-white text-slate-600 hover:border-slate-300 disabled:opacity-50";
                  return (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Send className="w-4 h-4 text-[#0E5566]" /> Email presenters their feedback
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                        Each presenter gets their own private link, plus the first comment you starred for them, if
                        any. No scores go in the email. Replies come to contact@aalb.org.
                      </p>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <button className={small} onClick={() => setAll(withFeedback.filter((b) => !b.presenter.feedbackSentAt).map((b) => b.presenter.id))}>
                          Tick everyone not sent yet
                        </button>
                        <button className={small} onClick={() => setAll(withFeedback.map((b) => b.presenter.id))}>Tick everyone</button>
                        <button className={small} onClick={() => setAll([])}>Untick all</button>
                      </div>
                      <div className="mt-3 rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-96 overflow-y-auto">
                        {withFeedback.map((b) => {
                          const sentAt = b.presenter.feedbackSentAt;
                          return (
                            <div key={b.presenter.id} className="px-3 py-2 flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={ticks.has(b.presenter.id)}
                                onChange={(e) => setTicks((t) => {
                                  const next = new Set(t);
                                  if (e.target.checked) next.add(b.presenter.id); else next.delete(b.presenter.id);
                                  return next;
                                })}
                                className="accent-[#0E5566]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-[13px] font-semibold text-slate-800 truncate">{b.presenter.name}</div>
                                <div className="text-[11.5px] text-slate-500 truncate">
                                  {b.responseCount} response{b.responseCount === 1 ? "" : "s"} &middot; {b.presenter.email}
                                </div>
                                <div className="text-[11.5px] truncate" title={b.emailQuote || undefined}>
                                  {b.emailQuote
                                    ? <span className="text-slate-600">Quotes: &ldquo;{b.emailQuote}&rdquo;</span>
                                    : <span className="text-slate-400">No quote picked. Star a comment below to add one.</span>}
                                </div>
                              </div>
                              <span className={`shrink-0 text-[11.5px] font-semibold ${sentAt ? "text-emerald-700" : "text-slate-400"}`}>
                                {sentAt ? `Sent ${new Date(sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Not sent"}
                              </span>
                              <button className={small} disabled={sending} onClick={() => void sendFeedback([b.presenter.id], false)}>
                                {sentAt ? "Send again" : "Send"}
                              </button>
                              <button className={small} onClick={() => void markSent(b.presenter.id, !sentAt)}>
                                {sentAt ? "Unmark" : "Mark sent"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <button
                          disabled={sending || !ticked.length}
                          onClick={() => void sendFeedback(ticked, true)}
                          className="px-3.5 py-2 rounded-xl text-[12.5px] font-bold border border-slate-200 bg-white text-slate-700 disabled:opacity-50"
                        >
                          Send me a test
                        </button>
                        <button
                          disabled={sending || !ticked.length}
                          onClick={() => void sendFeedback(ticked, false)}
                          className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50 bg-gradient-to-r from-[#0E5566] to-[#0066B3]"
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Send to {ticked.length} ticked
                        </button>
                        <span className="text-[11.5px] text-slate-400">The test uses the first ticked presenter&rsquo;s real link and quote.</span>
                      </div>
                      {sendNote && <div className="mt-2 text-[12.5px] font-semibold text-[#0E5566]">{sendNote}</div>}
                    </div>
                  );
                })()}

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
                          <div className="text-[15px] font-bold text-slate-800">
                            {overall !== null ? overall.toFixed(2) : "–"}
                            {overall !== null && b.questions.every((q) => q.scale === b.questions[0].scale) && (
                              <span className="text-[11px] font-normal text-slate-400">/{b.questions[0].scale}</span>
                            )}
                          </div>
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
                                <th className="py-1 pr-3">Top two</th>
                                <th className="py-1">n</th>
                              </tr>
                            </thead>
                            <tbody>
                              {b.questions.map((q) => (
                                <tr key={q.question} className="border-t border-slate-100">
                                  <td className="py-1.5 pr-3 text-slate-700">{q.question}</td>
                                  <td className="py-1.5 pr-3 font-bold text-slate-900">{q.mean.toFixed(2)}<span className="font-normal text-slate-400">/{q.scale}</span></td>
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
                              <p className="text-[12px] text-slate-500 pb-1">
                                Star the comments to feature at the top of their page. The first one you star is quoted in
                                their email. Nothing is featured until you star it; &ldquo;Suggested&rdquo; only marks likely
                                candidates, so read before you star.
                              </p>
                              {b.commentRows.map((c, i) => (
                                <div key={`${c.responseId}-${c.question}-${i}`}
                                     className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
                                       c.hidden || c.autoHidden ? "border-rose-200 bg-rose-50/60"
                                       : c.featured ? "border-amber-300 bg-amber-50/70"
                                       : "border-slate-150 bg-slate-50/60"}`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                      {c.question}
                                      {c.featured && b.emailQuote === c.text && (
                                        <span className="px-1.5 rounded bg-amber-200/70 text-amber-900 font-bold">In their email</span>
                                      )}
                                      {c.featured && b.emailQuote !== c.text && (
                                        <span className="px-1.5 rounded bg-amber-100 text-amber-800 font-bold">Featured</span>
                                      )}
                                      {!c.featured && !c.hidden && c.suggested && (
                                        <span className="px-1.5 rounded bg-sky-100 text-sky-800 font-bold">Suggested</span>
                                      )}
                                      {c.autoHidden && (
                                        <span className="px-1.5 rounded bg-rose-100 text-rose-800 font-bold">Not about the speaker: {c.offTopic}</span>
                                      )}
                                      {c.offTopic && c.kept && !c.hidden && (
                                        <span className="px-1.5 rounded bg-emerald-100 text-emerald-800 font-bold">Flagged, shown anyway</span>
                                      )}
                                    </div>
                                    <div className={`text-[13px] leading-relaxed ${c.hidden || c.autoHidden ? "text-rose-800 line-through" : "text-slate-700"}`}>{c.text}</div>
                                  </div>
                                  {!c.hidden && !c.autoHidden && (
                                    <button
                                      onClick={() => void toggleFeature(c.responseId, c.question, !c.featured)}
                                      title={c.featured ? "Stop featuring this" : "Feature this on their page"}
                                      className={`shrink-0 p-1.5 rounded-lg hover:bg-white ${c.featured ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}
                                    >
                                      <Star className="w-3.5 h-3.5" fill={c.featured ? "currentColor" : "none"} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => void (c.autoHidden
                                      ? setKept(c.responseId, c.question, true)
                                      : toggleHide(c.responseId, c.question, !c.hidden))}
                                    title={c.hidden || c.autoHidden ? "Show on their page again" : "Hide from their page"}
                                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white"
                                  >
                                    {c.hidden || c.autoHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
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
