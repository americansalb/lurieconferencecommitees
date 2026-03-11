"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Mail, Shield, LogOut, Users, Globe, Check } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

interface Membership {
  role: string;
  committee: { id: string; name: string; slug: string; color: string };
}

const ROLE_LABELS: Record<string, string> = {
  developer: "Developer",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [userTimezone, setUserTimezone] = useState("");
  const [detectedTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [tzSaving, setTzSaving] = useState(false);
  const [tzSaved, setTzSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Load user timezone, auto-save detected if none saved
  useEffect(() => {
    if (!session) return;
    fetch("/api/user")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.timezone && data.timezone !== "America/Chicago") {
          setUserTimezone(data.timezone);
        } else {
          // Auto-save detected timezone
          setUserTimezone(detectedTimezone);
          fetch("/api/user", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timezone: detectedTimezone }),
          });
        }
      })
      .catch(() => setUserTimezone(detectedTimezone));
  }, [session, detectedTimezone]);

  async function saveTimezone(tz: string) {
    setUserTimezone(tz);
    setTzSaving(true);
    setTzSaved(false);
    try {
      await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: tz }),
      });
      setTzSaved(true);
      setTimeout(() => setTzSaved(false), 2000);
    } catch { /* ignore */ }
    setTzSaving(false);
  }

  useEffect(() => {
    if (!session) return;
    fetch("/api/committees")
      .then((r) => (r.ok ? r.json() : []))
      .then((committees: { id: string; members: { user: { id: string }; role: string }[]; name: string; slug: string; color: string }[]) => {
        const userId = (session.user as { id: string }).id;
        const mine: Membership[] = [];
        committees.forEach((c) => {
          const m = c.members.find((m) => m.user.id === userId);
          if (m) mine.push({ role: m.role, committee: { id: c.id, name: c.name, slug: c.slug, color: c.color } });
        });
        setMemberships(mine);
      })
      .catch(() => {});
  }, [session]);

  async function handleLeaveCommittee(committeeId: string, committeeName: string) {
    if (!confirm(`Leave ${committeeName}?`)) return;
    const res = await fetch("/api/committees/join", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ committeeId }),
    });
    if (res.ok) {
      setMemberships((prev: Membership[]) => prev.filter((m: Membership) => m.committee.id !== committeeId));
    }
  }

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const user = session.user as { name?: string; email?: string; role?: string };
  const role = user.role || "member";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-2xl mx-auto">
            <h1 className="text-xl font-extrabold text-slate-900 mb-5">Profile</h1>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-4">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{user.name}</div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Shield className="w-3.5 h-3.5" />
                    {ROLE_LABELS[role] || role}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{user.name}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-slate-400" />
                Timezone
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Your detected timezone is <span className="font-semibold text-slate-700">{detectedTimezone.replace(/_/g, " ")}</span>.
                All event times will be displayed in your selected timezone.
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={userTimezone}
                  onChange={e => saveTimezone(e.target.value)}
                  disabled={tzSaving}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                >
                  <optgroup label="US Timezones">
                    <option value="America/New_York">Eastern (ET) - America/New_York</option>
                    <option value="America/Chicago">Central (CT) - America/Chicago</option>
                    <option value="America/Denver">Mountain (MT) - America/Denver</option>
                    <option value="America/Los_Angeles">Pacific (PT) - America/Los_Angeles</option>
                    <option value="America/Anchorage">Alaska (AKT) - America/Anchorage</option>
                    <option value="Pacific/Honolulu">Hawaii (HT) - Pacific/Honolulu</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="UTC">UTC</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Paris (CET/CEST)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                    <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                  </optgroup>
                </select>
                {tzSaved && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-slate-400" />
                My Committees ({memberships.length})
              </h2>
              {memberships.length === 0 ? (
                <p className="text-sm text-slate-400">Not a member of any committee yet.</p>
              ) : (
                <div className="space-y-2">
                  {memberships.map((m) => (
                    <div
                      key={m.committee.slug}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.committee.color }} />
                        <span className="text-sm font-semibold text-slate-900">{m.committee.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 capitalize">{m.role}</span>
                        <button
                          onClick={() => handleLeaveCommittee(m.committee.id, m.committee.name)}
                          className="text-[11px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-2 py-0.5 transition-colors"
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
