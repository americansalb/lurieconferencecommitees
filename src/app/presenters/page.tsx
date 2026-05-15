"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic, Search, Plus, Download, Send, X, Copy, CheckCircle2,
  Clock, XCircle, RefreshCw,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { STATUS_LABELS } from "@/lib/presenters";

interface PresenterRow {
  id: string;
  email: string;
  name: string;
  affiliation: string | null;
  jobTitle: string | null;
  talkTitle: string | null;
  sessionFormat: string | null;
  sessionTrack: string | null;
  status: string;
  invitedAt: string;
  confirmedAt: string | null;
  lastSentAt: string | null;
  headshotMime: string | null;
}

export default function PresentersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<PresenterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showInvite, setShowInvite] = useState(false);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin" || role === "developer";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/presenters");
    if (res.ok) setRows(await res.json());
    setLoading(false);
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
    invited: rows.filter((r) => r.status === "invited").length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    declined: rows.filter((r) => r.status === "declined").length,
  }), [rows]);

  function exportCsv() {
    const headers = ["Name", "Email", "Affiliation", "Talk title", "Format", "Track", "Status", "Invited", "Confirmed"];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      lines.push([
        r.name, r.email, r.affiliation || "", r.talkTitle || "",
        r.sessionFormat || "", r.sessionTrack || "", r.status,
        r.invitedAt, r.confirmedAt || "",
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
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
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
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-blue-500">
                  <Mic className="w-3.5 h-3.5" /> Presenters
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Presenter confirmations
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Track invitations and confirmations for the 2026 Lurie Children&rsquo;s &amp; AALB Conference.
                </p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowInvite(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" /> Invite presenter
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Stat label="Total" value={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
              <Stat label="Awaiting" value={counts.invited} icon={<Clock className="w-4 h-4 text-amber-500" />} active={filter === "invited"} onClick={() => setFilter("invited")} />
              <Stat label="Confirmed" value={counts.confirmed} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} active={filter === "confirmed"} onClick={() => setFilter("confirmed")} />
              <Stat label="Declined" value={counts.declined} icon={<XCircle className="w-4 h-4 text-rose-500" />} active={filter === "declined"} onClick={() => setFilter("declined")} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, talk title…"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={load}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
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
                    <PresenterRowItem key={r.id} row={r} isAdmin={isAdmin} onChanged={load} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
        <MobileNav />
      </div>

      {showInvite && isAdmin && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onCreated={() => {
            setShowInvite(false);
            load();
          }}
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
          ? "bg-white border-blue-300 ring-1 ring-blue-200 shadow-sm"
          : "bg-white border-slate-200 hover:border-slate-300")
      }
    >
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">{label}</div>
      </div>
      <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
    </button>
  );
}

function PresenterRowItem({
  row, isAdmin, onChanged,
}: {
  row: PresenterRow;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
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
          <Link href={`/presenters/${row.id}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 truncate block">
            {row.name}
          </Link>
          <div className="text-xs text-slate-500 truncate">
            {row.talkTitle || row.email}
            {row.affiliation && <span className="text-slate-300"> &middot; {row.affiliation}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={"inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border " + status.color}>
          {status.label}
        </span>
        {isAdmin && row.status !== "confirmed" && (
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
            title="Resend invitation"
          >
            <Send className="w-3 h-3" /> {busy ? "Sending…" : "Resend"}
          </button>
        )}
        <Link href={`/presenters/${row.id}`} className="text-xs font-semibold text-blue-600 hover:underline">
          View
        </Link>
      </div>
    </div>
  );
}

function InviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [talkTitle, setTalkTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sendNow, setSendNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/presenters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, affiliation, talkTitle, customMessage, sendNow }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCreatedUrl(data.url);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to invite");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-semibold text-slate-900">Invite a presenter</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdUrl ? (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-emerald-900">
                  {sendNow ? "Invitation sent" : "Presenter created"}
                </div>
                <div className="text-xs text-emerald-700 mt-1">
                  {sendNow
                    ? "We emailed the presenter their personal portal link."
                    : "Send the link below to your presenter."}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Personal portal link</label>
              <div className="flex items-center gap-2">
                <input readOnly value={createdUrl} className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg" />
                <button
                  onClick={() => navigator.clipboard.writeText(createdUrl)}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-xs">{error}</div>
            )}
            <ModalField label="Name" required>
              <input value={name} onChange={(e) => setName(e.target.value)} className={modalInput} />
            </ModalField>
            <ModalField label="Email" required>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={modalInput} />
            </ModalField>
            <ModalField label="Affiliation">
              <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} className={modalInput} />
            </ModalField>
            <ModalField label="Talk title (you can leave blank)">
              <input value={talkTitle} onChange={(e) => setTalkTitle(e.target.value)} className={modalInput} />
            </ModalField>
            <ModalField label="Personal note (optional)" hint="Shows in the invitation email.">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className={modalInput}
                placeholder="Looking forward to having you back this year…"
              />
            </ModalField>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              Email the invitation now
            </label>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
              <button
                onClick={submit}
                disabled={busy || !email || !name}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
              >
                {busy ? "Working…" : "Send invitation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const modalInput =
  "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none";

function ModalField({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <div className="text-[11px] text-slate-400">{hint}</div>}
    </div>
  );
}

function csvEscape(s: string) {
  if (s == null) return "";
  const needs = /[",\n]/.test(s);
  const safe = s.replace(/"/g, '""');
  return needs ? `"${safe}"` : safe;
}
