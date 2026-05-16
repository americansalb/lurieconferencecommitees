"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic, Search, Plus, Download, Send, X, Copy, Check,
  Clock, XCircle, RefreshCw, AlertCircle, CircleHelp, Trash2,
  Mail, User, Calendar, DollarSign,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import {
  STATUS_LABELS, ROLE_OPTIONS, SESSION_LENGTHS, QA_LENGTHS, PREFERRED_DAY,
} from "@/lib/presenters";
import { presenterInviteEmail } from "@/lib/mail-templates";
import { parseResponse } from "@/lib/api";

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
    tentative: rows.filter((r) => r.status === "tentative").length,
    changes_requested: rows.filter((r) => r.status === "changes_requested").length,
    declined: rows.filter((r) => r.status === "declined").length,
  }), [rows]);

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
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowInvite(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Invite presenter
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <Stat label="Total" value={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
              <Stat label="Awaiting" value={counts.invited} icon={<Clock className="w-4 h-4 text-amber-500" />} active={filter === "invited"} onClick={() => setFilter("invited")} />
              <Stat label="Confirmed" value={counts.confirmed} icon={<Check className="w-4 h-4 text-emerald-500" />} active={filter === "confirmed"} onClick={() => setFilter("confirmed")} />
              <Stat label="Tentative" value={counts.tentative} icon={<CircleHelp className="w-4 h-4 text-sky-500" />} active={filter === "tentative"} onClick={() => setFilter("tentative")} />
              <Stat label="Changes" value={counts.changes_requested} icon={<AlertCircle className="w-4 h-4 text-amber-600" />} active={filter === "changes_requested"} onClick={() => setFilter("changes_requested")} />
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
          onCreated={() => { setShowInvite(false); load(); }}
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
  row, isAdmin, onChanged,
}: {
  row: PresenterRow;
  isAdmin: boolean;
  onChanged: () => void;
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
        <span className={"inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border " + status.color}>
          {status.label}
        </span>
        {isAdmin && row.status !== "confirmed" && (
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-[#0066B3] hover:bg-[#0066B3]/5 disabled:opacity-40"
            title="Resend invitation"
          >
            <Send className="w-3 h-3" /> {busy ? "Sending" : "Resend"}
          </button>
        )}
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

function InviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");

  const [role, setRole] = useState("");
  const [sessionFormat, setSessionFormat] = useState("");
  const [sessionLength, setSessionLength] = useState("");
  const [qaLength, setQaLength] = useState("");
  const [sessionTrack, setSessionTrack] = useState("");
  const [preferredDay, setPreferredDay] = useState("");

  const [talkTitle, setTalkTitle] = useState("");
  const [talkAbstract, setTalkAbstract] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");

  const [honorariumAmount, setHonorariumAmount] = useState<string>("");
  const [travelReimbursement, setTravelReimbursement] = useState<string>("");

  const [customMessage, setCustomMessage] = useState("");
  const [sendNow, setSendNow] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        name, email, affiliation, customMessage, sendNow,
        role: role || undefined,
        sessionFormat: sessionFormat || undefined,
        sessionLength: sessionLength || undefined,
        qaLength: qaLength || undefined,
        sessionTrack: sessionTrack || undefined,
        preferredDay: preferredDay || undefined,
        talkTitle: talkTitle || undefined,
        talkAbstract: talkAbstract || undefined,
        learningObjectives: learningObjectives || undefined,
        honorariumAmount: honorariumAmount ? Number(honorariumAmount) : undefined,
        travelReimbursement: travelReimbursement ? Number(travelReimbursement) : undefined,
      };
      const res = await fetch("/api/presenters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const { ok, data, error } = await parseResponse<{ id: string; url: string }>(res);
      if (!ok || !data) throw new Error(error || "Failed");
      setCreatedUrl(data.url);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to invite");
    } finally {
      setBusy(false);
    }
  }

  const hasAssignment = !!(role || sessionFormat || sessionLength || qaLength || sessionTrack || preferredDay);
  const hasTalkOrComp = !!(talkTitle || talkAbstract || learningObjectives || honorariumAmount || travelReimbursement);

  type TabId = "recipient" | "session" | "extras";
  const [tab, setTab] = useState<TabId>("recipient");
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);

  const previewHtml = useMemo(() => {
    return presenterInviteEmail({
      name: name || "Your presenter",
      url: "https://conference.aalb.org/presenters/confirm/preview-link",
      customMessage: customMessage || undefined,
      role: role || undefined,
      sessionFormat: sessionFormat || undefined,
    });
  }, [name, customMessage, role, sessionFormat]);

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; done: boolean }[] = [
    { id: "recipient", label: "Recipient", icon: User, done: !!(name && email) },
    { id: "session", label: "Session", icon: Calendar, done: hasAssignment },
    { id: "extras", label: "Talk & money", icon: DollarSign, done: hasTalkOrComp },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-6xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        <div className="h-1.5 w-full flex shrink-0">
          <div className="w-1/2 bg-[#0E5566]" />
          <div className="w-1/2 bg-[#0066B3]" />
        </div>
        <div className="px-7 py-5 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">Invite a presenter</div>
            <div className="text-sm text-slate-500 mt-0.5">Compose on the left, see exactly what they will receive on the right.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewMobile((v) => !v)}
              className="md:hidden text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              {showPreviewMobile ? "Edit" : "Preview"}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {createdUrl ? (
          <div className="p-7 space-y-4 overflow-y-auto">
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
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
              <div className="text-xs font-semibold text-slate-700 mb-1">Personal portal link</div>
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
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0E5566] hover:bg-[#0A3F4D]"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className={"flex flex-col md:w-[46%] md:border-r md:border-slate-100 " + (showPreviewMobile ? "hidden md:flex" : "flex")}>
              <div className="flex gap-1 px-7 pt-4 border-b border-slate-100 shrink-0">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={
                      "flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors " +
                      (tab === t.id
                        ? "border-[#0066B3] text-slate-900"
                        : "border-transparent text-slate-500 hover:text-slate-700")
                    }
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                    {t.done && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-xs">{error}</div>
                )}

                {tab === "recipient" && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Name" required>
                        <input value={name} onChange={(e) => setName(e.target.value)} className={mInput} placeholder="Jordan Smith" />
                      </Field>
                      <Field label="Email" required>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={mInput} placeholder="jordan@example.org" />
                      </Field>
                    </div>
                    <Field label="Affiliation">
                      <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} className={mInput} placeholder="Lurie Children's, Northwestern, AALB…" />
                    </Field>
                    <Field
                      label="Personal note"
                      hint="Appears above everything else in their email. Skip it and the email is still warm."
                    >
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={4}
                        className={mInput}
                        placeholder="Looking forward to having you back this year."
                      />
                    </Field>
                  </>
                )}

                {tab === "session" && (
                  <>
                    <div className="text-xs text-slate-500 -mt-1 leading-relaxed">
                      Anything you skip stays open and the presenter can propose their own in the portal.
                    </div>
                    <Field label="Role">
                      <ChipPicker value={role} setValue={setRole} options={ROLE_OPTIONS} allowCustom />
                    </Field>
                    <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
                      <Field label="Presentation length">
                        <ChipPicker value={sessionLength} setValue={setSessionLength} options={SESSION_LENGTHS} allowCustom />
                      </Field>
                      <Field label="Q and A length">
                        <ChipPicker value={qaLength} setValue={setQaLength} options={QA_LENGTHS} allowCustom />
                      </Field>
                      <Field label="Preferred day">
                        <ChipPicker value={preferredDay} setValue={setPreferredDay} options={PREFERRED_DAY} />
                      </Field>
                      <Field label="Track or theme">
                        <input value={sessionTrack} onChange={(e) => setSessionTrack(e.target.value)} className={mInput} placeholder="e.g. Medical interpreting" />
                      </Field>
                    </div>
                    <Field label="Format" hint="Workshop, panel, breakout — only if different from the role.">
                      <input value={sessionFormat} onChange={(e) => setSessionFormat(e.target.value)} className={mInput} />
                    </Field>
                  </>
                )}

                {tab === "extras" && (
                  <>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Proposed talk details</div>
                      <p className="text-xs text-slate-500 mt-0.5">A starting point. The presenter can refine or replace in their portal.</p>
                    </div>
                    <Field label="Working title">
                      <input value={talkTitle} onChange={(e) => setTalkTitle(e.target.value)} className={mInput} placeholder="A draft title — the presenter can refine it." />
                    </Field>
                    <Field label="Abstract">
                      <textarea value={talkAbstract} onChange={(e) => setTalkAbstract(e.target.value)} rows={3} className={mInput} />
                    </Field>
                    <Field label="Learning objectives">
                      <textarea value={learningObjectives} onChange={(e) => setLearningObjectives(e.target.value)} rows={3} className={mInput} placeholder="What attendees will be able to do after the session." />
                    </Field>

                    <div className="pt-2">
                      <div className="text-sm font-semibold text-slate-900">Compensation</div>
                      <p className="text-xs text-slate-500 mt-0.5">Omit both and compensation is unmentioned in the invitation.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Honorarium" hint="Fixed amount, paid after participation.">
                        <Money value={honorariumAmount} setValue={setHonorariumAmount} placeholder="300" />
                      </Field>
                      <Field label="Travel reimbursement cap" hint='Presenter sees "up to $X".'>
                        <Money value={travelReimbursement} setValue={setTravelReimbursement} placeholder="200" />
                      </Field>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={"flex-1 flex-col bg-slate-100/70 " + (showPreviewMobile ? "flex" : "hidden md:flex")}>
              <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-2 text-xs text-slate-500 shrink-0">
                <Mail className="w-3.5 h-3.5" />
                <span className="font-medium">What {name ? name.split(" ")[0] : "they"} will receive</span>
                <span className="ml-auto text-slate-400">to: {email || "jordan@example.org"}</span>
              </div>
              <div className="flex-1 overflow-hidden p-4">
                <iframe
                  srcDoc={previewHtml}
                  title="Email preview"
                  className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200"
                  sandbox=""
                />
              </div>
            </div>
          </div>
        )}

        {!createdUrl && (
          <div className="px-7 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 bg-slate-50/50">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={sendNow}
                onChange={(e) => setSendNow(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0066B3] focus:ring-[#0066B3]"
              />
              Email the invitation now
            </label>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
              <button
                onClick={submit}
                disabled={busy || !email || !name}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] disabled:opacity-50 shadow-sm"
              >
                {busy ? "Working" : sendNow ? "Send invitation" : "Save invitation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Money({ value, setValue, placeholder }: { value: string; setValue: (s: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={mInput + " pl-7"}
      />
    </div>
  );
}

function ChipPicker({
  value, setValue, options, allowCustom,
}: {
  value: string;
  setValue: (s: string) => void;
  options: string[];
  allowCustom?: boolean;
}) {
  const [custom, setCustom] = useState(!!value && !options.includes(value));
  if (custom) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={mInput}
          placeholder="Type a custom value"
        />
        <button
          type="button"
          onClick={() => { setCustom(false); setValue(""); }}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 whitespace-nowrap px-2 py-1"
        >
          Pick from list
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => setValue(active ? "" : o)}
            className={
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all " +
              (active
                ? "bg-[#0066B3] text-white border-[#0066B3] shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50")
            }
          >
            {o}
          </button>
        );
      })}
      {allowCustom && (
        <button
          type="button"
          onClick={() => setCustom(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700"
        >
          Custom…
        </button>
      )}
    </div>
  );
}

const mInput =
  "w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-transparent rounded-lg focus:bg-white focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 outline-none transition-all placeholder:text-slate-400";

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <div className="text-[11px] text-slate-400 leading-relaxed">{hint}</div>}
    </div>
  );
}

function csvEscape(s: string) {
  if (s == null) return "";
  const needs = /[",\n]/.test(s);
  const safe = s.replace(/"/g, '""');
  return needs ? `"${safe}"` : safe;
}
