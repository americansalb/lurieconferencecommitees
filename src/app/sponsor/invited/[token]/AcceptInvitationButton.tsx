"use client";

import { useState } from "react";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";

export default function AcceptInvitationButton({
  token, accent, amountLabel,
}: {
  token: string;
  accent: string;
  amountLabel: string;
}) {
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setRedirecting(true);
    setError(null);
    try {
      const res = await fetch("/api/sponsors/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error || "Could not start checkout.");
        setRedirecting(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Could not reach the payment system. Please try again.");
      setRedirecting(false);
    }
  }

  return (
    <>
      <button
        onClick={go}
        disabled={redirecting}
        className="w-full px-6 py-4 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 inline-flex items-center justify-center gap-2 text-base"
        style={{ background: accent }}
      >
        {redirecting
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to checkout…</>
          : <><CreditCard className="w-4 h-4" /> Accept and pay {amountLabel}</>}
      </button>
      {error && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm inline-flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
    </>
  );
}
