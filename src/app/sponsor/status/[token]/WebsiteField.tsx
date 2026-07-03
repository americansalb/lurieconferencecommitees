"use client";

import { useState } from "react";
import { Globe, Loader2, Check } from "lucide-react";

// Lets an in-kind sponsor add or correct the website URL we link their name to,
// straight from their portal. Posts to the token-gated website route.
export default function WebsiteField({ token, initial }: { token: string; initial: string }) {
  const [value, setValue] = useState(initial || "");
  const [saved, setSaved] = useState(initial || "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dirty = value.trim() !== saved.trim();

  async function save() {
    setErr(null);
    setBusy(true);
    setDone(false);
    try {
      const res = await fetch("/api/sponsors/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, website: value.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not save that address.");
      const next = j.website || "";
      setValue(next);
      setSaved(next);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save that address.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="text-sm font-semibold text-slate-700">Your website</div>
      <p className="text-xs text-slate-500 mt-0.5">
        We&rsquo;ll link your name on the conference website straight to your site.
      </p>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="url"
            inputMode="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && dirty && !busy) save(); }}
            placeholder="yourrestaurant.com"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
          />
        </div>
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
          style={{ background: "#0E5566" }}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save
        </button>
      </div>
      {done && <div className="mt-1 text-xs font-semibold text-emerald-600">Saved</div>}
      {err && <div className="mt-1 text-xs text-rose-600">{err}</div>}
    </div>
  );
}
