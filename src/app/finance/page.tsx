"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Banknote, Loader2, RefreshCw, AlertTriangle, Download } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

// What actually arrived, per payer, from Stripe's own balance transactions.
//
// Everywhere else in this app, a revenue figure is a price we wrote down:
// Sponsors sums `amountCents`, the agreed tier, and calls it "revenue actually
// collected"; attendee totals sum `finalPriceCents`, what checkout meant to
// charge. Neither has ever seen a Stripe fee or a refund. This page never
// touches those columns for its totals, and shows the expected figure only
// beside the real one so the gap is visible instead of arguable.

type Group = { payments: number; grossCents: number; feeCents: number; refundedCents: number; netCents: number };
type Line = {
  kind: "attendee" | "sponsor";
  name: string; email: string; detail: string;
  expectedCents: number | null; paidAt: string | null;
  grossCents: number; feeCents: number; refundedCents: number; netCents: number;
  currency: string; availableOn: string | null;
};
type OffStripe = {
  kind: string; name: string; email: string; detail: string;
  expectedCents: number | null; paidAt: string | null; reason: string;
};
type Report = {
  generatedAt: string;
  totals: Group;
  attendees: Group;
  sponsors: Group;
  expectedCentsForSettled: number;
  offStripe: OffStripe[];
  testModeCount: number;
  unresolved: { kind: string; name: string; email: string }[];
  errors: { name: string; message: string }[];
  lines: Line[];
};

const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function FinancePage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<"all" | "attendee" | "sponsor">("all");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Not loaded on mount: the report makes one Stripe call per payment, so it is
  // a deliberate action rather than something that fires because a page opened.
  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/finance");
      const j = await r.json();
      if (!r.ok) setError(j.error || "Could not reach Stripe.");
      else setData(j);
    } catch {
      setError("Network error while reading from Stripe.");
    } finally {
      setLoading(false);
    }
  }, []);

  function downloadCsv() {
    if (!data) return;
    const head = ["type", "name", "email", "detail", "paid_at", "expected", "gross", "stripe_fee", "refunded", "net"];
    const esc = (v: string | number | null) =>
      `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = data.lines.map((l) => [
      l.kind, l.name, l.email, l.detail, l.paidAt || "",
      ((l.expectedCents ?? 0) / 100).toFixed(2),
      (l.grossCents / 100).toFixed(2),
      (l.feeCents / 100).toFixed(2),
      (l.refundedCents / 100).toFixed(2),
      (l.netCents / 100).toFixed(2),
    ].map(esc).join(","));
    const csv = [head.join(","), ...body].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `stripe-income-${data.generatedAt.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const shown = data ? data.lines.filter((l) => kind === "all" || l.kind === kind) : [];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto">

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-900">Income received</h1>
                <p className="text-sm text-slate-500">
                  Read from Stripe&rsquo;s balance transactions, not from our own price columns.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {data && (
                  <button
                    onClick={downloadCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                )}
                <button
                  onClick={run}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {data ? "Re-read from Stripe" : "Read from Stripe"}
                </button>
              </div>
            </div>

            {!data && !loading && (
              <p className="text-sm text-slate-500 mt-6 max-w-2xl leading-relaxed">
                This asks Stripe about every payment we have on record, one at a time, so it takes a
                moment and it is never cached. Nothing here is calculated from what we believed a
                ticket or a tier was worth.
              </p>
            )}
            {loading && (
              <p className="text-sm text-slate-500 mt-6">Reading every payment from Stripe&hellip;</p>
            )}
            {error && (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {error}
              </div>
            )}

            {data && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                  <Stat label="Net received" value={money(data.totals.netCents)} strong
                        note={`${data.totals.payments} Stripe payment${data.totals.payments === 1 ? "" : "s"}`} />
                  <Stat label="Charged" value={money(data.totals.grossCents)} />
                  <Stat label="Stripe fees" value={`-${money(data.totals.feeCents)}`} />
                  <Stat label="Refunded" value={`-${money(data.totals.refundedCents)}`} />
                </div>

                <p className="text-[13px] text-slate-500 mt-3 leading-relaxed">
                  Our own records expected{" "}
                  <strong className="text-slate-700 tabular-nums">{money(data.expectedCentsForSettled)}</strong>{" "}
                  from these same payments. The difference is Stripe&rsquo;s cut and any refund, and it is
                  the reason the Sponsors page total has never been the money you actually have.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  <Split label="Attendees" g={data.attendees} />
                  <Split label="Sponsors and exhibitors" g={data.sponsors} />
                </div>

                {(data.offStripe.length > 0 || data.unresolved.length > 0 || data.errors.length > 0 || data.testModeCount > 0) && (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-[13px] text-amber-900 leading-relaxed">
                        <strong>Not in the totals above.</strong>
                        {data.offStripe.length > 0 && (
                          <> {data.offStripe.length} record{data.offStripe.length === 1 ? " is" : "s are"} marked paid
                            with no Stripe payment behind {data.offStripe.length === 1 ? "it" : "them"} (cheques, wires,
                            comps, guest seats, or a row flipped by hand). Real money may well have changed hands, but we
                            cannot prove the amount or the fee from here.</>
                        )}
                        {data.testModeCount > 0 && <> {data.testModeCount} test-mode payment{data.testModeCount === 1 ? "" : "s"} excluded.</>}
                        {data.unresolved.length > 0 && <> {data.unresolved.length} payment{data.unresolved.length === 1 ? "" : "s"} Stripe returned without a charge.</>}
                        {data.errors.length > 0 && <> {data.errors.length} row{data.errors.length === 1 ? "" : "s"} failed to read.</>}
                      </div>
                    </div>
                    {data.offStripe.length > 0 && (
                      <ul className="mt-3 space-y-1.5 pl-7">
                        {data.offStripe.map((o, i) => (
                          <li key={i} className="text-[12.5px] text-amber-900">
                            <span className="font-semibold">{o.name}</span>
                            <span className="text-amber-700"> · {o.detail}</span>
                            {o.expectedCents ? <span className="text-amber-700 tabular-nums"> · expected {money(o.expectedCents)}</span> : null}
                            <span className="block text-amber-700">{o.reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-7 mb-3">
                  {(["all", "attendee", "sponsor"] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setKind(k)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        kind === k ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {k === "all" ? "Everyone" : k === "attendee" ? "Attendees" : "Sponsors"}
                      {" "}
                      {k === "all" ? data.lines.length : data.lines.filter((l) => l.kind === k).length}
                    </button>
                  ))}
                  <span className="ml-auto text-[11px] text-slate-400">
                    Read {new Date(data.generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                        <th className="text-left px-4 py-3 font-bold">Who</th>
                        <th className="text-right px-4 py-3 font-bold">Charged</th>
                        <th className="text-right px-4 py-3 font-bold">Fee</th>
                        <th className="text-right px-4 py-3 font-bold">Refunded</th>
                        <th className="text-right px-4 py-3 font-bold">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((l, i) => (
                        <tr key={i} className={i > 0 ? "border-t border-slate-100" : ""}>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{l.name}</div>
                            <div className="text-[12px] text-slate-500">
                              {l.detail} · {l.email}
                              {l.paidAt && ` · ${new Date(l.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">{money(l.grossCents)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-500">-{money(l.feeCents)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                            {l.refundedCents ? `-${money(l.refundedCents)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">{money(l.netCents)}</td>
                        </tr>
                      ))}
                      {!shown.length && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No Stripe payments in this group.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}

function Stat({ label, value, note, strong }: { label: string; value: string; note?: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${strong ? "border-slate-900 bg-slate-900" : "border-slate-200 bg-white"}`}>
      <div className={`text-[10px] font-bold uppercase tracking-[0.16em] ${strong ? "text-slate-400" : "text-slate-500"}`}>{label}</div>
      <div className={`mt-1.5 text-xl font-bold tabular-nums ${strong ? "text-white" : "text-slate-900"}`}>{value}</div>
      {note && <div className={`text-[11px] mt-0.5 ${strong ? "text-slate-400" : "text-slate-400"}`}>{note}</div>}
    </div>
  );
}

function Split({ label, g }: { label: string; g: Group }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-slate-900">{label}</span>
        <span className="text-[11px] text-slate-400">{g.payments} payment{g.payments === 1 ? "" : "s"}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-lg font-bold tabular-nums text-slate-900">{money(g.netCents)}</span>
        <span className="text-[12px] text-slate-500 tabular-nums">
          from {money(g.grossCents)} charged
        </span>
      </div>
    </div>
  );
}
