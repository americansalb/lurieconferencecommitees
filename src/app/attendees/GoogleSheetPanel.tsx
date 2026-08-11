"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, RefreshCw, Table2, X } from "lucide-react";

type SheetInfo = {
  formulas: { inPerson: string; virtual: string };
  tabs: { inPerson: string; virtual: string };
  live: {
    configured: boolean;
    sheetId: string | null;
    sheetUrl: string | null;
    serviceAccount: string | null;
    lastSyncedAt: string | null;
  };
};

// Two ways to get the attendee list into a Google Sheet, because they suit
// different amounts of patience:
//
//   Paste a formula. Nothing to configure, works in a minute, and Google
//   refreshes it on its own roughly hourly.
//
//   Live push. We write both tabs ourselves within a minute of a registration,
//   but it needs a service account set up first.
//
// The panel shows both, and says plainly which one is actually running.
export default function GoogleSheetPanel({ onClose }: { onClose: () => void }) {
  const [info, setInfo] = useState<SheetInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/attendees/sheet");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not load the sheet settings.");
      setInfo(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the sheet settings.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setError("Could not copy. Select the formula and copy it by hand.");
    }
  }

  async function post(action?: string) {
    setBusy(true);
    setNote(null);
    setError(null);
    try {
      const res = await fetch("/api/attendees/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action ? { action } : {}),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "That did not work.");
      if (action === "rotate") {
        setNote("New link issued. Paste the new formulas into the sheet; the old ones have stopped working.");
        await load();
      } else {
        setNote(`Pushed ${j.inPerson} in-person and ${j.virtual} virtual.`);
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
          <Table2 className="w-5 h-5 text-emerald-600" />
          <div className="flex-1">
            <div className="text-[15px] font-bold text-slate-900">Attendees in Google Sheets</div>
            <div className="text-[12px] text-slate-500">One tab in person, one tab virtual, kept current</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-800">{error}</div>}
          {note && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">{note}</div>}

          {!info ? (
            <div className="flex items-center gap-2 text-slate-500 text-[13px] py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading&hellip;
            </div>
          ) : (
            <>
              <section>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  The quick way, no setup
                </div>
                <p className="text-[12.5px] text-slate-600 leading-relaxed mb-3">
                  Make a spreadsheet with two tabs. Put the first formula in cell <strong>A1</strong> of the
                  in-person tab and the second in <strong>A1</strong> of the virtual tab. Google fills in the
                  rest and re-reads it about once an hour, so the sheet keeps itself current without anyone
                  exporting anything.
                </p>
                <Formula label="In-person tab" value={info.formulas.inPerson} copied={copied === "in"} onCopy={() => copy(info.formulas.inPerson, "in")} />
                <Formula label="Virtual tab" value={info.formulas.virtual} copied={copied === "virt"} onCopy={() => copy(info.formulas.virtual, "virt")} />
                <p className="mt-2.5 text-[11.5px] text-slate-500 leading-relaxed">
                  These links carry a key instead of a login, since Google fetches them from its own servers.
                  Anyone with the link can read the attendee list, so keep the sheet inside the team.{" "}
                  <button
                    onClick={() => post("rotate")}
                    disabled={busy}
                    className="font-semibold text-[#0066B3] hover:underline disabled:opacity-50"
                  >
                    Issue a new link
                  </button>{" "}
                  if it gets out, then paste the new formulas in.
                </p>
              </section>

              <section className="pt-4 border-t border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Live push, within a minute
                </div>
                {info.live.configured ? (
                  <>
                    <p className="text-[12.5px] text-slate-600 leading-relaxed">
                      Running. Both tabs, <strong>{info.tabs.inPerson}</strong> and <strong>{info.tabs.virtual}</strong>,
                      are rewritten within a minute of any registration changing.
                      {info.live.lastSyncedAt && (
                        <> Last written {new Date(info.live.lastSyncedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })}.</>
                      )}
                    </p>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {info.live.sheetUrl && (
                        <a href={info.live.sheetUrl} target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
                          <ExternalLink className="w-3.5 h-3.5" /> Open the sheet
                        </a>
                      )}
                      <button onClick={() => post()} disabled={busy}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Push now
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[12.5px] text-slate-600 leading-relaxed">
                      Not set up, so nothing is being pushed. The formulas above work without any of this. To have
                      the app write the sheet itself instead:
                    </p>
                    <ol className="mt-2 space-y-1.5 text-[12.5px] text-slate-600 list-decimal pl-5">
                      <li>In the Google Cloud console, create a service account and enable the Sheets API.</li>
                      <li>Create a JSON key for it, and paste the whole file into the <code className="text-[11.5px] bg-slate-100 px-1 py-0.5 rounded">GOOGLE_SERVICE_ACCOUNT_JSON</code> environment variable on Render.</li>
                      <li>Share the spreadsheet with the service account&rsquo;s email address, as an Editor.</li>
                      <li>Put the spreadsheet id, the long part of its URL, into <code className="text-[11.5px] bg-slate-100 px-1 py-0.5 rounded">ATTENDEE_SHEET_ID</code>.</li>
                    </ol>
                    <p className="mt-2 text-[11.5px] text-slate-500">
                      The tabs are created automatically if they do not exist.
                    </p>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Formula({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="mb-2">
      <div className="text-[11px] font-semibold text-slate-500 mb-1">{label}</div>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 min-w-0 text-[11.5px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 break-all">
          {value}
        </code>
        <button
          onClick={onCopy}
          className="shrink-0 px-3 rounded-lg text-[12px] font-bold inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
