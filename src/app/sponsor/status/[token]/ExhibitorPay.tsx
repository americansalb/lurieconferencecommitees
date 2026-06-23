"use client";

import { useState } from "react";
import { CreditCard, Loader2, Check } from "lucide-react";
import ExhibitorDetailsForm, { type ExhibitorDetails } from "@/components/sponsor/ExhibitorDetailsForm";
import type { LogoValue } from "@/components/sponsor/LogoUpload";

export default function ExhibitorPay({
  token, accent, amountLabel, initial, hasLogo,
}: {
  token: string;
  accent: string;
  amountLabel: string;
  initial: ExhibitorDetails;
  hasLogo: boolean;
}) {
  const [details, setDetails] = useState<ExhibitorDetails>(initial);
  const [logo, setLogo] = useState<LogoValue>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveAndPay() {
    if (!details.registreeName.trim()) { setError("Please add who will staff your table."); return; }
    setBusy(true); setError(null);
    try {
      const save = await fetch("/api/sponsors/exhibitor-details", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...details, logo: details.wantsLogo && logo ? { dataUrl: logo.dataUrl, name: logo.name } : undefined }),
      });
      if (!save.ok) { const j = await save.json().catch(() => ({})); throw new Error(j.error || "Could not save your details."); }

      const res = await fetch("/api/sponsors/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const j = await res.json();
      if (!res.ok || !j.url) throw new Error(j.error || "Could not start checkout.");
      window.location.href = j.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Before you pay — exhibitor details</div>
      {hasLogo && !logo && (
        <div className="mb-3 text-xs text-emerald-700 inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> A logo is already on file. Upload again to replace it.</div>
      )}
      <ExhibitorDetailsForm value={details} onChange={setDetails} logo={logo} onLogo={setLogo} />
      {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
      <button onClick={saveAndPay} disabled={busy} className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-white shadow-sm disabled:opacity-50" style={{ background: accent }}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Save &amp; pay {amountLabel}
      </button>
      <p className="mt-2 text-[11px] text-center text-slate-400">Payment processed by Stripe. Tax-deductible under IRS code 501(c)(3).</p>
    </div>
  );
}
