"use client";

import { useState } from "react";
import { X, Loader2, Tag, Check, AlertCircle, Monitor, MapPin } from "lucide-react";

// Create a discount code. The value is set per attendance mode, leave a mode
// blank and the code won't apply there (so "$15 virtual only" is just virtual
// filled, in-person empty). "kind" switches both inputs between dollars and
// percent.
export default function CreateDiscountModal({
  onClose, onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"fixed" | "percent">("fixed");
  const [inPersonValue, setInPersonValue] = useState("");
  const [virtualValue, setVirtualValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unit = kind === "fixed" ? "$" : "%";

  async function submit() {
    if (!code.trim()) { setError("Enter a code."); return; }
    if (!inPersonValue.trim() && !virtualValue.trim()) {
      setError("Set a discount for at least one of in-person or virtual.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code, description, kind,
          inPersonValue: inPersonValue.trim() || null,
          virtualValue: virtualValue.trim() || null,
          expiresAt: expiresAt || null,
          maxRedemptions: maxRedemptions || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        onCreated();
      } else {
        setError(json.error || "Could not create the code.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0E5566] to-[#0066B3] flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold text-slate-900">New discount code</div>
            <div className="text-xs text-slate-500">Set the value per attendance mode</div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Code">
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")); setError(null); }}
              placeholder="PARTNER25"
              className="w-full px-3 py-2.5 text-sm font-mono font-bold tracking-wide bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
            />
          </Field>

          <Field label="Internal label" optional>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Partner organization, Northwestern"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
            />
          </Field>

          {/* Kind toggle */}
          <Field label="Discount type">
            <div className="grid grid-cols-2 gap-2">
              <TypeButton active={kind === "fixed"} onClick={() => setKind("fixed")} label="Fixed amount" hint="e.g. $30 off" />
              <TypeButton active={kind === "percent"} onClick={() => setKind("percent")} label="Percentage" hint="e.g. 15% off" />
            </div>
          </Field>

          {/* Per-mode values */}
          <Field label="Value per mode" hint="Leave a mode blank to exclude it">
            <div className="grid grid-cols-2 gap-2">
              <ModeInput icon={<MapPin className="w-3.5 h-3.5" />} label="In-person" unit={unit} value={inPersonValue} onChange={setInPersonValue} />
              <ModeInput icon={<Monitor className="w-3.5 h-3.5" />} label="Virtual" unit={unit} value={virtualValue} onChange={setVirtualValue} />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Expires" optional>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
              />
            </Field>
            <Field label="Max redemptions" optional>
              <input
                type="number"
                min={1}
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
              />
            </Field>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4 flex items-center gap-3">
          {error && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-rose-600">
              <AlertCircle className="w-4 h-4" /> <span>{error}</span>
            </div>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Create code
          </button>
        </div>
      </div>
    </div>
  );
}

function TypeButton({ active, onClick, label, hint }: { active: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-xl border transition-all ${active ? "border-[#0066B3] bg-[#0066B3]/5 ring-1 ring-[#0066B3]/20" : "border-slate-200 hover:border-slate-300"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">{label}</span>
        {active && <Check className="w-4 h-4 text-[#0066B3]" />}
      </div>
      <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>
    </button>
  );
}

function ModeInput({
  icon, label, unit, value, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-2.5">
      <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
        {icon} {label}
      </div>
      <div className="flex items-center gap-1">
        {unit === "$" && <span className="text-slate-400 text-sm font-semibold">$</span>}
        <input
          type="number"
          min={0}
          step={unit === "$" ? "1" : "1"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="–"
          className="w-full px-1 py-1 text-sm font-semibold bg-transparent outline-none tabular-nums"
        />
        {unit === "%" && <span className="text-slate-400 text-sm font-semibold">%</span>}
      </div>
    </div>
  );
}

function Field({ label, optional, hint, children }: { label: string; optional?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold tracking-wide uppercase text-slate-500">
          {label}{optional && <span className="ml-1 font-medium normal-case tracking-normal text-slate-400">optional</span>}
        </span>
        {hint && <span className="text-[11px] text-slate-400 normal-case font-medium">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
