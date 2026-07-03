"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Megaphone, Loader2, Download, Send, Ticket, Users, CheckCircle2, AlertCircle, ExternalLink,
} from "lucide-react";
import { AMBASSADOR_STATUS_LABELS } from "@/lib/ambassadors";

const TEAL = "#0E5566";
const GOLD = "#C9A14B";
const GOLD_DARK = "#9C7A2E";
const CREAM = "#FBF8F1";

type AmbassadorRow = {
  id: string;
  orgName: string;
  contactName: string;
  email: string;
  website: string | null;
  audience: string | null;
  code: string;
  status: string;
  unsubscribedAt: string | null;
  redemptions: number;
  codeLive: boolean;
};

// The ambassador program: educators, program directors, and association
// leaders who share a personal 20% code (unlimited uses, through Aug 10) with
// their students and members. This page loads the curated list, queues the
// engraved letters into the shared paced queue, and shows whose code is
// actually driving registrations.
// Dev-only mock rows so the page can be design-reviewed and screenshotted
// without a database (visit /ambassadors?demo=1 in development).
const DEMO_ROWS: AmbassadorRow[] = [
  { id: "1", orgName: "College of DuPage — Healthcare Interpreting Certificate", contactName: "Dr. Elena Garcia", email: "garciae@cod.edu", website: "https://www.cod.edu", audience: "healthcare-interpreting certificate students, western suburbs", code: "GARCIA20", status: "invited", unsubscribedAt: null, redemptions: 7, codeLive: true },
  { id: "2", orgName: "CHICATA — Chicago Area Translators & Interpreters Association", contactName: "", email: "office@chicata.org", website: "https://www.chicata.org", audience: "working translators & interpreters, Chicagoland", code: "CHICATA20", status: "invited", unsubscribedAt: null, redemptions: 4, codeLive: true },
  { id: "3", orgName: "Columbia College Chicago — ASL-English Interpretation BA", contactName: "Prof. Daniel Okafor", email: "dokafor@colum.edu", website: "https://www.colum.edu", audience: "ASL interpreting majors", code: "OKAFOR20", status: "queued", unsubscribedAt: null, redemptions: 0, codeLive: true },
  { id: "4", orgName: "UIC School of Public Health — Health Equity Program", contactName: "Dr. Amara Osei", email: "aosei@uic.edu", website: "https://publichealth.uic.edu", audience: "MPH students & health-equity researchers", code: "OSEI20", status: "pending", unsubscribedAt: null, redemptions: 0, codeLive: false },
  { id: "5", orgName: "MATI — Midwest Association of Translators & Interpreters", contactName: "", email: "info@matiata.org", website: "https://www.matiata.org", audience: "member translators & interpreters, five states", code: "MATI20", status: "pending", unsubscribedAt: null, redemptions: 0, codeLive: false },
];

export default function AmbassadorsPage() {
  const { data: session, status } = useSession();
  // Demo mode resolves after mount (never during render) so server and client
  // HTML agree; the page briefly shows its loading state, then the mock rows.
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("demo")) {
      setDemo(true);
    }
  }, []);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = demo || role === "admin" || role === "developer";

  const [rows, setRows] = useState<AmbassadorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | "load" | "queue">(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (demo) { setRows(DEMO_ROWS); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/ambassadors");
      const j = await res.json();
      if (res.ok) setRows(j.ambassadors || []);
    } finally {
      setLoading(false);
    }
  }, [demo]);
  useEffect(() => { if (status === "authenticated" || demo) void load(); }, [status, demo, load]);

  async function loadCurated() {
    setBusy("load");
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/ambassadors/load", { method: "POST" });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Load failed."); return; }
      setNote(`Loaded ${j.created} new ambassador${j.created === 1 ? "" : "s"}${j.skipped?.length ? ` · ${j.skipped.length} skipped (already loaded or in the sponsor pipeline)` : ""}.`);
      await load();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function queueAll() {
    const pending = rows.filter((r) => r.status === "pending" && !r.unsubscribedAt).length;
    if (!pending) return;
    if (!confirm(`Queue engraved share letters to ${pending} ambassador${pending === 1 ? "" : "s"}? They go out paced from the shared email queue, and each person's 20% code goes live now.`)) return;
    setBusy("queue");
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/ambassadors/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Queue failed."); return; }
      setNote(`Queued ${j.queued} letter${j.queued === 1 ? "" : "s"} — watch them go out on the Email Queue page.`);
      await load();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading" && !demo) {
    return <Centered><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></Centered>;
  }
  if (status !== "authenticated" && !demo) {
    return <Centered><p className="text-sm text-slate-500">Please <Link className="font-semibold underline" href="/login">sign in</Link>.</p></Centered>;
  }

  const counts = {
    pending: rows.filter((r) => r.status === "pending").length,
    queued: rows.filter((r) => r.status === "queued").length,
    invited: rows.filter((r) => r.status === "invited").length,
    redemptions: rows.reduce((sum, r) => sum + (r.redemptions || 0), 0),
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#F0EBDD 0%,#EFEAE0 30%, #f6f8fa 100%)" }}>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: GOLD_DARK }}>
              <Megaphone className="w-4 h-4" /> Ambassador program
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              People who open doors.
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
              Professors, program directors, and association leaders — invited not to sponsor, but to
              <strong> share</strong>. Each receives an engraved letter with a personal <strong>20% code</strong> (unlimited
              uses, valid through <strong>August&nbsp;10</strong>) and a ready-to-forward blurb. Redemptions are tracked
              per code, so you can see exactly whose voice fills seats.
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadCurated}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-white border hover:bg-slate-50 disabled:opacity-50"
                style={{ borderColor: GOLD, color: GOLD_DARK }}
              >
                {busy === "load" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Load curated list
              </button>
              <button
                onClick={queueAll}
                disabled={busy !== null || counts.pending === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: TEAL }}
              >
                {busy === "queue" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Queue {counts.pending || ""} invite{counts.pending === 1 ? "" : "s"}
              </button>
            </div>
          )}
        </div>

        {(note || error) && (
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm inline-flex items-start gap-2 ${error ? "bg-rose-50 border border-rose-200 text-rose-700" : "bg-emerald-50 border border-emerald-200 text-emerald-800"}`}>
            {error ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
            {error || note}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Stat label="Loaded" value={counts.pending} icon={Users} />
          <Stat label="Queued" value={counts.queued} icon={Send} />
          <Stat label="Letters sent" value={counts.invited} icon={Megaphone} />
          <Stat label="Registrations via codes" value={counts.redemptions} icon={Ticket} gold />
        </div>

        <div className="mt-6 bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#E4DAC4" }}>
          <div className="h-1" style={{ background: "linear-gradient(90deg,#9C7A2E 0%,#F4E9CD 50%,#9C7A2E 100%)" }} />
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300 inline" /></div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <Megaphone className="w-8 h-8 mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">No ambassadors yet. Load the curated list to begin.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((r) => {
                const st = r.unsubscribedAt
                  ? { label: "Unsubscribed", color: "bg-rose-50 text-rose-600 border-rose-200" }
                  : AMBASSADOR_STATUS_LABELS[r.status] || AMBASSADOR_STATUS_LABELS.pending;
                return (
                  <li key={r.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 truncate">{r.orgName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 truncate">
                        {r.contactName ? `${r.contactName} · ` : ""}{r.email}
                        {r.audience ? <span className="hidden sm:inline"> · {r.audience}</span> : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className="inline-block px-2.5 py-1 rounded-lg text-[12px] font-bold tracking-wider"
                        style={{ background: CREAM, border: `1.5px dashed ${GOLD}`, color: "#3C2E10", fontFamily: "'Courier New', monospace" }}
                      >
                        {r.code}
                      </span>
                      <div className="mt-1 text-[11px] font-semibold" style={{ color: r.redemptions > 0 ? GOLD_DARK : "#94a3b8" }}>
                        {r.redemptions} registration{r.redemptions === 1 ? "" : "s"}
                      </div>
                    </div>
                    {r.website && (
                      <a href={r.website} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-300 hover:text-slate-500">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Letters send from the shared paced <Link href="/queue" className="font-semibold underline" style={{ color: TEAL }}>Email Queue</Link> (Ambassadors show as their own type there).
          Share links look like <code className="bg-white border border-slate-200 rounded px-1">conference.aalb.org/register?code=GARCIA20</code> and prefill the code at checkout.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, gold }: { label: string; value: number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; gold?: boolean }) {
  return (
    <div className="bg-white rounded-xl border px-4 py-3 shadow-sm" style={{ borderColor: gold ? GOLD : "#e2e8f0" }}>
      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-extrabold inline-flex items-center gap-2" style={{ color: gold ? GOLD_DARK : "#0f172a" }}>
        <Icon className="w-4 h-4" style={{ color: gold ? GOLD : "#94a3b8" }} />
        {value}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center bg-slate-50">{children}</div>;
}
