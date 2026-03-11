"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  MapPin, Monitor, Megaphone, Handshake, Users,
  Calendar, MessageSquare, ChevronDown, ChevronUp,
  Pin, Send, Plus, LogOut, User, Pencil, Trash2, Check, X,
  ChevronLeft, ChevronRight, Clock, Globe, BarChart3,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import GanttChart from "@/components/tasks/GanttChart";

const SLUG_COLORS: Record<string, { accent: string; bg: string; light: string }> = {
  "logistics-venue": { accent: "#3b82f6", bg: "#1e3a5f", light: "#eff6ff" },
  "technology-virtual": { accent: "#06b6d4", bg: "#164e63", light: "#ecfeff" },
  "marketing-communications": { accent: "#f59e0b", bg: "#78350f", light: "#fffbeb" },
  "sponsorship-fundraising": { accent: "#8b5cf6", bg: "#3b0764", light: "#f5f3ff" },
  "volunteer-participant": { accent: "#10b981", bg: "#064e3b", light: "#ecfdf5" },
  "executive-planning": { accent: "#DC2626", bg: "#7f1d1d", light: "#fef2f2" },
};

const SLUG_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  "map-pin": MapPin,
  monitor: Monitor,
  megaphone: Megaphone,
  handshake: Handshake,
  users: Users,
};

interface Member {
  user: { id: string; name: string; email: string };
  role: string;
}

interface Discussion {
  id: string;
  title: string;
  isPinned: boolean;
  author: { id: string; name: string };
  createdAt: string;
  posts?: { id: string; body: string; author: { id: string; name: string }; createdAt: string }[];
  _count?: { posts: number };
}

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  duration: number;
  timezone: string;
  meetingUrl?: string | null;
}

interface Committee {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  members: Member[];
  discussions: Discussion[];
  events: Event[];
  _count: { members: number; discussions: number; events: number };
}

type Tab = "overview" | "members" | "calendar" | "discussion" | "tasks";

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function Avatar({ name, size = "md", accentColor }: { name: string; size?: "sm" | "md"; accentColor: string }) {
  const dims = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div
      className={`${dims} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ background: accentColor + "18", color: accentColor, border: `1.5px solid ${accentColor}33` }}
    >
      {getInitials(name)}
    </div>
  );
}

function MiniCalendar({ events, accent, light }: { events: Event[]; accent: string; light: string }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const eventDays = new Set(
    events
      .filter(e => {
        const d = new Date(e.startTime);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map(e => new Date(e.startTime).getDate())
  );

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2 px-1">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm font-bold text-slate-800">
          {viewDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <div key={d} className="text-[10px] font-bold text-slate-400 py-1">{d}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const hasEvent = eventDays.has(day);
          return (
            <div
              key={day}
              className={`text-xs py-1.5 rounded-md relative ${
                isToday ? "font-bold text-white" : hasEvent ? "font-semibold" : "text-slate-600"
              }`}
              style={isToday ? { background: accent } : hasEvent ? { background: light, color: accent } : undefined}
            >
              {day}
              {hasEvent && !isToday && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: accent }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [newDiscTitle, setNewDiscTitle] = useState("");
  const [expandedDisc, setExpandedDisc] = useState<string | null>(null);
  const [discPosts, setDiscPosts] = useState<Record<string, Discussion["posts"]>>({});
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDuration, setEventDuration] = useState("60");
  const [eventTimezone, setEventTimezone] = useState("America/Chicago");
  const [eventRecurring, setEventRecurring] = useState(false);
  const [eventMeetingUrl, setEventMeetingUrl] = useState("");
  const [userTimezone, setUserTimezone] = useState("");
  const [showNewCommittee, setShowNewCommittee] = useState(false);
  const [newCommitteeName, setNewCommitteeName] = useState("");
  const [newCommitteeDesc, setNewCommitteeDesc] = useState("");
  const [newCommitteeColor, setNewCommitteeColor] = useState("#3b82f6");
  const [newCommitteeIcon, setNewCommitteeIcon] = useState("users");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Load user timezone for event form defaults
  useEffect(() => {
    if (!session) return;
    fetch("/api/user")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const tz = data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(tz);
        setEventTimezone(tz);
      })
      .catch(() => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(tz);
        setEventTimezone(tz);
      });
  }, [session]);

  const fetchCommittees = useCallback(async () => {
    try {
      const res = await fetch("/api/committees");
      if (res.ok) {
        const data = await res.json();
        setCommittees(data);
        if (!selectedSlug && data.length > 0) setSelectedSlug(data[0].slug);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [selectedSlug]);

  useEffect(() => {
    if (session) fetchCommittees();
  }, [session, fetchCommittees]);

  const committee = committees.find(c => c.slug === selectedSlug);
  const col = committee ? SLUG_COLORS[committee.slug] || SLUG_COLORS["logistics-venue"] : SLUG_COLORS["logistics-venue"];
  const IconComponent = committee ? SLUG_ICONS[committee.icon] || Users : Users;

  const isMember = committee?.members.some(
    m => m.user.id === (session?.user as { id?: string })?.id
  );

  async function handleJoin() {
    if (!committee) return;
    await fetch("/api/committees/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ committeeId: committee.id }),
    });
    fetchCommittees();
  }

  async function handleLeave() {
    if (!committee) return;
    if (!confirm(`Leave ${committee.name}?`)) return;
    await fetch("/api/committees/join", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ committeeId: committee.id }),
    });
    fetchCommittees();
  }

  async function handleCreateDiscussion() {
    if (!committee || !newDiscTitle.trim()) return;
    await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newDiscTitle, committeeId: committee.id }),
    });
    setNewDiscTitle("");
    fetchCommittees();
  }

  async function loadDiscussionPosts(discId: string) {
    const res = await fetch(`/api/discussions/${discId}`);
    if (res.ok) {
      const data = await res.json();
      setDiscPosts(prev => ({ ...prev, [discId]: data.posts }));
    }
  }

  async function handleReply(discId: string) {
    if (!replyText.trim()) return;
    await fetch(`/api/discussions/${discId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyText }),
    });
    setReplyText("");
    loadDiscussionPosts(discId);
  }

  async function handleCreateEvent() {
    if (!committee || !eventTitle.trim() || !eventDate || !eventTime) return;
    const startTime = new Date(`${eventDate}T${eventTime}`).toISOString();
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: eventTitle,
        description: eventDesc,
        committeeId: committee.id,
        startTime,
        duration: parseInt(eventDuration),
        timezone: eventTimezone,
        recurring: eventRecurring,
        meetingUrl: eventMeetingUrl || undefined,
      }),
    });
    setEventTitle("");
    setEventDesc("");
    setEventDate("");
    setEventTime("");
    setEventDuration("60");
    setEventRecurring(false);
    setEventMeetingUrl("");
    setShowEventForm(false);
    fetchCommittees();
  }

  async function handleEditPost(postId: string) {
    if (!editText.trim() || !expandedDisc) return;
    await fetch(`/api/discussions/${expandedDisc}/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editText }),
    });
    setEditingPost(null);
    setEditText("");
    loadDiscussionPosts(expandedDisc);
  }

  async function handleDeletePost(postId: string) {
    if (!expandedDisc) return;
    await fetch(`/api/discussions/${expandedDisc}/posts/${postId}`, { method: "DELETE" });
    loadDiscussionPosts(expandedDisc);
  }

  async function handleDeleteDiscussion(discId: string) {
    if (!confirm("Delete this discussion and all its replies?")) return;
    const res = await fetch(`/api/discussions/${discId}`, { method: "DELETE" });
    if (res.ok) {
      if (expandedDisc === discId) setExpandedDisc(null);
      fetchCommittees();
    }
  }

  async function handleCreateCommittee() {
    if (!newCommitteeName.trim()) return;
    const res = await fetch("/api/committees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCommitteeName,
        description: newCommitteeDesc,
        color: newCommitteeColor,
        icon: newCommitteeIcon,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setNewCommitteeName("");
      setNewCommitteeDesc("");
      setNewCommitteeColor("#3b82f6");
      setNewCommitteeIcon("users");
      setShowNewCommittee(false);
      await fetchCommittees();
      setSelectedSlug(created.slug);
    }
  }

  const currentUserId = (session?.user as { id?: string })?.id;
  const currentUserRole = (session?.user as { role?: string })?.role;
  const canModerate = currentUserRole === "developer" || currentUserRole === "admin";

  if (status === "loading" || !session || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: Monitor },
    { id: "members", label: `Members (${committee?._count.members || 0})`, icon: Users },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "discussion", label: `Discussion (${committee?._count.discussions || 0})`, icon: MessageSquare },
    { id: "tasks", label: "Tasks", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {/* Committee selector */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedSlug("__all__"); setActiveTab("members"); setExpandedDisc(null); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedSlug === "__all__" ? "shadow-sm border bg-slate-900 text-white border-slate-900" : "border border-transparent hover:bg-slate-50 text-slate-500"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">All Committees</span>
                <span className="sm:hidden">All</span>
              </button>
              {committees.map(c => {
                const isSelected = selectedSlug === c.slug;
                const cCol = SLUG_COLORS[c.slug] || SLUG_COLORS["logistics-venue"];
                const CIcon = SLUG_ICONS[c.icon] || Users;
                return (
                  <button
                    key={c.slug}
                    onClick={() => { setSelectedSlug(c.slug); setActiveTab("overview"); setExpandedDisc(null); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected ? "shadow-sm border" : "border border-transparent hover:bg-slate-50"
                    }`}
                    style={isSelected ? { background: cCol.light, borderColor: cCol.accent + "30", color: cCol.accent } : { color: "#64748b" }}
                  >
                    <CIcon className="w-4 h-4" style={isSelected ? { color: cCol.accent } : undefined} />
                    <span className="hidden sm:inline">{c.name}</span>
                    <span className="sm:hidden">{c.name.split(" ")[0]}</span>
                  </button>
                );
              })}
              {canModerate && (
                <button
                  onClick={() => setShowNewCommittee(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-all"
                  title="Create new committee"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New</span>
                </button>
              )}
            </div>
          </div>

          {showNewCommittee && (
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
              <div className="max-w-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Create New Committee</h3>
                  <button onClick={() => setShowNewCommittee(false)} className="p-1 rounded hover:bg-slate-100">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    value={newCommitteeName}
                    onChange={e => setNewCommitteeName(e.target.value)}
                    placeholder="Committee name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                  />
                  <input
                    value={newCommitteeDesc}
                    onChange={e => setNewCommitteeDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                  />
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Color</label>
                      <input
                        type="color"
                        value={newCommitteeColor}
                        onChange={e => setNewCommitteeColor(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Icon</label>
                      <select
                        value={newCommitteeIcon}
                        onChange={e => setNewCommitteeIcon(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400"
                      >
                        <option value="users">Users</option>
                        <option value="map-pin">Map Pin</option>
                        <option value="monitor">Monitor</option>
                        <option value="megaphone">Megaphone</option>
                        <option value="handshake">Handshake</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowNewCommittee(false)} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5">
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCommittee}
                      disabled={!newCommitteeName.trim()}
                      className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg px-4 py-1.5 transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

      {selectedSlug === "__all__" && (
        <div className="p-4 sm:p-6">
          {/* All Committees — Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 w-fit">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md transition-colors ${
                activeTab === "members" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Users className="w-4 h-4" /> All Members
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md transition-colors ${
                activeTab === "calendar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Calendar className="w-4 h-4" /> All Events
            </button>
          </div>

          {/* All Members */}
          {activeTab === "members" && (
            <div className="space-y-4">
              {committees.map(c => {
                const cCol = SLUG_COLORS[c.slug] || SLUG_COLORS["logistics-venue"];
                return (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: cCol.accent }} />
                      <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                      <span className="text-xs text-slate-400 ml-auto">{c.members.length} {c.members.length === 1 ? "member" : "members"}</span>
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {c.members.length === 0 ? (
                        <div className="col-span-full text-center text-xs text-slate-400 py-4">No members yet</div>
                      ) : c.members.map(m => (
                        <div key={m.user.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-100">
                          <Avatar name={m.user.name} size="sm" accentColor={cCol.accent} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-slate-900 truncate">{m.user.name}</div>
                            <div className="text-[11px] text-slate-400">{m.role === "chair" ? "Group Leader" : "Member"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* All Events */}
          {activeTab === "calendar" && (() => {
            const allEvents = committees.flatMap(c =>
              c.events.map(e => ({ ...e, committeeName: c.name, committeeSlug: c.slug }))
            ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            const upcoming = allEvents.filter(e => new Date(e.startTime) >= new Date());
            const past = allEvents.filter(e => new Date(e.startTime) < new Date());
            return (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Upcoming Events ({upcoming.length})</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {upcoming.length === 0 && (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">No upcoming events</div>
                    )}
                    {upcoming.map(ev => {
                      const cCol = SLUG_COLORS[ev.committeeSlug] || SLUG_COLORS["logistics-venue"];
                      const start = new Date(ev.startTime);
                      const end = new Date(ev.endTime);
                      return (
                        <div key={ev.id} className="px-4 py-3 flex items-start gap-3">
                          <div className="w-1.5 h-10 rounded-full shrink-0 mt-0.5" style={{ background: cCol.accent }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{ev.title}</span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{ev.committeeName}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: ev.timezone || undefined })}
                                {" - "}
                                {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: ev.timezone || undefined })}
                              </span>
                            </div>
                          </div>
                          {ev.meetingUrl && (
                            <a
                              href={ev.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg shrink-0"
                            >
                              Join
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {past.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-500">Past Events ({past.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-50 opacity-60">
                      {past.map(ev => {
                        const cCol = SLUG_COLORS[ev.committeeSlug] || SLUG_COLORS["logistics-venue"];
                        const start = new Date(ev.startTime);
                        return (
                          <div key={ev.id} className="px-4 py-3 flex items-center gap-3">
                            <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: cCol.accent }} />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-slate-700">{ev.title}</span>
                              <div className="text-xs text-slate-400">
                                {ev.committeeName} &middot; {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {committee && selectedSlug !== "__all__" && (
        <div>
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-7 pt-4 sm:pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: col.accent + "15" }}>
                <IconComponent className="w-5 h-5" style={{ color: col.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                  {committee.name}
                </h1>
                <p className="text-xs text-slate-500 truncate">
                  {committee.members.length > 0
                    ? committee.members.map(m => m.user.name.split(" ")[0]).join(", ")
                    : "No members yet"}
                </p>
              </div>
              {!isMember ? (
                <button
                  onClick={handleJoin}
                  className="text-sm font-bold text-white rounded-lg px-4 py-2 transition-all hover:opacity-90 shrink-0"
                  style={{ background: col.accent }}
                >
                  Join
                </button>
              ) : (
                <button
                  onClick={handleLeave}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-3 py-2 transition-colors shrink-0"
                >
                  Leave
                </button>
              )}
            </div>
            {/* Tabs */}
            <div className="flex gap-0.5 overflow-x-auto -mb-px">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); setExpandedDisc(null); }}
                  className={`px-3 sm:px-4 py-3 text-[13px] whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                    activeTab === t.id
                      ? "font-bold border-current"
                      : "font-medium text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                  style={activeTab === t.id ? { color: col.accent } : undefined}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* Overview */}
            {activeTab === "overview" && (
              <div className="p-4 sm:p-6">
                {/* Description + stats row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  <div
                    className="rounded-xl p-5 flex-1 relative overflow-hidden min-w-0"
                    style={{ background: `linear-gradient(135deg, ${col.bg}, ${col.bg}dd)` }}
                  >
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
                      <IconComponent className="w-16 h-16 text-white" />
                    </div>
                    <div className="relative z-10">
                      <div className="text-[10px] font-bold tracking-wider uppercase mb-1.5" style={{ color: col.accent }}>
                        {committee.name}
                      </div>
                      <p className="text-[13px] text-slate-300 leading-relaxed">{committee.description}</p>
                    </div>
                  </div>
                  <div className="flex lg:flex-col gap-3 shrink-0">
                    {[
                      { label: "Members", value: committee._count.members, Icon: User },
                      { label: "Events", value: committee._count.events, Icon: Calendar },
                      { label: "Threads", value: committee._count.discussions, Icon: MessageSquare },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white border border-slate-100 rounded-lg px-4 py-3 flex items-center gap-3 flex-1 lg:w-48 shadow-sm">
                        <stat.Icon className="w-4 h-4 shrink-0" style={{ color: col.accent }} />
                        <div>
                          <span className="text-lg font-extrabold text-slate-900">{stat.value}</span>
                          <span className="text-xs text-slate-400 ml-1.5">{stat.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Two-column: recent discussions + upcoming events */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Recent discussions */}
                  <div className="bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Recent Discussions
                      </h3>
                      <button onClick={() => setActiveTab("discussion")} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                        View all
                      </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {committee.discussions.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-400">No discussions yet</div>
                      ) : (
                        committee.discussions.slice(0, 4).map(d => (
                          <div key={d.id} className="px-4 py-2.5 flex items-center gap-2.5">
                            <Avatar name={d.author.name} size="sm" accentColor={col.accent} />
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-semibold text-slate-900 truncate">{d.title}</div>
                              <div className="text-[11px] text-slate-400">{d.author.name} &middot; {d._count?.posts || 0} replies</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Upcoming events */}
                  <div className="bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Upcoming Events
                      </h3>
                      <button onClick={() => setActiveTab("calendar")} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                        View all
                      </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {committee.events.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-400">No events scheduled</div>
                      ) : (
                        committee.events.slice(0, 4).map(ev => {
                          const d = new Date(ev.startTime);
                          return (
                            <div key={ev.id} className="px-4 py-2.5 flex items-center gap-3">
                              <div className="w-10 text-center shrink-0 rounded py-1" style={{ background: col.light }}>
                                <div className="text-[9px] font-bold tracking-wider" style={{ color: col.accent }}>
                                  {d.toLocaleString("default", { month: "short" }).toUpperCase()}
                                </div>
                                <div className="text-sm font-extrabold leading-tight" style={{ color: col.accent }}>{d.getDate()}</div>
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13px] font-semibold text-slate-900 truncate">{ev.title}</div>
                                <div className="text-[11px] text-slate-400">
                                  {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Members preview */}
                  <div className="bg-white border border-slate-100 rounded-xl shadow-sm lg:col-span-2">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> Team ({committee._count.members})
                      </h3>
                      <button onClick={() => setActiveTab("members")} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                        View all
                      </button>
                    </div>
                    <div className="px-4 py-3 flex flex-wrap gap-2">
                      {committee.members.length === 0 ? (
                        <span className="text-xs text-slate-400">No members yet</span>
                      ) : (
                        committee.members.map(m => (
                          <div key={m.user.id} className="flex items-center gap-2 bg-slate-50 rounded-full pl-1 pr-3 py-1">
                            <Avatar name={m.user.name} size="sm" accentColor={col.accent} />
                            <span className="text-xs font-medium text-slate-700">{m.user.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Members */}
            {activeTab === "members" && (
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {committee.members.map(m => (
                  <div key={m.user.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                    <Avatar name={m.user.name} accentColor={col.accent} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{m.user.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{m.role === "chair" ? "Chair" : "Member"}</div>
                    </div>
                  </div>
                ))}
                {isMember && (
                  <div className="border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    style={{ borderColor: col.accent + "44" }}
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center"
                      style={{ borderColor: col.accent + "44" }}
                    >
                      <Plus className="w-4 h-4" style={{ color: col.accent }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: col.accent }}>Invite member</span>
                  </div>
                )}
                {committee.members.length === 0 && (
                  <div className="col-span-full text-center text-slate-400 py-10">
                    No members yet. Be the first to join!
                  </div>
                )}
              </div>
            )}

            {/* Calendar */}
            {activeTab === "calendar" && (
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <MiniCalendar events={committee.events} accent={col.accent} light={col.light} />
                  </div>
                  <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" /> Events
                  </h2>
                  {isMember && (
                    <button
                      onClick={() => setShowEventForm(!showEventForm)}
                      className="text-[13px] font-bold text-white rounded-lg px-3 py-1.5 flex items-center gap-1 transition-all hover:opacity-90"
                      style={{ background: col.accent }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Event
                    </button>
                  )}
                </div>

                {/* Event creation form */}
                {showEventForm && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm space-y-3">
                    <input
                      value={eventTitle}
                      onChange={e => setEventTitle(e.target.value)}
                      placeholder="Event title"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                    />
                    <input
                      value={eventDesc}
                      onChange={e => setEventDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Date</label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={e => setEventDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Start Time</label>
                        <input
                          type="time"
                          value={eventTime}
                          onChange={e => setEventTime(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Duration</label>
                        <select
                          value={eventDuration}
                          onChange={e => setEventDuration(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-white"
                        >
                          <option value="30">30 min</option>
                          <option value="60">1 hour</option>
                          <option value="90">1.5 hours</option>
                          <option value="120">2 hours</option>
                          <option value="180">3 hours</option>
                          <option value="240">4 hours</option>
                          <option value="480">Full day</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Timezone</label>
                        <select
                          value={eventTimezone}
                          onChange={e => setEventTimezone(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-white"
                        >
                          <option value="America/Chicago">Central (CT)</option>
                          <option value="America/New_York">Eastern (ET)</option>
                          <option value="America/Denver">Mountain (MT)</option>
                          <option value="America/Los_Angeles">Pacific (PT)</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Zoom / Meeting Link (optional)</label>
                      <input
                        value={eventMeetingUrl}
                        onChange={e => setEventMeetingUrl(e.target.value)}
                        placeholder="https://zoom.us/j/..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventRecurring}
                          onChange={e => setEventRecurring(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        Recurring event
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowEventForm(false)}
                          className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateEvent}
                          className="text-sm font-bold text-white rounded-lg px-4 py-1.5 transition-all hover:opacity-90"
                          style={{ background: col.accent }}
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {committee.events.length === 0 && !showEventForm ? (
                  <div className="bg-white border border-slate-100 rounded-xl p-8 text-center shadow-sm">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 mb-3">No events scheduled yet.</p>
                    {isMember && (
                      <button
                        onClick={() => setShowEventForm(true)}
                        className="text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors"
                        style={{ color: col.accent, background: col.light }}
                      >
                        Schedule the first event
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {committee.events
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map(ev => {
                        const d = new Date(ev.startTime);
                        const end = new Date(ev.endTime);
                        const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
                        const day = d.getDate();
                        return (
                          <div key={ev.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
                            <div className="w-12 text-center shrink-0 rounded-lg py-1.5" style={{ background: col.light }}>
                              <div className="text-[10px] font-bold tracking-wider" style={{ color: col.accent }}>{month}</div>
                              <div className="text-lg font-extrabold leading-tight" style={{ color: col.accent }}>{day}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-bold text-slate-900 truncate">{ev.title}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: userTimezone || undefined })}
                                {" - "}
                                {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: userTimezone || undefined })}
                                {userTimezone && (
                                  <span className="text-slate-400 ml-1">
                                    ({userTimezone.replace("America/", "").replace(/_/g, " ")})
                                  </span>
                                )}
                                {ev.description && ` · ${ev.description}`}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {ev.meetingUrl && (
                                <a
                                  href={ev.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                >
                                  Join Meeting
                                </a>
                              )}
                              {ev.recurring && (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: col.light, color: col.accent }}>
                                  Recurring
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
                  </div>
                </div>
              </div>
            )}

            {/* Tasks / Gantt Chart */}
            {activeTab === "tasks" && committee && (
              <GanttChart
                committeeId={committee.id}
                accentColor={col.accent}
                lightColor={col.light}
                members={committee.members}
                isMember={!!isMember}
              />
            )}

            {/* Discussion */}
            {activeTab === "discussion" && (
              <div className="p-4 sm:p-6">
                {isMember && (
                  <div className="flex gap-2 mb-5 bg-white border border-slate-200 rounded-xl p-3">
                    <input
                      value={newDiscTitle}
                      onChange={e => setNewDiscTitle(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCreateDiscussion()}
                      placeholder="Start a new discussion..."
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all"
                    />
                    <button
                      onClick={handleCreateDiscussion}
                      className="text-sm font-bold text-white rounded-lg px-4 py-2 transition-all hover:opacity-90"
                      style={{ background: col.accent }}
                    >
                      Post
                    </button>
                  </div>
                )}
                {(!committee.discussions || committee.discussions.length === 0) ? (
                  <div className="text-slate-400 text-center py-10">
                    No discussions yet. {isMember ? "Start one above!" : "Join the committee to start a discussion."}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {committee.discussions.map(d => (
                      <div key={d.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => {
                            if (expandedDisc === d.id) {
                              setExpandedDisc(null);
                            } else {
                              setExpandedDisc(d.id);
                              if (!discPosts[d.id]) loadDiscussionPosts(d.id);
                            }
                          }}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                        >
                          <Avatar name={d.author.name} size="sm" accentColor={col.accent} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                              {d.isPinned && <Pin className="w-3 h-3 shrink-0" style={{ color: col.accent }} />}
                              {d.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {d.author.name} &middot; {new Date(d.createdAt).toLocaleDateString()}
                              {d._count?.posts ? ` \u00b7 ${d._count.posts} replies` : ""}
                            </div>
                          </div>
                          {expandedDisc === d.id
                            ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                        </button>
                        {expandedDisc === d.id && (
                          <div className="border-t border-slate-100 px-4 py-4">
                            {(d.author.id === currentUserId || canModerate) && (
                              <div className="flex justify-end mb-3">
                                <button
                                  onClick={() => handleDeleteDiscussion(d.id)}
                                  className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete Discussion
                                </button>
                              </div>
                            )}
                            {discPosts[d.id]?.map(p => {
                              const isOwnPost = p.author.id === currentUserId;
                              const canEditPost = isOwnPost || canModerate;
                              const isEditing = editingPost === p.id;
                              return (
                                <div key={p.id} className="flex gap-3 mb-3 group">
                                  <Avatar name={p.author.name} size="sm" accentColor={col.accent} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2 mb-1">
                                      <span className="text-[13px] font-bold text-slate-900">{p.author.name}</span>
                                      <span className="text-[11px] text-slate-400">
                                        {new Date(p.createdAt).toLocaleString()}
                                      </span>
                                      {canEditPost && !isEditing && (
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-auto">
                                          <button
                                            onClick={() => { setEditingPost(p.id); setEditText(p.body); }}
                                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                                            title="Edit"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDeletePost(p.id)}
                                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                                            title="Delete"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </span>
                                      )}
                                    </div>
                                    {isEditing ? (
                                      <div className="flex gap-2 max-w-xl">
                                        <input
                                          value={editText}
                                          onChange={e => setEditText(e.target.value)}
                                          onKeyDown={e => e.key === "Enter" && handleEditPost(p.id)}
                                          className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400/20"
                                          autoFocus
                                        />
                                        <button onClick={() => handleEditPost(p.id)} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setEditingPost(null)} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200">
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="bg-slate-50 rounded-lg rounded-tl-none border border-slate-100 px-3 py-2 text-sm text-slate-700 leading-relaxed max-w-xl">
                                        {p.body}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {isMember && (
                              <div className="flex gap-2 mt-3">
                                <input
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleReply(d.id)}
                                  placeholder="Write a reply..."
                                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all"
                                />
                                <button
                                  onClick={() => handleReply(d.id)}
                                  className="text-white rounded-lg px-3 py-2 transition-all hover:opacity-90"
                                  style={{ background: col.accent }}
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
