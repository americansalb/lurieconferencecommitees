"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Download, FileText, Loader2, MessageSquareText } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import FeedbackTabs from "@/components/feedback/FeedbackTabs";
import { formLabel } from "@/lib/feedback";
import type { RidForm, RidReport } from "@/lib/rid-ceu-report";

// The RID CEU list for Vancro, compiled from the session feedback forms: who
// asked for RID CEUs, at which of the 13 sponsored sessions, in the columns of
// Vancro's RID CEU Upload Form. The team adds Vancro's Workshop IDs, checks
// what needs a look, and downloads the file.

const HOW: Record<NonNullable<RidForm["how"]>, string> = {
  chosen: "chosen by hand",
  day: "from the form's day number",
  names: "from the presenters",
  title: "from the form's title",
};

export default function RidCeuPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<RidReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workshopIds, setWorkshopIds] = useState<Record<string, string>>({});
  const [ceus, setCeus] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = (j: RidReport) => {
    setData(j);
    setWorkshopIds(Object.fromEntries(j.sessions.map((s) => [s.key, s.workshopId])));
    setCeus(Object.fromEntries(j.sessions.map((s) => [s.key, s.ceus])));
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.replace("/login"); return; }
    fetch("/api/feedback/rid-ceu")
      .then(async (res) => {
        const j = await res.json();
        if (res.ok) load(j); else setError(j.error || "Could not load the RID list.");
      })
      .catch(() => setError("Could not load the RID list."));
  }, [session, status, router]);

  const dirty = useMemo(() => !!data && data.sessions.some((s) =>
    (workshopIds[s.key] ?? "") !== s.workshopId || (ceus[s.key] ?? "") !== s.ceus), [data, workshopIds, ceus]);

  const post = async (body: object) => {
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await fetch("/api/feedback/rid-ceu", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Could not save."); return; }
      load(j);
      setSaved(true);
    } catch {
      setError("Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const saveSessions = () => {
    if (!data) return;
    // A CEU amount left as the default is not stored, so a later change to
    // the program carries through.
    const ceuPatch = Object.fromEntries(data.sessions.map((s) => {
      const v = (ceus[s.key] ?? "").trim();
      return [s.key, v === s.defaultCeus ? "" : v];
    }));
    post({ workshopIds, ceus: ceuPatch });
  };

  if (status === "loading" || (!data && !error)) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  const sessionName = (key: string | null) => {
    const s = data?.sessions.find((x) => x.key === key);
    return s ? `Day ${s.day}.${s.n}: ${s.title}` : "Not one of the 13 sessions";
  };
  const empty = data ? data.sessions.filter((s) => s.people === 0) : [];
  const missingIds = data ? data.sessions.filter((s) => s.people > 0 && !s.workshopId).length : 0;
  const card = "bg-white rounded-2xl border border-slate-200 p-5 sm:p-6";
  const input = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0E5566]/20";

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
              <MessageSquareText className="w-3.5 h-3.5" /> Session feedback
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">RID CEUs</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              Everyone who asked for RID CEUs on a session&rsquo;s feedback form, laid out as Vancro&rsquo;s RID CEU
              Upload Form. Add Vancro&rsquo;s Workshop ID for each session, check what needs a look, then download the file.
            </p>
            <FeedbackTabs active="rid" />

            {error && <div className="mt-6 text-sm font-semibold text-rose-700">{error}</div>}

            {data && data.totals.responses === 0 && (
              <div className={`mt-8 ${card} text-center text-slate-500`}>
                No feedback forms imported yet. Upload them under Import and manage, then come back here.
              </div>
            )}

            {data && data.totals.responses > 0 && (
              <div className="mt-6 space-y-6">
                {data.totals.formsAsking === 0 && (
                  <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13.5px] text-amber-900">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      None of the {data.totals.forms} imported form{data.totals.forms === 1 ? "" : "s"} has a question about RID
                      CEUs or an RID number. Every column of every row was kept at import, so if the forms in Google asked
                      about RID, this means that question was under some other wording. The questions each form was read
                      from are listed under Forms below.
                    </div>
                  </div>
                )}

                <section className={card}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
                      {([
                        ["Lines in the file", data.totals.rows],
                        ["People", data.totals.people],
                        ["Sessions with RID attendees", `${data.totals.sessionsWith} of ${data.sessions.length}`],
                        ["Need a look", data.totals.issues],
                      ] as [string, string | number][]).map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-[12px] text-slate-500">{label}</dt>
                          <dd className="text-[26px] font-semibold text-slate-900 leading-tight">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="flex flex-col items-stretch gap-2">
                      <a href="/api/feedback/rid-ceu?format=csv"
                         className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-white"
                         style={{ background: "#0E5566" }}>
                        <Download className="w-4 h-4" /> RID CEU Upload Form (CSV)
                      </a>
                      <a href="/api/feedback/compiled?format=csv"
                         className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:border-slate-300">
                        <Download className="w-4 h-4" /> Evaluation results (CSV)
                      </a>
                    </div>
                  </div>
                  {missingIds > 0 && (
                    <p className="mt-4 text-[12.5px] text-slate-600">
                      {missingIds} session{missingIds === 1 ? " has" : "s have"} RID attendees but no Workshop ID yet. Until one
                      is added, those lines name the session in Notes so Vancro can tell which activity it was.
                    </p>
                  )}
                  {empty.length > 0 && (
                    <div className="mt-3 text-[12.5px] text-slate-600">
                      Nobody asked for RID CEUs at {empty.length} session{empty.length === 1 ? "" : "s"}, which Vancro can close out:
                      <ul className="mt-1 space-y-0.5 text-slate-500">
                        {empty.map((s) => <li key={s.key}>Day {s.day}.{s.n} &middot; {s.title}</li>)}
                      </ul>
                    </div>
                  )}
                </section>

                <section className={card}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="text-[18px] font-semibold text-slate-900">The 13 sessions</h2>
                    <div className="flex items-center gap-2">
                      {saved && !dirty && <span className="inline-flex items-center gap-1 text-[12.5px] text-emerald-700"><Check className="w-4 h-4" /> Saved</span>}
                      <button type="button" onClick={saveSessions} disabled={!dirty || saving}
                              className="rounded-xl px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
                              style={{ background: "#0E5566" }}>
                        {saving ? "Saving" : "Save"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-[12.5px] text-slate-500 max-w-3xl">
                    Workshop IDs come from Vancro&rsquo;s approval of each activity. CEUs start at the scheduled length (one
                    CEU is ten hours, so an hour is 0.1); change any that Vancro approved differently.
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="text-left text-[11.5px] text-slate-400 border-b border-slate-200">
                          <th className="py-2 pr-3 font-semibold">Session</th>
                          <th className="py-2 pr-3 font-semibold whitespace-nowrap">RID</th>
                          <th className="py-2 pr-3 font-semibold whitespace-nowrap">Workshop ID</th>
                          <th className="py-2 pr-3 font-semibold">CEUs</th>
                          <th className="py-2 pr-3 font-semibold whitespace-nowrap hidden md:table-cell">Evaluations</th>
                          <th className="py-2 font-semibold hidden md:table-cell">Slides</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.sessions.map((s) => (
                          <tr key={s.key} className="border-b border-slate-100 align-top">
                            <td className="py-2.5 pr-3 min-w-[16rem]">
                              <div className="text-[11.5px] text-slate-400">Day {s.day}.{s.n} &middot; {s.date} &middot; {s.time}</div>
                              <div className="font-semibold text-slate-800 leading-snug">{s.title}</div>
                              <div className="text-[11.5px] text-slate-500">{s.who.split("·")[0].trim()}</div>
                            </td>
                            <td className="py-2.5 pr-3 tabular-nums text-slate-700">{s.people}</td>
                            <td className="py-2.5 pr-3 w-36">
                              <input value={workshopIds[s.key] ?? ""} placeholder="From Vancro"
                                     onChange={(e) => setWorkshopIds((cur) => ({ ...cur, [s.key]: e.target.value }))}
                                     className={input} />
                            </td>
                            <td className="py-2.5 pr-3 w-24">
                              <input value={ceus[s.key] ?? ""} inputMode="decimal"
                                     onChange={(e) => setCeus((cur) => ({ ...cur, [s.key]: e.target.value }))}
                                     className={input} />
                              <div className="mt-0.5 text-[11px] text-slate-400 whitespace-nowrap">{s.minutes} min</div>
                            </td>
                            <td className="py-2.5 pr-3 tabular-nums text-slate-700 hidden md:table-cell">{s.responses}</td>
                            <td className="py-2.5 hidden md:table-cell">
                              {s.slides.length ? s.slides.map((sl) => (
                                <a key={sl.href} href={sl.href} target="_blank" rel="noopener noreferrer"
                                   className="flex items-center gap-1 text-[12.5px] text-[#0E5566] hover:underline whitespace-nowrap">
                                  <FileText className="w-3.5 h-3.5" /> {sl.name}
                                </a>
                              )) : <span className="text-[12.5px] text-slate-400">None on file</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {data.issues.length > 0 && (
                  <section className={card}>
                    <h2 className="text-[18px] font-semibold text-slate-900">Need a look <span className="font-normal text-slate-400">({data.issues.length})</span></h2>
                    <p className="mt-1 text-[12.5px] text-slate-500 max-w-3xl">
                      These people asked for RID CEUs, or may have, but are not in the file because something is missing
                      or unclear. Each one needs a reply or a fix before Vancro can credit them.
                    </p>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="text-left text-[11.5px] text-slate-400 border-b border-slate-200">
                            <th className="py-2 pr-3 font-semibold">Person</th>
                            <th className="py-2 pr-3 font-semibold">What is wrong</th>
                            <th className="py-2 font-semibold">Session</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.issues.map((i, n) => (
                            <tr key={n} className="border-b border-slate-100 align-top">
                              <td className="py-2.5 pr-3">
                                <div className="font-semibold text-slate-800">{i.name || "No name given"}</div>
                                {i.email && <div className="text-[11.5px] text-slate-500 break-all">{i.email}</div>}
                              </td>
                              <td className="py-2.5 pr-3 text-slate-700">{i.reason}</td>
                              <td className="py-2.5 text-[12.5px] text-slate-500">
                                {i.sessionKey ? sessionName(i.sessionKey) : <span title={i.form}>{formLabel(i.form)}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                <section className={card}>
                  <h2 className="text-[18px] font-semibold text-slate-900">In the file <span className="font-normal text-slate-400">({data.rows.length})</span></h2>
                  {data.rows.length === 0 ? (
                    <p className="mt-2 text-[13px] text-slate-500">Nobody yet.</p>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="text-left text-[11.5px] text-slate-400 border-b border-slate-200">
                            <th className="py-2 pr-3 font-semibold whitespace-nowrap">Member ID</th>
                            <th className="py-2 pr-3 font-semibold whitespace-nowrap">Last name</th>
                            <th className="py-2 pr-3 font-semibold">Session</th>
                            <th className="py-2 pr-3 font-semibold hidden md:table-cell">Attended</th>
                            <th className="py-2 font-semibold">Check</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.rows.map((r) => (
                            <tr key={`${r.sessionKey}-${r.memberId}`} className="border-b border-slate-100 align-top">
                              <td className="py-2 pr-3 tabular-nums text-slate-800">{r.memberId}</td>
                              <td className="py-2 pr-3">
                                <div className="font-semibold text-slate-800">{r.lastName}</div>
                                {r.fullName && r.fullName !== r.lastName && <div className="text-[11.5px] text-slate-500">{r.fullName}</div>}
                              </td>
                              <td className="py-2 pr-3 text-[12.5px] text-slate-600">{sessionName(r.sessionKey)}</td>
                              <td className="py-2 pr-3 text-[12.5px] text-slate-500 hidden md:table-cell">{r.segment || ""}</td>
                              <td className="py-2 text-[12px]">
                                {r.flags.map((f) => (
                                  <div key={f} className="mb-0.5 inline-block rounded bg-amber-50 px-1.5 text-amber-800">{f}</div>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="mt-3 text-[12px] text-slate-400 max-w-3xl">
                    This is everyone who asked on a form. Virtual attendees earn CEUs only with their camera on for the
                    session, so take out anyone the Zoom logs do not support before sending.
                  </p>
                </section>

                <section className={card}>
                  <h2 className="text-[18px] font-semibold text-slate-900">Forms <span className="font-normal text-slate-400">({data.totals.forms})</span></h2>
                  <p className="mt-1 text-[12.5px] text-slate-500 max-w-3xl">
                    Each imported form, the session its answers count toward, and the questions the RID answers were read
                    from. If a form is matched to the wrong session, choose the right one.
                  </p>
                  <ul className="mt-4 divide-y divide-slate-100">
                    {data.forms.map((f) => (
                      <li key={f.key} className="py-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_18rem]">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 text-[13.5px] break-words" title={f.form}>{formLabel(f.form)}</div>
                          <div className="text-[11.5px] text-slate-500">
                            {f.general ? "Whole conference" : f.presenters.join(", ") || "No presenter assigned"}
                            {" "}&middot; {f.responses} response{f.responses === 1 ? "" : "s"}
                            {" "}&middot; {f.wanted} asked for RID
                          </div>
                          <div className="mt-1 text-[12px]">
                            {f.asks ? (
                              <span className="text-slate-600">
                                {f.columns.map((c) => <span key={c.header} className="mr-3"><span className="text-slate-400">{c.label}:</span> &ldquo;{c.header}&rdquo;</span>)}
                              </span>
                            ) : (
                              <span className="text-slate-400">No RID question found on this form</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <select
                            value={f.how === "chosen" ? (f.sessionKey || "none") : ""}
                            onChange={(e) => post({ forms: { [f.key]: e.target.value } })}
                            disabled={saving}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12.5px] text-slate-700"
                          >
                            <option value="">
                              {f.autoKey ? `Auto: ${sessionName(f.autoKey)}` : f.general ? "Auto: whole conference, no session" : "Auto: not matched"}
                            </option>
                            {data.sessions.map((s) => <option key={s.key} value={s.key}>Day {s.day}.{s.n}: {s.title}</option>)}
                            <option value="none">Not one of the 13 sessions</option>
                          </select>
                          {f.how && f.how !== "chosen" && <div className="mt-0.5 text-[11px] text-slate-400">Matched {HOW[f.how]}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
