"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Bell, Smartphone, Trash2, Save, Clock } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import type { NotificationSettings, DiscussionScope } from "@/lib/notification-prefs";

type Device = {
  id: string;
  platform: string;
  deviceName: string | null;
  appVersion: string | null;
  locale: string | null;
  timezone: string | null;
  lastSeenAt: string;
  createdAt: string;
};

const LEAD_TIME_OPTIONS: { label: string; minutes: number }[] = [
  { label: "5 min", minutes: 5 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "1 day", minutes: 1440 },
  { label: "2 days", minutes: 2880 },
  { label: "1 week", minutes: 10080 },
];

const DAYS: { key: string; label: string }[] = [
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
];

const SCOPE_LABELS: Record<DiscussionScope, string> = {
  all: "All posts in my committees",
  subscribed: "Threads I'm in or follow",
  mentions: "Only when I'm @mentioned",
  none: "Off",
};

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/notification-preferences").then((r) => r.json()),
      fetch("/api/devices").then((r) => r.json()),
    ])
      .then(([prefs, devs]) => {
        setSettings(prefs.settings);
        setDevices(Array.isArray(devs) ? devs : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    const res = await fetch("/api/notification-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) {
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2200);
    }
  }

  async function removeDevice(id: string) {
    if (!confirm("Remove this device? It will stop receiving push notifications.")) return;
    await fetch(`/api/devices/${id}`, { method: "DELETE" });
    load();
  }

  async function sendTest() {
    const res = await fetch("/api/notifications/test", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (data?.delivered > 0) {
      alert(`Test sent. ${data.delivered} device(s) received it.`);
    } else if (data?.reason === "no devices") {
      alert("No devices registered. Sign in on the iOS or Android app first.");
    } else {
      alert("Test was skipped (check preferences / quiet hours).");
    }
  }

  function toggleLeadTime(channel: "events" | "tasks", minutes: number) {
    if (!settings) return;
    const arr = settings[channel].leadTimesMinutes;
    const next = arr.includes(minutes) ? arr.filter((m) => m !== minutes) : [...arr, minutes].sort((a, b) => a - b);
    setSettings({ ...settings, [channel]: { ...settings[channel], leadTimesMinutes: next } });
  }

  function toggleDay(key: string) {
    if (!settings) return;
    const arr = settings.mutedDays;
    const next = arr.includes(key) ? arr.filter((d) => d !== key) : [...arr, key];
    setSettings({ ...settings, mutedDays: next });
  }

  if (status !== "authenticated" || loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Notifications</h1>
                <p className="text-xs text-slate-500">Push reminders for committee activity</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {savedAt && <span className="text-xs font-semibold text-emerald-600">Saved</span>}
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg px-3 py-2"
                >
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            <Section title="Devices" subtitle="Phones registered to receive push from this account">
              {devices.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">
                  No devices yet. When you sign in on the iOS or Android app, it will appear here.
                </p>
              ) : (
                <>
                <button
                  onClick={sendTest}
                  className="mb-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5"
                >
                  Send test notification
                </button>
                <ul className="divide-y divide-slate-100">
                  {devices.map((d) => (
                    <li key={d.id} className="py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          {d.deviceName || d.platform.toUpperCase()}{" "}
                          <span className="text-[11px] font-semibold uppercase text-slate-400 ml-1">{d.platform}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Last seen {new Date(d.lastSeenAt).toLocaleString()}
                        </div>
                      </div>
                      <button onClick={() => removeDevice(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                </>
              )}
            </Section>

            <Section title="Committee events" subtitle="Get a heads-up before meetings start">
              <Toggle
                label="Notify me about upcoming events"
                checked={settings.events.enabled}
                onChange={(v) => setSettings({ ...settings, events: { ...settings.events, enabled: v } })}
              />
              {settings.events.enabled && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Remind me</div>
                  <div className="flex flex-wrap gap-2">
                    {LEAD_TIME_OPTIONS.map((opt) => (
                      <Chip
                        key={opt.minutes}
                        active={settings.events.leadTimesMinutes.includes(opt.minutes)}
                        onClick={() => toggleLeadTime("events", opt.minutes)}
                        label={opt.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Task deadlines" subtitle="Reminders before a task's due date">
              <Toggle
                label="Notify me about task deadlines"
                checked={settings.tasks.enabled}
                onChange={(v) => setSettings({ ...settings, tasks: { ...settings.tasks, enabled: v } })}
              />
              {settings.tasks.enabled && (
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Remind me</div>
                    <div className="flex flex-wrap gap-2">
                      {LEAD_TIME_OPTIONS.map((opt) => (
                        <Chip
                          key={opt.minutes}
                          active={settings.tasks.leadTimesMinutes.includes(opt.minutes)}
                          onClick={() => toggleLeadTime("tasks", opt.minutes)}
                          label={opt.label}
                        />
                      ))}
                    </div>
                  </div>
                  <Toggle
                    label="Only tasks assigned to me"
                    checked={settings.tasks.onlyMyTasks}
                    onChange={(v) => setSettings({ ...settings, tasks: { ...settings.tasks, onlyMyTasks: v } })}
                  />
                  <Toggle
                    label="Notify when a task is assigned to me"
                    checked={settings.tasks.onAssigned}
                    onChange={(v) => setSettings({ ...settings, tasks: { ...settings.tasks, onAssigned: v } })}
                  />
                  <Toggle
                    label="Notify when a task's status changes"
                    checked={settings.tasks.onStatusChange}
                    onChange={(v) => setSettings({ ...settings, tasks: { ...settings.tasks, onStatusChange: v } })}
                  />
                </div>
              )}
            </Section>

            <Section title="Discussions" subtitle="When committee members post replies">
              <Toggle
                label="Notify me about discussion posts"
                checked={settings.discussions.enabled}
                onChange={(v) => setSettings({ ...settings, discussions: { ...settings.discussions, enabled: v } })}
              />
              {settings.discussions.enabled && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Scope</div>
                  <div className="space-y-1">
                    {(Object.keys(SCOPE_LABELS) as DiscussionScope[]).map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          checked={settings.discussions.scope === s}
                          onChange={() => setSettings({ ...settings, discussions: { ...settings.discussions, scope: s } })}
                        />
                        {SCOPE_LABELS[s]}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="@Mentions" subtitle="When someone @mentions you in a discussion">
              <Toggle
                label="Notify me when I'm @mentioned"
                checked={settings.mentions.enabled}
                onChange={(v) => setSettings({ ...settings, mentions: { enabled: v } })}
              />
              <p className="text-xs text-slate-400 mt-2">
                Mentions are delivered even if you have discussion notifications scoped to mentions-only or off.
              </p>
            </Section>

            <Section title="Admin broadcasts" subtitle="Critical announcements from chairs and admins">
              <Toggle
                label="Receive admin broadcasts (recommended)"
                checked={settings.broadcast.enabled}
                onChange={(v) => setSettings({ ...settings, broadcast: { enabled: v } })}
              />
              <p className="text-xs text-slate-400 mt-2">
                Broadcasts bypass quiet hours and muted days.
              </p>
            </Section>

            <Section title="Quiet hours" subtitle="Don't disturb me at certain times" icon={<Clock className="w-4 h-4" />}>
              <Toggle
                label="Enable quiet hours"
                checked={settings.quietHours.enabled}
                onChange={(v) => setSettings({ ...settings, quietHours: { ...settings.quietHours, enabled: v } })}
              />
              {settings.quietHours.enabled && (
                <div className="mt-3 grid grid-cols-2 gap-3 max-w-xs">
                  <NumberField
                    label="From (hour)"
                    value={settings.quietHours.startHour}
                    onChange={(n) => setSettings({ ...settings, quietHours: { ...settings.quietHours, startHour: n } })}
                  />
                  <NumberField
                    label="Until (hour)"
                    value={settings.quietHours.endHour}
                    onChange={(n) => setSettings({ ...settings, quietHours: { ...settings.quietHours, endHour: n } })}
                  />
                </div>
              )}
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Mute on</div>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <Chip
                      key={d.key}
                      active={settings.mutedDays.includes(d.key)}
                      onClick={() => toggleDay(d.key)}
                      label={d.label}
                    />
                  ))}
                </div>
              </div>
            </Section>
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}

function Section({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-4">
      <div className="flex items-start gap-2 mb-3">
        {icon && <div className="text-slate-500 mt-0.5">{icon}</div>}
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-1.5">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-200"}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </label>
  );
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</span>
      <input
        type="number"
        min={0}
        max={23}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(23, parseInt(e.target.value || "0", 10))))}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
      />
    </label>
  );
}
