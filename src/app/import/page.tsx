"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Check, AlertCircle, Eye, ArrowRight } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { IMPORT_TYPES, type ImportType } from "@/lib/imports";

type PreviewRow = { cells: string[]; status: "new" | "update" | "exists" };
type ImportResponse = {
  ok: true;
  type: ImportType;
  committed: boolean;
  columns: string[];
  rows: PreviewRow[];
  stats: { total: number; create: number; update: number; skip: number };
  errors: string[];
};

const STATUS_STYLE: Record<PreviewRow["status"], { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  update: { label: "Update", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  exists: { label: "Skip", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

export default function ImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [type, setType] = useState<ImportType>("attendees");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [preview, setPreview] = useState<ImportResponse | null>(null);
  const [done, setDone] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin" || role === "developer";

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.replace("/login");
  }, [session, status, router]);

  const meta = useMemo(() => IMPORT_TYPES.find((t) => t.id === type)!, [type]);

  function reset() {
    setPreview(null);
    setDone(null);
    setError(null);
  }

  async function run(commit: boolean) {
    setBusy(commit ? "commit" : "preview");
    setError(null);
    if (!commit) setDone(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, text, commit }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      if (commit) { setDone(json); setPreview(null); }
      else setPreview(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
              <Upload className="w-3.5 h-3.5" /> Import
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">Import from a spreadsheet</h1>
            <p className="text-sm text-slate-500 mt-1">
              Paste rows from an old spreadsheet or form export, preview exactly what will happen, then import. Existing records are matched by email so re-importing is safe.
            </p>

            {!isAdmin ? (
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> Importing is limited to admins.
              </div>
            ) : (
              <>
                {/* Type picker */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {IMPORT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setType(t.id); reset(); }}
                      className={
                        "px-4 py-2 rounded-xl text-sm font-semibold border transition-colors " +
                        (type === t.id ? "bg-[#0E5566] text-white border-[#0E5566]" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 text-[13px] text-slate-500">
                  {meta.blurb} <span className="block mt-1 text-slate-400">Expected columns: {meta.expects}</span>
                </div>

                <textarea
                  value={text}
                  onChange={(e) => { setText(e.target.value); reset(); }}
                  placeholder={`Paste your ${meta.label} rows here (with or without the header row)…`}
                  rows={10}
                  className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[13px] font-mono leading-relaxed focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
                />

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => run(false)}
                    disabled={!text.trim() || busy !== null}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0E5566] bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    {busy === "preview" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Preview
                  </button>
                  {preview && (preview.stats.create + preview.stats.update) > 0 && (
                    <button
                      type="button"
                      onClick={() => run(true)}
                      disabled={busy !== null}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] disabled:opacity-40 shadow-sm"
                    >
                      {busy === "commit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      Import {preview.stats.create + preview.stats.update} record{preview.stats.create + preview.stats.update === 1 ? "" : "s"}
                    </button>
                  )}
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                  </div>
                )}

                {done && (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">Import complete.</div>
                      <div className="mt-0.5">
                        Created {done.stats.create}
                        {done.stats.update > 0 ? `, updated ${done.stats.update}` : ""}
                        , skipped {done.stats.skip} (already there). Open the matching dashboard to verify.
                      </div>
                    </div>
                  </div>
                )}

                {preview && (
                  <div className="mt-6">
                    <div className="flex flex-wrap gap-2 mb-3 text-[13px]">
                      <Chip label="New" value={preview.stats.create} cls="bg-emerald-50 text-emerald-700 border-emerald-200" />
                      {preview.stats.update > 0 && <Chip label="Update" value={preview.stats.update} cls="bg-amber-50 text-amber-800 border-amber-200" />}
                      <Chip label="Skip" value={preview.stats.skip} cls="bg-slate-100 text-slate-600 border-slate-200" />
                      <Chip label="Total" value={preview.stats.total} cls="bg-white text-slate-700 border-slate-200" />
                    </div>

                    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 text-left">
                              {preview.columns.map((c) => (
                                <th key={c} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>
                              ))}
                              <th className="px-3 py-2 font-semibold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {preview.rows.map((r, i) => (
                              <tr key={i} className={r.status === "exists" ? "text-slate-400" : "text-slate-700"}>
                                {r.cells.map((cell, j) => (
                                  <td key={j} className="px-3 py-2 align-top max-w-[260px] truncate" title={cell}>{cell}</td>
                                ))}
                                <td className="px-3 py-2 text-right">
                                  <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border " + STATUS_STYLE[r.status].cls}>
                                    {STATUS_STYLE[r.status].label}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {preview.errors.length > 0 && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
                        <div className="font-semibold mb-1">{preview.errors.length} row{preview.errors.length === 1 ? "" : "s"} skipped:</div>
                        <ul className="list-disc pl-5 space-y-0.5">
                          {preview.errors.slice(0, 12).map((e, i) => <li key={i}>{e}</li>)}
                          {preview.errors.length > 12 && <li>…and {preview.errors.length - 12} more.</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

function Chip({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold " + cls}>
      {label} <span className="tabular-nums">{value}</span>
    </span>
  );
}
