"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import ExhibitorDetailsForm, { EMPTY_EXHIBITOR, type ExhibitorDetails } from "@/components/sponsor/ExhibitorDetailsForm";
import type { LogoValue } from "@/components/sponsor/LogoUpload";

// Catch-up form for exhibitors who paid before telling us who staffs their
// table (e.g. older records from before the landing page routed exhibitors
// through the completion wizard). Saves via the same token-gated
// exhibitor-details endpoint the wizard uses.
export default function PostPaymentDetailsForm({ token, accent }: { token: string; accent: string }) {
  const [details, setDetails] = useState<ExhibitorDetails>(EMPTY_EXHIBITOR);
  const [logo, setLogo] = useState<LogoValue>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sponsors/exhibitor-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...details, logo }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not save your details.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm flex items-center gap-2" style={{ color: accent }}>
        <Check className="w-4 h-4" /> Table details saved. Thank you — we&rsquo;ll send your representative&rsquo;s ticket to their email.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">
        One thing we still need
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Your table is paid for, but we don&rsquo;t yet know who will staff it. Tell us below so we can send their ticket and plan the hall.
      </p>
      <ExhibitorDetailsForm value={details} onChange={setDetails} logo={logo} onLogo={setLogo} />
      {error && <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
      <button
        onClick={save}
        disabled={busy}
        className="mt-4 w-full px-5 py-3 rounded-xl font-bold text-white shadow disabled:opacity-50 inline-flex items-center justify-center gap-2 text-sm"
        style={{ background: accent }}
      >
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save table details"}
      </button>
    </div>
  );
}
