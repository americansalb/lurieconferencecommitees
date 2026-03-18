"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart3, Circle, Clock, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  endDate: string;
  color: string | null;
  assignee: { id: string; name: string } | null;
  committee: { id: string; name: string; slug: string; color: string };
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Circle; color: string; bg: string }> = {
  todo: { label: "To Do", icon: Circle, color: "#94a3b8", bg: "#f1f5f9" },
  "in-progress": { label: "In Progress", icon: Clock, color: "#3b82f6", bg: "#eff6ff" },
  review: { label: "Review", icon: AlertCircle, color: "#f59e0b", bg: "#fffbeb" },
  done: { label: "Done", icon: CheckCircle2, color: "#10b981", bg: "#ecfdf5" },
};

const SLUG_COLORS: Record<string, string> = {
  "logistics-venue": "#3b82f6",
  "technology-virtual": "#06b6d4",
  "marketing-communications": "#f59e0b",
  "sponsorship-fundraising": "#8b5cf6",
  "volunteer-participant": "#10b981",
  "executive-planning": "#DC2626",
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

interface DashboardTimelineProps {
  userId: string;
}

export default function DashboardTimeline({ userId }: DashboardTimelineProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [viewOffset, setViewOffset] = useState(0);

  useEffect(() => {
    fetch("/api/tasks")
      .then(r => r.ok ? r.json() : [])
      .then(data => setTasks(data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredTasks = useMemo(() => {
    const base = filter === "mine" ? tasks.filter(t => t.assignee?.id === userId) : tasks;
    return base.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [tasks, filter, userId]);

  // Timeline: 8 weeks centered around today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const TOTAL_DAYS = 56; // 8 weeks
  const timelineStart = addDays(today, -14 + viewOffset * 7); // start 2 weeks ago
  const timelineEnd = addDays(timelineStart, TOTAL_DAYS);

  // Generate week columns
  const weeks: { start: Date; end: Date; label: string }[] = [];
  for (let i = 0; i < 8; i++) {
    const wStart = addDays(timelineStart, i * 7);
    const wEnd = addDays(wStart, 6);
    weeks.push({
      start: wStart,
      end: wEnd,
      label: wStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }

  // Tasks visible in the timeline window
  const visibleTasks = filteredTasks.filter(t => {
    const ts = new Date(t.startDate);
    const te = new Date(t.endDate);
    return te >= timelineStart && ts <= timelineEnd;
  });

  // Status summary
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { todo: 0, "in-progress": 0, review: 0, done: 0 };
    filteredTasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return counts;
  }, [filteredTasks]);

  function getBarStyle(task: Task) {
    const ts = new Date(task.startDate);
    const te = new Date(task.endDate);
    const clampStart = ts < timelineStart ? timelineStart : ts;
    const clampEnd = te > timelineEnd ? timelineEnd : te;
    const leftDays = daysBetween(timelineStart, clampStart);
    const widthDays = daysBetween(clampStart, clampEnd) + 1;
    const leftPct = (leftDays / TOTAL_DAYS) * 100;
    const widthPct = (widthDays / TOTAL_DAYS) * 100;
    return { left: `${leftPct}%`, width: `${Math.max(widthPct, 1.5)}%` };
  }

  // Today line position
  const todayOffset = daysBetween(timelineStart, today);
  const todayPct = (todayOffset / TOTAL_DAYS) * 100;
  const showTodayLine = todayPct >= 0 && todayPct <= 100;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-[18px] h-[18px] text-slate-400" /> Task Timeline
        </h2>
        <div className="flex items-center gap-3">
          {/* Status summary pills */}
          <div className="hidden sm:flex items-center gap-2">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = statusCounts[key] || 0;
              if (!count) return null;
              const Icon = cfg.icon;
              return (
                <span key={key} className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                  <Icon className="w-3 h-3" /> {count}
                </span>
              );
            })}
          </div>
          {/* Filter toggle */}
          <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setFilter("all")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setFilter("mine")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                filter === "mine" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              My Tasks
            </button>
          </div>
          {/* Timeline navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewOffset(v => v - 2)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewOffset(0)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setViewOffset(v => v + 2)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-16 text-center">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 mt-2">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <BarChart3 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            {filter === "mine" ? "No tasks assigned to you yet" : "No tasks created yet"}
          </p>
          <p className="text-xs text-slate-300 mt-1">Tasks can be added from individual committee pages</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Week header */}
          <div className="relative border-b border-slate-100 min-w-[700px]">
            <div className="flex">
              <div className="w-[220px] shrink-0 px-4 py-2 border-r border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task</span>
              </div>
              <div className="flex-1 relative">
                <div className="flex">
                  {weeks.map((w, i) => (
                    <div key={i} className="flex-1 text-center py-2 border-r border-slate-50 last:border-r-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Task rows */}
          <div className="relative min-w-[700px]">
            {visibleTasks.map(task => {
              const barStyle = getBarStyle(task);
              const barColor = task.color || SLUG_COLORS[task.committee?.slug] || task.committee?.color || "#3b82f6";
              const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
              const StatusIcon = statusCfg.icon;

              return (
                <div key={task.id} className="flex items-center border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  {/* Task name column */}
                  <div className="w-[220px] shrink-0 px-4 py-2.5 border-r border-slate-100 flex items-center gap-2.5 min-h-[44px]">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={{ background: statusCfg.bg }}
                      title={statusCfg.label}
                    >
                      <StatusIcon className="w-3 h-3" style={{ color: statusCfg.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 truncate">{task.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{task.committee?.name}</div>
                    </div>
                    {task.assignee && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                        style={{ background: barColor + "20", color: barColor }}
                        title={task.assignee.name}
                      >
                        {getInitials(task.assignee.name)}
                      </div>
                    )}
                  </div>

                  {/* Gantt bar area */}
                  <div className="flex-1 relative h-[44px]">
                    {/* Week grid lines */}
                    {weeks.map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-r border-slate-50"
                        style={{ left: `${((i + 1) / 8) * 100}%` }}
                      />
                    ))}

                    {/* Today line */}
                    {showTodayLine && (
                      <div
                        className="absolute top-0 bottom-0 w-px z-10"
                        style={{ left: `${todayPct}%`, background: "#ef4444" }}
                      >
                        <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500" />
                      </div>
                    )}

                    {/* Task bar */}
                    <div className="absolute top-1/2 -translate-y-1/2 h-[22px] flex items-center" style={barStyle}>
                      <div
                        className="w-full h-full rounded-md relative overflow-hidden cursor-default group/bar"
                        style={{ background: barColor + "22", border: `1.5px solid ${barColor}44` }}
                      >
                        {/* Progress fill */}
                        {task.progress > 0 && (
                          <div
                            className="absolute inset-y-0 left-0 rounded-l-md"
                            style={{ width: `${task.progress}%`, background: barColor + "30" }}
                          />
                        )}
                        {/* Task title on bar (only if wide enough) */}
                        <div
                          className="relative z-10 px-2 h-full flex items-center"
                        >
                          <span
                            className="text-[10px] font-semibold truncate"
                            style={{ color: barColor }}
                          >
                            {task.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Note if tasks exist but none are in visible window */}
            {visibleTasks.length === 0 && filteredTasks.length > 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-slate-400">No tasks in this date range. Use the arrows to navigate.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
