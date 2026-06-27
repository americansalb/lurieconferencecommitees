"use client";

import { useMemo, useState } from "react";
import { X, Loader2, Send, AlertCircle, Check, Sparkles, User, Users } from "lucide-react";
import { TIERS } from "@/lib/sponsors";
import { buildSponsorInviteRows } from "@/lib/imports";

type BulkResult = { created: number; skipped: { email: string; reason: string }[]; parseErrors: string[] };

export default function InviteSponsorComposer({
  onClose, onSent,
}: {
  onClose: () => void;
  onSent: () => void;
}) {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Single
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Bulk
  const [csv, setCsv] = useState("");
  const [bulkTier, setBulkTier] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Shared
  const [inviteMessage, setInviteMessage] = useState("");
  const [compExhibitor, setCompExhibitor] = useState(false);

  // Live preview of the pasted list, using the same parser the server uses to
  // queue, so the counts and per-row "custom vs default" badges match exactly.
  const preview = useMemo(
    () => (csv.trim() ? buildSponsorInviteRows(csv) : { rows: [], errors: [] }),
    [csv],
  );
  const personalizedCount = preview.rows.filter((r) => r.note && r.note.trim()).length;

  async function send() {
    if (!companyName.trim() || !contactName.trim() || !contactEmail.trim()) {
      setResult({ ok: false, message: "Company, contact name, and email are required." });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/sponsors/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, contactName, contactEmail, contactRole, contactPhone, website, inviteMessage, compExhibitor }),
      });
      const json = await res.json();
      if (res.ok && json.sent) {
        setResult({ ok: true, message: `Invitation sent to ${contactEmail}.` });
        setTimeout(onSent, 900);
      } else {
        setResult({ ok: false, message: json.error || "Could not send invitation." });
      }
    } catch {
      setResult({ ok: false, message: "Network error. Try again." });
    } finally {
      setSending(false);
    }
  }

  async function queueBulk() {
    setBulkError(null);
    if (!csv.trim()) { setBulkError("Paste at least one prospect."); return; }
    setBulkSending(true);
    try {
      const res = await fetch("/api/sponsors/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, tier: compExhibitor ? undefined : (bulkTier || undefined), inviteMessage, compExhibitor }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not queue invites.");
      setBulkResult(json as BulkResult);
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Network error. Try again.");
    } finally {
      setBulkSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0E5566] to-[#0066B3] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold text-slate-900">Invite sponsors &amp; exhibitors</div>
            <div className="text-xs text-slate-500">They choose their own level on the invitation page.</div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
        </div>

        {/* Mode tabs */}
        <div className="px-5 pt-4">
          <div className="inline-flex items-center bg-slate-100 rounded-xl p-0.5">
            <TabBtn active={mode === "single"} onClick={() => setMode("single")} icon={<User className="w-3.5 h-3.5" />} label="One invite" />
            <TabBtn active={mode === "bulk"} onClick={() => setMode("bulk")} icon={<Users className="w-3.5 h-3.5" />} label="Bulk (paced)" />
          </div>
        </div>

        {mode === "single" ? (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Company / organization" value={companyName} onChange={setCompanyName} required className="sm:col-span-2" />
              <Field label="Contact name" value={contactName} onChange={setContactName} required />
              <Field label="Role" value={contactRole} onChange={setContactRole} placeholder="e.g. Director of Outreach" />
              <Field label="Email" value={contactEmail} onChange={setContactEmail} required type="email" />
              <Field label="Phone (optional)" value={contactPhone} onChange={setContactPhone} />
              <Field label="Website (optional)" value={website} onChange={setWebsite} placeholder="https://" className="sm:col-span-2" />
            </div>
            <CompToggle checked={compExhibitor} onChange={setCompExhibitor} />
            <MessageField value={inviteMessage} onChange={setInviteMessage} contactName={contactName} />
            {result && <ResultBanner ok={result.ok} message={result.message} />}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">Cancel</button>
              <button onClick={send} disabled={sending} className="px-5 py-2.5 rounded-lg font-bold text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-2 text-sm bg-gradient-to-r from-[#0E5566] to-[#0066B3]">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send invitation</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {bulkResult ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">{bulkResult.created} invite{bulkResult.created === 1 ? "" : "s"} queued.</div>
                    <div className="mt-0.5 text-[13px]">They&rsquo;ll go out gradually on the shared sending schedule (so the domain stays healthy). {bulkResult.skipped.length > 0 ? `${bulkResult.skipped.length} skipped (already on the list).` : ""}</div>
                  </div>
                </div>
                {bulkResult.parseErrors.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
                    <div className="font-semibold mb-1">{bulkResult.parseErrors.length} row{bulkResult.parseErrors.length === 1 ? "" : "s"} skipped:</div>
                    <ul className="list-disc pl-5 space-y-0.5">{bulkResult.parseErrors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}</ul>
                  </div>
                )}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button onClick={onSent} className="px-5 py-2.5 rounded-lg font-bold text-white text-sm bg-gradient-to-r from-[#0E5566] to-[#0066B3]">Done</button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-[13px] text-slate-500">
                  Paste one prospect per line, <b className="text-slate-700">Company, Contact, Email</b> (Phone, Website, Note optional). Add a <b className="text-slate-700">Note</b> column to give each org its own line, it goes into their email and onto their invitation page, so a bulk send still reads as personal. Tip: paste straight from a spreadsheet so commas inside your notes stay safe. Invites are <b className="text-slate-700">queued and sent gradually</b> to protect the sending domain.
                </div>
                <CompToggle checked={compExhibitor} onChange={setCompExhibitor} />
                {!compExhibitor && (
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Suggested level (optional)</span>
                    <select value={bulkTier} onChange={(e) => setBulkTier(e.target.value)} className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 bg-white">
                      <option value="">Let them choose on the page</option>
                      {TIERS.map((t) => <option key={t.id} value={t.id}>{t.name}, {t.amountLabel}</option>)}
                    </select>
                  </label>
                )}
                <label className="block">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Prospect list</span>
                  <textarea
                    value={csv} onChange={(e) => setCsv(e.target.value)} rows={8}
                    placeholder={"Company, Contact, Email, Phone, Website, Note\nLanguageLine Solutions, Sara Kim, sara@example.com, , languageline.com, Loved having you exhibit before, we'd be honored to host you again.\nCyraCom, Dana Lee, dana@example.com, , cyracom.com, Your hospital-interpreting work is exactly what our clinicians need to see."}
                    className="mt-1 w-full px-3 py-2.5 text-[13px] font-mono border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  />
                </label>

                {csv.trim() && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-[12px]">
                      <span className="font-bold text-slate-700">{preview.rows.length} ready</span>
                      {personalizedCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold">
                          <Sparkles className="w-3 h-3" /> {personalizedCount} personalized
                        </span>
                      )}
                      {preview.rows.length - personalizedCount > 0 && (
                        <span className="text-slate-500">{preview.rows.length - personalizedCount} use the default note</span>
                      )}
                      {preview.errors.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-semibold">
                          <AlertCircle className="w-3 h-3" /> {preview.errors.length} skipped
                        </span>
                      )}
                    </div>
                    {preview.rows.length > 0 && (
                      <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
                        {preview.rows.slice(0, 50).map((r, i) => {
                          const hasNote = Boolean(r.note && r.note.trim());
                          return (
                            <div key={i} className="px-3 py-2 flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold text-slate-800 truncate">
                                  {r.companyName} <span className="font-normal text-slate-300">·</span> <span className="font-normal text-slate-500">{r.contactName}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">{r.contactEmail}</div>
                                {hasNote && (
                                  <div className="mt-1 text-[11.5px] text-slate-600 italic line-clamp-2">&ldquo;{r.note!.trim()}&rdquo;</div>
                                )}
                              </div>
                              {hasNote ? (
                                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                  <Sparkles className="w-3 h-3" /> Custom
                                </span>
                              ) : (
                                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-300">Default</span>
                              )}
                            </div>
                          );
                        })}
                        {preview.rows.length > 50 && (
                          <div className="px-3 py-2 text-[11px] text-slate-400">&hellip;and {preview.rows.length - 50} more</div>
                        )}
                      </div>
                    )}
                    {preview.errors.length > 0 && (
                      <div className="px-3 py-2 bg-rose-50/60 border-t border-rose-100 text-[11px] text-rose-600 space-y-0.5">
                        {preview.errors.slice(0, 4).map((e, i) => <div key={i}>{e}</div>)}
                        {preview.errors.length > 4 && <div>&hellip;and {preview.errors.length - 4} more</div>}
                      </div>
                    )}
                  </div>
                )}

                <MessageField
                  value={inviteMessage}
                  onChange={setInviteMessage}
                  contactName=""
                  label="Default note (optional)"
                  hint="Used only for prospects without their own Note in the list above. A row's Note always wins."
                />
                {bulkError && <ResultBanner ok={false} message={bulkError} />}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">Cancel</button>
                  <button onClick={queueBulk} disabled={bulkSending || preview.rows.length === 0} className="px-5 py-2.5 rounded-lg font-bold text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-2 text-sm bg-gradient-to-r from-[#0E5566] to-[#0066B3]">
                    {bulkSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Queuing…</> : <><Users className="w-4 h-4" /> {preview.rows.length ? `Queue ${preview.rows.length} invite${preview.rows.length === 1 ? "" : "s"}` : "Queue invites"}</>}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors " + (active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
      {icon} {label}
    </button>
  );
}

function ResultBanner({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div className={`px-3 py-2 rounded-lg border text-sm inline-flex items-start gap-2 ${ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
      {ok ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
      {message}
    </div>
  );
}

function MessageField({
  value, onChange, contactName,
  label = "Personal note (optional)",
  hint = "Appears at the top of the invitation page in a highlighted callout.",
}: {
  value: string; onChange: (v: string) => void; contactName: string; label?: string; hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        placeholder={`Hi ${contactName.split(" ")[0] || "[name]"}, I wanted to personally reach out about sponsoring our conference because…`}
        className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
      />
      <span className="text-[10px] text-slate-400 mt-1 block">{hint}</span>
    </label>
  );
}

function CompToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      className="flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-colors"
      style={{ borderColor: checked ? "#0E5566" : "#e2e8f0", background: checked ? "rgba(14,85,102,0.04)" : "white" }}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#0E5566]" />
      <span>
        <span className="block text-[13px] font-bold text-slate-800">Offer a complimentary exhibitor table</span>
        <span className="block text-[11px] text-slate-500">They get a free exhibitor table. The invite asks them to claim it and confirm their details, no payment, no level to pick.</span>
      </span>
    </label>
  );
}

function Field({
  label, value, onChange, placeholder, required, type, className,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string; className?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      <input
        type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
      />
    </label>
  );
}
