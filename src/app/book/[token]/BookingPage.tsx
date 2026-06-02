"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar, Clock, Check, Loader2, Video, ChevronLeft, Globe, AlertCircle,
} from "lucide-react";

const TEAL = "#0E5566";
const BLUE = "#0066B3";

type Day = { dayKey: string; label: string; slots: { startAt: string; label: string }[] };
type InviteInfo = { inviteeName: string; title: string | null; message: string | null; durationMin: number };

export default function BookingPage({ token }: { token: string }) {
  const [tz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ startAt: string; label: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [booked, setBooked] = useState<{ startAt: string; hostName: string; joinUrl: string | null; durationMin: number } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/book/${token}/slots?tz=${encodeURIComponent(tz)}`);
        const json = await res.json();
        if (json.booked) { setError("This invitation has already been booked."); return; }
        if (!res.ok || !json.ok) { setError(json.error || "This booking link isn't valid."); return; }
        setInvite(json.invite);
        setDays(json.days);
        setActiveDay(json.days[0]?.dayKey ?? null);
      } catch {
        setError("Couldn't load available times. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, tz]);

  const activeDayObj = useMemo(() => days.find((d) => d.dayKey === activeDay), [days, activeDay]);

  async function confirm() {
    if (!picked) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/book/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: picked.startAt, tz }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Couldn't confirm that time. Please pick another.");
        // Refresh slots if the time was taken.
        if (res.status === 409) {
          const r = await fetch(`/api/book/${token}/slots?tz=${encodeURIComponent(tz)}`);
          const j = await r.json();
          if (j.ok) { setDays(j.days); setPicked(null); setActiveDay(j.days[0]?.dayKey ?? null); }
        }
        return;
      }
      setBooked({ startAt: json.booking.startAt, hostName: json.booking.hostName, joinUrl: json.booking.joinUrl, durationMin: json.booking.durationMin });
    } catch {
      setError("Network hiccup. Please try again.");
    } finally {
      setConfirming(false);
    }
  }

  function longWhen(iso: string) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz, weekday: "long", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short",
    }).format(new Date(iso));
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f7f3ea 0%, #ffffff 55%, #f0f6f7 100%)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3" style={{ background: TEAL + "12", color: TEAL }}>
            <Calendar className="w-3 h-3" /> 2026 Conference
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {invite?.title || "Find a time to talk"}
          </h1>
          {invite && (
            <p className="text-sm text-slate-500 mt-2 inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {invite.durationMin} minutes · over Zoom
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="h-1.5" style={{ background: `linear-gradient(to right, ${TEAL} 0%, ${TEAL} 50%, ${BLUE} 50%, ${BLUE} 100%)` }} />

          {/* Booked confirmation */}
          {booked ? (
            <div className="p-7 sm:p-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5" style={{ background: TEAL + "15" }}>
                <Check className="w-8 h-8" style={{ color: TEAL }} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">You&rsquo;re booked.</h2>
              <p className="text-slate-600 max-w-md mx-auto">
                Your {booked.durationMin}-minute meeting with <strong>{booked.hostName}</strong> is confirmed for:
              </p>
              <div className="mt-4 inline-block rounded-xl px-5 py-3" style={{ background: TEAL + "0A", border: `1px solid ${TEAL}22` }}>
                <span className="text-lg font-bold text-slate-900">{longWhen(booked.startAt)}</span>
              </div>
              {booked.joinUrl ? (
                <div className="mt-6">
                  <a href={booked.joinUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all" style={{ background: TEAL }}>
                    <Video className="w-4 h-4" /> Join the Zoom meeting
                  </a>
                  <p className="text-xs text-slate-400 mt-3">A calendar invite and this link are on the way to your inbox.</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mt-6">A confirmation is on its way to your inbox with the Zoom details.</p>
              )}
            </div>
          ) : loading ? (
            <div className="p-16 text-center text-slate-400"><Loader2 className="w-7 h-7 animate-spin mx-auto" /></div>
          ) : error && !invite ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">{error}</p>
              <p className="text-sm text-slate-400 mt-2">If you think this is a mistake, reply to the email that brought you here.</p>
            </div>
          ) : days.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No open times right now.</p>
              <p className="text-sm text-slate-400 mt-2">Please reply to the invitation email and we&rsquo;ll find a time directly.</p>
            </div>
          ) : (
            <div className="p-5 sm:p-7">
              {invite?.message && (
                <div className="mb-5 px-4 py-3 rounded-lg text-sm text-slate-700 leading-relaxed" style={{ background: "#f8fafc", borderLeft: `3px solid ${BLUE}` }}>
                  {invite.message}
                </div>
              )}

              {!picked ? (
                <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5">
                  {/* Day rail */}
                  <div className="sm:border-r sm:border-slate-100 sm:pr-5">
                    <div className="text-[11px] font-bold tracking-wide uppercase text-slate-400 mb-2">Select a day</div>
                    <div className="flex sm:flex-col gap-2 overflow-x-auto pb-1">
                      {days.map((d) => (
                        <button
                          key={d.dayKey}
                          onClick={() => setActiveDay(d.dayKey)}
                          className={`text-left px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                            activeDay === d.dayKey ? "text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                          }`}
                          style={{ background: activeDay === d.dayKey ? TEAL : "transparent", border: activeDay === d.dayKey ? "none" : "1px solid #e2e8f0" }}
                        >
                          {d.label}
                          <span className={`block text-[11px] font-medium ${activeDay === d.dayKey ? "text-white/70" : "text-slate-400"}`}>
                            {d.slots.length} time{d.slots.length === 1 ? "" : "s"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Times */}
                  <div>
                    <div className="text-[11px] font-bold tracking-wide uppercase text-slate-400 mb-2">
                      {activeDayObj?.label}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
                      {activeDayObj?.slots.map((s) => (
                        <button
                          key={s.startAt}
                          onClick={() => setPicked(s)}
                          className="py-2.5 rounded-lg border-2 text-sm font-bold transition-all hover:shadow-sm"
                          style={{ borderColor: "#e2e8f0", color: TEAL }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = TEAL)}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Confirm step */
                <div className="max-w-md mx-auto text-center py-4">
                  <button onClick={() => { setPicked(null); setError(null); }} className="text-sm font-semibold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 mb-5">
                    <ChevronLeft className="w-4 h-4" /> Pick a different time
                  </button>
                  <div className="rounded-xl p-5 mb-5" style={{ background: TEAL + "0A", border: `1px solid ${TEAL}22` }}>
                    <div className="text-[11px] font-bold tracking-wide uppercase mb-1" style={{ color: TEAL }}>Your meeting</div>
                    <div className="text-lg font-bold text-slate-900">{longWhen(picked.startAt)}</div>
                    <div className="text-sm text-slate-500 mt-1">{invite?.durationMin} minutes · over Zoom</div>
                  </div>
                  {error && (
                    <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm inline-flex items-start gap-2 text-left">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                    </div>
                  )}
                  <button
                    onClick={confirm}
                    disabled={confirming}
                    className="w-full px-6 py-3.5 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    style={{ background: TEAL }}
                  >
                    {confirming ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</> : <><Check className="w-4 h-4" /> Confirm meeting</>}
                  </button>
                </div>
              )}

              {/* Timezone footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 inline-flex items-center justify-center gap-1.5 w-full">
                <Globe className="w-3.5 h-3.5" /> Times shown in your timezone ({tz.replace(/_/g, " ")})
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          2026 Lurie Children&rsquo;s &amp; AALB Conference · Questions? Reply to your invitation email.
        </p>
      </div>
    </div>
  );
}
