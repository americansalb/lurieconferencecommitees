"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  CalendarClock, Plus, RefreshCw, Video, Clock, ExternalLink, Loader2, CalendarDays,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import AvailabilityEditor from "@/components/meetings/AvailabilityEditor";
import SendBookingInvite from "@/components/meetings/SendBookingInvite";

type Presenter = { id: string; name: string; email: string };
type Invite = {
  id: string;
  inviteeName: string;
  inviteeEmail: string;
  durationMin: number;
  title: string | null;
  status: string;
  createdAt: string;
  booking: null | {
    startAt: string;
    inviteeTz: string;
    zoomJoinUrl: string | null;
    assignedUser: { name: string; email: string };
  };
};

export default function MeetingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"bookings" | "availability">("bookings");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, pRes] = await Promise.all([
        fetch("/api/meetings/invite"),
        fetch("/api/presenters"),
      ]);
      if (iRes.ok) setInvites((await iRes.json()).invites || []);
      if (pRes.ok) {
        const rows = await pRes.json();
        const list: Presenter[] = (Array.isArray(rows) ? rows : [])
          .filter((r: { status?: string }) => r.status === "proposed")
          .map((r: { id: string; name: string; email: string }) => ({ id: r.id, name: r.name, email: r.email }));
        setPresenters(list);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  const upcoming = invites.filter((i) => i.booking && new Date(i.booking.startAt) >= new Date());
  const pending = invites.filter((i) => i.status === "sent");

  function fmtWhen(iso: string, tz: string) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz, weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    }).format(new Date(iso));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
                  <CalendarClock className="w-3.5 h-3.5" /> Meetings
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">Meetings</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Invite proposal submitters to book a Zoom conversation on your availability.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" /> Send booking invite
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 mb-5">
              <TabBtn active={tab === "bookings"} onClick={() => setTab("bookings")} icon={<CalendarDays className="w-4 h-4" />}>Bookings</TabBtn>
              <TabBtn active={tab === "availability"} onClick={() => setTab("availability")} icon={<Clock className="w-4 h-4" />}>My availability</TabBtn>
              {tab === "bookings" && (
                <button onClick={load} className="ml-auto p-2 text-slate-400 hover:text-slate-600" title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>

            {tab === "availability" ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <AvailabilityEditor />
              </div>
            ) : loading ? (
              <div className="p-12 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : (
              <div className="space-y-6">
                {/* Upcoming */}
                <Section title="Upcoming meetings" count={upcoming.length}>
                  {upcoming.length === 0 ? (
                    <Empty>No meetings booked yet.</Empty>
                  ) : upcoming.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#0E55660F" }}>
                        <Video className="w-5 h-5 text-[#0E5566]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 truncate">{i.inviteeName}</div>
                        <div className="text-[12px] text-slate-500">
                          {i.booking && fmtWhen(i.booking.startAt, i.booking.inviteeTz)} · with {i.booking?.assignedUser.name}
                        </div>
                      </div>
                      {i.booking?.zoomJoinUrl && (
                        <a href={i.booking.zoomJoinUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E5566] hover:underline shrink-0">
                          Zoom <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </Section>

                {/* Pending invites */}
                <Section title="Awaiting booking" count={pending.length}>
                  {pending.length === 0 ? (
                    <Empty>No outstanding invites.</Empty>
                  ) : pending.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-50">
                        <Clock className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 truncate">{i.inviteeName}</div>
                        <div className="text-[12px] text-slate-500 truncate">{i.inviteeEmail} · {i.durationMin} min · invited {new Date(i.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full shrink-0">Sent</span>
                    </div>
                  ))}
                </Section>
              </div>
            )}
          </div>
        </main>
        <MobileNav />
      </div>

      {showInvite && (
        <SendBookingInvite
          presenters={presenters}
          onClose={() => setShowInvite(false)}
          onSent={() => { setShowInvite(false); load(); }}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active ? "border-[#0E5566] text-[#0E5566]" : "border-transparent text-slate-500 hover:text-slate-700"
      }`}>
      {icon} {children}
    </button>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold tracking-wide uppercase text-slate-400 mb-2">{title} {count > 0 && <span className="text-slate-300">({count})</span>}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-6 text-center text-sm text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">{children}</div>;
}
