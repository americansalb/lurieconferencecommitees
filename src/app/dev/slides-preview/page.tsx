"use client";

import SlidesPanel from "@/app/presenters/confirm/[token]/SlidesPanel";

// Dev-only gallery of the presenter slides panel in every state, so the
// upload UX can be eyeballed without a presenter row in the database.
// Not linked from anywhere; same spirit as /dev/portal-preview.
export default function SlidesPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-xl mx-auto space-y-10">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Empty — nothing sent yet</div>
          <SlidesPanel token="DEV-PREVIEW" initial={null} presenterName="Yuliya Speroff" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">File received</div>
          <SlidesPanel
            token="DEV-PREVIEW"
            initial={{ fileName: "Health-Equity-Through-Language-Access.pptx", sizeBytes: 18_400_000, linkUrl: null, updatedAt: "2026-07-21T15:00:00Z" }}
            initialNotes="Please pass the microphone to the audience for the Q&A. The video on slide 14 has sound."
            presenterName="Yuliya Speroff"
          />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Google Slides link received</div>
          <SlidesPanel
            token="DEV-PREVIEW"
            initial={{ fileName: null, sizeBytes: null, linkUrl: "https://docs.google.com/presentation/d/1AbC/edit", updatedAt: "2026-07-22T15:00:00Z" }}
            presenterName="Yuliya Speroff"
          />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">File over 50 MB — email fallback</div>
          <SlidesPanel
            token="DEV-PREVIEW"
            initial={null}
            presenterName="Yuliya Speroff"
            demoOversize={{ name: "Keynote-with-videos.pptx", sizeBytes: 187_000_000 }}
          />
        </div>
      </div>
    </div>
  );
}
