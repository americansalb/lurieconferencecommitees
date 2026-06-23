"use client";

import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";

export type LogoValue = { dataUrl: string; mime: string; name: string } | null;

export default function LogoUpload({ value, onChange }: { value: LogoValue; onChange: (v: LogoValue) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);

  function onFile(file?: File) {
    setErr(null);
    if (!file) return;
    if (!/^image\//.test(file.type)) { setErr("Please choose an image file (PNG, JPG, or SVG)."); return; }
    if (file.size > 4 * 1024 * 1024) { setErr("That image is over 4 MB — please use a smaller file."); return; }
    const reader = new FileReader();
    reader.onload = () => onChange({ dataUrl: String(reader.result), mime: file.type, name: file.name });
    reader.readAsDataURL(file);
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.dataUrl} alt="Logo preview" className="w-16 h-16 object-contain rounded bg-slate-50 border border-slate-100" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{value.name}</div>
            <div className="text-xs text-slate-400">This is what we&rsquo;ll display.</div>
          </div>
          <button type="button" onClick={() => onChange(null)} className="p-1.5 text-slate-400 hover:text-rose-600" title="Remove"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-slate-500 hover:bg-slate-50 transition-colors">
          <UploadCloud className="w-5 h-5" />
          <span className="text-sm font-semibold">Upload your logo</span>
          <span className="text-[11px] text-slate-400">PNG, JPG, or SVG · high resolution · up to 4 MB</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      {err && <div className="mt-1.5 text-xs text-rose-600">{err}</div>}
    </div>
  );
}
