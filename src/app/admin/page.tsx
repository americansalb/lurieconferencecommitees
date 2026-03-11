"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Users, Calendar, Shield, Trash2, Pencil, X, Check,
  Clock, Globe, Search,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

interface Committee {
  id: string;
  name: string;
  slug: string;
}

interface MemberCommittee {
  committee: Committee;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  timezone: string;
  createdAt: string;
  committees: MemberCommittee[];
}

interface CalEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  timezone: string;
  recurring: boolean;
  meetingUrl: string | null;
  committee: { id: string; name: string; slug: string; color: string };
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  developer: { label: "Developer", color: "bg-red-100 text-red-700 border-red-200" },
  admin: { label: "Admin", color: "bg-purple-100 text-purple-700 border-purple-200" },
  member: { label: "Member", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"members" | "events">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Member editing
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editCommittees, setEditCommittees] = useState<string[]>([]);

  // Event editing
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventDesc, setEditEventDesc] = useState("");
  const [editEventRecurring, setEditEventRecurring] = useState(false);
  const [editEventMeetingUrl, setEditEventMeetingUrl] = useState("");

  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === "admin" || userRole === "developer";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && !isAdmin) router.replace("/dashboard");
  }, [status, router, isAdmin]);

  const fetchData = useCallback(() => {
    if (!session || !isAdmin) return;
    Promise.all([
      fetch("/api/admin/members").then(r => r.ok ? r.json() : []),
      fetch("/api/admin/events").then(r => r.ok ? r.json() : []),
      fetch("/api/committees").then(r => r.ok ? r.json() : []),
    ]).then(([m, e, c]) => {
      setMembers(m);
      setEvents(e);
      setCommittees(c.map((cm: Committee & { id: string; name: string; slug: string }) => ({ id: cm.id, name: cm.name, slug: cm.slug })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [session, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function startEditMember(m: Member) {
    setEditingMemberId(m.id);
    setEditRole(m.role);
    setEditCommittees(m.committees.map(c => c.committee.id));
  }

  async function saveMember() {
    if (!editingMemberId) return;
    await fetch("/api/admin/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: editingMemberId, role: editRole, committeeIds: editCommittees }),
    });
    setEditingMemberId(null);
    fetchData();
  }

  async function removeMember(userId: string, name: string) {
    if (!confirm(`Remove ${name}? This will delete their account and all their data.`)) return;
    await fetch("/api/admin/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    fetchData();
  }

  function startEditEvent(ev: CalEvent) {
    setEditingEventId(ev.id);
    setEditEventTitle(ev.title);
    setEditEventDesc(ev.description);
    setEditEventRecurring(ev.recurring);
    setEditEventMeetingUrl(ev.meetingUrl || "");
  }

  async function saveEvent() {
    if (!editingEventId) return;
    await fetch("/api/admin/events", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: editingEventId,
        title: editEventTitle,
        description: editEventDesc,
        recurring: editEventRecurring,
        meetingUrl: editEventMeetingUrl,
      }),
    });
    setEditingEventId(null);
    fetchData();
  }

  async function deleteEvent(eventId: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch("/api/admin/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    fetchData();
  }

  function toggleCommittee(cid: string) {
    setEditCommittees((prev: string[]) =>
      prev.includes(cid) ? prev.filter((id: string) => id !== cid) : [...prev, cid]
    );
  }

  const filteredMembers = members.filter((m: Member) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEvents = events.filter((ev: CalEvent) =>
    ev.title.toLowerCase().includes(search.toLowerCase()) ||
    ev.committee.name.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || !session || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Admin Panel</h1>
                <p className="text-xs text-slate-500">Manage members and events</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 w-fit">
              <button
                onClick={() => { setTab("members"); setSearch(""); }}
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md transition-colors ${
                  tab === "members" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Users className="w-4 h-4" /> Members ({members.length})
              </button>
              <button
                onClick={() => { setTab("events"); setSearch(""); }}
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md transition-colors ${
                  tab === "events" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Calendar className="w-4 h-4" /> Events ({events.length})
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tab === "members" ? "Search members..." : "Search events..."}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-white"
              />
            </div>

            {/* Members Tab */}
            {tab === "members" && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Name</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Email</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Role</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Committees</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Joined</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMembers.map(m => {
                        const isEditing = editingMemberId === m.id;
                        const roleInfo = ROLE_LABELS[m.role] || ROLE_LABELS.member;
                        const isSelf = (session.user as { id: string }).id === m.id;
                        return (
                          <tr key={m.id} className={isEditing ? "bg-blue-50/50" : "hover:bg-slate-50"}>
                            <td className="px-4 py-3 font-semibold text-slate-900">{m.name}</td>
                            <td className="px-4 py-3 text-slate-500">{m.email}</td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <select
                                  value={editRole}
                                  onChange={e => setEditRole(e.target.value)}
                                  className="text-xs border border-slate-200 rounded-md px-2 py-1 outline-none focus:border-blue-400"
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                  <option value="developer">Developer</option>
                                </select>
                              ) : (
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${roleInfo.color}`}>
                                  {roleInfo.label}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <div className="flex flex-wrap gap-1">
                                  {committees.map(c => (
                                    <button
                                      key={c.id}
                                      onClick={() => toggleCommittee(c.id)}
                                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                                        editCommittees.includes(c.id)
                                          ? "bg-blue-100 text-blue-700 border-blue-200"
                                          : "bg-slate-50 text-slate-400 border-slate-200"
                                      }`}
                                    >
                                      {c.name}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {m.committees.length === 0 ? (
                                    <span className="text-xs text-slate-400">None</span>
                                  ) : m.committees.map(mc => (
                                    <span key={mc.committee.id} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                      {mc.committee.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs">
                              {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={saveMember} className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setEditingMemberId(null)} className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => startEditMember(m)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Edit member">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  {!isSelf && (
                                    <button onClick={() => removeMember(m.id, m.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Remove member">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredMembers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                            No members found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {tab === "events" && (
              <div className="space-y-3">
                {filteredEvents.length === 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">
                    No events found.
                  </div>
                )}
                {filteredEvents.map(ev => {
                  const isEditing = editingEventId === ev.id;
                  const start = new Date(ev.startTime);
                  const end = new Date(ev.endTime);
                  return (
                    <div key={ev.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${isEditing ? "border-blue-300" : "border-slate-200"}`}>
                      <div className="px-4 py-3 flex items-start gap-3">
                        <div
                          className="w-1.5 h-12 rounded-full shrink-0 mt-0.5"
                          style={{ background: ev.committee.color || "#3b82f6" }}
                        />
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                value={editEventTitle}
                                onChange={e => setEditEventTitle(e.target.value)}
                                className="w-full text-sm font-bold border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                              />
                              <input
                                value={editEventDesc}
                                onChange={e => setEditEventDesc(e.target.value)}
                                placeholder="Description"
                                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                              />
                              <input
                                value={editEventMeetingUrl}
                                onChange={e => setEditEventMeetingUrl(e.target.value)}
                                placeholder="Meeting URL"
                                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                              />
                              <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={editEventRecurring}
                                  onChange={e => setEditEventRecurring(e.target.checked)}
                                  className="rounded border-slate-300"
                                />
                                Recurring
                              </label>
                              <div className="flex gap-2">
                                <button onClick={saveEvent} className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 transition-colors">
                                  Save
                                </button>
                                <button onClick={() => setEditingEventId(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{ev.title}</span>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                  {ev.committee.name}
                                </span>
                                {ev.recurring && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                                    Recurring
                                  </span>
                                )}
                              </div>
                              {ev.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: ev.timezone || undefined })}
                                  {" - "}
                                  {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: ev.timezone || undefined })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {(ev.timezone || "").replace("America/", "").replace(/_/g, " ")}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        {!isEditing && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => startEditEvent(ev)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Edit event">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteEvent(ev.id, ev.title)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete event">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
