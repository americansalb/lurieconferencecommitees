"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, RefreshCw, Table2, X } from "lucide-react";

type SheetInfo = {
  formulas: { inPerson: string; virtual: string };
  tabs: { inPerson: string; virtual: string };
  live: {
    credentials: boolean;
    configured: boolean;
    sheetId: string | null;
    sheetUrl: string | null;
    serviceAccount: string | null;
    credentialSource: "sheets" | "push" | null;
    lastSyncedAt: string | null;
  };
};

// The attendee list in a Google Sheet.
//
// The real answer is the live push: the app makes the spreadsheet, shares it
// back, and rewrites both tabs within a minute of a registration. That needs
// credentials, because Google will not let a server write to a private
// spreadsheet without them, and that one paste is the whole setup.
//
// The IMPORTDATA formulas are kept underneath as the fallback for when nobody
// wants to touch a Google Cloud console. They work, but somebody has to paste
// them, and Google only re-reads them about hourly. That is why they are second
// now, not first.
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
      if (action === "create") {
        setNote("Sheet created and shared with you. Both tabs are filled in.");
        await load();
      } else if (action === "rotate") {
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
                  The sheet
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
                ) : info.live.credentials ? (
                  <>
                    <p className="text-[12.5px] text-slate-600 leading-relaxed">
                      Credentials are in place
                      {info.live.credentialSource === "push" && (
                        <> (the same service account this app already uses for push notifications)</>
                      )}
                      . One button and the app makes the spreadsheet, names both tabs, shares it with you as an
                      editor and fills it in. After that it rewrites itself within a minute of any registration
                      changing.
                    </p>
                    {info.live.credentialSource === "push" && (
                      <p className="mt-2 text-[11.5px] text-slate-500 leading-relaxed">
                        If the button comes back saying an API is disabled, enable the Google Sheets API and the
                        Google Drive API on that same project in the Google Cloud console. That is a switch, not
                        a new credential.
                      </p>
                    )}
                    <button onClick={() => post("create")} disabled={busy}
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table2 className="w-4 h-4" />} Create the sheet
                    </button>
                    <p className="mt-2 text-[11.5px] text-slate-500">
                      Already have a spreadsheet you want used instead? Share it with{" "}
                      <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">{info.live.serviceAccount}</code>{" "}
                      as an Editor and put its id in <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">ATTENDEE_SHEET_ID</code>.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[12.5px] text-slate-600 leading-relaxed">
                      No Google credentials are reachable on this deployment. The app normally borrows the
                      service account already set up for push notifications
                      (<code className="text-[11.5px] bg-slate-100 px-1 py-0.5 rounded">FCM_CLIENT_EMAIL</code> and{" "}
                      <code className="text-[11.5px] bg-slate-100 px-1 py-0.5 rounded">FCM_PRIVATE_KEY</code>), so if
                      those are set on Render this section should not be showing. Otherwise, paste any service
                      account&rsquo;s JSON key into{" "}
                      <code className="text-[11.5px] bg-slate-100 px-1 py-0.5 rounded">GOOGLE_SERVICE_ACCOUNT_JSON</code>.
                    </p>
                    <p className="mt-2 text-[12.5px] text-slate-600 leading-relaxed">
                      Come back here after it redeploys and one button does the rest: the spreadsheet, both tabs,
                      sharing it with you, and keeping it current. No formulas, no ids to hunt for.
                    </p>
                  </>
                )}
              </section>
              <section className="pt-4 border-t border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Or, without any credentials
                </div>
                <p className="text-[12.5px] text-slate-600 leading-relaxed mb-3">
                  If you would rather not set up a service account at all: make a spreadsheet with two tabs, put
                  the first formula in cell <strong>A1</strong> of the in-person tab and the second in
                  <strong> A1</strong> of the virtual tab. Google fills in the rest and re-reads it about once an
                  hour. It works, but it is slower than the push above and somebody has to paste them.
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
