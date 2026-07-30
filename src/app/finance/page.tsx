"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Banknote, Loader2, RefreshCw, AlertTriangle, Download } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

// Income, and where it came from.
//
// The population is Stripe's charge list, not our own rows. `paid` is a
// boolean somebody sets from a dashboard, and it was never evidence: the
// Sponsors page reported 8 paid worth $3,440 while Stripe had taken money from
// four of them. Nothing on this page is gated on that flag. Every live charge
// is income, and the only question asked of each one is who it came from.

type Group = { payments: number; grossCents: number; feeCents: number; refundedCents: number; netCents: number };
type Line = {
  chargeId: string;
  source: "attendee" | "sponsor" | "unattributed";
  matchedBy: string;
  name: string; email: string | null; detail: string;
  grossCents: number; feeCents: number; refundedCents: number; netCents: number;
  paidAt: string;
  flagMissing: boolean;
};
type Report = {
  generatedAt: string;
  truncated: boolean;
  totals: Group;
  attendees: Group;
  sponsors: Group;
  unattributed: Group;
  flaggedPaid: { attendee: number; sponsor: number };
  flaggedWithoutCharge: { attendee: number; sponsor: number };
  unflagged: { name: string; email: string | null; detail: string; netCents: number; chargeId: string }[];
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
  const [src, setSrc] = useState<"all" | "attendee" | "sponsor" | "unattributed">("all");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

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
    const head = ["source", "matched_by", "name", "email", "detail", "date", "gross", "stripe_fee", "refunded", "net", "charge_id"];
    const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = data.lines.map((l) => [
      l.source, l.matchedBy, l.name, l.email, l.detail, l.paidAt,
      (l.grossCents / 100).toFixed(2), (l.feeCents / 100).toFixed(2),
      (l.refundedCents / 100).toFixed(2), (l.netCents / 100).toFixed(2), l.chargeId,
    ].map(esc).join(","));
    const url = URL.createObjectURL(new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `income-${data.generatedAt.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const shown = data ? data.lines.filter((l) => src === "all" || l.source === src) : [];
  const pct = (g: Group) =>
    data && data.totals.netCents ? Math.round((1000 * g.netCents) / data.totals.netCents) / 10 : 0;

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
                <h1 className="text-xl font-bold text-slate-900">Income</h1>
                <p className="text-sm text-slate-500">
                  Every charge Stripe took, and where it came from. Nothing here reads the paid flag.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {data && (
                  <button onClick={downloadCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                )}
                <button onClick={run} disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {data ? "Re-read from Stripe" : "Read from Stripe"}
                </button>
              </div>
            </div>

            {!data && !loading && (
              <p className="text-sm text-slate-500 mt-6 max-w-2xl leading-relaxed">
                This reads Stripe&rsquo;s charge list, then works out who each payment came from using the
                identifiers written at checkout. A record marked paid that Stripe never charged is not
                income and will not appear in the totals.
              </p>
            )}
            {loading && <p className="text-sm text-slate-500 mt-6">Reading every charge from Stripe&hellip;</p>}
            {error && (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>
            )}

            {data && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                  <Stat label="Net received" value={money(data.totals.netCents)} strong
                        note={`${data.totals.payments} charges Stripe took`} />
                  <Stat label="Charged" value={money(data.totals.grossCents)} />
                  <Stat label="Stripe fees" value={`-${money(data.totals.feeCents)}`} />
                  <Stat label="Refunded" value={`-${money(data.totals.refundedCents)}`} />
                </div>

                {data.truncated && (
                  <p className="mt-3 text-[13px] text-rose-800">
                    Stripe had more charges than this run could read, so every figure here is a floor.
                  </p>
                )}

                <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 mt-7 mb-2.5">
                  Where it came from
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Source label="Attendees" g={data.attendees} pct={pct(data.attendees)} />
                  <Source label="Sponsors and exhibitors" g={data.sponsors} pct={pct(data.sponsors)} />
                  <Source label="Unattributed" g={data.unattributed} pct={pct(data.unattributed)}
                          warn={data.unattributed.payments > 0} />
                </div>

                {/* The flag, reported as what it is: a claim, not evidence. */}
                <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
                  <div className="text-[13px] text-slate-600 leading-relaxed">
                    <strong className="text-slate-900">Marked paid, but no charge.</strong>{" "}
                    {data.flaggedWithoutCharge.sponsor > 0 || data.flaggedWithoutCharge.attendee > 0 ? (
                      <>
                        {data.flaggedWithoutCharge.sponsor > 0 && (
                          <><strong className="text-rose-700">{data.flaggedWithoutCharge.sponsor}</strong> of the{" "}
                            {data.flaggedPaid.sponsor} sponsors marked paid have no Stripe charge behind them. </>
                        )}
                        {data.flaggedWithoutCharge.attendee > 0 && (
                          <><strong className="text-slate-900">{data.flaggedWithoutCharge.attendee}</strong> of the{" "}
                            {data.flaggedPaid.attendee} attendees marked paid have none either, which is what a comp or a
                            guest seat looks like. </>
                        )}
                        Either the money came in some other way, or the box was ticked and it never arrived. Not counted
                        as income above.
                      </>
                    ) : (
                      <>Every record marked paid has a Stripe charge behind it.</>
                    )}
                  </div>
                </div>

                {data.unflagged.length > 0 && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-[13px] text-amber-900 leading-relaxed">
                        <strong>{data.unflagged.length} payment{data.unflagged.length === 1 ? "" : "s"} the app thinks
                        {data.unflagged.length === 1 ? " is" : " are"} unpaid.</strong>{" "}
                        Stripe took the money, but the record still says otherwise, so these people look unpaid
                        everywhere else and may be getting chased for it.
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1 pl-7">
                      {data.unflagged.map((u) => (
                        <li key={u.chargeId} className="text-[12.5px] text-amber-900">
                          <span className="tabular-nums font-semibold">{money(u.netCents)}</span>
                          {" · "}{u.name}
                          {u.email && <span className="text-amber-700"> · {u.email}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-7 mb-3 flex-wrap">
                  {(["all", "attendee", "sponsor", "unattributed"] as const).map((k) => {
                    const n = k === "all" ? data.lines.length : data.lines.filter((l) => l.source === k).length;
                    if (k === "unattributed" && n === 0) return null;
                    return (
                      <button key={k} onClick={() => setSrc(k)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          src === k ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}>
                        {k === "all" ? "All charges" : k === "attendee" ? "Attendees" : k === "sponsor" ? "Sponsors" : "Unattributed"} {n}
                      </button>
                    );
                  })}
                  <span className="ml-auto text-[11px] text-slate-400">
                    Read {new Date(data.generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                  <table className="w-full text-sm min-w-[760px]">
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
                        <tr key={l.chargeId} className={i > 0 ? "border-t border-slate-100" : ""}>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
                              {l.name}
                              {l.source === "unattributed" && (
                                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                                  no record
                                </span>
                              )}
                              {l.matchedBy === "email" && (
                                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                  matched on email
                                </span>
                              )}
                              {l.flagMissing && (
                                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  not marked paid
                                </span>
                              )}
                            </div>
                            <div className="text-[12px] text-slate-500">
                              {[l.detail, l.email].filter(Boolean).join(" · ")}
                              {" · "}
                              {new Date(l.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No charges in this group.</td></tr>
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
      {note && <div className="text-[11px] mt-0.5 text-slate-400">{note}</div>}
    </div>
  );
}

function Source({ label, g, pct, warn }: { label: string; g: Group; pct: number; warn?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${warn ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-sm font-bold ${warn ? "text-rose-900" : "text-slate-900"}`}>{label}</span>
        <span className={`text-[11px] tabular-nums ${warn ? "text-rose-700" : "text-slate-400"}`}>
          {g.payments} payment{g.payments === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-lg font-bold tabular-nums ${warn ? "text-rose-900" : "text-slate-900"}`}>{money(g.netCents)}</span>
        <span className={`text-[12px] tabular-nums ${warn ? "text-rose-700" : "text-slate-500"}`}>{pct}% of income</span>
      </div>
    </div>
  );
}
