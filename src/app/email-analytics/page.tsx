"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, RefreshCw, Award, Ticket, AlertTriangle, TrendingDown, Clock, Users } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { medianLabel } from "@/lib/engagement";

type Eng = { delivered: number; clicked: number; rate: number; medianMs: number | null };
type Segment = {
  key: string; label: string;
  emailed: number; clicked: number; started: number; paid: number; unsubscribed: number;
  revenueCents: number; clickRate: number; payRate: number; unsubRate: number;
};
type AbRow = { id: string; label: string; example: string; sent: number; clicked: number; paid: number; clickRate: number };
type Analytics = {
  counts: Record<string, number>;
  sent: { total: number; last24h: number; last7d: number; last30d: number; byType: Record<string, number> };
  daily: { day: string; attendee: number; sponsor: number; other: number }[];
  engagement: { attendees: Eng; sponsors: Eng; combined: Eng };
  funnel: {
    attendees: { emailed: number; clicked: number; started: number; paid: number; revenueCents: number; clickRate: number; startRate: number; payRate: number; endToEnd: number };
    sponsors: { emailed: number; clicked: number; won: number; revenueCents: number; clickRate: number; endToEnd: number };
    totalPaidAttendees: number;
    totalAttendeeRevenueCents: number;
  };
  segments: Segment[];
  abBySet: { key: string; label: string; sent: number; rows: AbRow[] }[];
  hours: { hour: number; sent: number; clicked: number; clickRate: number }[];
  frequency: {
    people: number; avgPerPerson: number; medianPerPerson: number | null; maxPerPerson: number;
    distribution: { label: string; people: number }[];
    multiplePerDay: number; threePlusPerDay: number;
  };
  health: { unsubscribed: number; unsubRate: number; failed: number; failRate: number; pending: number };
  failures: { to: string; subject: string; lastError: string | null; recipientType: string; attempts: number; scheduledFor: string | null }[];
};

const TEAL = "#0E5566", AMBER = "#D97706", SLATE = "#94a3b8", VIOLET = "#7C3AED", GREEN = "#059669", ROSE = "#e11d48";

function money(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}
function hourLabel(h: number): string {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

export default function EmailAnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const backfilled = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Once per session, retag any pre-tagging delivery-test records so they
      // drop out of the real numbers. Idempotent and cheap thereafter.
      if (!backfilled.current) {
        backfilled.current = true;
        await fetch("/api/admin/backfill-test-tags", { method: "POST" }).catch(() => {});
      }
      const r = await fetch("/api/admin/email-analytics");
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  if (status === "loading" || (loading && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading analytics…</div>
      </div>
    );
  }

  const d = data;
  const maxDay = Math.max(1, ...(d?.daily || []).map((x) => x.attendee + x.sponsor + x.other));
  const f = d?.funnel.attendees;
  const maxHourSent = Math.max(1, ...(d?.hours || []).map((h) => h.sent));
  const freq = d?.frequency;
  const maxFreqBucket = Math.max(1, ...(freq?.distribution || []).map((b) => b.people));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Email Analytics</h1>
                <p className="text-sm text-slate-500">What the campaign is actually earning, and which lists earn it.</p>
              </div>
              <button onClick={load} className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Reload
              </button>
            </div>

            {/* Top stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              <Stat label="Sent (all time)" value={(d?.sent.total || 0).toLocaleString()} />
              <Stat label="Sent (7 days)" value={(d?.sent.last7d || 0).toLocaleString()} accent={GREEN} />
              <Stat label="Revenue from email" value={money(f?.revenueCents || 0)} accent={TEAL} sub={`${money(d?.funnel.totalAttendeeRevenueCents || 0)} total`} />
              <Stat label="Unsubscribes" value={(d?.health.unsubscribed || 0).toLocaleString()} accent={(d?.health.unsubRate || 0) > 1 ? ROSE : undefined} sub={`${d?.health.unsubRate ?? 0}% of emailed`} />
            </div>

            {/* THE FUNNEL — the headline of the page */}
            <Card title="Attendee funnel · where people fall out">
              <div className="grid grid-cols-4 gap-2">
                <FunnelStep label="Emailed" value={f?.emailed || 0} color={SLATE} pctOfPrev={null} />
                <FunnelStep label="Clicked" value={f?.clicked || 0} color={VIOLET} pctOfPrev={f?.clickRate ?? 0} />
                <FunnelStep label="Started" value={f?.started || 0} color={AMBER} pctOfPrev={f?.startRate ?? 0} />
                <FunnelStep label="Paid" value={f?.paid || 0} color={GREEN} pctOfPrev={f?.payRate ?? 0} />
              </div>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
                <span className="text-slate-500">
                  End to end: <strong className="text-slate-900 tabular-nums">{f?.endToEnd ?? 0}%</strong> of everyone emailed has paid
                </span>
                <span className="text-slate-500">
                  Worth <strong style={{ color: TEAL }} className="tabular-nums">{money(f?.revenueCents || 0)}</strong>
                </span>
                <span className="text-slate-400 text-[12px]">
                  {(f?.emailed || 0) > 0 && `${((f!.revenueCents / 100) / f!.emailed).toFixed(2)} per email sent`}
                </span>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Every stage counts only people we emailed, so a walk-up registration is never credited to the campaign. &ldquo;Started&rdquo; means they picked an attendance option or began checkout. The biggest percentage drop is where to spend your next hour of work.
              </p>
            </Card>

            {/* Per-segment performance */}
            {(d?.segments || []).length > 0 && (
              <Card title="Which lists actually convert">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wide text-slate-400 text-left">
                        <th className="py-2 pr-3 font-bold">Segment</th>
                        <th className="py-2 px-2 font-bold text-right">Emailed</th>
                        <th className="py-2 px-2 font-bold text-right">Click</th>
                        <th className="py-2 px-2 font-bold text-right">Paid</th>
                        <th className="py-2 px-2 font-bold text-right">Rate</th>
                        <th className="py-2 px-2 font-bold text-right">Revenue</th>
                        <th className="py-2 pl-2 font-bold text-right">Unsub</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(d?.segments || [])].sort((a, b) => b.revenueCents - a.revenueCents || b.payRate - a.payRate).map((s) => (
                        <tr key={s.key} className="border-t border-slate-100">
                          <td className="py-2.5 pr-3 font-semibold text-slate-800">{s.label}</td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-slate-600">{s.emailed.toLocaleString()}</td>
                          <td className="py-2.5 px-2 text-right tabular-nums" style={{ color: VIOLET }}>{s.clickRate}%</td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">{s.paid}</td>
                          <td className="py-2.5 px-2 text-right tabular-nums font-bold" style={{ color: s.payRate > 0 ? GREEN : "#94a3b8" }}>{s.payRate}%</td>
                          <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-slate-800">{s.revenueCents > 0 ? money(s.revenueCents) : "—"}</td>
                          <td className="py-2.5 pl-2 text-right tabular-nums" style={{ color: s.unsubRate >= 1 ? ROSE : "#94a3b8" }}>{s.unsubRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  Sorted by revenue. A segment with a high unsubscribe rate and no revenue is one you should stop mailing, not mail harder.
                </p>
              </Card>
            )}

            {/* Volume chart */}
            <Card title="Send volume · last 14 days">
              <div className="flex items-end gap-1.5 h-40 px-1">
                {(d?.daily || []).map((x) => {
                  const total = x.attendee + x.sponsor + x.other;
                  const h = (v: number) => `${(v / maxDay) * 100}%`;
                  return (
                    <div key={x.day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div className="w-full flex flex-col justify-end h-32" title={`${x.day}: ${total} sent (${x.attendee} attendee, ${x.sponsor} sponsor)`}>
                        {x.other > 0 && <div style={{ height: h(x.other), background: SLATE }} className="w-full rounded-t-sm" />}
                        {x.sponsor > 0 && <div style={{ height: h(x.sponsor), background: AMBER }} className="w-full" />}
                        {x.attendee > 0 && <div style={{ height: h(x.attendee), background: TEAL }} className="w-full" />}
                        {total === 0 && <div className="w-full h-px bg-slate-100" />}
                      </div>
                      <div className="text-[9px] text-slate-400 tabular-nums">{x.day.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
                <Legend color={TEAL} label={`Attendees (${d?.sent.byType?.attendee || 0})`} />
                <Legend color={AMBER} label={`Sponsors (${d?.sent.byType?.sponsor || 0})`} />
                {(d?.sent.byType?.test || 0) > 0 && <Legend color={SLATE} label={`Test (${d?.sent.byType?.test || 0})`} />}
              </div>
            </Card>

            {/* List health / frequency — how hard are we hitting people */}
            {freq && freq.people > 0 && (
              <Card title="How much mail each person has received">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <MiniStat label="People mailed" value={freq.people.toLocaleString()} Icon={Users} />
                  <MiniStat label="Avg per person" value={String(freq.avgPerPerson)} />
                  <MiniStat label="Most to one person" value={String(freq.maxPerPerson)} accent={freq.maxPerPerson >= 4 ? ROSE : undefined} />
                  <MiniStat label="Got 2+ in a day" value={freq.multiplePerDay.toLocaleString()} accent={freq.multiplePerDay > 0 ? ROSE : GREEN} Icon={TrendingDown} />
                </div>
                <div className="space-y-1.5">
                  {freq.distribution.map((b) => (
                    <div key={b.label} className="flex items-center gap-3 text-sm">
                      <span className="w-20 shrink-0 text-slate-500 text-[12px]">{b.label}</span>
                      <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div style={{ width: `${(b.people / maxFreqBucket) * 100}%`, background: TEAL }} className="h-full rounded-full" />
                      </div>
                      <span className="w-14 shrink-0 text-right tabular-nums text-slate-600">{b.people.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  One send per person per day is the ceiling, and one every 5&ndash;7 days is the healthy cadence for this list.
                  {freq.multiplePerDay > 0
                    ? ` ${freq.multiplePerDay.toLocaleString()} ${freq.multiplePerDay === 1 ? "person has" : "people have"} received two or more in a single day — worth checking they aren't on two lists at once.`
                    : " Nobody has received two in one day."}
                </p>
              </Card>
            )}

            {/* Best send hour */}
            {(d?.hours || []).some((h) => h.sent > 0) && (
              <Card title="Click rate by send hour · America/Chicago">
                <div className="flex items-end gap-1 h-32 px-1">
                  {(d?.hours || []).map((h) => (
                    <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${hourLabel(h.hour)}: ${h.sent} sent, ${h.clicked} clicked (${h.clickRate}%)`}>
                      <div className="w-full flex flex-col justify-end h-24">
                        {h.sent > 0
                          ? <div style={{ height: `${Math.max(4, (h.clickRate / Math.max(1, ...(d?.hours || []).map((x) => x.clickRate))) * 100)}%`, background: h.sent >= 25 ? VIOLET : "#ddd6fe" }} className="w-full rounded-t-sm" />
                          : <div className="w-full h-px bg-slate-100" />}
                      </div>
                      <div className="text-[8px] text-slate-400 tabular-nums">{h.hour % 3 === 0 ? hourLabel(h.hour) : ""}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
                  <Legend color={VIOLET} label="25+ sends (meaningful)" />
                  <Legend color="#ddd6fe" label="Fewer sends (noisy)" />
                  <span className="inline-flex items-center gap-1 text-slate-400 ml-auto"><Clock className="w-3 h-3" /> Bar height = click rate</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  {(() => {
                    const solid = (d?.hours || []).filter((h) => h.sent >= 25).sort((a, b) => b.clickRate - a.clickRate);
                    if (!solid.length) return "Not enough sends in any single hour yet to call a winner.";
                    const best = solid[0], worst = solid[solid.length - 1];
                    return `Best hour so far: ${hourLabel(best.hour)} at ${best.clickRate}% (${best.sent} sends). Worst: ${hourLabel(worst.hour)} at ${worst.clickRate}%.`;
                  })()}
                </div>
              </Card>
            )}

            {/* Engagement */}
            <Card title="Engagement · delivered vs clicked">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-slate-400 text-left">
                      <th className="py-2 pr-4 font-bold">Audience</th>
                      <th className="py-2 px-3 font-bold text-right">Delivered</th>
                      <th className="py-2 px-3 font-bold text-right">Clicked</th>
                      <th className="py-2 px-3 font-bold text-right">Click rate</th>
                      <th className="py-2 pl-3 font-bold text-right">Median time to click</th>
                    </tr>
                  </thead>
                  <tbody>
                    <EngRow label="Attendees" Icon={Ticket} color={TEAL} e={d?.engagement.attendees} />
                    <EngRow label="Sponsors" Icon={Award} color={AMBER} e={d?.engagement.sponsors} />
                    <EngRow label="Combined" e={d?.engagement.combined} bold />
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">Delivered = invites sent (we have no SMTP delivery receipt, so bounces still count here; Resend&rsquo;s dashboard has the true bounce and complaint rates). Clicked = they opened their personal link.</p>
            </Card>

            {/* Sponsor funnel, compact */}
            {(d?.funnel.sponsors.emailed || 0) > 0 && (
              <Card title="Sponsor funnel" tight>
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
                  <span className="text-slate-500">Emailed <strong className="text-slate-900 tabular-nums">{d?.funnel.sponsors.emailed}</strong></span>
                  <span className="text-slate-500">Clicked <strong className="tabular-nums" style={{ color: VIOLET }}>{d?.funnel.sponsors.clicked}</strong> ({d?.funnel.sponsors.clickRate}%)</span>
                  <span className="text-slate-500">Won <strong className="tabular-nums" style={{ color: GREEN }}>{d?.funnel.sponsors.won}</strong> ({d?.funnel.sponsors.endToEnd}%)</span>
                  <span className="text-slate-500">Revenue <strong className="tabular-nums" style={{ color: AMBER }}>{money(d?.funnel.sponsors.revenueCents || 0)}</strong></span>
                </div>
              </Card>
            )}

            {/* Subject A/B, every set */}
            {(d?.abBySet || []).map((set) => (
              <Card key={set.key} title={`Subject lines · ${set.label}`}>
                <div className="space-y-1.5">
                  {[...set.rows].filter((r) => r.sent > 0).sort((a, b) => b.clickRate - a.clickRate).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 text-sm">
                      <span className="w-28 shrink-0 font-bold text-slate-700 text-[12px] truncate" title={r.label}>{r.label}</span>
                      <span className="flex-1 min-w-0 text-slate-500 truncate text-[12px]" title={r.example}>{r.example}</span>
                      <span className="shrink-0 text-slate-400 text-xs tabular-nums">{r.clicked}/{r.sent}</span>
                      <div className="w-20 shrink-0 hidden sm:block h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div style={{ width: `${Math.min(100, r.clickRate * 10)}%`, background: VIOLET }} className="h-full" />
                      </div>
                      <span className="w-12 shrink-0 text-right font-bold tabular-nums" style={{ color: VIOLET }}>{r.clickRate}%</span>
                    </div>
                  ))}
                </div>
                {set.sent < 60 && (
                  <p className="mt-3 text-[11px] text-slate-400">Only {set.sent} sends across these lines so far — too few to trust the ranking yet.</p>
                )}
              </Card>
            ))}

            {/* Failures */}
            {(d?.failures || []).length > 0 && (
              <Card title={`Recent failures · ${d?.health.failRate ?? 0}% of all sends`}>
                <ul className="divide-y divide-slate-100">
                  {(d?.failures || []).map((f2, i) => (
                    <li key={i} className="py-2 flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-700 truncate">{f2.to} <span className="font-normal text-slate-400">· {f2.recipientType}</span></div>
                        <div className="text-xs text-slate-500 truncate">{f2.subject}</div>
                        {f2.lastError && <div className="text-xs text-rose-600 truncate">{f2.lastError}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}

function Stat({ label, value, accent, sub }: { label: string; value: string; accent?: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{label}</div>
      <div className="text-2xl font-extrabold mt-1" style={{ color: accent || "#0f172a" }}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniStat({ label, value, accent, Icon }: { label: string; value: string; accent?: string; Icon?: typeof Users }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div className="text-lg font-extrabold mt-0.5 tabular-nums" style={{ color: accent || "#0f172a" }}>{value}</div>
    </div>
  );
}

function FunnelStep({ label, value, color, pctOfPrev }: { label: string; value: number; color: string; pctOfPrev: number | null }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-white">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-2xl font-extrabold mt-1 tabular-nums" style={{ color }}>{value.toLocaleString()}</div>
      {pctOfPrev != null && (
        <div className="mt-1.5">
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div style={{ width: `${Math.min(100, pctOfPrev)}%`, background: color }} className="h-full rounded-full" />
          </div>
          <div className="text-[10px] text-slate-400 mt-1 tabular-nums">{pctOfPrev}% of previous step</div>
        </div>
      )}
    </div>
  );
}

function Card({ title, children, tight }: { title: string; children: React.ReactNode; tight?: boolean }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${tight ? "p-4" : "p-5"} mb-4`}>
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-3">{title}</div>
      {children}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />{label}</span>
  );
}

function EngRow({ label, e, Icon, color, bold }: { label: string; e?: Eng; Icon?: typeof Award; color?: string; bold?: boolean }) {
  return (
    <tr className={`border-t border-slate-100 ${bold ? "font-bold" : ""}`}>
      <td className="py-2.5 pr-4">
        <span className="inline-flex items-center gap-1.5 text-slate-800">
          {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />} {label}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">{e?.delivered ?? 0}</td>
      <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">{e?.clicked ?? 0}</td>
      <td className="py-2.5 px-3 text-right tabular-nums font-bold" style={{ color: VIOLET }}>{e?.rate ?? 0}%</td>
      <td className="py-2.5 pl-3 text-right tabular-nums text-slate-500">{e?.medianMs != null ? medianLabel([e.medianMs]) : "—"}</td>
    </tr>
  );
}
