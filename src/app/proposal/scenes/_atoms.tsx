"use client";

import { useEffect, useRef } from "react";

export const TEAL = "#0E4456";
export const TEAL_DEEP = "#0C3B4B";
export const GOLD = "#C9A14B";
export const GOLD_SOFT = "#F4E9CD";
export const PAPER = "#FAFBFC";
export const INK = "#0B1F25";
export const MUTED = "#5A6E76";
export const HAIRLINE = "#E6EBEE";

export function SceneEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span style={{ color: GOLD }}>[</span>
      <span
        className="text-[10px] font-bold tracking-[0.30em] uppercase"
        style={{ color: GOLD }}
      >
        {children}
      </span>
      <span style={{ color: GOLD }}>]</span>
      <span className="flex-1 ml-2 h-px" style={{ background: `${GOLD_SOFT}` }} />
    </div>
  );
}

export function Field({
  label, value, onChange, placeholder, required, type, error, autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  error?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: MUTED }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </span>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="mt-1 w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors"
        style={{
          borderColor: error ? "#dc2626" : HAIRLINE,
          boxShadow: error ? "0 0 0 3px rgba(220,38,38,0.10)" : undefined,
        }}
      />
    </label>
  );
}

export function TextArea({
  label, value, onChange, placeholder, required, rows, error, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  error?: boolean;
  hint?: React.ReactNode;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  // Auto-grow.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: MUTED }}>
          {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
        </span>
        {hint && <span className="text-[11px]" style={{ color: MUTED }}>{hint}</span>}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        className="mt-1 w-full px-3 py-2.5 text-sm border rounded-lg outline-none leading-relaxed resize-none"
        style={{
          borderColor: error ? "#dc2626" : HAIRLINE,
          boxShadow: error ? "0 0 0 3px rgba(220,38,38,0.10)" : undefined,
          minHeight: (rows ?? 3) * 24,
        }}
      />
    </label>
  );
}

export function BigTitleInput({
  value, onChange, placeholder, error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: MUTED }}>
        Working title <span style={{ color: "#dc2626" }}>*</span>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full font-serif-display text-[26px] sm:text-[30px] font-bold tracking-tight border-b-2 bg-transparent outline-none pb-2 transition-colors"
        style={{
          color: INK,
          borderColor: error ? "#dc2626" : GOLD,
        }}
      />
    </label>
  );
}

export function PillGroup({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold tracking-wide uppercase mb-2.5" style={{ color: MUTED }}>
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(selected ? "" : opt)}
              className="px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all"
              style={{
                background: selected ? TEAL : "white",
                color: selected ? "white" : INK,
                border: `1px solid ${selected ? TEAL : HAIRLINE}`,
                boxShadow: selected ? `0 6px 14px -8px ${TEAL}99` : undefined,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
