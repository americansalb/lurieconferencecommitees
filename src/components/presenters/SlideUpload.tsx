"use client";

import { useRef, useState } from "react";
import {
  Presentation, Upload, Link2, Download, ExternalLink, Trash2, Loader2, Check,
} from "lucide-react";
import { SLIDE_ACCEPT, SLIDE_TYPES_SENTENCE } from "@/lib/slide-types";

// Putting a presentation on file for a presenter who cannot do it themselves.
//
// The whole point is that the presenter is not going to work a form, so this
// one stays out of the way: drop a file on it, or paste a link, and it is done.
// It always says who a deck came from, because "slides in" meaning "we typed it
// in for them" and "slides in" meaning "they sent it" are different facts on
// the morning of the conference.

/** Decks run from a few KB to tens of MB, and "0.0 MB" reads like a failure. */
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export type Slide = {
  fileName: string | null;
  sizeBytes: number | null;
  linkUrl: string | null;
  uploadedBy: string | null;
  updatedAt: string;
};

export function SlideUpload({
  presenterId, presenterName, slide, onChanged,
}: {
  presenterId: string;
  presenterName: string;
  slide: Slide | null;
  onChanged: (slide: Slide | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [link, setLink] = useState("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function flashSaved(next: Slide | null) {
    onChanged(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function send(body: FormData | string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/presenters/${presenterId}/slides`, {
        method: "POST",
        ...(typeof body === "string"
          ? { headers: { "Content-Type": "application/json" }, body }
          : { body }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j.error || "That did not save.");
      flashSaved(j.slide);
      setShowLink(false);
      setLink("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not save.");
    } finally {
      setBusy(false);
    }
  }

  function upload(file: File | null | undefined) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    void send(form);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/presenters/${presenterId}/slides`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j.error || "Could not remove that.");
      flashSaved(null);
      setConfirmingRemove(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove that.");
    } finally {
      setBusy(false);
    }
  }

  const first = presenterName.split(" ")[0] || "them";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <Presentation className="w-4 h-4 text-[#0E5566]" />
        <h2 className="text-sm font-bold text-slate-900">Presentation</h2>
        {saved && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {slide && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <a
                  href={`/api/presenters/${presenterId}/slides`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13.5px] font-bold text-emerald-900 hover:underline inline-flex items-center gap-1.5 break-all"
                >
                  {slide.fileName
                    ? <><Download className="w-3.5 h-3.5 shrink-0" /> {slide.fileName}</>
                    : <><ExternalLink className="w-3.5 h-3.5 shrink-0" /> {slide.linkUrl}</>}
                </a>
                <div className="text-[11.5px] text-emerald-800/80 mt-1">
                  {slide.sizeBytes ? `${fileSize(slide.sizeBytes)} · ` : ""}
                  {new Date(slide.updatedAt).toLocaleString("en-US", {
                    timeZone: "America/Chicago",
                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                  })}
                  {slide.uploadedBy
                    ? ` · uploaded for ${first} by ${slide.uploadedBy}`
                    : ` · sent by ${first}`}
                </div>
              </div>
              {confirmingRemove ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={remove} disabled={busy}
                          className="px-2 py-1 rounded text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40">
                    {busy ? "Removing" : "Remove"}
                  </button>
                  <button type="button" onClick={() => setConfirmingRemove(false)}
                          className="px-2 py-1 rounded text-[11px] font-semibold text-slate-600 hover:bg-white">
                    Keep
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmingRemove(true)} title="Take this off file"
                        className="shrink-0 p-1.5 rounded-lg text-emerald-700/60 hover:text-rose-600 hover:bg-white">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Drop target. Also the plain button, because a file picker is what
            most people will actually use. */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            upload(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
            dragging ? "border-[#0066B3] bg-[#0066B3]/5" : "border-slate-200 bg-slate-50/60"
          }`}
        >
          <input
            ref={fileInput}
            type="file"
            accept={SLIDE_ACCEPT}
            className="hidden"
            onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {busy ? "Uploading" : slide ? "Replace the file" : `Upload ${first}'s deck`}
          </button>
          <div className="text-[11.5px] text-slate-500 mt-2">
            or drop it here. {SLIDE_TYPES_SENTENCE}, up to 50 MB.
          </div>
        </div>

        {showLink ? (
          <div className="flex items-center gap-2">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && link.trim()) void send(JSON.stringify({ linkUrl: link.trim() })); }}
              placeholder="https://docs.google.com/presentation/..."
              autoFocus
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0066B3]/20"
            />
            <button type="button" disabled={busy || !link.trim()}
                    onClick={() => void send(JSON.stringify({ linkUrl: link.trim() }))}
                    className="px-3 py-2 rounded-xl text-[13px] font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40">
              Save
            </button>
            <button type="button" onClick={() => { setShowLink(false); setLink(""); }}
                    className="px-3 py-2 rounded-xl text-[13px] font-semibold text-slate-500 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowLink(true)}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0066B3] hover:underline">
            <Link2 className="w-3.5 h-3.5" /> Paste a link instead (Google Slides, Drive, Dropbox)
          </button>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-800">{error}</div>
        )}
      </div>
    </div>
  );
}
