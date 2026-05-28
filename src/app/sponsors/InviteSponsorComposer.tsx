"use client";

import { useState } from "react";
import { X, Loader2, Send, AlertCircle, Check, Sparkles } from "lucide-react";

export default function InviteSponsorComposer({
  onClose, onSent,
}: {
  onClose: () => void;
  onSent: () => void;
}) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function send() {
    if (!companyName.trim() || !contactName.trim() || !contactEmail.trim()) {
      setResult({ ok: false, message: "Company, contact name, and email are required." });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/sponsors/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName, contactName, contactEmail, contactRole, contactPhone, website,
          inviteMessage,
        }),
      });
      const json = await res.json();
      if (res.ok && json.sent) {
        setResult({ ok: true, message: `Invitation sent to ${contactEmail}.` });
        setTimeout(onSent, 900);
      } else {
        setResult({ ok: false, message: json.error || "Could not send invitation." });
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
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold text-slate-900">Invite a sponsor</div>
            <div className="text-xs text-slate-500">They&rsquo;ll choose their own sponsorship level on the invitation page.</div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Company / organization" value={companyName} onChange={setCompanyName} required className="sm:col-span-2" />
            <Field label="Contact name" value={contactName} onChange={setContactName} required />
            <Field label="Role" value={contactRole} onChange={setContactRole} placeholder="e.g. Director of Outreach" />
            <Field label="Email" value={contactEmail} onChange={setContactEmail} required type="email" />
            <Field label="Phone (optional)" value={contactPhone} onChange={setContactPhone} />
            <Field label="Website (optional)" value={website} onChange={setWebsite} placeholder="https://" className="sm:col-span-2" />
            <label className="block sm:col-span-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Personal note (optional)
              </span>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={4}
                placeholder={`Hi ${contactName.split(" ")[0] || "[name]"}, I wanted to personally reach out about sponsoring our conference because…`}
                className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Appears at the top of the invitation page in a highlighted callout. Use this to suggest a tier or speak to a specific opportunity if you&rsquo;d like.
              </span>
            </label>
          </div>

          {result && (
            <div className={`px-3 py-2 rounded-lg border text-sm inline-flex items-start gap-2 ${
              result.ok
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}>
              {result.ok ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              {result.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Cancel
            </button>
            <button
              onClick={send}
              disabled={sending}
              className="px-5 py-2.5 rounded-lg font-bold text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-2 text-sm bg-gradient-to-r from-[#0E5566] to-[#0066B3]"
            >
              {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send invitation</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, required, type, className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
      />
    </label>
  );
}
