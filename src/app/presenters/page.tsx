"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic, Search, UserCheck, Download, Send, Check,
  Clock, XCircle, RefreshCw, AlertCircle, CircleHelp, Trash2, Megaphone, Inbox,
  Presentation, ExternalLink,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { STATUS_LABELS } from "@/lib/presenters";
import { parseResponse } from "@/lib/api";
import { InviteComposer, type InviteEditable } from "@/components/presenters/InviteComposer";
import ProposalCallComposer from "@/components/presenters/ProposalCallComposer";

interface PresenterRow {
  id: string;
  email: string;
  name: string;
  affiliation: string | null;
  jobTitle: string | null;
  role: string | null;
  talkTitle: string | null;
  sessionFormat: string | null;
  sessionLength: string | null;
  sessionTrack: string | null;
  preferredDay: string | null;
  honorariumAmount: number | null;
  travelReimbursement: number | null;
  status: string;
  invitedAt: string;
  confirmedAt: string | null;
  lastSentAt: string | null;
  headshotMime: string | null;
  slidesRequestedAt: string | null;
  slidesRemindCount: number;
  slide: { fileName: string | null; sizeBytes: number | null; linkUrl: string | null; updatedAt: string | null; createdAt: string } | null;
}

function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function PresentersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<PresenterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showInvite, setShowInvite] = useState(false);
  const [showProposalCall, setShowProposalCall] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<InviteEditable | null>(null);
  const [slidesBusy, setSlidesBusy] = useState<"initial" | "remind" | null>(null);
  const [slidesNote, setSlidesNote] = useState<string | null>(null);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin" || role === "developer";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/presenters");
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  // Open the confirm composer pre-filled from an applicant's full submission
  // (the list payload omits the abstract and objectives, so fetch the record).
  const startAccept = useCallback(async (id: string) => {
    const res = await fetch(`/api/presenters/${id}`);
    if (!res.ok) return;
    const p = await res.json();
    setAcceptTarget({
      id: p.id,
      name: p.name || "",
      email: p.email || "",
      affiliation: p.affiliation ?? null,
      role: p.role ?? null,
      sessionFormat: p.sessionFormat ?? null,
      sessionLength: p.sessionLength ?? null,
      qaLength: p.qaLength ?? null,
      sessionTrack: p.sessionTrack ?? null,
      preferredDay: p.preferredDay ?? null,
      talkTitle: p.talkTitle ?? null,
      talkAbstract: p.talkAbstract ?? null,
      learningObjectives: p.learningObjectives ?? null,
      honorariumAmount: p.honorariumAmount ?? null,
      travelReimbursement: p.travelReimbursement ?? null,
    });
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    load();
  }, [session, status, router, load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.talkTitle || "").toLowerCase().includes(q) ||
        (r.affiliation || "").toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);

  const counts = useMemo(() => ({
    all: rows.length,
    proposed: rows.filter((r) => r.status === "proposed").length,
    invited: rows.filter((r) => r.status === "invited").length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    tentative: rows.filter((r) => r.status === "tentative").length,
    changes_requested: rows.filter((r) => r.status === "changes_requested").length,
    declined: rows.filter((r) => r.status === "declined").length,
  }), [rows]);

  // Slide-deck collection across the confirmed roster: who has delivered,
  // who has been asked and hasn't, and who we haven't asked at all.
  const slides = useMemo(() => {
    const confirmed = rows.filter((r) => r.status === "confirmed");
    return {
      confirmed: confirmed.length,
      received: confirmed.filter((r) => r.slide).length,
      notAsked: confirmed.filter((r) => !r.slidesRequestedAt).length,
      askedPending: confirmed.filter((r) => r.slidesRequestedAt && !r.slide).length,
    };
  }, [rows]);

  async function requestSlides(mode: "initial" | "remind") {
    setSlidesBusy(mode);
    setSlidesNote(null);
    try {
      const res = await fetch("/api/presenters/request-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json().catch(() => ({}));
      setSlidesNote(res.ok
        ? `${mode === "remind" ? "Reminded" : "Asked"} ${json.sent || 0} presenter${json.sent === 1 ? "" : "s"}${json.failed ? ` · ${json.failed} failed` : ""}.`
        : (json.error || "Could not send."));
      await load();
    } catch {
      setSlidesNote("Network error while sending.");
    } finally {
      setSlidesBusy(null);
      setTimeout(() => setSlidesNote(null), 8000);
    }
  }

  function exportCsv() {
    const headers = ["Name", "Email", "Affiliation", "Role", "Talk title", "Length", "Track", "Day", "Honorarium", "Travel", "Status", "Invited", "Confirmed"];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      lines.push([
        r.name, r.email, r.affiliation || "", r.role || "", r.talkTitle || "",
        r.sessionLength || "", r.sessionTrack || "", r.preferredDay || "",
        r.honorariumAmount ? `$${r.honorariumAmount}` : "",
        r.travelReimbursement ? `up to $${r.travelReimbursement}` : "",
        r.status, r.invitedAt, r.confirmedAt || "",
      ].map(csvEscape).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presenters-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
                  <Mic className="w-3.5 h-3.5" /> Presenters
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                  Presenter confirmations
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Track invitations and confirmations for the 2026 Lurie Children&rsquo;s and AALB Conference.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProposalCall(true)}
                  title="Open call, emails a link inviting someone to submit their own proposal. They apply, you review."
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-left text-[#0E5566] bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  <Megaphone className="w-4 h-4 shrink-0" />
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">Call for Proposals</span>
                    <span className="block text-[11px] font-medium text-slate-500">Open call, they apply to speak</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvite(true)}
                  title="You've selected this speaker, send them their session details and a private portal link to confirm participation, request changes, or decline."
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-left text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm"
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">Confirm a Presenter</span>
                    <span className="block text-[11px] font-medium text-white/70">You pick them; they confirm participation</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
              <Stat label="Total" value={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
              <Stat label="Applicants" value={counts.proposed} icon={<Inbox className="w-4 h-4 text-violet-500" />} active={filter === "proposed"} onClick={() => setFilter("proposed")} />
              <Stat label="Awaiting" value={counts.invited} icon={<Clock className="w-4 h-4 text-amber-500" />} active={filter === "invited"} onClick={() => setFilter("invited")} />
              <Stat label="Confirmed" value={counts.confirmed} icon={<Check className="w-4 h-4 text-emerald-500" />} active={filter === "confirmed"} onClick={() => setFilter("confirmed")} />
              <Stat label="Tentative" value={counts.tentative} icon={<CircleHelp className="w-4 h-4 text-sky-500" />} active={filter === "tentative"} onClick={() => setFilter("tentative")} />
              <Stat label="Changes" value={counts.changes_requested} icon={<AlertCircle className="w-4 h-4 text-amber-600" />} active={filter === "changes_requested"} onClick={() => setFilter("changes_requested")} />
              <Stat label="Declined" value={counts.declined} icon={<XCircle className="w-4 h-4 text-rose-500" />} active={filter === "declined"} onClick={() => setFilter("declined")} />
            </div>

            {isAdmin && slides.confirmed > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                      <Presentation className="w-4 h-4 text-[#0E5566]" /> Presentation decks
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {slides.received}/{slides.confirmed} in
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Confirmed presenters upload their deck (PowerPoint, Keynote, PDF up to 50 MB, or a Google
                      Slides link) right in their portal, due <strong>Saturday, August 8</strong>, so there&rsquo;s time
                      to review formatting. Files over 50 MB come in by email to contact@aalb.org. Each row below shows
                      who has delivered; sends log to the presenter&rsquo;s history.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => requestSlides("initial")}
                      disabled={slidesBusy !== null || slides.notAsked === 0}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50 bg-gradient-to-r from-[#0E5566] to-[#0066B3]"
                      title="Email every confirmed presenter who hasn't been asked yet"
                    >
                      {slidesBusy === "initial" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {slides.notAsked === 0 ? "Everyone asked" : `Ask for presentations (${slides.notAsked})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => requestSlides("remind")}
                      disabled={slidesBusy !== null || slides.askedPending === 0}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border disabled:opacity-50 text-[#0E5566] border-[#0E5566] bg-white"
                      title="Nudge everyone who was asked and hasn't sent a deck yet"
                    >
                      {slidesBusy === "remind" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      {slides.askedPending === 0 ? "No one to remind" : `Send reminder (${slides.askedPending})`}
                    </button>
                  </div>
                </div>
                {slidesNote && <div className="mt-2 text-xs font-semibold text-teal-700">{slidesNote}</div>}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, talk title"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={load}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>

              {filtered.length === 0 ? (
                <div className="px-6 py-16 text-center text-sm text-slate-400">
                  No presenters {filter === "all" ? "yet" : `with status "${filter}"`}.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <PresenterRowItem key={r.id} row={r} isAdmin={isAdmin} onChanged={load} onAccept={startAccept} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
        <MobileNav />
      </div>

      {showInvite && (
        <InviteComposer
          onClose={() => setShowInvite(false)}
          onCreated={() => { setShowInvite(false); load(); }}
        />
      )}

      {showProposalCall && (
        <ProposalCallComposer
          onClose={() => setShowProposalCall(false)}
          onSent={() => setShowProposalCall(false)}
        />
      )}

      {acceptTarget && (
        <InviteComposer
          existing={acceptTarget}
          acceptMode
          onClose={() => setAcceptTarget(null)}
          onCreated={() => { setAcceptTarget(null); load(); }}
        />
      )}
    </div>
  );
}

function Stat({
  label, value, icon, active, onClick,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "text-left p-4 rounded-2xl border transition-all " +
        (active
          ? "bg-white border-[#0066B3] ring-1 ring-[#0066B3]/20 shadow-sm"
          : "bg-white border-slate-200 hover:border-slate-300")
      }
    >
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">{label}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    </button>
  );
}

function PresenterRowItem({
  row, isAdmin, onChanged, onAccept,
}: {
  row: PresenterRow;
  isAdmin: boolean;
  onChanged: () => void;
  onAccept: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const status = STATUS_LABELS[row.status] || STATUS_LABELS.invited;

  async function resend() {
    if (!isAdmin) return;
    setBusy(true);
    await fetch(`/api/presenters/${row.id}/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setBusy(false);
    onChanged();
  }

  async function remove() {
    if (!isAdmin) return;
    setBusy(true);
    await fetch(`/api/presenters/${row.id}`, { method: "DELETE" });
    setBusy(false);
    setConfirming(false);
    onChanged();
  }

  const subtitle = [
    row.role || row.sessionFormat,
    row.sessionLength,
    row.preferredDay,
  ].filter(Boolean).join(" | ");

  return (
    <div className="px-5 py-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row gap-3 sm:items-center">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-500 font-semibold text-sm shrink-0">
          {row.headshotMime ? (
            <img src={`/api/presenters/headshot/${row.id}`} alt="" className="w-full h-full object-cover" />
          ) : (
            row.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/presenters/${row.id}`} className="text-sm font-semibold text-slate-900 hover:text-[#0066B3] truncate block">
            {row.name}
          </Link>
          <div className="text-xs text-slate-500 truncate">
            {row.talkTitle || row.email}
            {subtitle && <span className="text-slate-300"> | {subtitle}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* Deck state, only meaningful once someone is confirmed: green when
            it's in (click to download; PDFs open in the tab, links open the
            deck), amber while we're waiting on an ask. */}
        {row.status === "confirmed" && row.slide && (
          <a
            href={`/api/presenters/${row.id}/slides`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            title={row.slide.fileName
              ? `${row.slide.fileName}${row.slide.sizeBytes ? ` · ${(row.slide.sizeBytes / 1024 / 1024).toFixed(1)} MB` : ""} — click to download`
              : `${row.slide.linkUrl} — click to open`}
          >
            {row.slide.fileName ? <Download className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
            Slides in · {shortDate(row.slide.updatedAt || row.slide.createdAt)}
          </a>
        )}
        {row.status === "confirmed" && !row.slide && row.slidesRequestedAt && (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200"
            title={`Asked ${shortDate(row.slidesRequestedAt)}${row.slidesRemindCount ? `, reminded ${row.slidesRemindCount}×` : ""} — no deck yet`}
          >
            <Presentation className="w-3 h-3" />
            Slides asked {shortDate(row.slidesRequestedAt)}{row.slidesRemindCount ? ` · ${row.slidesRemindCount}×` : ""}
          </span>
        )}
        <span className={"inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border " + status.color}>
          {status.label}
        </span>
        {row.status === "proposed" ? (
          isAdmin && (
            <button
              type="button"
              onClick={() => onAccept(row.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C]"
              title="Accept this applicant and email them a portal link to confirm participation"
            >
              <UserCheck className="w-3 h-3" /> Accept
            </button>
          )
        ) : row.status !== "confirmed" ? (
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-[#0066B3] hover:bg-[#0066B3]/5 disabled:opacity-40"
            title="Resend invitation"
          >
            <Send className="w-3 h-3" /> {busy ? "Sending" : "Resend"}
          </button>
        ) : null}
        {isAdmin && (
          confirming ? (
            <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
              <span className="text-[11px] font-medium text-rose-700">Delete?</span>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="px-2 py-0.5 rounded text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40"
              >
                {busy ? "Deleting" : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 hover:bg-slate-100"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              title="Delete invitation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )
        )}
        <Link href={`/presenters/${row.id}`} className="text-xs font-semibold text-[#0066B3] hover:underline">
          View
        </Link>
      </div>
    </div>
  );
}


function csvEscape(s: string) {
  if (s == null) return "";
  const needs = /[",\n]/.test(s);
  const safe = s.replace(/"/g, '""');
  return needs ? `"${safe}"` : safe;
}
