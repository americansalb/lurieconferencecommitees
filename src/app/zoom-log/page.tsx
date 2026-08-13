"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Video, RefreshCw, Loader2, ShieldAlert } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

// Every recorded click on the personal Zoom links (/z/<token>/<day>), one
// place, newest first. The same events also sit on each attendee's timeline;
// this page exists so a leak can be spotted without opening 150 drawers:
// one attendee with clicks from many IP addresses is the tell.

type Click = {
  id: string;
  createdAt: string;
  meta: string | null;
  attendee: { id: string; firstName: string; lastName: string; email: string; attendDay: string | null };
};

type Meta = { day?: string; allowed?: boolean; ip?: string | null; ua?: string | null };

function parseMeta(meta: string | null): Meta {
  if (!meta) return {};
  try {
    return JSON.parse(meta) as Meta;
  } catch {
    return {};
  }
}

function stamp(iso: string): string {
  return (
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Chicago",
    }) + " CT"
  );
}

export default function ZoomLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clicks, setClicks] = useState<Click[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/attendees/zoom-clicks");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not load the log.");
      } else {
        setClicks(data.clicks);
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  // How many distinct IPs each attendee's links have been clicked from. More
  // than a couple is the signature of a shared or leaked link.
  const ipsPerAttendee = new Map<string, Set<string>>();
  for (const c of clicks) {
    const m = parseMeta(c.meta);
    if (!m.ip) continue;
    const set = ipsPerAttendee.get(c.attendee.id) || new Set<string>();
    set.add(m.ip);
    ipsPerAttendee.set(c.attendee.id, set);
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-slate-900">Zoom link log</h1>
                <p className="text-xs text-slate-500">
                  Every click on a personal join link, newest first. One person clicked from many
                  IP addresses means their link was shared.
                </p>
              </div>
              <button
                onClick={load}
                disabled={loading}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Refresh
              </button>
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600 mb-4" role="alert">
                {error}
              </p>
            )}

            {loading && clicks.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">Loading…</div>
            ) : clicks.length === 0 && !error ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
                <Video className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No clicks recorded yet</p>
                <p className="text-xs text-slate-400 mt-2">
                  Clicks appear here the moment anyone opens a personal Zoom link from the virtual
                  info email or an attendee portal.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
                {clicks.map((c) => {
                  const m = parseMeta(c.meta);
                  const ipCount = ipsPerAttendee.get(c.attendee.id)?.size || 0;
                  return (
                    <div key={c.id} className="px-4 py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-[12px] text-slate-400 tabular-nums w-40 shrink-0">{stamp(c.createdAt)}</span>
                      <span className="text-[13px] font-bold text-slate-900">
                        {c.attendee.firstName} {c.attendee.lastName}
                      </span>
                      <span className="text-[12px] text-slate-500">{c.attendee.email}</span>
                      <span className="text-[12px] font-semibold text-slate-700">
                        {m.day === "sun" ? "Sunday room" : m.day === "sat" ? "Saturday room" : m.day || "?"}
                      </span>
                      {m.allowed === false && (
                        <span className="text-[11px] font-bold text-rose-600 inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> blocked
                        </span>
                      )}
                      {ipCount > 2 && (
                        <span className="text-[11px] font-bold text-amber-600">{ipCount} different IPs on this person</span>
                      )}
                      <span className="text-[11.5px] text-slate-400 break-all">
                        {m.ip || "no IP"}
                        {m.ua ? ` · ${m.ua.slice(0, 70)}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
