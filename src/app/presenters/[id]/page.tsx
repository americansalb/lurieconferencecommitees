"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, Send, Trash2, CheckCircle2, XCircle, Clock,
  Copy, Pencil, Save, X, ExternalLink,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { STATUS_LABELS } from "@/lib/presenters";
import { InviteComposer } from "@/components/presenters/InviteComposer";

interface Presenter {
  id: string;
  email: string;
  name: string;
  affiliation: string | null;
  jobTitle: string | null;
  pronouns: string | null;
  phone: string | null;
  role: string | null;
  talkTitle: string | null;
  talkAbstract: string | null;
  sessionFormat: string | null;
  sessionTrack: string | null;
  sessionLength: string | null;
  qaLength: string | null;
  coPresenters: string | null;
  preferredDay: string | null;
  learningObjectives: string | null;
  honorariumAmount: number | null;
  travelReimbursement: number | null;
  presenterMessage: string | null;
  requestedChanges: string | null;
  bio: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  avNotes: string | null;
  needsMic: boolean;
  needsProjector: boolean;
  needsAudio: boolean;
  needsInternet: boolean;
  needsRecording: boolean;
  needsClicker: boolean;
  travelMode: string | null;
  travelOrigin: string | null;
  travelArrival: string | null;
  travelDeparture: string | null;
  needsHotel: boolean;
  hotelNotes: string | null;
  needsParking: boolean;
  dietary: string | null;
  allergies: string | null;
  accessibilityNeeds: string | null;
  emergencyContact: string | null;
  status: string;
  declineReason: string | null;
  invitedAt: string;
  confirmedAt: string | null;
  lastSentAt: string | null;
  adminNotes: string | null;
  token: string;
  hasHeadshot: boolean;
  events: { id: string; type: string; createdAt: string; actorEmail: string | null; meta: string | null }[];
}

export default function PresenterDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [presenter, setPresenter] = useState<Presenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState(false);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin" || role === "developer";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/presenters/${params.id}`);
    if (res.ok) {
      const p = await res.json();
      setPresenter(p);
      setAdminNotes(p.adminNotes || "");
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    load();
  }, [session, status, router, load]);

  async function patch(data: Record<string, unknown>) {
    await fetch(`/api/presenters/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await load();
  }

  async function resend() {
    await fetch(`/api/presenters/${params.id}/resend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    await load();
  }

  async function remove() {
    if (!confirm("Delete this presenter and all their data? This cannot be undone.")) return;
    await fetch(`/api/presenters/${params.id}`, { method: "DELETE" });
    router.push("/presenters");
  }

  if (loading || status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
  }
  if (!presenter) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Not found.</div>;
  }

  const statusInfo = STATUS_LABELS[presenter.status] || STATUS_LABELS.invited;
  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/presenters/confirm/${presenter.token}` : "";

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            <Link href="/presenters" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4">
              <ArrowLeft className="w-4 h-4" /> All presenters
            </Link>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-lg shrink-0">
                  {presenter.hasHeadshot ? (
                    <img src={`/api/presenters/headshot/${presenter.id}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    presenter.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-slate-900 truncate">{presenter.name}</h1>
                    <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border " + statusInfo.color}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <a href={`mailto:${presenter.email}`} className="hover:text-blue-600 inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {presenter.email}
                    </a>
                    {presenter.affiliation && <span>&middot; {presenter.affiliation}</span>}
                    {presenter.jobTitle && <span className="text-slate-400">{presenter.jobTitle}</span>}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setEditingInvitation(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                      <Pencil className="w-3.5 h-3.5" /> Edit invitation
                    </button>
                    <button onClick={resend} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                      <Send className="w-3.5 h-3.5" /> Resend
                    </button>
                    {presenter.status !== "confirmed" && (
                      <button
                        onClick={() => patch({ status: "confirmed" })}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark confirmed
                      </button>
                    )}
                    <button onClick={remove} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="px-6 py-3 bg-blue-50/40 border-b border-blue-100/60 flex items-center gap-2">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-blue-700">Portal link</div>
                  <input readOnly value={portalUrl} className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-lg" />
                  <button onClick={() => navigator.clipboard.writeText(portalUrl)} className="p-1.5 text-slate-500 hover:text-slate-900" title="Copy">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-500 hover:text-slate-900" title="Open">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                <div className="lg:col-span-2 p-6 space-y-6 lg:border-r border-slate-200">
                  <Section title="Assignment">
                    <KV label="Role" value={presenter.role} />
                    <KV label="Format" value={presenter.sessionFormat} />
                    <KV label="Length" value={presenter.sessionLength} />
                    <KV label="Q and A" value={presenter.qaLength} />
                    <KV label="Track" value={presenter.sessionTrack} />
                    <KV label="Day" value={presenter.preferredDay} />
                    <KV label="Honorarium" value={presenter.honorariumAmount != null ? `$${presenter.honorariumAmount.toLocaleString("en-US")}` : null} />
                    <KV label="Travel reimbursement" value={presenter.travelReimbursement != null ? `up to $${presenter.travelReimbursement.toLocaleString("en-US")}` : null} />
                  </Section>
                  <Section title="Talk">
                    <KV label="Title" value={presenter.talkTitle} />
                    <KV label="Co presenters" value={presenter.coPresenters} />
                    <KV label="Abstract" value={presenter.talkAbstract} multiline />
                    <KV label="Learning objectives" value={presenter.learningObjectives} multiline />
                  </Section>
                  {(presenter.requestedChanges || presenter.presenterMessage) && (
                    <Section title="From the presenter">
                      <KV label="Requested adjustments" value={presenter.requestedChanges} multiline />
                      <KV label="Notes and questions" value={presenter.presenterMessage} multiline />
                    </Section>
                  )}
                  <Section title="About">
                    <KV label="Bio" value={presenter.bio} multiline />
                    <KV label="Pronouns" value={presenter.pronouns} />
                    <KV label="Phone" value={presenter.phone} />
                    <KV label="Website" value={presenter.websiteUrl} />
                    <KV label="LinkedIn" value={presenter.linkedinUrl} />
                    <KV label="Twitter" value={presenter.twitterHandle} />
                  </Section>
                  <Section title="Tech & A/V">
                    <KV label="Microphone" value={yesno(presenter.needsMic)} />
                    <KV label="Projector" value={yesno(presenter.needsProjector)} />
                    <KV label="Audio" value={yesno(presenter.needsAudio)} />
                    <KV label="Wi-Fi" value={yesno(presenter.needsInternet)} />
                    <KV label="Record session" value={yesno(presenter.needsRecording)} />
                    <KV label="Clicker" value={yesno(presenter.needsClicker)} />
                    <KV label="A/V notes" value={presenter.avNotes} multiline />
                  </Section>
                  <Section title="Travel">
                    <KV label="Mode" value={presenter.travelMode} />
                    <KV label="Origin" value={presenter.travelOrigin} />
                    <KV label="Arriving" value={presenter.travelArrival?.slice(0, 10) || null} />
                    <KV label="Departing" value={presenter.travelDeparture?.slice(0, 10) || null} />
                    <KV label="Hotel help" value={yesno(presenter.needsHotel)} />
                    <KV label="Parking" value={yesno(presenter.needsParking)} />
                    <KV label="Travel notes" value={presenter.hotelNotes} multiline />
                  </Section>
                  <Section title="Logistics">
                    <KV label="Dietary" value={presenter.dietary} />
                    <KV label="Allergies" value={presenter.allergies} />
                    <KV label="Accessibility" value={presenter.accessibilityNeeds} multiline />
                    <KV label="Emergency contact" value={presenter.emergencyContact} />
                  </Section>
                </div>

                <div className="p-6 space-y-6 bg-slate-50/50">
                  <div>
                    <div className="text-[11px] font-semibold tracking-widest uppercase text-slate-400 mb-2">Timeline</div>
                    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                      <TimelineItem label="Invited" date={presenter.invitedAt} />
                      {presenter.lastSentAt && <TimelineItem label="Last reminder sent" date={presenter.lastSentAt} />}
                      {presenter.confirmedAt && <TimelineItem label="Confirmed" date={presenter.confirmedAt} highlight />}
                      {presenter.status === "declined" && (
                        <TimelineItem label="Declined" date={null} reason={presenter.declineReason || undefined} />
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">Admin notes</div>
                        {!editingNotes ? (
                          <button onClick={() => setEditingNotes(true)} className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setAdminNotes(presenter.adminNotes || ""); setEditingNotes(false); }} className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
                              <X className="w-3 h-3" />
                            </button>
                            <button onClick={async () => { await patch({ adminNotes }); setEditingNotes(false); }} className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                              <Save className="w-3 h-3" /> Save
                            </button>
                          </div>
                        )}
                      </div>
                      {editingNotes ? (
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                        />
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap min-h-[64px]">
                          {presenter.adminNotes || <span className="text-slate-300">No notes yet.</span>}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] font-semibold tracking-widest uppercase text-slate-400 mb-2">Activity log</div>
                    <div className="space-y-1.5">
                      {presenter.events.slice(0, 12).map((e) => (
                        <div key={e.id} className="text-xs text-slate-500 flex items-start gap-2">
                          <EventDot type={e.type} />
                          <div className="flex-1">
                            <div className="text-slate-700">{eventLabel(e.type)}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(e.createdAt).toLocaleString()}
                              {e.actorEmail && ` · ${e.actorEmail}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
      {editingInvitation && isAdmin && presenter && (
        <InviteComposer
          onClose={() => setEditingInvitation(false)}
          onCreated={load}
          existing={{
            id: presenter.id,
            name: presenter.name,
            email: presenter.email,
            affiliation: presenter.affiliation,
            role: presenter.role,
            sessionFormat: presenter.sessionFormat,
            sessionLength: presenter.sessionLength,
            qaLength: presenter.qaLength,
            sessionTrack: presenter.sessionTrack,
            preferredDay: presenter.preferredDay,
            talkTitle: presenter.talkTitle,
            talkAbstract: presenter.talkAbstract,
            learningObjectives: presenter.learningObjectives,
            honorariumAmount: presenter.honorariumAmount,
            travelReimbursement: presenter.travelReimbursement,
          }}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-widest uppercase text-slate-400 mb-2">{title}</div>
      <div className="bg-white border border-slate-200 rounded-xl px-4">{children}</div>
    </div>
  );
}

function KV({ label, value, multiline }: { label: string; value: string | null | undefined; multiline?: boolean }) {
  return (
    <div className="py-2.5 grid grid-cols-3 gap-3 text-sm border-b border-slate-100 last:border-0">
      <div className="text-slate-500">{label}</div>
      <div className={"col-span-2 text-slate-900 " + (multiline ? "whitespace-pre-wrap" : "truncate")}>
        {value || <span className="text-slate-300">—</span>}
      </div>
    </div>
  );
}

function TimelineItem({ label, date, reason, highlight }: { label: string; date: string | null; reason?: string; highlight?: boolean }) {
  return (
    <div className="px-4 py-2.5">
      <div className={"text-xs font-semibold " + (highlight ? "text-emerald-700" : "text-slate-700")}>{label}</div>
      {date && <div className="text-[11px] text-slate-400">{new Date(date).toLocaleString()}</div>}
      {reason && <div className="text-xs text-slate-500 mt-1">"{reason}"</div>}
    </div>
  );
}

function EventDot({ type }: { type: string }) {
  const color =
    type === "confirmed" ? "bg-emerald-500" :
    type === "declined" ? "bg-rose-500" :
    type === "opened" ? "bg-blue-400" :
    type === "reminded" ? "bg-amber-500" :
    type === "admin_edited" ? "bg-purple-500" : "bg-slate-300";
  return <div className={"w-2 h-2 rounded-full mt-1.5 shrink-0 " + color} />;
}

function eventLabel(type: string) {
  switch (type) {
    case "invited": return "Invitation sent";
    case "opened": return "Portal opened";
    case "saved": return "Progress saved";
    case "reminded": return "Reminder sent";
    case "confirmed": return "Confirmed participation";
    case "declined": return "Declined";
    case "admin_edited": return "Edited by admin";
    default: return type;
  }
}

function yesno(b: boolean) {
  return b ? "Yes" : "No";
}
