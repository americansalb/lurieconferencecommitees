"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, FileText, Link2, Loader2, Mail, Presentation, RefreshCw, Trash2, UploadCloud } from "lucide-react";

// The presentation drop-box on the presenter portal's confirmed screen.
// One card, three states: nothing yet (upload zone + link field), a file on
// record, or a link on record. Files over the upload cap flip to a calm
// "email it instead" card — never an error wall. All copy names the real
// deadline so nobody has to guess.

const TEAL = "#0E5566";
const BLUE = "#0066B3";
export const SLIDE_MAX_MB = 50;
export const SLIDES_DEADLINE_LABEL = "Saturday, August 8";
const SLIDES_EMAIL = "contact@aalb.org";

export type SlideInfo = {
  fileName: string | null;
  sizeBytes: number | null;
  linkUrl: string | null;
  updatedAt: string | null;
};

function fmtBytes(n: number | null | undefined): string {
  if (!n || n <= 0) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(n >= 100 * 1024 * 1024 ? 0 : 1)} MB`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

const ACCEPT = ".ppt,.pptx,.key,.odp,.pdf";
const ACCEPT_RE = /\.(ppt|pptx|key|odp|pdf)$/i;

export default function SlidesPanel({
  token,
  initial,
  initialNotes,
  presenterName,
  demoOversize,
}: {
  token: string;
  initial: SlideInfo | null;
  initialNotes?: string | null;
  presenterName?: string | null;
  // Dev-preview only: render the too-big card with this fake file.
  demoOversize?: { name: string; sizeBytes: number } | null;
}) {
  const [slide, setSlide] = useState<SlideInfo | null>(initial);
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [oversize, setOversize] = useState<{ name: string; sizeBytes: number } | null>(demoOversize || null);
  const [linkInput, setLinkInput] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState(initialNotes || "");
  const [savedNotes, setSavedNotes] = useState(initialNotes || "");
  const [notesPhase, setNotesPhase] = useState<"idle" | "saving" | "saved">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const saveNotes = useCallback(async () => {
    setNotesPhase("saving");
    try {
      const res = await fetch(`/api/presenters/slides/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setSavedNotes(notes.trim());
        setNotesPhase("saved");
        setTimeout(() => setNotesPhase("idle"), 2500);
      } else {
        setNotesPhase("idle");
        setError("Couldn't save your notes. Please try again.");
      }
    } catch {
      setNotesPhase("idle");
      setError("Couldn't save your notes. Check your connection and try again.");
    }
  }, [notes, token]);

  const uploadFile = useCallback((file: File) => {
    setError(null);
    setOversize(null);
    if (!ACCEPT_RE.test(file.name)) {
      setError("PowerPoint (.ppt, .pptx), Keynote (.key), OpenDocument (.odp), or PDF, please.");
      return;
    }
    if (file.size > SLIDE_MAX_MB * 1024 * 1024) {
      setOversize({ name: file.name, sizeBytes: file.size });
      return;
    }
    setPhase("uploading");
    setProgress(0);
    // XMLHttpRequest instead of fetch: a 50 MB deck on hotel wifi needs a
    // real progress bar, not a spinner of unknown duration.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/presenters/slides/${token}`);
    // The file is sent as the raw body with its name in a header, rather than
    // wrapped in FormData. Multipart makes the server hold the entire deck in
    // memory before it can save any of it, and that is what was crashing the
    // site on upload. Progress reporting works the same either way.
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.setRequestHeader("X-File-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setPhase("idle");
      try {
        const json = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300 && json.slide) {
          setSlide(json.slide);
        } else {
          setError(json.error || "The upload didn't go through. Please try again.");
        }
      } catch {
        setError("The upload didn't go through. Please try again.");
      }
    };
    xhr.onerror = () => {
      setPhase("idle");
      setError("The upload didn't go through. Check your connection and try again.");
    };
    xhr.send(file);
  }, [token]);

  const saveLink = useCallback(async () => {
    const url = linkInput.trim();
    if (!/^https:\/\/.+\..+/.test(url)) {
      setError("Paste a full link, starting with https://");
      return;
    }
    setError(null);
    setPhase("saving");
    try {
      const res = await fetch(`/api/presenters/slides/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkUrl: url }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.slide) {
        setSlide(json.slide);
        setLinkInput("");
        setShowLink(false);
      } else {
        setError(json.error || "Couldn't save the link. Please try again.");
      }
    } catch {
      setError("Couldn't save the link. Check your connection and try again.");
    } finally {
      setPhase("idle");
    }
  }, [linkInput, token]);

  const remove = useCallback(async () => {
    setError(null);
    setPhase("saving");
    try {
      const res = await fetch(`/api/presenters/slides/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remove: true }),
      });
      if (res.ok) setSlide(null);
    } finally {
      setPhase("idle");
    }
  }, [token]);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SLIDES_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, []);

  const mailtoHref = `mailto:${SLIDES_EMAIL}?subject=${encodeURIComponent(
    `Conference presentation${presenterName ? ` - ${presenterName}` : ""}`
  )}&body=${encodeURIComponent(
    "Hi team,\n\nMy presentation for August 15-16 is attached (or linked below).\n\n"
  )}`;

  const hasFile = !!slide?.fileName;
  const hasLink = !!slide?.linkUrl && !hasFile;
  let linkHost = "";
  if (slide?.linkUrl) {
    try { linkHost = new URL(slide.linkUrl).hostname.replace(/^www\./, ""); } catch {}
  }

  return (
    <section id="presentation" className="mt-12 text-left">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${TEAL}, ${BLUE})` }} />
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.22em] uppercase" style={{ color: TEAL }}>
                Your presentation
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                {hasFile || hasLink ? "We have your slides." : "Upload your slides"}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
              Due {SLIDES_DEADLINE_LABEL}
            </span>
          </div>

          {!hasFile && !hasLink && !oversize && (
            <>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                PowerPoint, Keynote, or PDF up to {SLIDE_MAX_MB} MB — or a link to Google Slides.
                Sending it by {SLIDES_DEADLINE_LABEL} gives us time to check the formatting on the
                venue screens with you, well before the day.
              </p>

              {phase === "uploading" ? (
                <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: BLUE }} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-800">Uploading… {progress}%</div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${TEAL}, ${BLUE})` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) uploadFile(f);
                    }}
                    className="mt-5 w-full rounded-2xl border-2 border-dashed p-7 text-center transition-colors"
                    style={{ borderColor: dragOver ? BLUE : "#CBD5E1", background: dragOver ? "#F0F7FC" : "#FAFBFC" }}
                  >
                    <UploadCloud className="w-7 h-7 mx-auto" style={{ color: BLUE }} />
                    <div className="mt-2.5 text-sm font-semibold text-slate-800">
                      Drop your file here, or click to choose
                    </div>
                    <div className="mt-1 text-xs text-slate-400">.pptx · .key · .pdf · up to {SLIDE_MAX_MB} MB</div>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadFile(f);
                      e.target.value = "";
                    }}
                  />

                  {showLink ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        placeholder="https://docs.google.com/presentation/…"
                        className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15"
                        onKeyDown={(e) => { if (e.key === "Enter") saveLink(); }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={saveLink}
                        disabled={phase !== "idle"}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                        style={{ background: `linear-gradient(135deg, ${TEAL}, ${BLUE})` }}
                      >
                        {phase === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save link"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowLink(true)}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold"
                      style={{ color: BLUE }}
                    >
                      <Link2 className="w-4 h-4" /> Working in Google Slides? Paste a link instead
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {oversize && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="text-sm font-bold text-amber-900">
                That file is {fmtBytes(oversize.sizeBytes)} — a bit big for the uploader.
              </div>
              <p className="mt-1.5 text-sm text-amber-800 leading-relaxed">
                No problem at all: email <strong>{oversize.name}</strong> to{" "}
                <strong>{SLIDES_EMAIL}</strong> and we&rsquo;ll take it from there. Your email app
                handles big files better than a web form ever will.
              </p>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${TEAL}, ${BLUE})` }}
                >
                  <Mail className="w-4 h-4" /> Open email
                </a>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-amber-200 text-amber-900"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy address"}
                </button>
                <button
                  type="button"
                  onClick={() => setOversize(null)}
                  className="text-sm font-semibold text-amber-700 hover:text-amber-900 ml-auto"
                >
                  Try a smaller file
                </button>
              </div>
            </div>
          )}

          {(hasFile || hasLink) && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white border border-emerald-200">
                  {hasFile
                    ? (/\.pdf$/i.test(slide?.fileName || "") ? <FileText className="w-5 h-5 text-emerald-700" /> : <Presentation className="w-5 h-5 text-emerald-700" />)
                    : <Link2 className="w-5 h-5 text-emerald-700" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {hasFile ? slide?.fileName : linkHost || "Presentation link"}
                  </div>
                  <div className="text-xs text-emerald-800 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                    Received{slide?.updatedAt ? ` ${fmtDate(slide.updatedAt)}` : ""}
                    {hasFile && slide?.sizeBytes ? ` · ${fmtBytes(slide.sizeBytes)}` : ""} · The team
                    will review the formatting and reach out if anything needs adjusting.
                  </div>
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-3 flex-wrap">
                {hasLink && slide?.linkUrl && (
                  <a href={slide.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: BLUE }}>
                    <ExternalLink className="w-3.5 h-3.5" /> Open link
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => { setSlide(null); setShowLink(hasLink); }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: BLUE }}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Replace
                </button>
                <button
                  type="button"
                  onClick={remove}
                  disabled={phase !== "idle"}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          )}

          {error && <div className="mt-3 text-sm font-semibold text-rose-600">{error}</div>}

          {/* Run-of-show notes: present in every state, because "pass the mic
              to the audience" matters whether the deck came here or by email. */}
          <div className="mt-5">
            <label className="block text-xs font-bold text-slate-700">
              Anything we should handle in the room?
            </label>
            <p className="mt-0.5 text-xs text-slate-400">
              Optional, for the day-of team: mic handling, videos with sound, handouts, timing cues.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="e.g. Please pass the microphone to the audience for the Q&A. My last slide has a video with sound."
              className="mt-2 w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 resize-y"
            />
            {(notes.trim() !== savedNotes || notesPhase !== "idle") && (
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={notesPhase === "saving" || notes.trim() === savedNotes}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${TEAL}, ${BLUE})` }}
                >
                  {notesPhase === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : notesPhase === "saved" ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                  {notesPhase === "saved" ? "Saved" : "Save notes"}
                </button>
                {notesPhase === "saved" && <span className="text-xs font-semibold text-emerald-700">The team will see this with your slides.</span>}
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-slate-400 leading-relaxed">
            Bigger than {SLIDE_MAX_MB} MB? Email it to{" "}
            <a href={mailtoHref} className="font-semibold" style={{ color: BLUE }}>{SLIDES_EMAIL}</a>{" "}
            instead. You can replace what you&rsquo;ve sent any time up to {SLIDES_DEADLINE_LABEL}.
          </p>
        </div>
      </div>
    </section>
  );
}
