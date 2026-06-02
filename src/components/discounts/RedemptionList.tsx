"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Clock, Ban } from "lucide-react";

type Redemption = {
  id: string;
  code: string;
  attendeeEmail: string | null;
  attendanceMode: string | null;
  basePriceCents: number;
  discountCents: number;
  finalPriceCents: number;
  status: "applied" | "redeemed" | "voided";
  redeemedAt: string | null;
  createdAt: string;
};

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

// The audit trail for one code: who applied it, the price math, and whether
// payment cleared. Lazily fetched when a code row is expanded.
export default function RedemptionList({ codeId }: { codeId: string }) {
  const [rows, setRows] = useState<Redemption[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/discounts/${codeId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setRows(data.code?.redemptions || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [codeId]);

  if (loading) {
    return (
      <div className="py-6 text-center text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="py-5 text-center text-[13px] text-slate-400">
        No redemptions yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
            <th className="px-3 py-2 font-bold">Email</th>
            <th className="px-3 py-2 font-bold">Mode</th>
            <th className="px-3 py-2 font-bold text-right">Was</th>
            <th className="px-3 py-2 font-bold text-right">Saved</th>
            <th className="px-3 py-2 font-bold text-right">Paid</th>
            <th className="px-3 py-2 font-bold">Status</th>
            <th className="px-3 py-2 font-bold">When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-50 last:border-0">
              <td className="px-3 py-2 text-slate-700 truncate max-w-[180px]">{r.attendeeEmail || "—"}</td>
              <td className="px-3 py-2 text-slate-500">
                {r.attendanceMode === "in-person" ? "In-person" : r.attendanceMode === "virtual" ? "Virtual" : "—"}
              </td>
              <td className="px-3 py-2 text-right text-slate-400 tabular-nums">{money(r.basePriceCents)}</td>
              <td className="px-3 py-2 text-right text-emerald-600 font-semibold tabular-nums">−{money(r.discountCents)}</td>
              <td className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">{money(r.finalPriceCents)}</td>
              <td className="px-3 py-2"><StatusPill status={r.status} /></td>
              <td className="px-3 py-2 text-slate-400">
                {new Date(r.redeemedAt || r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }: { status: Redemption["status"] }) {
  const map = {
    redeemed: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Check className="w-3 h-3" /> },
    applied: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3 h-3" /> },
    voided: { label: "Voided", cls: "bg-slate-100 text-slate-500 border-slate-200", icon: <Ban className="w-3 h-3" /> },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${map.cls}`}>
      {map.icon} {map.label}
    </span>
  );
}
