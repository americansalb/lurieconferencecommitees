"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Hand, Loader2, Mail, Check, Clock, Gauge, Globe2 } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { aslCertSummary } from "@/lib/asl-certs";
import { CONFERENCE_TZ, availabilityRanges } from "@/lib/asl-slots";

// Review page for /asl interpreter submissions. Submitting the public form
// emails the interpreter nothing; the Accept button here is what sends their
// confirmation email and marks them accepted. Any member can look; only
// admins can accept.

type Interpreter = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  certifications: string[];
  certificationOther: string | null;
  ridNumber: string | null;
  yearsFluent: number;
  yearsInterpreting: number;
  timezone: string;
  hourlyCents: number;
  availability: string[];
  notes: string | null;
  speedDownMbps: number | null;
  speedUpMbps: number | null;
  speedPingMs: number | null;
  status: string;
  acceptedAt: string | null;
  // When we asked where to send their payment.
  paymentAskedAt?: string | null;
  createdAt: string;
};

function chicagoStamp(iso: string): string {
  return (
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: CONFERENCE_TZ,
    }) + " CT"
  );
}

export default function AslTeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [interpreters, setInterpreters] = useState<Interpreter[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showPay, setShowPay] = useState(false);
  const [payBusy, setPayBusy] = useState<string | null>(null);
  const [payNote, setPayNote] = useState<string | null>(null);
  // Ticks for the payment ask. Null = untouched, and the default is everyone
  // accepted: unlike the presenters, being on this team means being paid.
  const [payPicked, setPayPicked] = useState<Set<string> | null>(null);

  const isAdmin = ["admin", "developer"].includes(
    (session?.user as { role?: string } | undefined)?.role || ""
  );

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/asl/interpreters");
      if (res.ok) {
        const data = await res.json();
        setInterpreters(data.interpreters);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  async function accept(person: Interpreter) {
    const resend = person.status === "accepted";
    const ok = window.confirm(
      resend
        ? `Resend the confirmation email to ${person.fullName} (${person.email})?`
        : `Accept ${person.fullName} and send their confirmation email to ${person.email}?`
    );
    if (!ok) return;
    setBusyId(person.id);
    setError("");
    try {
      const res = await fetch(`/api/asl/interpreters/${person.id}/accept`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Something went wrong.");
        return;
      }
      setInterpreters((prev) =>
        prev.map((p) =>
          p.id === person.id
            ? { ...p, status: data.status, acceptedAt: data.acceptedAt ?? p.acceptedAt }
            : p
        )
      );
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  const acceptedPeople = interpreters.filter((p) => p.status === "accepted");
  const payPickedSet = payPicked ?? new Set(acceptedPeople.map((p) => p.id));
  const payToSend = acceptedPeople.filter((p) => payPickedSet.has(p.id) && !p.paymentAskedAt);

  async function requestPayment(kind: "one" | "bulk" | "test", one?: Interpreter) {
    setPayBusy(kind === "one" && one ? one.id : kind);
    setPayNote(null);
    try {
      const body =
        kind === "test" ? { mode: "all", test: true, ...(payToSend[0] ? { ids: [payToSend[0].id] } : {}) }
        : kind === "one" && one ? { mode: "all", ids: [one.id] }
        : { mode: "initial", ids: payToSend.map((p) => p.id) };
      const res = await fetch("/api/asl/request-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      setPayNote(res.ok
        ? j.sent
          ? kind === "test"
            ? `Test copy sent to ${(j.recipients || [])[0]}. Nobody was marked as asked.`
            : `Sent to ${(j.recipients || []).join(", ")}.`
          : "Nobody to send to."
        : (j.error || (j.failures || [])[0]?.error || "Could not send."));
      if (kind !== "test") await load();
    } catch {
      setPayNote("Network error while sending.");
    } finally {
      setPayBusy(null);
      setTimeout(() => setPayNote(null), 12000);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const acceptedCount = interpreters.filter((p) => p.status === "accepted").length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Hand className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-slate-900">ASL team</h1>
                <p className="text-xs text-slate-500">
                  {interpreters.length} submission{interpreters.length === 1 ? "" : "s"} ·{" "}
                  {acceptedCount} accepted · the public form is at /asl
                </p>
              </div>
            </div>

            {!isAdmin && interpreters.length > 0 && (
              <p className="text-xs text-slate-500 mb-4">
                Accepting an interpreter (which sends their confirmation email) is admin-only.
              </p>
            )}
            {error && (
              <p className="text-sm font-medium text-red-600 mb-4" role="alert">
                {error}
              </p>
            )}

            {/* Paying the team, mirroring the presenters' honorarium panel:
                a test copy to yourself, then send one at a time from a ticked
                list. Everyone accepted starts ticked, because being on this
                team means being paid; untick anyone who ended up not working. */}
            {isAdmin && acceptedPeople.length > 0 && (
              <div className="rounded-2xl p-4 shadow-sm mb-5 border" style={{ background: "linear-gradient(180deg,#F5F3FF,#ffffff)", borderColor: "#DDD6FE" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                      Payment
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {acceptedPeople.filter((p) => p.paymentAskedAt).length}/{acceptedPeople.length} asked
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Thanks each interpreter and asks where to send their payment: they reply with a
                      mailing address for a check, or invoice <strong className="text-slate-700">invoice@aalb.org</strong>.
                      The email names no dollar figure and asks them to include their hours. Untick anyone
                      who ended up not working the conference.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void requestPayment("test")}
                      disabled={payBusy !== null}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50"
                      style={{ background: "linear-gradient(90deg,#7C3AED,#6D28D9)" }}
                      title="Send yourself one copy. Marks nobody as asked."
                    >
                      {payBusy === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Send me a test copy
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPay((v) => !v)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border text-[#6D28D9] border-[#DDD6FE] bg-white"
                    >
                      {showPay ? "Hide the list" : `Choose who to send to (${acceptedPeople.length})`}
                    </button>
                  </div>
                </div>
                {payNote && <div className="mt-2 text-xs font-semibold text-[#6D28D9]">{payNote}</div>}

                {showPay && (
                  <div className="mt-3 rounded-xl border border-[#DDD6FE] bg-white overflow-hidden">
                    {acceptedPeople.map((p) => (
                      <div key={p.id} className="px-3 py-2.5 flex items-center gap-3 border-b border-slate-100 last:border-0">
                        <input
                          type="checkbox"
                          checked={payPickedSet.has(p.id)}
                          onChange={() => setPayPicked((prev) => {
                            const next = new Set(prev ?? acceptedPeople.map((x) => x.id));
                            if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                            return next;
                          })}
                          className="w-4 h-4 shrink-0 accent-[#6D28D9] cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold text-slate-900 truncate">{p.fullName}</div>
                          <div className="text-[11.5px] text-slate-500 truncate">
                            {p.email} · ${(p.hourlyCents / 100).toFixed(0)}/hr
                          </div>
                        </div>
                        {p.paymentAskedAt && (
                          <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                            Asked {chicagoStamp(p.paymentAskedAt)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => void requestPayment("one", p)}
                          disabled={payBusy !== null}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border disabled:opacity-40 text-[#6D28D9] border-[#DDD6FE] bg-white hover:bg-[#F5F3FF]"
                        >
                          {payBusy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          {payBusy === p.id ? "Sending" : p.paymentAskedAt ? "Send again" : "Send"}
                        </button>
                      </div>
                    ))}
                    <div className="px-3 py-2.5 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-[11.5px] text-slate-500">
                        {payPickedSet.size === 0
                          ? "Nobody is ticked."
                          : payToSend.length === 0
                          ? "Everyone ticked has already been asked."
                          : `Ticked and not yet asked: ${payToSend.map((p) => p.fullName).join(", ")}.`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!payToSend.length) return;
                          if (window.confirm(
                            `Email these ${payToSend.length} interpreter${payToSend.length === 1 ? "" : "s"}?\n\n` +
                            payToSend.map((p) => `  ${p.fullName} <${p.email}>`).join("\n") +
                            `\n\nThis sends immediately and cannot be taken back.`
                          )) {
                            void requestPayment("bulk");
                          }
                        }}
                        disabled={payBusy !== null || payToSend.length === 0}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border disabled:opacity-40 text-slate-600 border-slate-200 bg-white"
                      >
                        {payBusy === "bulk" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        {payToSend.length === 0 ? "Nobody ticked to send" : `Send to the ${payToSend.length} ticked`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div className="text-center py-10 text-sm text-slate-400">Loading…</div>
            ) : interpreters.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
                <Hand className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No interpreter submissions yet</p>
                <p className="text-xs text-slate-400 mt-2">
                  Share conference.aalb.org/asl with the interpreters you want to invite.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {interpreters.map((person) => {
                  const ranges = availabilityRanges(new Set(person.availability), CONFERENCE_TZ);
                  const totalHours = person.availability.length;
                  const rate = person.hourlyCents / 100;
                  const accepted = person.status === "accepted";
                  return (
                    <div
                      key={person.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-[15px] font-bold text-slate-900">{person.fullName}</h2>
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                                accepted
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {accepted ? "Accepted" : "Awaiting review"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {person.email}
                            {person.phone ? ` · ${person.phone}` : ""} · submitted{" "}
                            {chicagoStamp(person.createdAt)}
                            {accepted && person.acceptedAt
                              ? ` · accepted ${chicagoStamp(person.acceptedAt)}`
                              : ""}
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => accept(person)}
                            disabled={busyId === person.id}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 transition disabled:opacity-50 ${
                              accepted
                                ? "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                                : "bg-teal-700 text-white hover:bg-teal-800"
                            }`}
                          >
                            {busyId === person.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : accepted ? (
                              <Mail className="w-3.5 h-3.5" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            {accepted ? "Resend confirmation" : "Accept and email them"}
                          </button>
                        )}
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-[13px] text-slate-700">
                        <div>
                          <span className="font-semibold text-slate-900">Certifications:</span>{" "}
                          {aslCertSummary(
                            person.certifications,
                            person.ridNumber,
                            person.certificationOther
                          ) || "Not answered"}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Experience:</span> fluent{" "}
                          {person.yearsFluent} yr · interpreting {person.yearsInterpreting} yr
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                          {person.timezone.replace(/_/g, " ")}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" />
                          {person.speedDownMbps !== null
                            ? `${person.speedDownMbps} Mbps down${
                                person.speedUpMbps !== null ? ` · ${person.speedUpMbps} Mbps up` : ""
                              }${person.speedPingMs !== null ? ` · ${person.speedPingMs} ms ping` : ""}`
                            : "Connection check incomplete"}
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-[13px] text-slate-700">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {totalHours} hour{totalHours === 1 ? "" : "s"} at ${rate.toFixed(2)}/hr
                          <span className="font-normal text-slate-500">
                            (up to ${(rate * totalHours).toFixed(2)} if all hours are used)
                          </span>
                        </div>
                        {ranges.map((r) => (
                          <p key={r.day.key} className="mt-1">
                            {r.day.label}: {r.text} CT
                          </p>
                        ))}
                      </div>

                      {person.notes && (
                        <p className="mt-3 text-[13px] text-slate-600">
                          <span className="font-semibold text-slate-900">Notes:</span> {person.notes}
                        </p>
                      )}
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
