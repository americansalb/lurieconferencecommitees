"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Loader2, Check, X, Star, RefreshCw, Download, Search, ChevronDown, ChevronRight,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

// Reading the scholarship applications.
//
// Built to be read rather than scanned: the three answers are the whole point
// of the form, so they are shown in full on the row, not truncated behind a
// detail pane nobody opens. Deciding is two clicks from the same screen.

type Application = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  standing: string;
  cohort: string | null;
  currentRole: string | null;
  languages: string | null;
  whyAttend: string;
  barrierSeen: string;
  whatTheyWillDo: string;
  costBarrier: string | null;
  accessibility: string | null;
  dietary: string | null;
  virtualInstead: boolean;
  status: string;
  reviewNotes: string | null;
  score: number | null;
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
};

const TABS = [
  { key: "all", label: "All" },
  { key: "submitted", label: "To read" },
  { key: "shortlisted", label: "Shortlist" },
  { key: "awarded", label: "Awarded" },
  { key: "declined", label: "Declined" },
] as const;

export default function ScholarshipsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [awardCount, setAwardCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scholarship/applications");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not load applications.");
      setApps(j.applications);
      setAwardCount(j.awardCount);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") load();
  }, [status, router, load]);

  async function decide(id: string, next: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/scholarship/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Could not save that.");
      setApps((prev) => prev.map((a) => (a.id === id ? j.application : a)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that.");
    } finally {
      setBusyId(null);
    }
  }

  const awarded = apps.filter((a) => a.status === "awarded").length;

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter((a) => {
      if (tab !== "all" && a.status !== tab) return false;
      if (!q) return true;
      return [a.firstName, a.lastName, a.email, a.currentRole, a.languages, a.whyAttend, a.barrierSeen, a.whatTheyWillDo]
        .some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [apps, tab, search]);

  function exportCsv() {
    const head = [
      "name", "email", "phone", "standing", "cohort", "role", "languages",
      "barrier_seen", "why_attend", "what_after", "cost", "virtual_instead",
      "accessibility", "dietary", "status", "applied",
    ];
    const esc = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const rows = shown.map((a) => [
      `${a.firstName} ${a.lastName}`, a.email, a.phone || "", a.standing, a.cohort || "",
      a.currentRole || "", a.languages || "", a.barrierSeen, a.whyAttend, a.whatTheyWillDo,
      a.costBarrier || "", a.virtualInstead ? "yes" : "no", a.accessibility || "", a.dietary || "",
      a.status, new Date(a.createdAt).toISOString(),
    ].map(esc).join(","));
    const blob = new Blob([[head.join(","), ...rows].join("\r\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scholarship-applications.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
                  <GraduationCap className="w-3.5 h-3.5" /> Scholarships
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                  Scholarship applications
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {awarded} of {awardCount} seats awarded &middot; {apps.length} application{apps.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportCsv} disabled={!shown.length}
                        className="px-3 py-2 rounded-xl text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1.5 disabled:opacity-50">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={load}
                        className="px-3 py-2 rounded-xl text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">{error}</div>
            )}

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {TABS.map((t) => {
                const n = t.key === "all" ? apps.length : apps.filter((a) => a.status === t.key).length;
                return (
                  <button key={t.key} onClick={() => setTab(t.key)}
                          className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold border ${tab === t.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                    {t.label} <span className="opacity-60">{n}</span>
                  </button>
                );
              })}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search names and answers"
                       className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0E5566]/20" />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 justify-center text-slate-500 text-sm py-16">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading&hellip;
              </div>
            ) : !shown.length ? (
              <div className="text-center text-[13.5px] text-slate-400 py-16 bg-white rounded-2xl border border-slate-200">
                {apps.length ? "Nothing in this view." : "No applications yet."}
              </div>
            ) : (
              <div className="space-y-3">
                {shown.map((a) => {
                  const open = openId === a.id;
                  return (
                    <div key={a.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 flex items-start gap-3">
                        <button onClick={() => setOpenId(open ? null : a.id)} className="mt-0.5 text-slate-400 shrink-0">
                          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[14px] font-bold text-slate-900">{a.firstName} {a.lastName}</span>
                            <Chip>{a.standing}{a.cohort ? ` · session ${a.cohort}` : ""}</Chip>
                            {a.virtualInstead && <Chip tone="sky">wants virtual</Chip>}
                            {a.status !== "submitted" && <Chip tone={a.status === "awarded" ? "green" : a.status === "declined" ? "rose" : "amber"}>{a.status}</Chip>}
                          </div>
                          <div className="text-[12px] text-slate-500 mt-0.5">
                            {a.email}{a.phone ? ` · ${a.phone}` : ""}
                            {a.currentRole ? ` · ${a.currentRole}` : ""}
                            {a.languages ? ` · ${a.languages}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Action label="Shortlist" icon={Star} tone="amber" busy={busyId === a.id}
                                  active={a.status === "shortlisted"} onClick={() => decide(a.id, "shortlisted")} />
                          <Action label="Award" icon={Check} tone="green" busy={busyId === a.id}
                                  active={a.status === "awarded"} onClick={() => decide(a.id, "awarded")} />
                          <Action label="Decline" icon={X} tone="rose" busy={busyId === a.id}
                                  active={a.status === "declined"} onClick={() => decide(a.id, "declined")} />
                        </div>
                      </div>

                      {open && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-4">
                          <Answer label="A language barrier they saw" value={a.barrierSeen} />
                          <Answer label="Why this conference, and why now" value={a.whyAttend} />
                          <Answer label="What they would do afterwards" value={a.whatTheyWillDo} />
                          {a.costBarrier && <Answer label="On cost" value={a.costBarrier} />}
                          {(a.accessibility || a.dietary) && (
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12.5px] text-slate-600">
                              {a.accessibility && <span><span className="text-slate-400">Access:</span> {a.accessibility}</span>}
                              {a.dietary && <span><span className="text-slate-400">Food:</span> {a.dietary}</span>}
                            </div>
                          )}
                          <div className="text-[11.5px] text-slate-400">
                            Applied {new Date(a.createdAt).toLocaleString("en-US", { timeZone: "America/Chicago" })}
                            {a.decidedAt && ` · decided ${new Date(a.decidedAt).toLocaleDateString("en-US")}${a.decidedBy ? ` by ${a.decidedBy}` : ""}`}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

function Answer({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <p className="text-[13.5px] leading-relaxed text-slate-700 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function Chip({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "rose" | "amber" | "sky" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
  };
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${tones[tone]}`}>{children}</span>;
}

function Action({ label, icon: Icon, tone, active, busy, onClick }: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "green" | "rose" | "amber";
  active: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  const on = {
    green: "bg-emerald-600 text-white border-emerald-600",
    rose: "bg-rose-600 text-white border-rose-600",
    amber: "bg-amber-500 text-white border-amber-500",
  }[tone];
  const off = "bg-white text-slate-500 border-slate-200 hover:bg-slate-50";
  return (
    <button onClick={onClick} disabled={busy} title={label}
            className={`text-[11.5px] font-bold px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1 disabled:opacity-50 ${active ? on : off}`}>
      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />} {label}
    </button>
  );
}
