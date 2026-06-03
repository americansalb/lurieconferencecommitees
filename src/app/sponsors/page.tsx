"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Award, Trash2, RefreshCw, Search, Filter, ExternalLink, Mail, Building2, Copy, Plus,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { SPONSOR_STATUS_LABELS, TIERS } from "@/lib/sponsors";
import InviteSponsorComposer from "./InviteSponsorComposer";

type Sponsor = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  tier: string;
  amountCents: number;
  donateFoodInstead: boolean;
  message: string | null;
  status: string;
  paid: boolean;
  paidAt: string | null;
  applicationToken: string;
  createdAt: string;
};

export default function SponsorsAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "admin" || role === "developer";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sponsors");
      if (res.ok) {
        const data = await res.json();
        setSponsors(data.sponsors || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/sponsors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this sponsor application? This cannot be undone.")) return;
    await fetch(`/api/sponsors/${id}`, { method: "DELETE" });
    load();
  }

  async function copyStatusLink(token: string) {
    const url = `${window.location.origin}/sponsor/status/${token}`;
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const filtered = sponsors.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (tierFilter !== "all" && s.tier !== tierFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![s.companyName, s.contactName, s.contactEmail, s.website].some((v) => v?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const totalDollars = sponsors.filter((s) => s.paid).reduce((sum, s) => sum + s.amountCents, 0) / 100;
  const pipelineDollars = sponsors.filter((s) => !s.paid && !s.donateFoodInstead && s.status !== "declined").reduce((sum, s) => sum + s.amountCents, 0) / 100;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-slate-900">Sponsors &amp; Exhibitors</h1>
                <p className="text-xs text-slate-500">Applications, pipeline, and confirmed sponsorships</p>
              </div>
              <a
                href="/sponsor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5"
                title="Open the public sponsor page"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Public page
              </a>
              <button
                onClick={() => setShowInvite(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Invite sponsor
              </button>
              <button onClick={load} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {showInvite && (
              <InviteSponsorComposer
                onClose={() => setShowInvite(false)}
                onSent={() => { setShowInvite(false); load(); }}
              />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              <Stat label="Applications" value={sponsors.length.toString()} />
              <Stat label="Confirmed (paid)" value={sponsors.filter((s) => s.paid).length.toString()} accent="#059669" />
              <Stat label="Confirmed $" value={`$${totalDollars.toLocaleString("en-US")}`} accent="#0E5566" />
              <Stat label="Pipeline $" value={`$${pipelineDollars.toLocaleString("en-US")}`} accent="#0066B3" />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search company, contact, email…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-teal-500"
                  >
                    <option value="all">All statuses</option>
                    {Object.entries(SPONSOR_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-teal-500"
                  >
                    <option value="all">All tiers</option>
                    {TIERS.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-400">
                  {sponsors.length === 0
                    ? <>No sponsor applications yet. Share <code className="px-1.5 py-0.5 bg-slate-100 rounded">/sponsor</code> to start collecting them.</>
                    : "No matches."}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map((s) => {
                    const tier = TIERS.find((t) => t.id === s.tier);
                    const sl = SPONSOR_STATUS_LABELS[s.status] || SPONSOR_STATUS_LABELS.submitted;
                    return (
                      <li key={s.id} className="p-4 group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: (tier?.accent || "#94a3b8") + "20" }}>
                            <Building2 className="w-4 h-4" style={{ color: tier?.accent || "#475569" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate">{s.companyName}</div>
                            <div className="text-xs text-slate-500 truncate">
                              {s.contactName} &middot; <a className="hover:text-slate-700" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>
                              {s.contactPhone && <> &middot; {s.contactPhone}</>}
                            </div>
                          </div>
                          <div className="text-right shrink-0 hidden sm:block">
                            <div className="text-xs font-bold text-slate-900">
                              {tier?.name || (s.tier === "undecided" ? "Tier not yet chosen" : s.tier)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {s.tier === "undecided"
                                ? "Invitee will pick a level"
                                : s.donateFoodInstead
                                  ? "Food in kind"
                                  : (tier?.amountLabel || `$${(s.amountCents / 100).toFixed(0)}`)}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${sl.color}`}>{sl.label}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyStatusLink(s.applicationToken)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                              title="Copy status link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`mailto:${s.contactEmail}`}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-teal-700"
                              title="Email contact"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                            {isAdmin && (
                              <button
                                onClick={() => remove(s.id)}
                                className="p-1.5 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500"
                                title="Delete (admin only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {s.message && (
                          <div className="mt-2 ml-12 text-xs text-slate-600 bg-slate-50 rounded px-3 py-2 border-l-2 border-slate-200">
                            {s.message}
                          </div>
                        )}
                        {isAdmin && (
                          <div className="mt-2 ml-12 flex items-center gap-1 text-[11px] flex-wrap">
                            {Object.entries(SPONSOR_STATUS_LABELS).map(([k, v]) => (
                              <button
                                key={k}
                                onClick={() => updateStatus(s.id, k)}
                                disabled={s.status === k}
                                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                                  s.status === k
                                    ? `border ${v.color}`
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {v.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{label}</div>
      <div className="text-2xl font-extrabold mt-1" style={{ color: accent || "#0f172a" }}>{value}</div>
    </div>
  );
}
