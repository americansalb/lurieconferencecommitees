"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Award, Trash2, RefreshCw, Search, Filter, ExternalLink, Mail, Building2, Copy, Plus,
  Clock, Pause, Play, Zap, SlidersHorizontal, Loader2, BadgeCheck,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { SPONSOR_STATUS_LABELS, TIERS } from "@/lib/sponsors";
import InviteSponsorComposer from "./InviteSponsorComposer";
import QueueSettingsModal from "@/components/email/QueueSettingsModal";

type Sponsor = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  tier: string;
  amountCents: number;
  donateFoodInstead: boolean;
  message: string | null;
  registreeName: string | null;
  registreeEmail: string | null;
  dietary: string | null;
  accessibility: string | null;
  wantsLogo: boolean;
  exhibitorDetailsAt: string | null;
  logo: { mime: string } | null;
  status: string;
  paid: boolean;
  paidAt: string | null;
  applicationToken: string;
  createdAt: string;
};

export default function SponsorsAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [queue, setQueue] = useState<{ nextScheduledFor: string | null; paused: boolean; sentLast24h: number } | null>(null);
  const [flushing, setFlushing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void;
  } | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [requestingLogoId, setRequestingLogoId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "admin" || role === "developer";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sponsors");
      if (res.ok) {
        const data = await res.json();
        setSponsors(data.sponsors || []);
      }
      const q = await fetch("/api/admin/email-queue");
      if (q.ok) setQueue(await q.json());
    } finally {
      setLoading(false);
    }
  }, []);

  async function sendNow() {
    setFlushing(true);
    try {
      await fetch("/api/admin/email-queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force: true }) });
    } finally {
      setFlushing(false);
      load();
    }
  }

  async function togglePause() {
    if (!queue) return;
    await fetch("/api/admin/email-queue", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paused: !queue.paused }) });
    load();
  }

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  async function applyStatus(id: string, newStatus: string) {
    await fetch(`/api/sponsors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  function updateStatus(id: string, newStatus: string) {
    // Moving to "Awaiting payment" emails the applicant their acceptance +
    // pay link. Confirm in-app first so an inline misclick doesn't email someone.
    if (newStatus === "awaiting_payment") {
      const s = sponsors.find((x) => x.id === id);
      const owes = s && !s.paid && !s.donateFoodInstead && s.amountCents > 0;
      if (owes) {
        setConfirmDialog({
          title: "Accept and email this applicant?",
          message: `${s!.companyName} will receive an email confirming their acceptance with a link to complete payment. It sends right away.`,
          confirmLabel: "Accept & send email",
          onConfirm: () => { setConfirmDialog(null); void applyStatus(id, newStatus); },
        });
        return;
      }
    }
    void applyStatus(id, newStatus);
  }

  function remove(id: string) {
    const s = sponsors.find((x) => x.id === id);
    setConfirmDialog({
      title: "Delete this application?",
      message: `${s?.companyName || "This application"} will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        await fetch(`/api/sponsors/${id}`, { method: "DELETE" });
        load();
      },
    });
  }

  async function copyStatusLink(token: string) {
    const url = `${window.location.origin}/sponsor/status/${token}`;
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }

  // Verify a payment with Stripe and, if it went through, mark paid + email.
  // Recovers a payment the webhook never delivered.
  async function confirmPayment(id: string) {
    const s = sponsors.find((x) => x.id === id);
    setConfirmingId(id);
    setActionNote(null);
    try {
      const res = await fetch(`/api/sponsors/${id}/confirm-payment`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      const who = s?.companyName || "Sponsor";
      if (j.paidOnStripe === false) {
        setActionNote(`${who}: Stripe shows this checkout has not been paid, so nothing changed.`);
      } else if (res.ok && j.ok) {
        setActionNote(
          j.emailed
            ? `${who}: confirmed and the confirmation email was sent.`
            : `${who}: marked paid, but the email failed (${j.error || "see logs"}).`
        );
      } else {
        setActionNote(`${who}: could not confirm. ${j.error || "Unknown error."}`);
      }
      await load();
    } finally {
      setConfirmingId(null);
      setTimeout(() => setActionNote(null), 8000);
    }
  }

  // Email the sponsor asking for a higher-resolution logo, with an upload link.
  async function requestLogo(id: string) {
    const s = sponsors.find((x) => x.id === id);
    setRequestingLogoId(id);
    setActionNote(null);
    try {
      const res = await fetch(`/api/sponsors/${id}/request-logo`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      const who = s?.companyName || "Sponsor";
      setActionNote(
        res.ok && j.ok
          ? `${who}: emailed a request for a high-resolution logo with an upload link.`
          : `${who}: could not send the logo request. ${j.error || ""}`
      );
    } finally {
      setRequestingLogoId(null);
      setTimeout(() => setActionNote(null), 8000);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const filtered = sponsors.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (tierFilter !== "all" && s.tier !== tierFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![s.companyName, s.contactName, s.contactEmail, s.website].some((v) => v?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const totalDollars = sponsors.filter((s) => s.paid).reduce((sum, s) => sum + s.amountCents, 0) / 100;
  const pipelineDollars = sponsors.filter((s) => !s.paid && !s.donateFoodInstead && s.status !== "declined").reduce((sum, s) => sum + s.amountCents, 0) / 100;
  const queuedCount = sponsors.filter((s) => s.status === "queued").length;
  // Paid but the confirmation email hasn't gone out yet: the ones to chase.
  const confirmationPending = sponsors.filter((s) => s.status === "paid").length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-slate-900">Sponsors &amp; Exhibitors</h1>
                <p className="text-xs text-slate-500">Applications, pipeline, and confirmed sponsorships</p>
              </div>
              <a
                href="/sponsor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5"
                title="Open the public sponsor page"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Public page
              </a>
              <button
                onClick={() => setShowInvite(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Invite sponsors
              </button>
              <button onClick={load} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {showInvite && (
              <InviteSponsorComposer
                onClose={() => setShowInvite(false)}
                onSent={() => { setShowInvite(false); load(); }}
              />
            )}

            {showQueue && <QueueSettingsModal onClose={() => setShowQueue(false)} onChanged={load} />}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              <Stat label="Applications" value={sponsors.length.toString()} />
              <Stat label="Paid" value={sponsors.filter((s) => s.paid).length.toString()} accent="#059669" />
              <Stat label="Paid $" value={`$${totalDollars.toLocaleString("en-US")}`} accent="#0E5566" />
              <Stat label="Pipeline $" value={`$${pipelineDollars.toLocaleString("en-US")}`} accent="#0066B3" />
            </div>

            {confirmationPending > 0 && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-amber-800 font-semibold">
                  {confirmationPending} paid {confirmationPending === 1 ? "sponsor hasn’t" : "sponsors haven’t"} been sent a confirmation yet.
                </span>
                <button onClick={() => setFilter("paid")} className="ml-auto text-xs font-bold text-amber-700 underline hover:text-amber-900">Show them</button>
              </div>
            )}

            {(queuedCount > 0 || queue?.paused) && (
              <div className="mb-5 rounded-xl border border-[#0066B3]/20 bg-[#0066B3]/[0.04] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0E5566]">
                  <Clock className="w-4 h-4" /> {queuedCount} invite{queuedCount === 1 ? "" : "s"} queued
                </span>
                {queue?.paused ? (
                  <span className="text-sm font-medium text-amber-700">Sending paused</span>
                ) : queue?.nextScheduledFor ? (
                  <span className="text-sm text-slate-500">next ~{new Date(queue.nextScheduledFor).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                ) : null}
                {typeof queue?.sentLast24h === "number" && queue.sentLast24h > 0 && (
                  <span className="text-sm text-slate-400">· {queue.sentLast24h} sent in 24h</span>
                )}
                <span className="text-[11px] text-slate-400 hidden sm:inline">Paced on the shared schedule with attendee invites.</span>
                {isAdmin && (
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setShowQueue(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50" title="Queue settings: rate, window, and partial sends">
                      <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust
                    </button>
                    <button onClick={togglePause} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">
                      {queue?.paused ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
                    </button>
                    <button onClick={sendNow} disabled={flushing} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] disabled:opacity-50">
                      {flushing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Send now
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search company, contact, email…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-teal-500"
                  >
                    <option value="all">All statuses</option>
                    {Object.entries(SPONSOR_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-teal-500"
                  >
                    <option value="all">All tiers</option>
                    {TIERS.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-400">
                  {sponsors.length === 0
                    ? <>No sponsor applications yet. Share <code className="px-1.5 py-0.5 bg-slate-100 rounded">/sponsor</code> to start collecting them.</>
                    : "No matches."}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map((s) => {
                    const tier = TIERS.find((t) => t.id === s.tier);
                    const sl = SPONSOR_STATUS_LABELS[s.status] || SPONSOR_STATUS_LABELS.submitted;
                    // "Confirm payment" verifies an awaiting payment with Stripe;
                    // "Send confirmation" (re)sends the receipt to a paid sponsor.
                    const isConfirmAction = !s.paid && s.status === "awaiting_payment";
                    const showPayAction = isAdmin && s.amountCents > 0 && (s.status === "awaiting_payment" || s.paid || s.status === "paid");
                    return (
                      <li key={s.id} className="p-4 group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: (tier?.accent || "#94a3b8") + "20" }}>
                            <Building2 className="w-4 h-4" style={{ color: tier?.accent || "#475569" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate">{s.companyName}</div>
                            <div className="text-xs text-slate-500 truncate">
                              {s.contactName} &middot; <a className="hover:text-slate-700" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>
                              {s.contactPhone && <> &middot; {s.contactPhone}</>}
                            </div>
                          </div>
                          <div className="text-right shrink-0 hidden sm:block">
                            <div className="text-xs font-bold text-slate-900">
                              {tier?.name || (s.tier === "undecided" ? "Tier not yet chosen" : s.tier)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {s.tier === "undecided"
                                ? "Invitee will pick a level"
                                : s.donateFoodInstead
                                  ? "Food in kind"
                                  : (tier?.amountLabel || `$${(s.amountCents / 100).toFixed(0)}`)}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${sl.color}`}>{sl.label}</span>
                          {showPayAction && (
                            <button
                              onClick={() => confirmPayment(s.id)}
                              disabled={confirmingId === s.id}
                              className="text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center gap-1 shrink-0 disabled:opacity-50"
                              title={isConfirmAction ? "Check Stripe for this payment; if it went through, mark paid and email them" : "Send the payment confirmation email to this sponsor"}
                            >
                              {confirmingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : isConfirmAction ? <BadgeCheck className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                              {isConfirmAction ? "Confirm payment" : "Send confirmation"}
                            </button>
                          )}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyStatusLink(s.applicationToken)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                              title="Copy status link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`mailto:${s.contactEmail}`}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-teal-700"
                              title="Email contact"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                            {isAdmin && (
                              <button
                                onClick={() => remove(s.id)}
                                className="p-1.5 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500"
                                title="Delete (admin only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {s.message && (
                          <div className="mt-2 ml-12 text-xs text-slate-600 bg-slate-50 rounded px-3 py-2 border-l-2 border-slate-200">
                            {s.message}
                          </div>
                        )}
                        {s.tier === "exhibitor" && (s.registreeName || s.wantsLogo || s.exhibitorDetailsAt) && (
                          <div className="mt-2 ml-12 rounded-lg border border-[#0066B3]/15 bg-[#0066B3]/[0.03] px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-[#0066B3] mb-1">Exhibitor details</div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-600">
                              {s.registreeName && <span><span className="text-slate-400">Rep:</span> {s.registreeName}{s.registreeEmail ? ` · ${s.registreeEmail}` : ""}</span>}
                              {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0066B3] hover:underline">{s.website}</a>}
                              {s.dietary && <span><span className="text-slate-400">Dietary:</span> {s.dietary}</span>}
                              {s.accessibility && <span><span className="text-slate-400">Access:</span> {s.accessibility}</span>}
                            </div>
                            {(s.wantsLogo || s.logo) && (
                              <div className="mt-2 flex items-center gap-3 flex-wrap">
                                {s.logo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={`/api/sponsors/${s.id}/logo`} alt={`${s.companyName} logo`} className="h-10 w-auto max-w-[140px] object-contain bg-white rounded border border-slate-200 p-1" />
                                ) : (
                                  <span className="text-[11px] font-semibold text-amber-600">Wants logo shown (no file uploaded yet)</span>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={() => requestLogo(s.id)}
                                    disabled={requestingLogoId === s.id}
                                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#0066B3]/20 bg-white text-[#0066B3] hover:bg-[#0066B3]/[0.06] inline-flex items-center gap-1 disabled:opacity-50"
                                    title="Email them asking for a higher-resolution logo, with a one-click upload link"
                                  >
                                    {requestingLogoId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                                    {s.logo ? "Request better logo" : "Request logo"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {isAdmin && (
                          <div className="mt-2 ml-12 flex items-center gap-1 text-[11px] flex-wrap">
                            {Object.entries(SPONSOR_STATUS_LABELS).map(([k, v]) => (
                              <button
                                key={k}
                                onClick={() => updateStatus(s.id, k)}
                                disabled={s.status === k}
                                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                                  s.status === k
                                    ? `border ${v.color}`
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {v.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
        <MobileNav />
      </div>
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      {actionNote && (
        <div className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-xl bg-slate-900 text-white text-sm font-semibold px-4 py-3 shadow-2xl">
          {actionNote}
        </div>
      )}
    </div>
  );
}

function ConfirmDialog({
  title, message, confirmLabel, danger, onConfirm, onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5" style={{ background: danger ? "#e11d48" : "#0E5566" }} />
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{message}</p>
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-colors"
              style={{ background: danger ? "#e11d48" : "#0E5566" }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{label}</div>
      <div className="text-2xl font-extrabold mt-1" style={{ color: accent || "#0f172a" }}>{value}</div>
    </div>
  );
}
