"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Tag, Plus, RefreshCw, Search, Trash2, Power, Check, X,
  ChevronDown, ChevronRight, Loader2, Ticket, Pencil,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import CreateDiscountModal from "@/components/discounts/CreateDiscountModal";
import EditDiscountModal from "@/components/discounts/EditDiscountModal";
import RedemptionList from "@/components/discounts/RedemptionList";

export type DiscountCodeRow = {
  id: string;
  code: string;
  description: string | null;
  kind: "percent" | "fixed";
  virtualValue: number | null;
  inPersonValue: number | null;
  active: boolean;
  expiresAt: string | null;
  maxRedemptions: number | null;
  redeemedCount: number;
  createdByEmail: string | null;
  createdAt: string;
  _count?: { redemptions: number };
};

function modeLabel(c: DiscountCodeRow, value: number | null): string | null {
  if (value == null) return null;
  if (c.kind === "fixed") {
    return `$${(value / 100).toLocaleString("en-US", { minimumFractionDigits: value % 100 ? 2 : 0 })}`;
  }
  return `${value}%`;
}

function isExpired(c: DiscountCodeRow): boolean {
  return !!c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
}

export default function DiscountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [codes, setCodes] = useState<DiscountCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<DiscountCodeRow | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discounts");
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  async function toggleActive(c: DiscountCodeRow) {
    setBusyId(c.id);
    try {
      await fetch(`/api/discounts/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !c.active }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(c: DiscountCodeRow) {
    if (!confirm(`Delete code ${c.code}? Its redemption history will be removed too. Deactivating instead preserves the record.`)) return;
    setBusyId(c.id);
    try {
      await fetch(`/api/discounts/${c.id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const filtered = codes.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.code.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q);
  });

  const totalRedeemed = codes.reduce((sum, c) => sum + c.redeemedCount, 0);
  const activeCount = codes.filter((c) => c.active && !isExpired(c)).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
                  <Tag className="w-3.5 h-3.5" /> Discount codes
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                  Discount codes
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Create codes for the registration funnels and track how they&rsquo;re used.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" /> New code
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Stat label="Codes" value={codes.length} icon={<Tag className="w-4 h-4 text-rose-500" />} />
              <Stat label="Active" value={activeCount} icon={<Power className="w-4 h-4 text-emerald-500" />} />
              <Stat label="Redemptions" value={totalRedeemed} icon={<Ticket className="w-4 h-4 text-teal-500" />} />
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by code or label"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={load}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* List */}
              {loading ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <Tag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    {codes.length === 0 ? "No discount codes yet. Create your first one." : "No codes match your search."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.map((c) => {
                    const expired = isExpired(c);
                    const exhausted = c.maxRedemptions != null && c.redeemedCount >= c.maxRedemptions;
                    const live = c.active && !expired && !exhausted;
                    const open = expanded === c.id;
                    return (
                      <div key={c.id}>
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50">
                          <button
                            onClick={() => setExpanded(open ? null : c.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
                            title="Redemption history"
                          >
                            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 text-[15px] tracking-wide">{c.code}</span>
                              <Badge live={live}>{live ? "Active" : !c.active ? "Off" : expired ? "Expired" : "Used up"}</Badge>
                            </div>
                            {c.description && <div className="text-[12px] text-slate-500 mt-0.5 truncate">{c.description}</div>}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {modeLabel(c, c.inPersonValue) && (
                                <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                                  {modeLabel(c, c.inPersonValue)} <span className="text-[10px] font-semibold text-slate-400 uppercase">in-person</span>
                                </span>
                              )}
                              {modeLabel(c, c.virtualValue) && (
                                <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                                  {modeLabel(c, c.virtualValue)} <span className="text-[10px] font-semibold text-slate-400 uppercase">virtual</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {c.redeemedCount}{c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""} redeemed
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setEditing(c)}
                              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleActive(c)}
                              disabled={busyId === c.id}
                              className={`p-2 rounded-lg border ${c.active ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50" : "border-slate-200 text-slate-400 hover:bg-slate-50"}`}
                              title={c.active ? "Deactivate" : "Activate"}
                            >
                              {busyId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => remove(c)}
                              disabled={busyId === c.id}
                              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {open && (
                          <div className="px-4 pb-4 pt-1 bg-slate-50/60">
                            <RedemptionList codeId={c.id} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
        <MobileNav />
      </div>

      {showCreate && (
        <CreateDiscountModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}

      {editing && (
        <EditDiscountModal
          code={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide uppercase text-slate-400">
        {icon} {label}
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function Badge({ live, children }: { live: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
        live ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
      }`}
    >
      {live ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {children}
    </span>
  );
}
