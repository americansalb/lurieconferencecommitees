"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  MapPin, Monitor, Megaphone, Handshake, Users,
  ChevronLeft, ChevronRight, Calendar, Plus, X, Clock, Globe,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

const COMMITTEE_ICONS: Record<string, React.ElementType> = {
  "map-pin": MapPin,
  monitor: Monitor,
  megaphone: Megaphone,
  handshake: Handshake,
  users: Users,
};

const SLUG_COLORS: Record<string, string> = {
  "logistics-venue": "#3b82f6",
  "technology-virtual": "#06b6d4",
  "marketing-communications": "#f59e0b",
  "sponsorship-fundraising": "#8b5cf6",
  "volunteer-participant": "#10b981",
  "executive-planning": "#DC2626",
};

interface CalEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  timezone?: string;
  meetingUrl?: string;
  committee: { id: string; name: string; slug: string; color: string };
}

interface Committee {
  id: string;
  name: string;
  slug: string;
  color: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [eventTimezone, setEventTimezone] = useState("America/Chicago");
  const [eventDuration, setEventDuration] = useState("60");
  const [eventMeetingUrl, setEventMeetingUrl] = useState("");
  const [eventCommitteeId, setEventCommitteeId] = useState("");
  const [eventRecurring, setEventRecurring] = useState(false);
  const [filterSlug, setFilterSlug] = useState<string | null>(null);
  const [userTimezone, setUserTimezone] = useState<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [detectedTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [tzSource, setTzSource] = useState<"detected" | "saved">("detected");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Detect and load timezone
  useEffect(() => {
    if (!session) return;
    const detected = detectedTimezone;
    // Try to load saved timezone from user profile
    fetch("/api/user")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.timezone) {
          setUserTimezone(data.timezone);
          setEventTimezone(data.timezone);
          setTzSource("saved");
        } else {
          setUserTimezone(detected);
          setEventTimezone(detected);
          setTzSource("detected");
        }
      })
      .catch(() => {
        setUserTimezone(detected);
        setEventTimezone(detected);
        setTzSource("detected");
      });
  }, [session, detectedTimezone]);

  const fetchEvents = useCallback(() => {
    if (!session) return;
    Promise.all([
      fetch("/api/events").then(r => r.ok ? r.json() : []),
      fetch("/api/committees").then(r => r.ok ? r.json() : []),
    ]).then(([evts, comms]) => {
      setEvents(evts);
      setCommittees(comms.map((c: Committee) => ({ id: c.id, name: c.name, slug: c.slug, color: c.color })));
      if (!eventCommitteeId && comms.length > 0) setEventCommitteeId(comms[0].id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [session, eventCommitteeId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    if (!filterSlug) return events;
    return events.filter(ev => ev.committee.slug === filterSlug);
  }, [events, filterSlug]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    filteredEvents.forEach(ev => {
      // Format in the user's timezone so events land on the correct calendar day
      const dateKey = userTimezone
        ? new Intl.DateTimeFormat("en-CA", { timeZone: userTimezone }).format(new Date(ev.startTime))
        : new Date(ev.startTime).toISOString().split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ev);
    });
    return map;
  }, [filteredEvents, userTimezone]);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setSelectedDate(todayKey);
  }

  function openEventFormForDate(dateKey: string) {
    setSelectedDate(dateKey);
    setEventDate(dateKey);
    setEventTime("09:00");
    setShowEventForm(true);
  }

  async function handleCreateEvent() {
    if (!eventTitle.trim() || !eventDate || !eventTime || !eventCommitteeId) return;

    // Convert the user's wall-clock time in their selected timezone to a proper UTC ISO string.
    // We treat the naive datetime as UTC temporarily, then compute the real UTC offset for the
    // target timezone so the server stores the correct instant.
    const tempUtc = new Date(`${eventDate}T${eventTime}:00Z`);
    const utcFmt = tempUtc.toLocaleString("en-US", { timeZone: "UTC" });
    const tzFmt = tempUtc.toLocaleString("en-US", { timeZone: eventTimezone });
    const offsetMs = new Date(utcFmt).getTime() - new Date(tzFmt).getTime();
    const startTime = new Date(tempUtc.getTime() + offsetMs).toISOString();

    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: eventTitle,
        description: eventDesc,
        committeeId: eventCommitteeId,
        startTime,
        duration: parseInt(eventDuration),
        timezone: eventTimezone,
        recurring: eventRecurring,
        meetingUrl: eventMeetingUrl || undefined,
      }),
    });
    setEventTitle("");
    setEventDesc("");
    setEventMeetingUrl("");
    setEventRecurring(false);
    setShowEventForm(false);
    fetchEvents();
  }

  if (status === "loading" || !session || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" /> All Events
              </h1>
              <button
                onClick={() => {
                  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                  openEventFormForDate(todayKey);
                }}
                className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Event
              </button>
            </div>

            {/* Committee filter chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFilterSlug(null)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  !filterSlug ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                All Committees
              </button>
              {committees.map(c => {
                const color = SLUG_COLORS[c.slug] || "#3b82f6";
                const active = filterSlug === c.slug;
                return (
                  <button
                    key={c.slug}
                    onClick={() => setFilterSlug(active ? null : c.slug)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
                    style={active
                      ? { background: color, color: "#fff", borderColor: color }
                      : { background: color + "10", color, borderColor: color + "30" }
                    }
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            {/* Timezone indicator */}
            {userTimezone && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2 mb-4">
                <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>
                  Times displayed in <span className="font-semibold text-slate-700">{userTimezone.replace(/_/g, " ")}</span>
                  {tzSource === "detected" && (
                    <span className="text-slate-400"> (auto-detected)</span>
                  )}
                </span>
                <a href="/profile" className="ml-auto text-blue-600 hover:text-blue-700 font-semibold shrink-0">
                  Change
                </a>
              </div>
            )}

            {/* Event creation form */}
            {showEventForm && (
              <div className="bg-white border border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-500" /> New Event
                  </h3>
                  <button onClick={() => setShowEventForm(false)} className="p-1 rounded hover:bg-slate-100">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    placeholder="Event title"
                    className="sm:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                  />
                  <input
                    value={eventDesc}
                    onChange={e => setEventDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="sm:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                  />
                  <select
                    value={eventCommitteeId}
                    onChange={e => setEventCommitteeId(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                  >
                    {((session?.user as { role?: string })?.role === "admin" || (session?.user as { role?: string })?.role === "developer") && (
                      <option value="all">All Committees (broadcast)</option>
                    )}
                    {committees.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Timezone</label>
                    <select
                      value={eventTimezone}
                      onChange={e => setEventTimezone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                    >
                      <option value="America/Chicago">Central (CT)</option>
                      <option value="America/New_York">Eastern (ET)</option>
                      <option value="America/Denver">Mountain (MT)</option>
                      <option value="America/Los_Angeles">Pacific (PT)</option>
                      <option value="America/Anchorage">Alaska (AKT)</option>
                      <option value="Pacific/Honolulu">Hawaii (HT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Duration</label>
                    <select
                      value={eventDuration}
                      onChange={e => setEventDuration(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                      <option value="180">3 hours</option>
                      <option value="480">All day</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Zoom / Meeting Link (optional)</label>
                    <input
                      value={eventMeetingUrl}
                      onChange={e => setEventMeetingUrl(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventRecurring}
                      onChange={e => setEventRecurring(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Recurring
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => setShowEventForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5">
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateEvent}
                      disabled={!eventTitle.trim() || !eventDate || !eventTime}
                      className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg px-4 py-1.5 transition-colors"
                    >
                      Create Event
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4">
              {/* Calendar grid */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1">
                {/* Month navigation */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                    <h2 className="text-sm font-bold text-slate-900 ml-1">
                      {MONTHS[viewMonth]} {viewYear}
                    </h2>
                  </div>
                  <button
                    onClick={goToToday}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    Today
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-2">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {calendarCells.map((day, idx) => {
                    if (day === null) return <div key={idx} className="h-24 border-b border-r border-slate-50" />;
                    const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayEvents = eventsByDate[dateKey] || [];
                    const isToday = dateKey === todayStr;
                    const isSelected = dateKey === selectedDate;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
                        onDoubleClick={() => openEventFormForDate(dateKey)}
                        className={`h-24 border-b border-r border-slate-50 text-left px-1.5 py-1 transition-colors relative group ${
                          isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                            isToday ? "bg-blue-600 text-white" : "text-slate-600"
                          }`}>
                            {day}
                          </span>
                          <Plus className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-0.5 space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 2).map(ev => {
                            const evColor = SLUG_COLORS[ev.committee.slug] || "#3b82f6";
                            return (
                              <div
                                key={ev.id}
                                className="text-[10px] font-medium truncate rounded px-1 py-0.5 leading-tight"
                                style={{ background: evColor + "18", color: evColor }}
                              >
                                {ev.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 2} more</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event detail sidebar */}
              <div className="lg:w-80 shrink-0">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[13px] font-bold text-slate-900">
                      {selectedDate
                        ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                        : "Select a date"}
                    </h3>
                    {selectedDate && (
                      <button
                        onClick={() => openEventFormForDate(selectedDate)}
                        className="p-1 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors"
                        title="Add event on this date"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-50">
                    {!selectedDate ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">
                        Click a date to view events.<br />Double-click to create one.
                      </div>
                    ) : selectedEvents.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-xs text-slate-400 mb-2">No events on this day</p>
                        <button
                          onClick={() => openEventFormForDate(selectedDate)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          + Add an event
                        </button>
                      </div>
                    ) : (
                      selectedEvents.map(ev => {
                        const evColor = SLUG_COLORS[ev.committee.slug] || "#3b82f6";
                        const start = new Date(ev.startTime);
                        const end = new Date(ev.endTime);
                        return (
                          <div key={ev.id} className="px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: evColor }} />
                              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: evColor }}>
                                {ev.committee.name}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-slate-900">{ev.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: userTimezone || undefined })}
                              {" - "}
                              {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: userTimezone || undefined })}
                              <span className="text-slate-400 ml-1">
                                {userTimezone ? userTimezone.replace("America/", "").replace(/_/g, " ") : ""}
                              </span>
                            </div>
                            {ev.timezone && userTimezone && ev.timezone !== userTimezone && (
                              <div className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1 mt-1 flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                Event created in {ev.timezone.replace("America/", "").replace(/_/g, " ")}
                                {" \u2022 "}
                                {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: ev.timezone })} there
                              </div>
                            )}
                            {ev.description && (
                              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{ev.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {ev.recurring && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: evColor + "15", color: evColor }}>
                                  Recurring
                                </span>
                              )}
                            </div>
                            {ev.meetingUrl && (
                              <a
                                href={ev.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                onClick={e => e.stopPropagation()}
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v12h16V6H4zm2 2h5v5H6V8zm7 0h5v2h-5V8zm0 3h5v2h-5v-2zm-7 4h12v2H6v-2z"/></svg>
                                Join Meeting
                              </a>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Upcoming events list */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm mt-4">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h3 className="text-[13px] font-bold text-slate-900">Upcoming</h3>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                    {filteredEvents
                      .filter(ev => new Date(ev.startTime) >= today)
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .slice(0, 8)
                      .map(ev => {
                        const evColor = SLUG_COLORS[ev.committee.slug] || "#3b82f6";
                        const d = new Date(ev.startTime);
                        return (
                          <div key={ev.id} className="px-4 py-2.5 flex items-center gap-3">
                            <div className="w-1 h-8 rounded-full shrink-0" style={{ background: evColor }} />
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-semibold text-slate-900 truncate">{ev.title}</div>
                              <div className="text-[11px] text-slate-400">
                                {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                {" · "}
                                {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: userTimezone || undefined })}
                                {" · "}
                                {ev.committee.name}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {filteredEvents.filter(ev => new Date(ev.startTime) >= today).length === 0 && (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">No upcoming events</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
