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
