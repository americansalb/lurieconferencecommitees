"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Check } from "lucide-react";

// Lets a sponsor/exhibitor upload or replace their logo from the portal. Posts
// the file as a data URL to the token-gated upload route, then busts the logo
// image cache so the new one shows immediately.
export default function LogoUploader({
  token, sponsorId, companyName, hasLogo,
}: {
  token: string;
  sponsorId: string;
  companyName: string;
  hasLogo: boolean;
}) {
  const [present, setPresent] = useState(hasLogo);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    setDone(false);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error("Could not read that file."));
        r.readAsDataURL(file);
      });
      const res = await fetch("/api/sponsors/logo-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, logo: { dataUrl, name: file.name } }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Upload failed.");
      setPresent(true);
      setVersion((v) => v + 1);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-start gap-3">
      {present ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/sponsors/${sponsorId}/logo?v=${version}`}
          alt={`${companyName} logo`}
          className="h-14 w-auto max-w-[170px] object-contain bg-white rounded border border-slate-200 p-1.5 shrink-0"
        />
      ) : (
        <div className="h-14 w-[120px] rounded border border-dashed border-slate-300 bg-white flex items-center justify-center text-[11px] text-slate-400 shrink-0">
          No logo yet
        </div>
      )}
      <div className="text-sm min-w-0">
        {present ? (
          <div className="font-semibold text-emerald-700 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Logo on file</div>
        ) : (
          <div className="font-semibold text-slate-700">Add your logo</div>
        )}
        <p className="text-xs text-slate-500 mt-0.5 max-w-xs">
          Send a high-resolution version (vector .SVG/.PDF, or a PNG at least 1000px wide) so it stays sharp in print and on screen.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
          style={{ background: "#0E5566" }}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {present ? "Replace logo" : "Upload logo"}
        </button>
        {done && <span className="ml-2 text-xs font-semibold text-emerald-600">Uploaded</span>}
        {err && <div className="text-xs text-rose-600 mt-1">{err}</div>}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,application/pdf"
          onChange={onFile}
          className="hidden"
        />
      </div>
    </div>
  );
}
