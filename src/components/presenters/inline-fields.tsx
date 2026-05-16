"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X, Plus } from "lucide-react";

export function InlineTextSlot({
  value,
  setValue,
  placeholder,
  type = "text",
  size = "md",
  required,
}: {
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
  type?: "text" | "email";
  size?: "sm" | "md" | "lg";
  required?: boolean;
}) {
  const sizing = size === "lg" ? "text-2xl font-bold" : size === "sm" ? "text-sm" : "text-base";
  const hasValue = !!value;
  return (
    <span className="relative inline-flex items-baseline">
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={
          "bg-transparent outline-none border-b border-dashed transition-colors px-1 py-0.5 " +
          sizing +
          " " +
          (hasValue
            ? "border-slate-300 text-slate-900 focus:border-[#0066B3]"
            : "border-slate-300 text-slate-400 placeholder:text-slate-400 focus:border-[#0066B3]")
        }
        style={{ width: `${Math.max((value || placeholder).length + 1, 4)}ch` }}
      />
      {required && !hasValue && (
        <span aria-hidden className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-400 self-center" />
      )}
    </span>
  );
}

export function InlineChip({
  value,
  setValue,
  options,
  emptyLabel,
  allowCustom = true,
  tone = "neutral",
}: {
  value: string;
  setValue: (v: string) => void;
  options: readonly string[];
  emptyLabel: string;
  allowCustom?: boolean;
  tone?: "neutral" | "warn";
}) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCustomMode(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const hasValue = !!value;
  const empty = !hasValue;

  return (
    <span ref={ref} className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-base font-medium transition-colors " +
          (hasValue
            ? "bg-[#0066B3]/8 text-[#0E5566] hover:bg-[#0066B3]/15 ring-1 ring-[#0066B3]/20"
            : tone === "warn"
            ? "bg-amber-50 text-amber-800 hover:bg-amber-100 ring-1 ring-amber-200"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 ring-1 ring-slate-200")
        }
      >
        <span>{empty ? emptyLabel : value}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-30 min-w-[12rem] bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="max-h-72 overflow-y-auto py-1">
            {options.map((o) => {
              const active = o === value;
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    setValue(o);
                    setOpen(false);
                    setCustomMode(false);
                  }}
                  className={
                    "w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-slate-50 " +
                    (active ? "text-[#0E5566] font-semibold" : "text-slate-700")
                  }
                >
                  <span>{o}</span>
                  {active && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
            {hasValue && !options.includes(value) && (
              <div className="px-3 py-2 text-sm text-[#0E5566] font-semibold bg-slate-50 flex items-center justify-between">
                <span>{value}</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
          {allowCustom && (
            <div className="border-t border-slate-100 p-2">
              {customMode ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={customDraft}
                    onChange={(e) => setCustomDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customDraft.trim()) {
                        setValue(customDraft.trim());
                        setCustomDraft("");
                        setCustomMode(false);
                        setOpen(false);
                      } else if (e.key === "Escape") {
                        setCustomMode(false);
                      }
                    }}
                    placeholder="Type and press Enter"
                    className="flex-1 px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-[#0066B3] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomMode(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCustomMode(true)}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" /> Custom value
                </button>
              )}
            </div>
          )}
          {hasValue && (
            <div className="border-t border-slate-100 p-2">
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </span>
  );
}

export function OptionalBlock({
  title,
  isOpen,
  onOpen,
  onRemove,
  children,
  icon: Icon,
}: {
  title: string;
  isOpen: boolean;
  onOpen: () => void;
  onRemove: () => void;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#0066B3] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> {title}
      </button>
    );
  }
  return (
    <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {title}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-medium text-slate-400 hover:text-rose-600"
        >
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

export function SoftInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url" | "tel" | "number" | "date";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 outline-none transition-all placeholder:text-slate-400"
    />
  );
}

export function SoftTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 outline-none transition-all placeholder:text-slate-400"
    />
  );
}

export function Money({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-7 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 outline-none transition-all placeholder:text-slate-400"
      />
    </div>
  );
}

export function EmailPreview({
  html,
  caption,
}: {
  html: string;
  caption?: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col bg-slate-100/70">
      {caption && (
        <div className="px-6 py-3 border-b border-slate-200 text-xs text-slate-500 flex items-center gap-2 shrink-0">
          {caption}
        </div>
      )}
      <div className="flex-1 overflow-hidden p-4">
        <iframe
          srcDoc={html}
          title="Email preview"
          className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200"
          sandbox=""
        />
      </div>
    </div>
  );
}

