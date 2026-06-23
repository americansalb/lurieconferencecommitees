"use client";

import { useMemo, useState } from "react";
import { X, Loader2, Send, AlertCircle, Check, Megaphone, Eye, PenLine } from "lucide-react";
import { proposalCallEmail } from "@/lib/mail-templates";

type Variant = "general" | "healthcare";

// Compose and send the open Call for Proposals to a recipient. Unlike the
// presenter InviteComposer (which assigns a specific person a specific talk
// and sends them to a portal to accept/decline), this is the broadcast
// "please submit a proposal" outreach, the General and Healthcare variants
// from the outreach drafts, with a real link to /proposal.
export default function ProposalCallComposer({
  onClose, onSent,
}: {
  onClose: () => void;
  onSent: () => void;
}) {
  const [variant, setVariant] = useState<Variant>("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [view, setView] = useState<"compose" | "preview">("compose");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const previewHtml = useMemo(
    () =>
      proposalCallEmail({
        variant,
        submitUrl: "https://conference.aalb.org/proposal",
        recipientFirstName: name ? name.split(" ")[0] : null,
        customMessage: customMessage || null,
      }),
    [variant, name, customMessage]
  );

  async function send() {
    if (!email.trim()) {
      setResult({ ok: false, message: "A recipient email is required." });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/proposals/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, variant, customMessage }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setResult({ ok: true, message: `Call for Proposals sent to ${email}.` });
        setTimeout(onSent, 900);
      } else {
        const detail = json.results?.[0]?.error || json.error || "Could not send the email.";
        setResult({ ok: false, message: detail });
      }
    } catch {
      setResult({ ok: false, message: "Network error. Try again." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0E5566] to-[#0066B3] flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold text-slate-900">Send Call for Proposals</div>
            <div className="text-xs text-slate-500">Invite someone to submit a proposal</div>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setView("compose")}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === "compose" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              <PenLine className="w-3.5 h-3.5" /> Compose
            </button>
            <button
              type="button"
              onClick={() => setView("preview")}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {view === "compose" ? (
          <div className="p-5 space-y-4">
            {/* Variant */}
            <div>
              <label className="block text-xs font-bold tracking-wide uppercase text-slate-500 mb-2">Which version?</label>
              <div className="grid grid-cols-2 gap-2.5">
                <VariantCard
                  active={variant === "general"}
                  onClick={() => setVariant("general")}
                  title="General"
                  desc="The whole field, practitioners, researchers, educators, advocates."
                />
                <VariantCard
                  active={variant === "healthcare"}
                  onClick={() => setVariant("healthcare")}
                  title="Healthcare"
                  desc="Clinicians, physicians, nurses, social workers, care coordinators."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Recipient name" optional>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Maria Alvarez"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
                />
              </Field>
              <Field label="Recipient email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.org"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
                />
              </Field>
            </div>

            <Field label="Personal note" optional>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                placeholder="A line or two that appears in a highlighted box near the top of the email."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none resize-none"
              />
            </Field>

            <p className="text-xs text-slate-400">
              The email links to the public proposal form. Each recipient is logged so you can see who&rsquo;s been contacted and resend later.
            </p>
          </div>
        ) : (
          <div className="p-5">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <iframe title="Email preview" srcDoc={previewHtml} className="w-full h-[60vh] bg-white" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4 flex items-center gap-3">
          {result && (
            <div className={`flex items-center gap-1.5 text-sm font-medium ${result.ok ? "text-emerald-600" : "text-rose-600"}`}>
              {result.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{result.message}</span>
            </div>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending…" : "Send email"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VariantCard({
  active, onClick, title, desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-xl border transition-all ${active ? "border-[#0066B3] bg-[#0066B3]/5 ring-1 ring-[#0066B3]/20" : "border-slate-200 hover:border-slate-300"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">{title}</span>
        {active && <Check className="w-4 h-4 text-[#0066B3]" />}
      </div>
      <p className="text-xs text-slate-500 mt-1 leading-snug">{desc}</p>
    </button>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold tracking-wide uppercase text-slate-500 mb-1.5">
        {label}{optional && <span className="ml-1 font-medium normal-case tracking-normal text-slate-400">optional</span>}
      </span>
      {children}
    </label>
  );
}
