"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Users, Send, Pause, Play, Trash2, Loader2, Mail, Check, X,
  AlertCircle, ChevronRight, Filter, Search, RefreshCw,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { ATTENDEE_STATUS_LABELS } from "@/lib/attendees";

type Attendee = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  affiliation: string | null;
  attendanceMode: string | null;
  status: string;
  paid: boolean;
  finalPriceCents: number | null;
  discountPercent: number;
  invitedAt: string | null;
  lastSentAt: string | null;
  viewedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
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
};

export default function AttendeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"invite" | "list">("invite");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Invite composer state
  const [csv, setCsv] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [discountPercent, setDiscountPercent] = useState(25);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: { email: string; reason: string }[]; parseErrors: string[] } | null>(null);

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "admin" || role === "developer";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && !isAdmin) router.replace("/dashboard");
  }, [status, isAdmin, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, q] = await Promise.all([
        fetch("/api/attendees").then((r) => (r.ok ? r.json() : { attendees: [] })),
        fetch("/api/admin/email-queue").then((r) => (r.ok ? r.json() : null)),
      ]);
      setAttendees(a.attendees || []);
      setQueueStatus(q);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && isAdmin) load();
  }, [status, isAdmin, load]);

  async function submitInvites() {
    if (!csv.trim()) return;
    setSending(true);
    setResult(null);
    const res = await fetch("/api/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, inviteMessage, discountPercent, sendNow: true }),
    });
    const json = await res.json();
    setSending(false);
    setResult(json);
    if (json.created > 0) {
      setCsv("");
      setInviteMessage("");
      load();
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

  async function deleteAttendee(id: string) {
    if (!confirm("Remove this attendee and cancel any pending invite?")) return;
    await fetch(`/api/attendees/${id}`, { method: "DELETE" });
    load();
  }

  if (status !== "authenticated" || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const filtered = attendees.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (![a.firstName, a.lastName, a.email, a.affiliation].some((v) => v?.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  const stats = {
    total: attendees.length,
    paid: attendees.filter((a) => a.paid).length,
    confirmed: attendees.filter((a) => a.status === "confirmed" || a.status === "paid").length,
    viewed: attendees.filter((a) => !!a.viewedAt).length,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-slate-900">Attendees</h1>
                <p className="text-xs text-slate-500">Invite, track, and convert personal-discount invites</p>
              </div>
              <button onClick={load} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              <Stat label="Total" value={stats.total} />
              <Stat label="Viewed" value={stats.viewed} accent="#0066B3" />
              <Stat label="Confirmed" value={stats.confirmed} accent="#0E5566" />
              <Stat label="Paid" value={stats.paid} accent="#059669" />
            </div>

            {queueStatus && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${queueStatus.paused ? "bg-amber-400" : "bg-emerald-500 animate-pulse"}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">
                        {queueStatus.paused ? "Sending paused" : "Sending active"}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {queueStatus.counts.pending || 0} queued
                        {" · "}{queueStatus.counts.sent || 0} sent
                        {" · "}{queueStatus.sentLast24h} in last 24h
                        {queueStatus.nextScheduledFor && !queueStatus.paused && (
                          <> · next at {new Date(queueStatus.nextScheduledFor).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                  </div>
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
                <div className="mt-3 text-[11px] text-slate-400">
                  Rate: max {queueStatus.policy.maxPerHour}/hr, {queueStatus.policy.maxPerDay}/day &middot;
                  {" "}{queueStatus.policy.minGapSeconds}–{queueStatus.policy.maxGapSeconds}s between sends &middot;
                  {" "}{queueStatus.policy.sendStartHour}:00–{queueStatus.policy.sendEndHour}:00 {queueStatus.policy.sendTimezone}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 w-fit">
              <TabBtn active={tab === "invite"} onClick={() => setTab("invite")} label="Invite" />
              <TabBtn active={tab === "list"} onClick={() => setTab("list")} label={`Attendees (${attendees.length})`} />
            </div>

            {tab === "invite" && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900 mb-1">Send personalized invites</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Paste your list as CSV, one per line. Format: <code className="px-1.5 py-0.5 rounded bg-slate-100">FirstName,LastName,Email,Affiliation,Notes</code>.
                  The last two columns are optional. Header row is auto-detected. Each invitee gets a unique link with their personalized discount.
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <label className="block sm:col-span-1">
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
                    Applied to <strong>in-person standard</strong> ($210). At {discountPercent}% off, they&rsquo;ll pay
                    <strong> ${((21000 * (100 - discountPercent) / 100) / 100).toFixed(2)}</strong>. Virtual ($105) is unchanged.
                  </div>
                </div>

                <label className="block mb-5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Personal message (optional) — shown in email + funnel
                  </span>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    placeholder="Loved your work on X — would mean a lot to have you join us."
                    className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  />
                </label>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Invites will be queued and sent with random delays during business hours to protect domain reputation.
                  </div>
                  <button
                    onClick={submitInvites}
                    disabled={sending || !csv.trim()}
                    className="px-5 py-2.5 rounded-xl font-bold text-white shadow-md disabled:opacity-50 inline-flex items-center gap-1.5"
                    style={{ background: "#0E5566" }}
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Queue invites
                  </button>
                </div>

                {result && (
                  <div className="mt-5 rounded-lg border p-4 text-sm" style={{ background: result.created > 0 ? "#ecfdf5" : "#fff7ed", borderColor: result.created > 0 ? "#a7f3d0" : "#fed7aa" }}>
                    <div className="font-bold mb-1" style={{ color: result.created > 0 ? "#065f46" : "#9a3412" }}>
                      {result.created > 0 ? `Queued ${result.created} invite${result.created === 1 ? "" : "s"}` : "Nothing queued"}
                    </div>
                    {result.skipped.length > 0 && (
                      <div className="text-xs text-slate-600 mt-1">
                        Skipped: {result.skipped.map((s) => `${s.email} (${s.reason})`).join(", ")}
                      </div>
                    )}
                    {result.parseErrors.length > 0 && (
                      <ul className="text-xs text-rose-700 mt-1 list-disc pl-4">
                        {result.parseErrors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "list" && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, email, org…"
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
                      {Object.entries(ATTENDEE_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-400">
                    {attendees.length === 0 ? "No attendees yet — head to the Invite tab." : "No matches."}
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {filtered.map((a) => {
                      const sl = ATTENDEE_STATUS_LABELS[a.status] || ATTENDEE_STATUS_LABELS.queued;
                      return (
                        <li key={a.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 group">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                            {(a.firstName[0] + a.lastName[0]).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate">
                              {a.firstName} {a.lastName}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {a.email}{a.affiliation && ` · ${a.affiliation}`}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${sl.color}`}>
                            {sl.label}
                          </span>
                          {a.attendanceMode && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 hidden sm:inline">
                              {a.attendanceMode === "in-person" ? "In-person" : "Virtual"}
                            </span>
                          )}
                          <button
                            onClick={() => deleteAttendee(a.id)}
                            className="p-1.5 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{label}</div>
      <div className="text-2xl font-extrabold mt-1" style={{ color: accent || "#0f172a" }}>{value}</div>
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
