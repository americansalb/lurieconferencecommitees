"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Users, Send, Pause, Play, Loader2, Mail, Check,
  RefreshCw, Zap, FileText, UserPlus, Rocket, Eye, SlidersHorizontal,
  ChevronDown, ChevronRight, Video,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { ATTENDEE_TEMPLATES } from "@/lib/attendees";
import EmailPreviewModal from "@/components/attendees/EmailPreviewModal";
import QueueSettingsModal from "@/components/email/QueueSettingsModal";
import AttendeesView, { type Attendee } from "./AttendeesView";
import AttendeeDrawer from "./AttendeeDrawer";
import BroadcastComposer from "./BroadcastComposer";
import EventSettingsModal from "./EventSettingsModal";

type PreviewState = { title: string; meta?: string; html: string | null };

type QueueEntry = {
  id: string;
  to: string;
  subject: string;
  scheduledFor: string | null;
  recipientType: string;
  recipientId: string | null;
  attempts: number;
};

type QueueStatus = {
  counts: Record<string, number>;
  nextScheduledFor: string | null;
  sentLast24h: number;
  policy: {
    maxPerHour: number;
    maxPerDay: number;
    minGapSeconds: number;
    maxGapSeconds: number;
    sendStartHour: number;
    sendEndHour: number;
    sendTimezone: string;
  };
  paused: boolean;
  pending: QueueEntry[];
};

type InviteSubTab = "quick" | "bulk";

export default function AttendeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"attendees" | "invite">("attendees");
  const [inviteSubTab, setInviteSubTab] = useState<InviteSubTab>("quick");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [flushing, setFlushing] = useState(false);
  const [flushResult, setFlushResult] = useState<string | null>(null);
  // Attendees view: detail drawer + broadcast composer + portal-link sends.
  const [detailId, setDetailId] = useState<string | null>(null);
  const [composerIds, setComposerIds] = useState<string[] | null>(null);
  const [portalNote, setPortalNote] = useState<string | null>(null);
  const [showEventSettings, setShowEventSettings] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void;
  } | null>(null);
  const [reinvite, setReinvite] = useState<{ sending: boolean; note: string | null }>({ sending: false, note: null });

  // Shared composer state
  const [inviteMessage, setInviteMessage] = useState("");
  const [discountPercent, setDiscountPercent] = useState(25);
  // No default: the admin must explicitly pick Standard or AALB alumni so the
  // wrong template never goes out by accident.
  const [template, setTemplate] = useState<"standard" | "alumni" | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [showQueueList, setShowQueueList] = useState(false);
  const [sendingEntryId, setSendingEntryId] = useState<string | null>(null);

  // Quick invite form
  const [single, setSingle] = useState({ firstName: "", lastName: "", email: "", affiliation: "" });
  const [quickSending, setQuickSending] = useState(false);
  const [quickResult, setQuickResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Bulk invite
  const [csv, setCsv] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: { email: string; reason: string }[]; parseErrors: string[] } | null>(null);

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "admin" || role === "developer";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [a, q] = await Promise.all([
        fetch("/api/attendees").then((r) => (r.ok ? r.json() : { attendees: [] })),
        // Queue status is admin-gated server-side; non-admins just get null and the panel stays hidden.
        // This fetch also nudges the server to send any now-due queued invites.
        fetch("/api/admin/email-queue").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      setAttendees(a.attendees || []);
      setQueueStatus(q);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  // While invites are still queued, refresh quietly every 30s. Each refresh's
  // queue fetch also drains any now-due sends server-side, so the batch goes
  // out on its own while this page is open even if the background cron isn't.
  const pendingCount = queueStatus?.counts?.pending || 0;
  useEffect(() => {
    if (status !== "authenticated" || pendingCount <= 0) return;
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [status, pendingCount, load]);

  async function sendQuick() {
    if (!template) {
      setQuickResult({ ok: false, message: "Choose an email template first: Standard or AALB alumni." });
      return;
    }
    if (!single.firstName.trim() || !single.lastName.trim() || !single.email.trim()) {
      setQuickResult({ ok: false, message: "Fill in first name, last name, and email." });
      return;
    }
    setQuickSending(true);
    setQuickResult(null);
    const res = await fetch("/api/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        single,
        inviteMessage: inviteMessage.trim() || undefined,
        discountPercent,
        template,
      }),
    });
    const json = await res.json();
    setQuickSending(false);
    if (res.ok && json.sent) {
      setQuickResult({ ok: true, message: `Sent to ${single.email}.` });
      setSingle({ firstName: "", lastName: "", email: "", affiliation: "" });
      load();
    } else {
      setQuickResult({ ok: false, message: json.error || "Could not send invite." });
      if (json.attendeeId) load();
    }
  }

  async function sendBulk() {
    if (!csv.trim()) return;
    if (!template) {
      setBulkResult({ created: 0, skipped: [], parseErrors: ["Choose an email template first: Standard or AALB alumni."] });
      return;
    }
    setBulkSending(true);
    setBulkResult(null);
    const res = await fetch("/api/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, inviteMessage, discountPercent, template }),
    });
    const json = await res.json();
    setBulkSending(false);
    setBulkResult(json);
    if (json.created > 0) {
      setCsv("");
      load();
    }
  }

  const templateLabel = (t: string | null) =>
    t === "alumni" ? "AALB alumni template" : t === "standard" ? "Standard template" : "No template selected";

  async function sendQueueEntry(id: string) {
    setSendingEntryId(id);
    try {
      await fetch("/api/admin/email-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      await load();
    } finally {
      setSendingEntryId(null);
    }
  }

  async function openPreview() {
    if (!template) return;
    setPreview({ title: "Email preview", meta: templateLabel(template), html: null });
    try {
      const res = await fetch("/api/attendees/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, discountPercent, inviteMessage, firstName: single.firstName || undefined }),
      });
      const j = await res.json();
      setPreview({ title: j.subject || "Email preview", meta: `${templateLabel(template)} · sample preview`, html: j.html || "<p style='padding:24px;font-family:sans-serif'>Could not render.</p>" });
    } catch {
      setPreview({ title: "Email preview", meta: templateLabel(template), html: "<p style='padding:24px;font-family:sans-serif'>Network error.</p>" });
    }
  }

  async function viewEmail(a: Attendee) {
    setPreview({ title: `Email to ${a.firstName} ${a.lastName}`, html: null });
    try {
      const res = await fetch(`/api/attendees/${a.id}/email`);
      const j = await res.json();
      const when = j.source !== "sent"
        ? "Regenerated preview · not sent yet"
        : j.status === "sent"
          ? `Sent${j.sentAt ? " " + new Date(j.sentAt).toLocaleString() : ""}`
          : `Queued${j.scheduledFor ? " for " + new Date(j.scheduledFor).toLocaleString() : ""}`;
      setPreview({ title: j.subject || `Email to ${a.email}`, meta: `${when} · to ${j.to}`, html: j.html });
    } catch {
      setPreview({ title: "Email", meta: a.email, html: "<p style='padding:24px;font-family:sans-serif'>Could not load.</p>" });
    }
  }

  function flushQueueNow() {
    setConfirmDialog({
      title: "Send the whole queue now?",
      message: "Every currently-queued invite goes out right away, ignoring the paced schedule. Use this only for small batches; large bursts hurt domain reputation.",
      confirmLabel: "Send queue now",
      onConfirm: () => { setConfirmDialog(null); void doFlushQueueNow(); },
    });
  }

  async function doFlushQueueNow() {
    setFlushing(true);
    setFlushResult(null);
    try {
      const res = await fetch("/api/admin/email-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const json = await res.json();
      if (res.ok) {
        setFlushResult(`Sent ${json.sent}, failed ${json.failed} of ${json.processed} processed.`);
      } else {
        setFlushResult(json.error || "Flush failed.");
      }
      await load();
    } finally {
      setFlushing(false);
      setTimeout(() => setFlushResult(null), 6000);
    }
  }

  async function togglePause() {
    if (!queueStatus) return;
    await fetch("/api/admin/email-queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !queueStatus.paused }),
    });
    load();
  }

  async function sendPortalLink(ids: string[]) {
    if (!ids.length) return;
    const res = await fetch("/api/attendees/portal-link", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).then((r) => r.json()).catch(() => ({ sent: 0 }));
    setPortalNote(`Portal link sent to ${res.sent || 0}${res.failed ? `, ${res.failed} failed` : ""}.`);
    setTimeout(() => setPortalNote(null), 4000);
    load(true);
  }

  async function reinviteNonResponders() {
    setReinvite({ sending: true, note: null });
    try {
      const res = await fetch("/api/attendees/resend-bulk", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setReinvite({
          sending: false,
          note: `Re-queued ${json.queued || 0} invite${json.queued === 1 ? "" : "s"}. They'll send paced; hit "Send queue now" to push them out immediately.`,
        });
      } else {
        setReinvite({ sending: false, note: json.error || "Could not re-queue invites." });
      }
      await load();
    } catch {
      setReinvite({ sending: false, note: "Network error while re-queuing." });
    }
    setTimeout(() => setReinvite((r) => ({ ...r, note: null })), 9000);
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const previewDiscounted = ((21000 * (100 - discountPercent) / 100) / 100).toFixed(2);
  // People we've already emailed who still haven't registered: the audience a
  // bulk re-invite would target. Computed from the loaded list so the button can
  // show a live count without an extra round trip.
  const reinvitable = attendees.filter(
    (a) => !a.paid && (a.status === "invited" || a.status === "viewed" || a.status === "rsvp_pending")
  ).length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-slate-900">Attendees</h1>
                <p className="text-xs text-slate-500">Invite people and track them through to paid attendees</p>
              </div>
              {isAdmin && (
                <button onClick={() => setShowEventSettings(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1.5" title="Set the attendee portal join link and agenda">
                  <Video className="w-3.5 h-3.5" /> Portal
                </button>
              )}
              <button onClick={() => load()} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {portalNote && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800">{portalNote}</div>
            )}

            {queueStatus && (queueStatus.counts.pending > 0 || queueStatus.paused) && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${queueStatus.paused ? "bg-amber-400" : "bg-emerald-500 animate-pulse"}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">
                        {queueStatus.paused ? "Bulk sending paused" : "Bulk queue active"}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {queueStatus.counts.pending || 0} queued · {queueStatus.counts.sent || 0} sent · {queueStatus.sentLast24h} in last 24h
                        {queueStatus.nextScheduledFor && !queueStatus.paused && (
                          <> · next at {new Date(queueStatus.nextScheduledFor).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowQueue(true)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      title="Queue settings: rate, window, and partial sends"
                    >
                      <SlidersHorizontal className="w-3 h-3" /> Adjust
                    </button>
                    {(queueStatus.counts.pending || 0) > 0 && (
                      <button
                        onClick={flushQueueNow}
                        disabled={flushing}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 disabled:opacity-50"
                        title="Send all currently queued invites immediately"
                      >
                        {flushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                        Send queue now
                      </button>
                    )}
                    <button
                      onClick={togglePause}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${
                        queueStatus.paused
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {queueStatus.paused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
                    </button>
                  </div>
                </div>
                {flushResult && (
                  <div className="mt-2 text-xs font-semibold text-teal-700">{flushResult}</div>
                )}
                <div className="mt-3 text-[11px] text-slate-400">
                  Pacing: max {queueStatus.policy.maxPerHour}/hr, {queueStatus.policy.maxPerDay}/day ·
                  {" "}{queueStatus.policy.minGapSeconds}–{queueStatus.policy.maxGapSeconds}s between sends ·
                  {" "}{queueStatus.policy.sendStartHour}:00–{queueStatus.policy.sendEndHour}:00 {queueStatus.policy.sendTimezone}.
                  {" "}Quick invites send immediately and skip these limits.
                </div>

                {(queueStatus.pending?.length || 0) > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setShowQueueList((v) => !v)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
                    >
                      {showQueueList ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      {showQueueList ? "Hide" : "Show"} the {queueStatus.pending.length} queued invite{queueStatus.pending.length === 1 ? "" : "s"}
                    </button>
                    {showQueueList && (
                      <ul className="mt-2 divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                        {queueStatus.pending.map((entry) => {
                          const att = attendees.find((a) => a.id === entry.recipientId);
                          const name = att ? `${att.firstName} ${att.lastName}` : entry.to;
                          return (
                            <li key={entry.id} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50">
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold text-slate-800 truncate">
                                  {name}
                                  {entry.recipientType !== "attendee" && (
                                    <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{entry.recipientType}</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {entry.to} · {entry.scheduledFor ? `scheduled ${new Date(entry.scheduledFor).toLocaleString()}` : "unscheduled"}
                                </div>
                              </div>
                              {att && (
                                <button
                                  onClick={() => viewEmail(att)}
                                  className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                  title="View this email"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => sendQueueEntry(entry.id)}
                                disabled={sendingEntryId === entry.id}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 disabled:opacity-50 shrink-0"
                                title="Send this invite immediately"
                              >
                                {sendingEntryId === entry.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />} Send now
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Top tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 w-fit">
              <TabBtn active={tab === "attendees"} onClick={() => setTab("attendees")} label="Attendees" />
              <TabBtn active={tab === "invite"} onClick={() => setTab("invite")} label="Invite" />
            </div>

            {tab === "invite" && (
              <div>
                {isAdmin && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                          <RefreshCw className="w-4 h-4 text-teal-700" /> Re-invite non-responders
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-lg">
                          Re-sends the invite to the <strong>{reinvitable}</strong> {reinvitable === 1 ? "person" : "people"} we&rsquo;ve
                          already emailed who haven&rsquo;t registered yet, each with their own template and discount. Anyone who paid
                          or signed up is skipped, and no BCC is attached. Paced through the queue to protect the domain.
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDialog({
                          title: `Re-invite ${reinvitable} ${reinvitable === 1 ? "person" : "people"}?`,
                          message: "Everyone we invited who hasn't registered will be re-queued and sent paced over the next while. Anyone who already paid or signed up is skipped, and no BCC is attached.",
                          confirmLabel: "Re-queue invites",
                          onConfirm: () => { setConfirmDialog(null); void reinviteNonResponders(); },
                        })}
                        disabled={reinvite.sending || reinvitable === 0}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                        style={{ background: "#0E5566" }}
                      >
                        {reinvite.sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {reinvitable === 0 ? "No one to re-invite" : "Re-invite them"}
                      </button>
                    </div>
                    {reinvite.note && <div className="mt-2 text-xs font-semibold text-teal-700">{reinvite.note}</div>}
                  </div>
                )}

                {/* Sub-tabs */}
                <div className="flex gap-2 mb-4">
                  <SubTabBtn
                    active={inviteSubTab === "quick"}
                    onClick={() => setInviteSubTab("quick")}
                    icon={Zap}
                    label="Quick invite"
                    hint="Send one now"
                  />
                  <SubTabBtn
                    active={inviteSubTab === "bulk"}
                    onClick={() => setInviteSubTab("bulk")}
                    icon={FileText}
                    label="Bulk invite"
                    hint="Paste a list, paced over time"
                  />
                </div>

                {/* Shared settings card (used by both modes) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Invite settings</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Discount %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseInt(e.target.value || "0", 10))))}
                        className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                      />
                    </label>
                    <div className="sm:col-span-2 text-xs text-slate-500 self-end pb-2">
                      Applied to <strong>in-person standard</strong> ($210). At {discountPercent}% off they&rsquo;ll pay
                      {" "}<strong>${previewDiscounted}</strong>. Virtual ($105) unchanged.
                    </div>
                  </div>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Personal message (optional, shown in email and funnel)
                    </span>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      rows={2}
                      placeholder="Loved your work on X. Would mean a lot to have you join us."
                      className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                    />
                  </label>

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Email template <span className="text-rose-500">*</span>
                      </span>
                      {!template && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Choose one</span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {ATTENDEE_TEMPLATES.map((t) => {
                        const on = template === t.id;
                        return (
                          <button
                            key={t.id} type="button" onClick={() => setTemplate(t.id)}
                            className={"px-3 py-1.5 rounded-lg text-[13px] font-semibold border transition-colors " + (on ? "bg-[#0E5566] text-white border-[#0E5566]" : !template ? "bg-white text-slate-700 border-amber-300 ring-1 ring-amber-200 hover:bg-amber-50" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                      <button
                        type="button" onClick={openPreview} disabled={!template}
                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-[#0E5566] bg-[#0E5566]/[0.06] border border-[#0E5566]/15 hover:bg-[#0E5566]/[0.1] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview email
                      </button>
                    </div>
                    <p className="text-[11px] mt-1.5" style={{ color: template ? "#94a3b8" : "#b45309" }}>
                      {template
                        ? ATTENDEE_TEMPLATES.find((t) => t.id === template)?.description
                        : "Pick a template so the right email goes out: Standard for general invitees, AALB alumni for the community."}
                    </p>
                  </div>
                </div>

                {inviteSubTab === "quick" && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <UserPlus className="w-4 h-4 text-teal-700" />
                      <h2 className="text-base font-extrabold text-slate-900">Invite one person</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-5">
                      Email goes out the moment you hit send. No queue, no waiting.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">First name *</span>
                        <input
                          value={single.firstName}
                          onChange={(e) => setSingle({ ...single, firstName: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Last name *</span>
                        <input
                          value={single.lastName}
                          onChange={(e) => setSingle({ ...single, lastName: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Email *</span>
                        <input
                          value={single.email}
                          onChange={(e) => setSingle({ ...single, email: e.target.value })}
                          placeholder="name@example.com"
                          type="email"
                          className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Organization (optional)</span>
                        <input
                          value={single.affiliation}
                          onChange={(e) => setSingle({ ...single, affiliation: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={sendQuick}
                        disabled={quickSending || !template}
                        title={!template ? "Choose an email template first" : undefined}
                        className="px-5 py-2.5 rounded-xl font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                        style={{ background: "#0E5566" }}
                      >
                        {quickSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {quickSending ? "Sending…" : "Send invite now"}
                      </button>
                    </div>

                    {quickResult && (
                      <div className="mt-4 rounded-lg border p-3 text-sm inline-flex items-start gap-2"
                        style={{
                          background: quickResult.ok ? "#ecfdf5" : "#fef2f2",
                          borderColor: quickResult.ok ? "#a7f3d0" : "#fecaca",
                          color: quickResult.ok ? "#065f46" : "#991b1b",
                        }}>
                        {quickResult.ok ? <Check className="w-4 h-4 mt-0.5" /> : <Mail className="w-4 h-4 mt-0.5" />}
                        {quickResult.message}
                      </div>
                    )}
                  </div>
                )}

                {inviteSubTab === "bulk" && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-teal-700" />
                      <h2 className="text-base font-extrabold text-slate-900">Bulk invite (paste CSV)</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Format: <code className="px-1.5 py-0.5 rounded bg-slate-100">FirstName,LastName,Email,Affiliation,Notes</code>.
                      Last two columns optional. Header row auto-detected. Each invite is paced randomly during business hours
                      to protect domain reputation.
                    </p>

                    <label className="block mb-4">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Invitee list</span>
                      <textarea
                        value={csv}
                        onChange={(e) => setCsv(e.target.value)}
                        rows={8}
                        placeholder={`Jane,Doe,jane@example.com,Example Org,met at conf 2025\nJohn,Smith,john@school.edu`}
                        className="mt-1 w-full px-3 py-2.5 text-sm font-mono border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                      />
                    </label>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={sendBulk}
                        disabled={bulkSending || !csv.trim() || !template}
                        title={!template ? "Choose an email template first" : undefined}
                        className="px-5 py-2.5 rounded-xl font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                        style={{ background: "#0E5566" }}
                      >
                        {bulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Queue invites
                      </button>
                    </div>

                    {bulkResult && (
                      <div className="mt-5 rounded-lg border p-4 text-sm" style={{ background: bulkResult.created > 0 ? "#ecfdf5" : "#fff7ed", borderColor: bulkResult.created > 0 ? "#a7f3d0" : "#fed7aa" }}>
                        <div className="font-bold mb-1" style={{ color: bulkResult.created > 0 ? "#065f46" : "#9a3412" }}>
                          {bulkResult.created > 0 ? `Queued ${bulkResult.created} invite${bulkResult.created === 1 ? "" : "s"}` : "Nothing queued"}
                        </div>
                        {bulkResult.skipped.length > 0 && (
                          <div className="text-xs text-slate-600 mt-1">
                            Skipped: {bulkResult.skipped.map((s) => `${s.email} (${s.reason})`).join(", ")}
                          </div>
                        )}
                        {bulkResult.parseErrors.length > 0 && (
                          <ul className="text-xs text-rose-700 mt-1 list-disc pl-4">
                            {bulkResult.parseErrors.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "attendees" && (
              <AttendeesView
                attendees={attendees}
                onOpenDetail={(id) => setDetailId(id)}
                onCompose={(ids) => setComposerIds(ids)}
                onSendPortal={sendPortalLink}
              />
            )}
          </div>
        </div>
        <MobileNav />
      </div>

      {preview && (
        <EmailPreviewModal
          title={preview.title}
          meta={preview.meta}
          html={preview.html}
          loading={preview.html === null}
          onClose={() => setPreview(null)}
        />
      )}

      {showQueue && <QueueSettingsModal onClose={() => setShowQueue(false)} onChanged={load} />}
      {showEventSettings && <EventSettingsModal onClose={() => setShowEventSettings(false)} />}

      {detailId && (
        <AttendeeDrawer
          attendeeId={detailId}
          isAdmin={isAdmin}
          onClose={() => setDetailId(null)}
          onChanged={() => load(true)}
          onCompose={(ids) => { setDetailId(null); setComposerIds(ids); }}
        />
      )}

      {composerIds && (
        <BroadcastComposer
          recipientIds={composerIds}
          recipientLabel={composerIds.length === 1 ? "1 person" : `${composerIds.length} people`}
          onClose={() => setComposerIds(null)}
          onSent={(sent, failed) => {
            setComposerIds(null);
            setPortalNote(`Email sent to ${sent}${failed ? `, ${failed} failed` : ""}.`);
            setTimeout(() => setPortalNote(null), 4000);
            load(true);
          }}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
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

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-semibold px-4 py-2 rounded-md transition-colors ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function SubTabBtn({
  active, onClick, icon: Icon, label, hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-initial text-left px-4 py-3 rounded-xl border-2 transition-all ${
        active ? "shadow-sm" : "hover:bg-white"
      }`}
      style={{
        borderColor: active ? "#0E5566" : "#e2e8f0",
        background: active ? "#0E556608" : "#ffffff",
      }}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${active ? "text-teal-700" : "text-slate-400"}`} />
        <div>
          <div className={`text-sm font-bold ${active ? "text-slate-900" : "text-slate-600"}`}>{label}</div>
          <div className="text-[11px] text-slate-400">{hint}</div>
        </div>
      </div>
    </button>
  );
}
