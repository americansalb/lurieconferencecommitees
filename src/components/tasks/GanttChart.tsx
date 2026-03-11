"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Plus, X, Trash2, ChevronLeft, ChevronRight,
  Check, Circle, CheckCircle2, Clock, ExternalLink,
  AlertCircle, ArrowUp, ArrowRight, ArrowDown, Link2,
  Pencil, Calendar, User, Flag, Palette, Sparkles,
  FileText, Users, Zap,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  endDate: string;
  color: string | null;
  url: string | null;
  assignee: { id: string; name: string } | null;
  sortOrder: number;
}

interface Member {
  user: { id: string; name: string; email: string };
  role: string;
}

interface GanttChartProps {
  committeeId: string;
  accentColor: string;
  lightColor: string;
  members: Member[];
  isMember: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Circle; color: string; bg: string }> = {
  todo: { label: "To Do", icon: Circle, color: "#94a3b8", bg: "#f1f5f9" },
  "in-progress": { label: "In Progress", icon: Clock, color: "#3b82f6", bg: "#eff6ff" },
  review: { label: "Review", icon: AlertCircle, color: "#f59e0b", bg: "#fffbeb" },
  done: { label: "Done", icon: CheckCircle2, color: "#10b981", bg: "#ecfdf5" },
};

const PRIORITY_CONFIG: Record<string, { label: string; icon: typeof ArrowUp; color: string; bg: string }> = {
  low: { label: "Low", icon: ArrowDown, color: "#94a3b8", bg: "#f8fafc" },
  medium: { label: "Medium", icon: ArrowRight, color: "#f59e0b", bg: "#fffbeb" },
  high: { label: "High", icon: ArrowUp, color: "#ef4444", bg: "#fef2f2" },
};

const TASK_COLORS = [
  "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function getDomainFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function GanttChart({ committeeId, accentColor, lightColor, members, isMember }: GanttChartProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [editField, setEditField] = useState<string | null>(null);
  const [viewOffset, setViewOffset] = useState(0);
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [dragType, setDragType] = useState<"move" | "resize-end" | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOrigStart, setDragOrigStart] = useState("");
  const [dragOrigEnd, setDragOrigEnd] = useState("");
  const ganttRef = useRef<HTMLDivElement>(null);

  // Form / wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formStart, setFormStart] = useState(formatDate(new Date()));
  const [formEnd, setFormEnd] = useState(formatDate(addDays(new Date(), 7)));
  const [formPriority, setFormPriority] = useState("medium");
  const [formColor, setFormColor] = useState(TASK_COLORS[0]);
  const [formAssignee, setFormAssignee] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?committeeId=${committeeId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [committeeId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Timeline - 8 weeks
  const weeksToShow = 8;
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const timelineStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay() + viewOffset * 7);
    return d;
  }, [today, viewOffset]);

  const totalDays = weeksToShow * 7;

  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      result.push(addDays(timelineStart, i));
    }
    return result;
  }, [timelineStart, totalDays]);

  const weeks = useMemo(() => {
    const result: { start: Date; days: Date[] }[] = [];
    for (let w = 0; w < weeksToShow; w++) {
      const weekStart = addDays(timelineStart, w * 7);
      const weekDays: Date[] = [];
      for (let d = 0; d < 7; d++) {
        weekDays.push(addDays(weekStart, d));
      }
      result.push({ start: weekStart, days: weekDays });
    }
    return result;
  }, [timelineStart, weeksToShow]);

  const dayWidth = 100 / totalDays;

  function getBarStyle(task: Task) {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const startOffset = daysBetween(timelineStart, start);
    const duration = daysBetween(start, end) + 1;
    const left = Math.max(0, startOffset * dayWidth);
    const right = Math.min(100, (startOffset + duration) * dayWidth);
    const width = right - left;
    if (width <= 0 || left >= 100 || right <= 0) return null;
    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100 - Math.max(0, left), width)}%` };
  }

  function resetForm() {
    setFormTitle(""); setFormDesc(""); setFormUrl(""); setFormPriority("medium"); setFormAssignee("");
    setFormStart(formatDate(new Date())); setFormEnd(formatDate(addDays(new Date(), 7)));
    setFormColor(TASK_COLORS[0]); setWizardStep(0); setCreating(false);
  }

  const [formError, setFormError] = useState("");

  async function handleCreateTask() {
    if (!formTitle.trim() || !formStart || !formEnd) return;
    setFormError("");
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          committeeId,
          title: formTitle,
          description: formDesc,
          startDate: formStart,
          endDate: formEnd,
          priority: formPriority,
          color: formColor,
          url: formUrl || null,
          assigneeId: formAssignee || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create task" }));
        setFormError(err.error || "Failed to create task");
        setCreating(false);
        return;
      }
      resetForm();
      setShowForm(false);
      fetchTasks();
    } catch {
      setFormError("Network error — please try again");
      setCreating(false);
    }
  }

  const WIZARD_STEPS = [
    { label: "Basics", icon: FileText, desc: "Name your task" },
    { label: "Timeline", icon: Calendar, desc: "Set dates & assign" },
    { label: "Details", icon: Zap, desc: "Priority & style" },
  ];

  function canAdvanceStep(step: number): boolean {
    if (step === 0) return formTitle.trim().length > 0;
    if (step === 1) return !!formStart && !!formEnd;
    return true;
  }

  async function handleUpdateTask(taskId: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, ...updates }),
      });
      if (!res.ok) return;
      fetchTasks();
      setEditField(null);
    } catch { /* ignore */ }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!res.ok) return;
      if (selectedTask === taskId) setSelectedTask(null);
      fetchTasks();
    } catch { /* ignore */ }
  }

  // Drag handlers
  function handleBarMouseDown(e: React.MouseEvent, taskId: string, type: "move" | "resize-end") {
    e.preventDefault();
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task || !isMember) return;
    setDragTask(taskId);
    setDragType(type);
    setDragStartX(e.clientX);
    setDragOrigStart(task.startDate);
    setDragOrigEnd(task.endDate);
  }

  useEffect(() => {
    if (!dragTask || !dragType) return;

    function handleMouseMove(e: MouseEvent) {
      if (!ganttRef.current || !dragTask) return;
      const ganttWidth = ganttRef.current.offsetWidth;
      const dx = e.clientX - dragStartX;
      const daysPx = ganttWidth / totalDays;
      const daysDelta = Math.round(dx / daysPx);
      if (daysDelta === 0) return;

      setTasks(prev => prev.map(t => {
        if (t.id !== dragTask) return t;
        if (dragType === "move") {
          return {
            ...t,
            startDate: formatDate(addDays(new Date(dragOrigStart), daysDelta)),
            endDate: formatDate(addDays(new Date(dragOrigEnd), daysDelta)),
          };
        } else {
          const newEnd = addDays(new Date(dragOrigEnd), daysDelta);
          if (newEnd >= new Date(dragOrigStart)) {
            return { ...t, endDate: formatDate(newEnd) };
          }
        }
        return t;
      }));
    }

    function handleMouseUp() {
      if (dragTask) {
        const task = tasks.find(t => t.id === dragTask);
        if (task && (task.startDate !== dragOrigStart || task.endDate !== dragOrigEnd)) {
          handleUpdateTask(dragTask, { startDate: task.startDate, endDate: task.endDate });
        }
      }
      setDragTask(null);
      setDragType(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragTask, dragType, dragStartX, dragOrigStart, dragOrigEnd, totalDays]);

  function cycleStatus(task: Task) {
    const order = ["todo", "in-progress", "review", "done"];
    const idx = order.indexOf(task.status);
    const next = order[(idx + 1) % order.length];
    const progress = next === "done" ? 100 : next === "review" ? 75 : next === "in-progress" ? 25 : 0;
    handleUpdateTask(task.id, { status: next, progress });
  }

  const selectedTaskData = tasks.find(t => t.id === selectedTask);

  // Summary counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { todo: 0, "in-progress": 0, review: 0, done: 0 };
    tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return counts;
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Tasks & Timeline</h2>
          {tasks.length > 0 && (
            <div className="flex items-center gap-3 mt-1.5">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = statusCounts[key] || 0;
                if (count === 0) return null;
                const Icon = cfg.icon;
                return (
                  <div key={key} className="flex items-center gap-1">
                    <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>{count}</span>
                    <span className="text-[11px] text-slate-400">{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setViewOffset(v => v - weeksToShow)}
              className="p-1.5 rounded-md hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-600"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewOffset(0)}
              className="px-3 py-1 text-[11px] font-bold rounded-md hover:bg-slate-50 transition-all text-slate-600"
            >
              Today
            </button>
            <button
              onClick={() => setViewOffset(v => v + weeksToShow)}
              className="p-1.5 rounded-md hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-600"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {isMember && (
            <button
              onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
              className="text-[13px] font-bold text-white rounded-lg px-4 py-2 flex items-center gap-1.5 transition-all hover:opacity-90 shadow-sm"
              style={{ background: accentColor }}
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Task creation wizard modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowForm(false); resetForm(); setFormError(""); }} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Wizard header with gradient */}
            <div className="relative overflow-hidden px-6 pt-6 pb-4" style={{ background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}06)` }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.04]" style={{ background: accentColor, transform: "translate(30%, -30%)" }} />
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: accentColor + "18" }}>
                    <Sparkles className="w-4.5 h-4.5" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-slate-900">Create a Task</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{WIZARD_STEPS[wizardStep].desc}</p>
                  </div>
                </div>
                <button onClick={() => { setShowForm(false); resetForm(); setFormError(""); }} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-1">
                {WIZARD_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isActive = i === wizardStep;
                  const isDone = i < wizardStep;
                  return (
                    <button
                      key={i}
                      onClick={() => { if (i < wizardStep || canAdvanceStep(wizardStep)) setWizardStep(i); }}
                      className={`flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                        isActive ? "shadow-sm" : isDone ? "hover:bg-white/60" : "opacity-50"
                      }`}
                      style={isActive ? { background: "white", color: accentColor, boxShadow: `0 2px 8px ${accentColor}15` } : isDone ? { color: accentColor } : { color: "#94a3b8" }}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step content */}
            <div className="px-6 py-5 min-h-[240px]">
              {/* Step 1: Basics */}
              {wizardStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">What needs to be done?</label>
                    <input
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="e.g. Book conference venue, Send speaker invitations..."
                      className="w-full px-4 py-3 text-[15px] font-medium border-2 border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all placeholder:text-slate-300"
                      autoFocus
                      onKeyDown={e => { if (e.key === "Enter" && formTitle.trim()) setWizardStep(1); }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Description <span className="font-normal text-slate-300">(optional)</span>
                    </label>
                    <textarea
                      value={formDesc}
                      onChange={e => setFormDesc(e.target.value)}
                      placeholder="Add context, notes, or instructions..."
                      rows={3}
                      className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all resize-none placeholder:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> Link <span className="font-normal text-slate-300">(optional)</span></span>
                    </label>
                    <input
                      value={formUrl}
                      onChange={e => setFormUrl(e.target.value)}
                      placeholder="https://docs.google.com/..."
                      className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Timeline & Assignment */}
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Timeline</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Start Date
                        </label>
                        <input
                          type="date"
                          value={formStart}
                          onChange={e => setFormStart(e.target.value)}
                          className="w-full px-3.5 py-3 text-sm font-medium border-2 border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all"
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> End Date
                        </label>
                        <input
                          type="date"
                          value={formEnd}
                          onChange={e => setFormEnd(e.target.value)}
                          className="w-full px-3.5 py-3 text-sm font-medium border-2 border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all"
                        />
                      </div>
                    </div>
                    {formStart && formEnd && (
                      <div className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: accentColor + "08" }}>
                        <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
                        <span className="text-xs font-medium" style={{ color: accentColor }}>
                          {daysBetween(new Date(formStart), new Date(formEnd)) + 1} days &middot;{" "}
                          {new Date(formStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} →{" "}
                          {new Date(formEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Assign to</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setFormAssignee("")}
                        className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border-2 transition-all text-left ${
                          !formAssignee ? "border-blue-400 bg-blue-50/50 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!formAssignee ? "bg-blue-100" : "bg-slate-100"}`}>
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">Unassigned</span>
                      </button>
                      {members.map(m => {
                        const isSelected = formAssignee === m.user.id;
                        return (
                          <button
                            key={m.user.id}
                            onClick={() => setFormAssignee(m.user.id)}
                            className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border-2 transition-all text-left ${
                              isSelected ? "border-blue-400 bg-blue-50/50 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ background: isSelected ? accentColor : "#94a3b8" }}
                            >
                              {getInitials(m.user.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-700 truncate">{m.user.name}</div>
                              <div className="text-[10px] text-slate-400 capitalize">{m.role}</div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 ml-auto shrink-0" style={{ color: accentColor }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Priority & Style */}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                      <span className="flex items-center gap-1"><Flag className="w-3 h-3" /> Priority</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        const isActive = formPriority === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setFormPriority(key)}
                            className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                              isActive ? "shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                            style={isActive ? { borderColor: cfg.color, background: cfg.bg } : undefined}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? "" : "bg-slate-100"}`}
                              style={isActive ? { background: cfg.color + "20" } : undefined}
                            >
                              <Icon className="w-5 h-5" style={{ color: isActive ? cfg.color : "#94a3b8" }} />
                            </div>
                            <span className="text-xs font-bold" style={{ color: isActive ? cfg.color : "#64748b" }}>{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                      <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> Color</span>
                    </label>
                    <div className="flex gap-2.5 flex-wrap">
                      {TASK_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setFormColor(c)}
                          className={`w-9 h-9 rounded-xl transition-all relative ${formColor === c ? "ring-2 ring-offset-2 scale-110 shadow-md" : "hover:scale-105 hover:shadow-sm"}`}
                          style={{ background: c, ringColor: c }}
                        >
                          {formColor === c && <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-sm" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview card */}
                  <div className="mt-2 p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preview</div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full" style={{ background: formColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{formTitle || "Task name"}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {formAssignee && (
                            <span className="text-[10px] text-slate-500">{members.find(m => m.user.id === formAssignee)?.user.name}</span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(formStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} → {new Date(formEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold" style={{ background: PRIORITY_CONFIG[formPriority]?.bg, color: PRIORITY_CONFIG[formPriority]?.color }}>
                        {(() => { const P = PRIORITY_CONFIG[formPriority]?.icon || ArrowRight; return <P className="w-3 h-3" />; })()}
                        {PRIORITY_CONFIG[formPriority]?.label}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formError && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}
            </div>

            {/* Footer navigation */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                onClick={() => { if (wizardStep === 0) { setShowForm(false); resetForm(); setFormError(""); } else setWizardStep(s => s - 1); }}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-xl hover:bg-white transition-all"
              >
                {wizardStep === 0 ? "Cancel" : "Back"}
              </button>
              <div className="flex items-center gap-1.5">
                {WIZARD_STEPS.map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: i === wizardStep ? accentColor : i < wizardStep ? accentColor + "60" : "#cbd5e1" }} />
                ))}
              </div>
              {wizardStep < 2 ? (
                <button
                  onClick={() => setWizardStep(s => s + 1)}
                  disabled={!canAdvanceStep(wizardStep)}
                  className="text-sm font-bold text-white rounded-xl px-5 py-2.5 transition-all hover:opacity-90 disabled:opacity-40 shadow-sm flex items-center gap-1.5"
                  style={{ background: accentColor }}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleCreateTask}
                  disabled={!formTitle.trim() || creating}
                  className="text-sm font-bold text-white rounded-xl px-5 py-2.5 transition-all hover:opacity-90 disabled:opacity-40 shadow-sm flex items-center gap-1.5"
                  style={{ background: accentColor }}
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Create Task
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 && !showForm ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: lightColor }}>
            <Calendar className="w-7 h-7" style={{ color: accentColor }} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No tasks yet</h3>
          <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">Create your first task to start tracking work with a beautiful timeline view.</p>
          {isMember && (
            <button
              onClick={() => setShowForm(true)}
              className="text-[13px] font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-90 shadow-sm text-white"
              style={{ background: accentColor }}
            >
              <span className="flex items-center gap-1.5"><Plus className="w-4 h-4" /> Create First Task</span>
            </button>
          )}
        </div>
      ) : tasks.length > 0 && (
        <div className="flex gap-4">
          {/* Main Gantt area */}
          <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${selectedTask ? "flex-1 min-w-0" : "w-full"} transition-all`}>
            {/* Timeline header */}
            <div className="border-b border-slate-200 overflow-hidden">
              <div className="flex">
                <div className="w-64 shrink-0 border-r border-slate-200 px-4 py-2.5 bg-gradient-to-b from-slate-50 to-white">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Task</span>
                </div>
                <div className="flex-1 min-w-0 overflow-x-auto">
                  <div className="min-w-[500px]">
                    {/* Month row */}
                    <div className="flex border-b border-slate-100">
                      {(() => {
                        const months: { label: string; span: number }[] = [];
                        let currentMonth = "";
                        days.forEach(d => {
                          const label = d.toLocaleString("default", { month: "long", year: "numeric" });
                          if (label !== currentMonth) {
                            months.push({ label, span: 1 });
                            currentMonth = label;
                          } else {
                            months[months.length - 1].span++;
                          }
                        });
                        return months.map((m, i) => (
                          <div
                            key={i}
                            className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1.5 border-r border-slate-50 last:border-r-0"
                            style={{ width: `${(m.span / totalDays) * 100}%` }}
                          >
                            {m.label}
                          </div>
                        ));
                      })()}
                    </div>
                    {/* Days row */}
                    <div className="flex">
                      {days.map((d, i) => {
                        const isToday = d.getTime() === today.getTime();
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        return (
                          <div
                            key={i}
                            className={`text-center py-1 ${isWeekend ? "bg-slate-50/60" : ""}`}
                            style={{ width: `${dayWidth}%` }}
                          >
                            <div className={`text-[8px] font-bold uppercase ${isToday ? "" : "text-slate-300"}`} style={isToday ? { color: accentColor } : undefined}>
                              {["S", "M", "T", "W", "T", "F", "S"][d.getDay()]}
                            </div>
                            <div
                              className={`text-[10px] font-bold mx-auto w-5 h-5 flex items-center justify-center rounded-full leading-none ${
                                isToday ? "text-white shadow-sm" : isWeekend ? "text-slate-300" : "text-slate-500"
                              }`}
                              style={isToday ? { background: accentColor } : undefined}
                            >
                              {d.getDate()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task rows */}
            <div>
              {tasks.map((task, taskIdx) => {
                const barStyle = getBarStyle(task);
                const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const StatusIcon = statusCfg.icon;
                const PriorityIcon = priorityCfg.icon;
                const taskColor = task.color || accentColor;
                const isSelected = selectedTask === task.id;

                return (
                  <div
                    key={task.id}
                    className={`flex transition-colors cursor-pointer ${
                      isSelected ? "bg-blue-50/50" : taskIdx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    } hover:bg-blue-50/30`}
                    onClick={() => setSelectedTask(isSelected ? null : task.id)}
                  >
                    {/* Task info column */}
                    <div className="w-64 shrink-0 border-r border-slate-100 px-3 py-2.5 flex items-center gap-2.5 group">
                      <button
                        onClick={e => { e.stopPropagation(); cycleStatus(task); }}
                        className="shrink-0 p-0.5 rounded-md hover:bg-white hover:shadow-sm transition-all"
                        title={`${statusCfg.label} — click to change`}
                      >
                        <StatusIcon className="w-4 h-4" style={{ color: statusCfg.color }} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[13px] font-semibold truncate ${
                            task.status === "done" ? "line-through text-slate-400" : "text-slate-900"
                          }`}>
                            {task.title}
                          </span>
                          {task.url && (
                            <a
                              href={task.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="shrink-0 p-0.5 rounded text-slate-300 hover:text-blue-500 transition-colors"
                              title={task.url}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <PriorityIcon className="w-2.5 h-2.5 shrink-0" style={{ color: priorityCfg.color }} />
                          {task.assignee ? (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
                                style={{ background: taskColor }}
                              >
                                {getInitials(task.assignee.name)}
                              </div>
                              <span className="text-[10px] text-slate-400 truncate">{task.assignee.name.split(" ")[0]}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">Unassigned</span>
                          )}
                          {task.description && (
                            <span className="text-[10px] text-slate-300 shrink-0" title="Has details">···</span>
                          )}
                        </div>
                      </div>
                      {isMember && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Gantt bar */}
                    <div className="flex-1 min-w-0 overflow-x-auto" ref={ganttRef}>
                      <div className="min-w-[500px] relative h-[44px]">
                        {/* Weekend shading */}
                        {days.map((d, i) => {
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                          if (!isWeekend) return null;
                          return (
                            <div
                              key={`weekend-${i}`}
                              className="absolute top-0 bottom-0 bg-slate-50/40"
                              style={{ left: `${(i / totalDays) * 100}%`, width: `${dayWidth}%` }}
                            />
                          );
                        })}
                        {/* Week grid lines */}
                        {weeks.map((_, wi) => (
                          <div
                            key={wi}
                            className="absolute top-0 bottom-0 border-r border-slate-100/60"
                            style={{ left: `${((wi + 1) * 7 / totalDays) * 100}%` }}
                          />
                        ))}
                        {/* Today line */}
                        {(() => {
                          const todayOffset = daysBetween(timelineStart, today);
                          if (todayOffset >= 0 && todayOffset < totalDays) {
                            return (
                              <div
                                className="absolute top-0 bottom-0 w-px z-10"
                                style={{ left: `${((todayOffset + 0.5) / totalDays) * 100}%`, background: accentColor + "60" }}
                              />
                            );
                          }
                          return null;
                        })()}
                        {/* Task bar */}
                        {barStyle && (
                          <div
                            className={`absolute top-[10px] h-[24px] rounded-lg transition-shadow select-none ${
                              dragTask === task.id ? "shadow-lg z-20 opacity-90" : "hover:shadow-md"
                            }`}
                            style={{
                              left: barStyle.left,
                              width: barStyle.width,
                              background: `linear-gradient(135deg, ${taskColor}, ${taskColor}dd)`,
                              boxShadow: isSelected ? `0 0 0 2px ${taskColor}44` : undefined,
                            }}
                            onClick={e => e.stopPropagation()}
                            onMouseDown={e => handleBarMouseDown(e, task.id, "move")}
                          >
                            {/* Progress fill */}
                            {task.progress > 0 && task.progress < 100 && (
                              <div
                                className="absolute inset-y-0 left-0 rounded-l-lg bg-white/20"
                                style={{ width: `${task.progress}%` }}
                              />
                            )}
                            {/* Done overlay */}
                            {task.status === "done" && (
                              <div className="absolute inset-0 rounded-lg bg-white/20 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                              </div>
                            )}
                            {/* Label */}
                            <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                              <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">
                                {task.status !== "done" ? task.title : ""}
                              </span>
                            </div>
                            {/* Resize handle */}
                            {isMember && (
                              <div
                                className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize rounded-r-lg hover:bg-white/20 transition-colors"
                                onMouseDown={e => handleBarMouseDown(e, task.id, "resize-end")}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with legend */}
            <div className="border-t border-slate-100 px-4 py-2.5 flex flex-wrap items-center gap-4 bg-gradient-to-b from-white to-slate-50/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} className="flex items-center gap-1">
                    <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                    <span className="text-[10px] font-medium text-slate-500">{cfg.label}</span>
                  </div>
                );
              })}
              <div className="border-l border-slate-200 h-3" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority:</span>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} className="flex items-center gap-1">
                    <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                    <span className="text-[10px] font-medium text-slate-500">{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task detail sidebar */}
          {selectedTask && selectedTaskData && (
            <div className="w-80 shrink-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-100" style={{ background: `linear-gradient(135deg, ${(selectedTaskData.color || accentColor)}08, ${(selectedTaskData.color || accentColor)}15)` }}>
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: (selectedTaskData.color || accentColor) + "20" }}
                  >
                    {(() => {
                      const cfg = STATUS_CONFIG[selectedTaskData.status] || STATUS_CONFIG.todo;
                      const Icon = cfg.icon;
                      return <Icon className="w-4 h-4" style={{ color: cfg.color }} />;
                    })()}
                  </div>
                  <button onClick={() => setSelectedTask(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {editField === "title" ? (
                  <input
                    defaultValue={selectedTaskData.title}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleUpdateTask(selectedTaskData.id, { title: (e.target as HTMLInputElement).value });
                      if (e.key === "Escape") setEditField(null);
                    }}
                    onBlur={e => handleUpdateTask(selectedTaskData.id, { title: e.target.value })}
                    className="w-full text-base font-bold text-slate-900 px-2 py-1 border border-blue-300 rounded-lg outline-none"
                    autoFocus
                  />
                ) : (
                  <h3
                    className={`text-base font-bold cursor-pointer hover:text-blue-600 transition-colors ${
                      selectedTaskData.status === "done" ? "line-through text-slate-400" : "text-slate-900"
                    }`}
                    onClick={() => isMember && setEditField("title")}
                  >
                    {selectedTaskData.title}
                  </h3>
                )}
              </div>

              <div className="p-4 space-y-4 overflow-y-auto max-h-[500px]">
                {/* Description */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Details</label>
                  {editField === "description" ? (
                    <div>
                      <textarea
                        defaultValue={selectedTaskData.description}
                        onBlur={e => handleUpdateTask(selectedTaskData.id, { description: e.target.value })}
                        onKeyDown={e => { if (e.key === "Escape") setEditField(null); }}
                        className="w-full text-sm text-slate-700 px-3 py-2 border border-blue-300 rounded-lg outline-none resize-none"
                        rows={4}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div
                      className={`text-sm rounded-lg px-3 py-2 min-h-[60px] transition-colors ${
                        selectedTaskData.description
                          ? "text-slate-700 bg-slate-50 leading-relaxed"
                          : "text-slate-300 italic bg-slate-50/50 cursor-pointer hover:bg-slate-50"
                      }`}
                      onClick={() => isMember && setEditField("description")}
                    >
                      {selectedTaskData.description || "Click to add details..."}
                    </div>
                  )}
                </div>

                {/* URL */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> External Link
                  </label>
                  {editField === "url" ? (
                    <input
                      defaultValue={selectedTaskData.url || ""}
                      placeholder="https://..."
                      onBlur={e => handleUpdateTask(selectedTaskData.id, { url: e.target.value || null })}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleUpdateTask(selectedTaskData.id, { url: (e.target as HTMLInputElement).value || null });
                        if (e.key === "Escape") setEditField(null);
                      }}
                      className="w-full text-sm px-3 py-2 border border-blue-300 rounded-lg outline-none"
                      autoFocus
                    />
                  ) : selectedTaskData.url ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={selectedTaskData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-2 transition-colors group"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate font-medium">{getDomainFromUrl(selectedTaskData.url)}</span>
                      </a>
                      {isMember && (
                        <button onClick={() => setEditField("url")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      className="text-sm text-slate-300 italic bg-slate-50/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => isMember && setEditField("url")}
                    >
                      Click to add a link...
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Status</label>
                  <div className="flex gap-1.5">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      const isActive = selectedTaskData.status === key;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            const progress = key === "done" ? 100 : key === "review" ? 75 : key === "in-progress" ? 25 : 0;
                            handleUpdateTask(selectedTaskData.id, { status: key, progress });
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                            isActive ? "shadow-sm ring-1" : "hover:bg-slate-50"
                          }`}
                          style={isActive ? { background: cfg.bg, color: cfg.color, ringColor: cfg.color + "40" } : { color: "#94a3b8" }}
                          disabled={!isMember}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Priority</label>
                  <div className="flex gap-1.5">
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      const isActive = selectedTaskData.priority === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleUpdateTask(selectedTaskData.id, { priority: key })}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                            isActive ? "shadow-sm ring-1" : "hover:bg-slate-50"
                          }`}
                          style={isActive ? { background: cfg.bg, color: cfg.color, ringColor: cfg.color + "40" } : { color: "#94a3b8" }}
                          disabled={!isMember}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Assignee</label>
                  {isMember ? (
                    <select
                      value={selectedTaskData.assignee?.id || ""}
                      onChange={e => handleUpdateTask(selectedTaskData.id, { assigneeId: e.target.value || null })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => (
                        <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-slate-600">
                      {selectedTaskData.assignee?.name || <span className="text-slate-300 italic">Unassigned</span>}
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Timeline</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Start</span>
                      {isMember ? (
                        <input
                          type="date"
                          value={selectedTaskData.startDate.split("T")[0]}
                          onChange={e => handleUpdateTask(selectedTaskData.id, { startDate: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400"
                        />
                      ) : (
                        <span className="text-xs text-slate-600">{new Date(selectedTaskData.startDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">End</span>
                      {isMember ? (
                        <input
                          type="date"
                          value={selectedTaskData.endDate.split("T")[0]}
                          onChange={e => handleUpdateTask(selectedTaskData.id, { endDate: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400"
                        />
                      ) : (
                        <span className="text-xs text-slate-600">{new Date(selectedTaskData.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    {daysBetween(new Date(selectedTaskData.startDate), new Date(selectedTaskData.endDate)) + 1} days
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Progress</label>
                    <span className="text-[11px] font-bold" style={{ color: selectedTaskData.color || accentColor }}>{selectedTaskData.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${selectedTaskData.progress}%`,
                        background: `linear-gradient(90deg, ${selectedTaskData.color || accentColor}, ${selectedTaskData.color || accentColor}cc)`,
                      }}
                    />
                  </div>
                  {isMember && (
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={selectedTaskData.progress}
                      onChange={e => handleUpdateTask(selectedTaskData.id, { progress: parseInt(e.target.value) })}
                      className="w-full mt-1 accent-blue-500 h-1"
                    />
                  )}
                </div>

                {/* Color */}
                {isMember && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Color</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {TASK_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => handleUpdateTask(selectedTaskData.id, { color: c })}
                          className={`w-6 h-6 rounded-lg transition-all ${
                            (selectedTaskData.color || accentColor) === c ? "ring-2 ring-offset-1 scale-110" : "hover:scale-105"
                          }`}
                          style={{ background: c, ringColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete */}
                {isMember && (
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleDeleteTask(selectedTaskData.id)}
                      className="w-full text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-3 py-2 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
