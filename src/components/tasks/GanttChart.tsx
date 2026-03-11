"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Plus, X, Trash2, ChevronLeft, ChevronRight,
  GripVertical, Check, Circle, CheckCircle2, Clock,
  AlertCircle, ArrowUp, ArrowRight, ArrowDown,
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

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Circle; color: string }> = {
  todo: { label: "To Do", icon: Circle, color: "#94a3b8" },
  "in-progress": { label: "In Progress", icon: Clock, color: "#3b82f6" },
  review: { label: "Review", icon: AlertCircle, color: "#f59e0b" },
  done: { label: "Done", icon: CheckCircle2, color: "#10b981" },
};

const PRIORITY_CONFIG: Record<string, { label: string; icon: typeof ArrowUp; color: string }> = {
  low: { label: "Low", icon: ArrowDown, color: "#94a3b8" },
  medium: { label: "Medium", icon: ArrowRight, color: "#f59e0b" },
  high: { label: "High", icon: ArrowUp, color: "#ef4444" },
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

export default function GanttChart({ committeeId, accentColor, lightColor, members, isMember }: GanttChartProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [viewOffset, setViewOffset] = useState(0); // weeks offset from current week
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [dragType, setDragType] = useState<"move" | "resize-end" | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOrigStart, setDragOrigStart] = useState("");
  const [dragOrigEnd, setDragOrigEnd] = useState("");
  const ganttRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStart, setFormStart] = useState(formatDate(new Date()));
  const [formEnd, setFormEnd] = useState(formatDate(addDays(new Date(), 7)));
  const [formPriority, setFormPriority] = useState("medium");
  const [formColor, setFormColor] = useState(TASK_COLORS[0]);
  const [formAssignee, setFormAssignee] = useState("");

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

  // Timeline calculation - show 6 weeks
  const weeksToShow = 6;
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const timelineStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay() + viewOffset * 7); // Start of current week + offset
    return d;
  }, [today, viewOffset]);

  const totalDays = weeksToShow * 7;
  const timelineEnd = addDays(timelineStart, totalDays);

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

  async function handleCreateTask() {
    if (!formTitle.trim() || !formStart || !formEnd) return;
    await fetch("/api/tasks", {
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
        assigneeId: formAssignee || null,
      }),
    });
    setFormTitle(""); setFormDesc(""); setFormPriority("medium"); setFormAssignee("");
    setFormStart(formatDate(new Date())); setFormEnd(formatDate(addDays(new Date(), 7)));
    setShowForm(false);
    fetchTasks();
  }

  async function handleUpdateTask(taskId: string, updates: Partial<Task>) {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, ...updates }),
    });
    fetchTasks();
    setEditingTask(null);
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });
    fetchTasks();
  }

  // Drag handlers for moving/resizing task bars
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

  async function cycleStatus(task: Task) {
    const order = ["todo", "in-progress", "review", "done"];
    const idx = order.indexOf(task.status);
    const next = order[(idx + 1) % order.length];
    const progress = next === "done" ? 100 : next === "review" ? 75 : next === "in-progress" ? 25 : 0;
    await handleUpdateTask(task.id, { status: next, progress });
  }

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <GripVertical className="w-4 h-4 text-slate-400" /> Tasks &amp; Timeline
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewOffset(v => v - weeksToShow)}
              className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-500"
              title="Previous weeks"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewOffset(0)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600"
            >
              Today
            </button>
            <button
              onClick={() => setViewOffset(v => v + weeksToShow)}
              className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-500"
              title="Next weeks"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {isMember && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-[13px] font-bold text-white rounded-lg px-3 py-1.5 flex items-center gap-1 transition-all hover:opacity-90"
              style={{ background: accentColor }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* New task form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm space-y-3">
          <input
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="Task title"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
          />
          <input
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Start Date</label>
              <input
                type="date"
                value={formStart}
                onChange={e => setFormStart(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">End Date</label>
              <input
                type="date"
                value={formEnd}
                onChange={e => setFormEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Priority</label>
              <select
                value={formPriority}
                onChange={e => setFormPriority(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-white"
              >
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Assign To</label>
              <select
                value={formAssignee}
                onChange={e => setFormAssignee(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Color</label>
            <div className="flex gap-1.5">
              {TASK_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setFormColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${formColor === c ? "ring-2 ring-offset-2 scale-110" : "hover:scale-105"}`}
                  style={{ background: c, ringColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5">Cancel</button>
            <button
              onClick={handleCreateTask}
              disabled={!formTitle.trim()}
              className="text-sm font-bold text-white rounded-lg px-4 py-1.5 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: accentColor }}
            >
              Create Task
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 && !showForm ? (
        <div className="bg-white border border-slate-100 rounded-xl p-10 text-center shadow-sm">
          <GripVertical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400 mb-3">No tasks yet. Create your first task to get started.</p>
          {isMember && (
            <button
              onClick={() => setShowForm(true)}
              className="text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ color: accentColor, background: lightColor }}
            >
              Create a task
            </button>
          )}
        </div>
      ) : tasks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Gantt timeline header */}
          <div className="border-b border-slate-200 overflow-hidden">
            <div className="flex">
              {/* Task list header */}
              <div className="w-72 shrink-0 border-r border-slate-200 px-3 py-2 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Task</span>
              </div>
              {/* Timeline header */}
              <div className="flex-1 min-w-0 overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Month labels */}
                  <div className="flex border-b border-slate-100">
                    {(() => {
                      const months: { label: string; span: number }[] = [];
                      let currentMonth = "";
                      days.forEach(d => {
                        const label = d.toLocaleString("default", { month: "short", year: "numeric" });
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
                          className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center py-1.5 border-r border-slate-50 last:border-r-0"
                          style={{ width: `${(m.span / totalDays) * 100}%` }}
                        >
                          {m.label}
                        </div>
                      ));
                    })()}
                  </div>
                  {/* Day labels */}
                  <div className="flex">
                    {days.map((d, i) => {
                      const isToday = d.getTime() === today.getTime();
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <div
                          key={i}
                          className={`text-center py-1 border-r border-slate-50 last:border-r-0 ${isWeekend ? "bg-slate-50/50" : ""}`}
                          style={{ width: `${dayWidth}%` }}
                        >
                          <div className={`text-[9px] font-semibold ${isToday ? "text-white" : "text-slate-400"}`}>
                            {["S", "M", "T", "W", "T", "F", "S"][d.getDay()]}
                          </div>
                          <div
                            className={`text-[10px] font-bold mx-auto w-5 h-5 flex items-center justify-center rounded-full ${
                              isToday ? "text-white" : "text-slate-600"
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
          <div className="divide-y divide-slate-50">
            {tasks.map(task => {
              const barStyle = getBarStyle(task);
              const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
              const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const StatusIcon = statusCfg.icon;
              const PriorityIcon = priorityCfg.icon;
              const taskColor = task.color || accentColor;
              const isEditing = editingTask === task.id;

              return (
                <div key={task.id} className="flex group hover:bg-slate-50/50 transition-colors">
                  {/* Task info */}
                  <div className="w-72 shrink-0 border-r border-slate-100 px-3 py-2.5 flex items-center gap-2">
                    <button
                      onClick={() => cycleStatus(task)}
                      className="shrink-0 p-0.5 rounded hover:bg-slate-100 transition-colors"
                      title={`Status: ${statusCfg.label} (click to change)`}
                    >
                      <StatusIcon className="w-4 h-4" style={{ color: statusCfg.color }} />
                    </button>
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <input
                            defaultValue={task.title}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                handleUpdateTask(task.id, { title: (e.target as HTMLInputElement).value });
                              }
                              if (e.key === "Escape") setEditingTask(null);
                            }}
                            className="w-full px-1.5 py-0.5 text-xs border border-blue-300 rounded outline-none"
                            autoFocus
                          />
                          <button onClick={() => setEditingTask(null)} className="p-0.5 text-slate-400 hover:text-slate-600">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`text-xs font-semibold truncate cursor-pointer hover:text-blue-600 ${
                            task.status === "done" ? "line-through text-slate-400" : "text-slate-900"
                          }`}
                          onClick={() => isMember && setEditingTask(task.id)}
                        >
                          {task.title}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <PriorityIcon className="w-2.5 h-2.5" style={{ color: priorityCfg.color }} />
                        {task.assignee && (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
                            style={{ background: taskColor }}
                            title={task.assignee.name}
                          >
                            {getInitials(task.assignee.name)}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 truncate">
                          {new Date(task.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" - "}
                          {new Date(task.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    {isMember && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Gantt bar area */}
                  <div className="flex-1 min-w-0 overflow-x-auto" ref={ganttRef}>
                    <div className="min-w-[600px] relative h-10">
                      {/* Grid lines */}
                      {weeks.map((w, wi) => (
                        <div
                          key={wi}
                          className="absolute top-0 bottom-0 border-r border-slate-100"
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
                              style={{ left: `${(todayOffset / totalDays) * 100}%`, background: accentColor }}
                            >
                              <div className="w-2 h-2 rounded-full -ml-[3px] -mt-0.5" style={{ background: accentColor }} />
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {/* Task bar */}
                      {barStyle && (
                        <div
                          className={`absolute top-2 h-6 rounded-md shadow-sm transition-shadow ${
                            dragTask === task.id ? "shadow-md z-20" : "hover:shadow-md cursor-pointer"
                          }`}
                          style={{
                            left: barStyle.left,
                            width: barStyle.width,
                            background: `linear-gradient(135deg, ${taskColor}, ${taskColor}cc)`,
                          }}
                          onMouseDown={e => handleBarMouseDown(e, task.id, "move")}
                        >
                          {/* Progress fill */}
                          <div
                            className="absolute inset-0 rounded-md opacity-30"
                            style={{
                              width: `${task.progress}%`,
                              background: "rgba(255,255,255,0.4)",
                            }}
                          />
                          {/* Label */}
                          <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                            <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">
                              {task.title}
                            </span>
                          </div>
                          {/* Resize handle */}
                          {isMember && (
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-md"
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

          {/* Legend */}
          <div className="border-t border-slate-100 px-3 py-2 flex flex-wrap items-center gap-3 bg-slate-50/50">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={key} className="flex items-center gap-1">
                  <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                  <span className="text-[10px] text-slate-500">{cfg.label}</span>
                </div>
              );
            })}
            <div className="border-l border-slate-200 h-3 mx-1" />
            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={key} className="flex items-center gap-1">
                  <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                  <span className="text-[10px] text-slate-500">{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
