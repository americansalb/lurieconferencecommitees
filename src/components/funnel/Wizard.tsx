"use client";

// Shared chrome and inputs for the public conference funnels (register,
// proposal). The goal is a calm, one-decision-per-screen wizard: a thin
// progress rail, a single big question per step, large friendly inputs,
// keyboard support, and smooth transitions. Both funnels compose these
// primitives so they feel like the same product.

import React, { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowRight, Check, Loader2 } from "lucide-react";

export const C = {
  teal: "#0E4456",
  teal2: "#0E5566",
  tealDeep: "#0C3B4B",
  blue: "#2A8FCC",
  blueDeep: "#1E6FA2",
  gold: "#C9A14B",
  goldSoft: "#F4E9CD",
  paper: "#FAFBFC",
  ink: "#0B1F25",
  inkSoft: "#284752",
  muted: "#5A6E76",
  mutedSoft: "#8898A0",
  hairline: "#E6EBEE",
};

// Advance on Enter, but never hijack Enter inside a textarea (newlines) or
// when a modifier is held.
export function useEnterKey(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter" || e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.getAttribute("role") === "button")) return;
      e.preventDefault();
      handler();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler, enabled]);
}

export function WizardShell({
  eyebrow,
  current,
  total,
  onBack,
  wide,
  children,
}: {
  eyebrow: string;
  current: number; // 0-based
  total: number;
  onBack: () => void;
  // Comparison steps (e.g. choosing a sponsorship tier) need the tiers
  // side by side, so they opt into a wider content column while keeping
  // the same rail, header, and eyebrow as every other step.
  wide?: boolean;
  children: React.ReactNode;
}) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(120% 75% at 50% -8%, rgba(201,161,75,0.10), transparent 60%),
          radial-gradient(110% 60% at 50% 112%, rgba(42,143,204,0.09), transparent 60%),
          ${C.paper}`,
      }}
    >
      {/* Progress rail, pinned to the very top edge */}
      <div className="fixed top-0 inset-x-0 z-50 h-1" style={{ background: "rgba(11,31,37,0.06)" }}>
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${C.teal} 0%, ${C.blue} 70%, ${C.gold} 100%)`,
            transition: "width 0.5s cubic-bezier(0.22,0.61,0.36,1)",
            boxShadow: `0 0 12px ${C.blue}66`,
          }}
        />
      </div>

      <div className={`${wide ? "max-w-5xl" : "max-w-xl"} mx-auto px-5 sm:px-6`}>
        {/* Header: back + brand + step counter */}
        <div className="flex items-center justify-between pt-7 pb-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-[13px] font-semibold rounded-lg px-2 py-1.5 -ml-2 transition-colors hover:bg-black/[0.04]"
            style={{ color: C.muted }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2.5 opacity-90">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/lurie-icon.png" alt="Lurie Children's" className="h-6 w-auto" />
            <span className="w-px h-4" style={{ background: C.hairline }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/aalb-icon.png" alt="AALB" className="h-6 w-auto" />
          </div>

          <div className="text-[11px] font-bold tracking-wider tabular-nums" style={{ color: C.mutedSoft }}>
            {current + 1}<span style={{ color: C.hairline }}> / </span>{total}
          </div>
        </div>

        <div
          className="text-[10px] font-bold tracking-[0.24em] uppercase text-center pb-6"
          style={{ color: C.gold }}
        >
          {eyebrow}
        </div>

        {children}
      </div>
    </div>
  );
}

// One step's content, animated in. `stepKey` should be unique per step so
// the animation re-fires on navigation.
export function StepFrame({
  stepKey,
  children,
}: {
  stepKey: string | number;
  children: React.ReactNode;
}) {
  return (
    <div key={stepKey} className="wiz-step-in pb-24">
      {children}
    </div>
  );
}

export function Question({
  title,
  sub,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <h1
        className="font-bold tracking-tight leading-[1.08] text-[28px] sm:text-[34px]"
        style={{ color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.muted }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  autoFocus,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  inputMode?: "text" | "email" | "tel" | "url";
}) {
  return (
    <label className="block">
      {label && (
        <span className="ml-0.5 text-[13px] font-semibold" style={{ color: C.inkSoft }}>
          {label}
          {required && <span style={{ color: C.gold }}> *</span>}
        </span>
      )}
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${label ? "mt-2 " : ""}w-full px-4 py-3.5 text-[15px] rounded-xl border bg-white outline-none transition-all
          focus:ring-4 focus:ring-[#0E4456]/10 focus:border-[#0E4456]`}
        style={{ borderColor: C.hairline, color: C.ink }}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
  autoFocus,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  autoFocus?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      {(label || hint) && (
        <div className="flex items-baseline justify-between">
          <span className="ml-0.5 text-[13px] font-semibold" style={{ color: C.inkSoft }}>
            {label}
            {required && <span style={{ color: C.gold }}> *</span>}
          </span>
          {hint && <span className="text-[11px]" style={{ color: C.mutedSoft }}>{hint}</span>}
        </div>
      )}
      <textarea
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`${label || hint ? "mt-2 " : ""}w-full px-4 py-3.5 text-[15px] leading-relaxed rounded-xl border bg-white outline-none transition-all resize-y
          focus:ring-4 focus:ring-[#0E4456]/10 focus:border-[#0E4456]`}
        style={{ borderColor: C.hairline, color: C.ink }}
      />
    </label>
  );
}

// Big tappable choice card. Used for the headline decision on a step
// (e.g. attendance mode). Selecting can auto-advance the wizard.
export function ChoiceCard({
  selected,
  accent,
  icon: Icon,
  title,
  tagline,
  price,
  features,
  onClick,
}: {
  selected: boolean;
  accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  tagline: string;
  price?: string;
  features?: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: selected ? accent + "0D" : "white",
        border: selected ? `2px solid ${accent}` : `1.5px solid ${C.hairline}`,
        boxShadow: selected
          ? `0 18px 40px -20px ${accent}77`
          : "0 6px 18px -14px rgba(11,31,37,0.25)",
      }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={{ background: accent + "16", color: accent }}
        >
          <Icon className="w-6 h-6" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[20px] font-bold leading-tight" style={{ color: C.ink }}>
            {title}
          </div>
          <div className="text-[13px]" style={{ color: C.muted }}>{tagline}</div>
        </div>
        {price && (
          <div className="text-right shrink-0">
            <div className="text-[26px] font-bold tabular-nums leading-none" style={{ color: C.ink }}>
              {price}
            </div>
            <div className="text-[10px] font-semibold tracking-wide" style={{ color: C.mutedSoft }}>USD</div>
          </div>
        )}
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
          style={{
            background: selected ? accent : "transparent",
            border: selected ? "none" : `1.5px solid ${C.hairline}`,
          }}
        >
          {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </span>
      </div>
      {features && features.length > 0 && (
        <ul className="mt-4 pt-4 grid grid-cols-1 gap-1.5" style={{ borderTop: `1px solid ${C.hairline}` }}>
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: C.inkSoft }}>
              <Check className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} strokeWidth={3} />
              {f}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

export function Pill({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150 hover:-translate-y-0.5"
      style={{
        background: selected ? C.teal : "white",
        color: selected ? "white" : C.inkSoft,
        border: `1.5px solid ${selected ? C.teal : C.hairline}`,
        boxShadow: selected ? `0 10px 22px -12px ${C.teal}` : "0 2px 8px -6px rgba(11,31,37,0.2)",
      }}
    >
      {children}
    </button>
  );
}

export function ToggleRow({
  checked,
  onToggle,
  title,
  desc,
  icon: Icon,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  desc: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left rounded-xl p-4 transition-all"
      style={{
        background: checked ? C.teal + "0C" : "white",
        border: checked ? `1.5px solid ${C.teal}` : `1.5px solid ${C.hairline}`,
      }}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: checked ? C.teal + "18" : C.paper, color: checked ? C.teal : C.muted }}
          >
            <Icon className="w-4 h-4" />
          </span>
        )}
        <div className="flex-1">
          <div className="text-[14px] font-bold" style={{ color: C.ink }}>{title}</div>
          <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>{desc}</div>
        </div>
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all"
          style={{
            background: checked ? C.teal : "white",
            border: checked ? "none" : `1.5px solid ${C.hairline}`,
          }}
        >
          {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </span>
      </div>
    </button>
  );
}

export function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
  icon: Icon = ArrowRight,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold text-[15px] text-white
        transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-xl
        disabled:opacity-45 disabled:cursor-not-allowed"
      style={{
        background: `linear-gradient(135deg, ${C.teal} 0%, ${C.blue} 100%)`,
        boxShadow: "0 16px 34px -16px rgba(14,68,86,0.7)",
      }}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Just a moment…
        </>
      ) : (
        <>
          {children} <Icon className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

export function GhostButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-[14px] transition-colors hover:bg-black/[0.03]"
      style={{ color: C.muted, border: `1.5px solid ${C.hairline}` }}
    >
      {children}
    </button>
  );
}

export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mt-4 px-3.5 py-3 rounded-xl text-[13px] inline-flex items-start gap-2 wiz-pop"
      style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}>
      <span className="mt-px">⚠</span>
      <span>{message}</span>
    </div>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-center text-[12px] leading-relaxed" style={{ color: C.mutedSoft }}>
      {children}
    </p>
  );
}
