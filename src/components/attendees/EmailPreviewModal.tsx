"use client";

import { X, Loader2 } from "lucide-react";

export default function EmailPreviewModal({
  title, meta, html, loading, onClose,
}: {
  title: string;
  meta?: React.ReactNode;
  html: string | null;
  loading?: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold text-slate-900 truncate">{title}</div>
            {meta && <div className="text-[11px] text-slate-500 truncate mt-0.5">{meta}</div>}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-hidden bg-slate-100 min-h-[60vh]">
          {loading || html == null ? (
            <div className="h-full min-h-[60vh] flex items-center justify-center text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <iframe srcDoc={html} title="Email preview" className="w-full h-full min-h-[60vh] border-0 bg-white" sandbox="" />
          )}
        </div>
      </div>
    </div>
  );
}
