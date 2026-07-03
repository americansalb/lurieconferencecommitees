"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Send, Check, Loader2, AlertCircle, Gift } from "lucide-react";
import { PARTNERS, type Partner } from "@/lib/partners";

const TEAL = "#0E5566";
const GOLD = "#C9A14B";

// Admin panel for the Partner Invitations in src/lib/partners.ts: shows each
// curated partner, whether it's sendable, and a one-click send that creates
// the discount codes and emails the engraved partner-offer letter.
export default function PartnersPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (status === "loading") {
    return <Centered><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></Centered>;
  }
  if (role !== "admin" && role !== "developer") {
    return <Centered><p className="text-sm text-slate-500">Admins only.</p></Centered>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: GOLD }}>
          <Gift className="w-4 h-4" /> Partner invitations
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Thank-you offers for AALB partners</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xl">
          Each send creates the partner&rsquo;s two discount codes (complimentary staff seats and a shareable
          attendee code), sets up their discounted exhibitor link, and emails the engraved partner letter.
          Partners become sendable in <code className="text-xs bg-slate-100 px-1 rounded">src/lib/partners.ts</code> once
          they have a contact email and <code className="text-xs bg-slate-100 px-1 rounded">ready: true</code>.
        </p>
        <div className="mt-6 space-y-3">
          {PARTNERS.map((p) => <PartnerCard key={p.slug} partner={p} />)}
        </div>
      </div>
    </div>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendable = partner.ready && !!partner.contactEmail.trim();

  async function send() {
    if (!confirm(`Send the partner offer to ${partner.orgName} (${partner.contactEmail})?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/partners/${partner.slug}/send`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error || "Send failed."); return; }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="font-bold text-slate-900">{partner.orgName}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {partner.contactEmail ? `${partner.contactName || "—"} · ${partner.contactEmail}` : "No contact email yet"}
            {partner.location ? ` · ${partner.location}` : ""}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
            <Chip>{partner.freeTickets} staff seats ({partner.staffCode})</Chip>
            <Chip>{partner.shareDiscountPct}% share code ({partner.shareCode})</Chip>
            <Chip>{partner.exhibitorDiscountPct}% off exhibitor table</Chip>
          </div>
        </div>
        <div className="shrink-0">
          {sent ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600">
              <Check className="w-4 h-4" /> Sent
            </span>
          ) : (
            <button
              onClick={send}
              disabled={!sendable || busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-40"
              style={{ background: TEAL }}
              title={sendable ? "Send the partner offer" : "Not sendable yet (see partners.ts)"}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sendable ? "Send offer" : "Not ready"}
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 inline-flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">{children}</span>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center bg-slate-50">{children}</div>;
}
