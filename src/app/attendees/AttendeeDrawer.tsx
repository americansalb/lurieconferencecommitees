"use client";

import { useEffect, useState } from "react";
import {
  X, Copy, Check, Mail, Loader2, Trash2, ExternalLink, MapPin, Monitor,
  CreditCard, Clock, Tag, Send, LinkIcon, Pencil,
} from "lucide-react";
import {
  ATTENDEE_STEP_LABELS, ATTENDEE_SOURCE_LABELS, ATTENDEE_STATUS_LABELS,
  attendeeStep, attendeeSource, formatPrice,
} from "@/lib/attendees";

type Detail = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  affiliation: string | null;
  primaryLanguages: string | null;
  attendanceMode: string | null;
  needsParking: boolean | null;
  accessibilityNotes: string | null;
  dietary: string | null;
  adminNotes: string | null;
  status: string;
  paid: boolean;
  paidAt: string | null;
  finalPriceCents: number | null;
  discountPercent: number;
  discountCode: string | null;
  inviteToken: string;
  invitedById: string | null;
  invitedAt: string | null;
  lastSentAt: string | null;
  viewedAt: string | null;
  createdAt: string;
  events: { id: string; type: string; meta: string | null; createdAt: string }[];
};

const EVENT_LABELS: Record<string, string> = {
  added_to_queue: "Added to invite queue",
  invite_sent_immediate: "Invite sent",
  invite_sent: "Invite sent",
  invite_resent: "Invite resent",
  invite_send_failed: "Invite send failed",
  viewed_invite: "Opened their invite",
  public_registration_started: "Started registration on the site",
  checkout_started: "Started checkout",
  paid: "Paid",
  portal_link_sent: "Portal link emailed",
  broadcast_sent: "Received a broadcast email",
  guide_sent: "Conference guide emailed",
  guide_send_failed: "Conference guide failed to send",
  sponsor_comp_seat: "Given an included ticket by a sponsor",
  sponsor_team_added: "Added to a sponsor's team",
  sponsor_team_linked: "Linked to a sponsor's team",
  virtual_info_sent: "Zoom links emailed",
  virtual_info_send_failed: "Zoom links email failed to send",
  zoom_click: "Clicked their Zoom link",
  tour_reminder_sent: "Hospital tour reminder emailed",
};

// The forensic detail on a zoom_click: which room, whether their ticket
// covered it, and where the click came from. If a personal link leaks, the
// stranger clicks show up here under the attendee the link was issued to.
function zoomClickDetail(meta: string | null): string | null {
  if (!meta) return null;
  try {
    const m = JSON.parse(meta) as { day?: string; allowed?: boolean; ip?: string | null; ua?: string | null };
    return [
      m.day === "sun" ? "Sunday room" : m.day === "sat" ? "Saturday room" : m.day || null,
      m.allowed === false ? "BLOCKED: ticket does not cover this" : null,
      m.ip || null,
      m.ua ? m.ua.slice(0, 70) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  } catch {
    return meta;
  }
}

export default function AttendeeDrawer({
  attendeeId, isAdmin, onClose, onChanged, onCompose,
}: {
  attendeeId: string;
  isAdmin: boolean;
  onClose: () => void;
  onChanged: () => void;
  onCompose: (ids: string[]) => void;
}) {
  const [a, setA] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Correcting the amount on file. A correction, not a new transaction: it
  // writes no timeline entry, so the record simply reads as though it had
  // been right from the start.
  const [editingPay, setEditingPay] = useState(false);
  const [payInput, setPayInput] = useState("");
  const [savingPay, setSavingPay] = useState(false);

  function startEditPay() {
    setPayInput(a?.finalPriceCents != null ? (a.finalPriceCents / 100).toFixed(2) : "");
    setEditingPay(true);
  }

  async function savePay() {
    const trimmed = payInput.trim().replace(/^\$/, "");
    const dollars = trimmed === "" ? null : Number(trimmed);
    if (dollars !== null && (!Number.isFinite(dollars) || dollars < 0)) return;
    setSavingPay(true);
    try {
      const res = await fetch(`/api/attendees/${attendeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmountCents: dollars === null ? null : Math.round(dollars * 100) }),
      });
      if (res.ok) {
        const updated = await res.json();
        setA((prev) => (prev ? { ...prev, ...updated } : prev));
        setEditingPay(false);
        onChanged();
      }
    } finally {
      setSavingPay(false);
    }
  }

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/attendees/${attendeeId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) { setA(d); setNotes(d.adminNotes || ""); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [attendeeId]);

  const portalUrl = a ? `${typeof window !== "undefined" ? window.location.origin : ""}/attend/${a.inviteToken}` : "";

  async function copyPortal() {
    try { await navigator.clipboard.writeText(portalUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  }
  async function saveNotes() {
    if (!a) return;
    setSavingNotes(true);
    try {
      await fetch(`/api/attendees/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminNotes: notes }) });
      onChanged();
    } finally { setSavingNotes(false); }
  }
  async function resend() {
    if (!a) return;
    setBusy("resend");
    try { await fetch(`/api/attendees/${a.id}/resend`, { method: "POST" }); onChanged(); } finally { setBusy(null); }
  }
  async function sendPortal() {
    if (!a) return;
    setBusy("portal");
    try {
      await fetch(`/api/attendees/${a.id}/portal-link`, { method: "POST" });
      const r = await fetch(`/api/attendees/${a.id}`).then((x) => x.json()).catch(() => null);
      if (r) setA(r);
      onChanged();
    } finally { setBusy(null); }
  }
  async function remove() {
    if (!a) return;
    if (!confirm(`Remove ${a.firstName} ${a.lastName}? This cannot be undone.`)) return;
    setBusy("delete");
    try { await fetch(`/api/attendees/${a.id}`, { method: "DELETE" }); onChanged(); onClose(); } finally { setBusy(null); }
  }

  const step = a ? attendeeStep(a) : null;
  const stageCfg = step ? ATTENDEE_STEP_LABELS[step] : null;
  const source = a ? attendeeSource(a) : null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {loading || !a ? (
          <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3 z-10">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-extrabold text-slate-900 truncate">{a.firstName} {a.lastName}</h2>
                  {stageCfg && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageCfg.color}`}>{stageCfg.label}</span>}
                </div>
                <div className="text-xs text-slate-500 truncate">{a.email}</div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Quick facts */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Fact label="Source" value={source ? ATTENDEE_SOURCE_LABELS[source] : "Not set"} />
                <Fact label="Attendance" value={a.attendanceMode === "in-person" ? "In-person" : a.attendanceMode === "virtual" ? "Virtual" : "Not chosen"} icon={a.attendanceMode === "virtual" ? Monitor : MapPin} />
                <div>
                  <div className="text-[10px] font-bold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
                    Payment
                    {isAdmin && !editingPay && (
                      <button onClick={startEditPay} className="text-slate-300 hover:text-slate-600" title="Correct the amount on file. No timeline entry is written.">
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {editingPay ? (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-sm text-slate-400">$</span>
                      <input
                        autoFocus
                        value={payInput}
                        onChange={(e) => setPayInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") savePay(); if (e.key === "Escape") setEditingPay(false); }}
                        placeholder="0.00"
                        inputMode="decimal"
                        className="w-20 px-2 py-1 text-sm border border-slate-200 rounded-md outline-none focus:border-teal-500"
                      />
                      <button onClick={savePay} disabled={savingPay} className="p-1 text-emerald-600 hover:text-emerald-700 disabled:opacity-50" title="Save">
                        {savingPay ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setEditingPay(false)} className="p-1 text-slate-400 hover:text-slate-600" title="Cancel">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold inline-flex items-center gap-1.5 mt-0.5" style={{ color: a.paid ? "#16a34a" : "#1e293b" }}>
                      <CreditCard className="w-3.5 h-3.5" />{a.paid ? `${formatPrice(a.finalPriceCents)} paid` : "Not paid"}
                    </div>
                  )}
                </div>
                <Fact label="Status" value={(ATTENDEE_STATUS_LABELS[a.status]?.label) || a.status} />
                {a.phone && <Fact label="Phone" value={a.phone} />}
                {a.affiliation && <Fact label="Organization" value={a.affiliation} />}
                {a.primaryLanguages && <Fact label="Languages" value={a.primaryLanguages} />}
                {a.discountCode && <Fact label="Code used" value={a.discountCode} icon={Tag} />}
              </div>

              {(a.accessibilityNotes || a.dietary || a.needsParking != null) && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm space-y-1.5">
                  {a.needsParking != null && <div><span className="text-slate-400 text-xs">Parking: </span>{a.needsParking ? "Yes" : "No"}</div>}
                  {a.dietary && <div><span className="text-slate-400 text-xs">Dietary: </span>{a.dietary}</div>}
                  {a.accessibilityNotes && <div><span className="text-slate-400 text-xs">Accessibility: </span>{a.accessibilityNotes}</div>}
                </div>
              )}

              {/* Portal link */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><LinkIcon className="w-3 h-3" /> Their portal</div>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 truncate">{portalUrl}</div>
                  <button onClick={copyPortal} className="px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5 text-xs font-semibold">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Copied" : "Copy"}
                  </button>
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center"><ExternalLink className="w-3.5 h-3.5" /></a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onCompose([a.id])} className="px-3 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: "#0E5566" }}>
                  <Mail className="w-3.5 h-3.5" /> Email them
                </button>
                <button onClick={sendPortal} disabled={busy === "portal"} className="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 disabled:opacity-50">
                  {busy === "portal" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send portal link
                </button>
                {!a.paid && (
                  <button onClick={resend} disabled={busy === "resend"} className="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 disabled:opacity-50">
                    {busy === "resend" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Resend invite
                  </button>
                )}
              </div>

              {/* Admin notes */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Internal notes</div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Only your team sees this." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" />
                {notes !== (a.adminNotes || "") && (
                  <button onClick={saveNotes} disabled={savingNotes} className="mt-1.5 text-xs font-bold text-teal-700 inline-flex items-center gap-1">
                    {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save notes
                  </button>
                )}
              </div>

              {/* Timeline */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Timeline</div>
                <ul className="space-y-2.5">
                  {a.events.length === 0 && <li className="text-xs text-slate-400">No activity yet.</li>}
                  {a.events.map((e) => (
                    <li key={e.id} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[13px] text-slate-700">{EVENT_LABELS[e.type] || e.type}</div>
                        {e.type === "zoom_click" && zoomClickDetail(e.meta) && (
                          <div className="text-[11px] text-slate-500 break-all">{zoomClickDetail(e.meta)}</div>
                        )}
                        <div className="text-[11px] text-slate-400">{new Date(e.createdAt).toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {isAdmin && (
                <button onClick={remove} disabled={busy === "delete"} className="text-xs font-semibold text-rose-500 hover:text-rose-700 inline-flex items-center gap-1.5 pt-2 disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" /> Remove from list
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Fact({ label, value, icon: Icon, accent }: { label: string; value: string; icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-wide uppercase text-slate-400">{label}</div>
      <div className="text-sm font-semibold inline-flex items-center gap-1.5 mt-0.5" style={{ color: accent || "#1e293b" }}>
        {Icon && <Icon className="w-3.5 h-3.5" />}{value}
      </div>
    </div>
  );
}
