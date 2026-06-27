"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, RefreshCw, Award, Ticket, AlertTriangle } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { medianLabel } from "@/lib/engagement";

type Eng = { delivered: number; clicked: number; rate: number; medianMs: number | null };
type Analytics = {
  counts: Record<string, number>;
  sent: { total: number; last24h: number; last7d: number; last30d: number; byType: Record<string, number> };
  daily: { day: string; attendee: number; sponsor: number; other: number }[];
  engagement: { attendees: Eng; sponsors: Eng; combined: Eng };
  conversion: { attendees: { sent: number; paid: number; rate: number }; sponsors: { sent: number; paid: number; rate: number } };
  ab: { id: string; label: string; example: string; sent: number; clicked: number }[];
  failures: { to: string; subject: string; lastError: string | null; recipientType: string; attempts: number; scheduledFor: string | null }[];
};

const TEAL = "#0E5566", AMBER = "#D97706", SLATE = "#94a3b8", VIOLET = "#7C3AED";

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
                <p className="text-sm text-slate-500">Volume, engagement, and conversion across every invite we send.</p>
              </div>
              <button onClick={load} className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Reload
              </button>
            </div>

            {/* Top stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              <Stat label="Sent (all time)" value={(d?.sent.total || 0).toLocaleString()} />
              <Stat label="Sent (7 days)" value={(d?.sent.last7d || 0).toLocaleString()} accent="#059669" />
              <Stat label="Pending" value={(d?.counts?.pending || 0).toLocaleString()} accent="#0066B3" />
              <Stat label="Failed" value={(d?.counts?.failed || 0).toLocaleString()} accent={(d?.counts?.failed || 0) > 0 ? "#e11d48" : undefined} />
            </div>

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
              <p className="mt-3 text-[11px] text-slate-400">Delivered = invites sent (we have no SMTP delivery receipt). Clicked = they opened their personal link. Time to click is measured from the send.</p>
            </Card>

            {/* Conversion */}
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <Card title="Attendee conversion" tight>
                <ConvBody sent={d?.conversion.attendees.sent || 0} paid={d?.conversion.attendees.paid || 0} rate={d?.conversion.attendees.rate || 0} color={TEAL} noun="registered" />
              </Card>
              <Card title="Sponsor conversion" tight>
                <ConvBody sent={d?.conversion.sponsors.sent || 0} paid={d?.conversion.sponsors.paid || 0} rate={d?.conversion.sponsors.rate || 0} color={AMBER} noun="confirmed" />
              </Card>
            </div>

            {/* Subject A/B */}
            {(d?.ab || []).some((r) => r.sent > 0) && (
              <Card title="Alumni subject lines · A/B click rate">
                <div className="space-y-1.5">
                  {(d?.ab || []).filter((r) => r.sent > 0).sort((a, b) => (b.clicked / b.sent) - (a.clicked / a.sent)).map((r) => {
                    const rate = r.sent ? Math.round((r.clicked / r.sent) * 100) : 0;
                    return (
                      <div key={r.id} className="flex items-center gap-3 text-sm">
                        <span className="w-16 shrink-0 font-bold text-slate-700">{r.label}</span>
                        <span className="flex-1 min-w-0 text-slate-500 truncate" title={r.example}>{r.example.replace(/^Alex,\s*/, "")}</span>
                        <span className="shrink-0 text-slate-400 text-xs tabular-nums">{r.clicked}/{r.sent}</span>
                        <div className="w-24 shrink-0 hidden sm:block h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div style={{ width: `${rate}%`, background: VIOLET }} className="h-full" />
                        </div>
                        <span className="w-10 shrink-0 text-right font-bold tabular-nums" style={{ color: VIOLET }}>{rate}%</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Failures */}
            {(d?.failures || []).length > 0 && (
              <Card title="Recent failures">
                <ul className="divide-y divide-slate-100">
                  {(d?.failures || []).map((f, i) => (
                    <li key={i} className="py-2 flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-700 truncate">{f.to} <span className="font-normal text-slate-400">· {f.recipientType}</span></div>
                        <div className="text-xs text-slate-500 truncate">{f.subject}</div>
                        {f.lastError && <div className="text-xs text-rose-600 truncate">{f.lastError}</div>}
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{label}</div>
      <div className="text-2xl font-extrabold mt-1" style={{ color: accent || "#0f172a" }}>{value}</div>
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

function ConvBody({ sent, paid, rate, color, noun }: { sent: number; paid: number; rate: number; color: string; noun: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold" style={{ color }}>{rate}%</span>
        <span className="text-sm text-slate-500">{paid} {noun} of {sent} emailed</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div style={{ width: `${Math.min(100, rate)}%`, background: color }} className="h-full" />
      </div>
    </div>
  );
}
