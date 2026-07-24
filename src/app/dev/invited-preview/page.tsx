"use client";

import { useState } from "react";
import InvitedGuestForm from "@/app/invited/[code]/InvitedGuestForm";

// Dev-only gallery for the complimentary-guest RSVP: the invitation card and
// its reserved-seat state, no database required. Same spirit as
// /dev/slides-preview.
export default function InvitedPreviewPage() {
  const [state, setState] = useState<"form" | "success">("form");
  return (
    <div className="relative">
      <div className="fixed top-3 left-3 z-50 flex gap-2">
        <button onClick={() => setState("form")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${state === "form" ? "bg-white text-slate-900" : "bg-white/20 text-white"}`}>Form</button>
        <button onClick={() => setState("success")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${state === "success" ? "bg-white text-slate-900" : "bg-white/20 text-white"}`}>Success</button>
      </div>
      <InvitedGuestForm key={state} code="GUEST" demoState={state === "success" ? "success" : null} />
    </div>
  );
}
