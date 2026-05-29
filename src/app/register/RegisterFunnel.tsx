"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar, MapPin, Monitor, ArrowRight, Check, AlertCircle,
  Loader2, CreditCard, Sparkles, ChevronLeft,
} from "lucide-react";

const TEAL = "#0E4456";
const TEAL_DEEP = "#0C3B4B";
const BLUE = "#2A8FCC";
const GOLD = "#C9A14B";
const PAPER = "#FAFBFC";
const INK = "#0B1F25";
const MUTED = "#5A6E76";
const HAIRLINE = "#E6EBEE";

type Mode = "in-person" | "virtual";

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  primaryLanguages: string;
  attendanceMode: Mode | "";
  needsParking: boolean;
  accessibilityNotes: string;
  dietary: string;
};

const EMPTY: Form = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  primaryLanguages: "",
  attendanceMode: "",
  needsParking: false,
  accessibilityNotes: "",
  dietary: "",
};

export default function RegisterFunnel({
  tierLabel, tierEnd, inPersonPrice, virtualPrice,
}: {
  tierLabel: string;
  tierEnd: string;
  inPersonPrice: number;
  virtualPrice: number;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const livePrice = form.attendanceMode === "in-person"
    ? inPersonPrice
    : form.attendanceMode === "virtual"
      ? virtualPrice
      : null;

  function update<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    setError(null);
    if (!form.attendanceMode) {
      setError("Please choose in-person or virtual.");
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/attendees/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error || "Could not start checkout. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const tierEndDate = new Date(tierEnd).toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="min-h-screen" style={{ background: PAPER }}>
      {/* Hero band */}
      <div
        className="relative overflow-hidden text-white"
        style={{
          background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,161,75,0.18) 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white mb-6">
            <ChevronLeft className="w-3 h-3" /> Back to the conference
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.22em] uppercase mb-5 border"
            style={{
              color: "#F4E9CD",
              borderColor: "rgba(201,161,75,0.45)",
              background: "rgba(201,161,75,0.08)",
            }}>
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            Registration
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight">
            Reserve your seat.
          </h1>
          <p className="mt-3 text-white/75 text-sm sm:text-base max-w-xl mx-auto">
            August 15 and 16, 2026 &middot; Lurie Children&rsquo;s, Chicago. {tierLabel} pricing through {tierEndDate}.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6 pb-20">
        <div
          className="bg-white rounded-2xl border overflow-hidden"
          style={{ borderColor: HAIRLINE, boxShadow: "0 24px 60px -28px rgba(11,31,37,0.20)" }}
        >
          {/* Step 1: choose mode */}
          <Section number="1" title="How will you attend?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ModeChoice
                selected={form.attendanceMode === "in-person"}
                accent={TEAL}
                icon={MapPin}
                title="In-Person"
                tagline="Join us in Chicago"
                price={inPersonPrice}
                features={["Lunch + materials", "CEU certificate", "Recordings after"]}
                onClick={() => update("attendanceMode", "in-person")}
              />
              <ModeChoice
                selected={form.attendanceMode === "virtual"}
                accent={BLUE}
                icon={Monitor}
                title="Virtual"
                tagline="Attend from anywhere"
                price={virtualPrice}
                features={["Live stream", "CEU certificate", "On-demand replays"]}
                onClick={() => update("attendanceMode", "virtual")}
              />
            </div>
          </Section>

          {/* Step 2: details */}
          <Section number="2" title="About you" disabled={!form.attendanceMode}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="First name" required value={form.firstName} onChange={(v) => update("firstName", v)} />
              <Field label="Last name"  required value={form.lastName}  onChange={(v) => update("lastName", v)} />
              <Field label="Email"      required value={form.email}     onChange={(v) => update("email", v)} type="email" className="sm:col-span-2" />
              <Field label="Phone"      value={form.phone} onChange={(v) => update("phone", v)} type="tel" />
              <Field
                label="Primary languages"
                placeholder="e.g. English, Spanish, ASL"
                value={form.primaryLanguages}
                onChange={(v) => update("primaryLanguages", v)}
              />
            </div>
          </Section>

          {/* Step 3: extras */}
          <Section number="3" title="Anything else?" disabled={!form.attendanceMode}>
            <div className="space-y-4">
              {form.attendanceMode === "in-person" && (
                <BigToggle
                  checked={form.needsParking}
                  onToggle={() => update("needsParking", !form.needsParking)}
                  title="Parking pass at the venue"
                  desc="We'll reserve a spot at the Streeterville garage."
                />
              )}
              <TextArea
                label="Accessibility accommodations (optional)"
                placeholder="ASL, captioning, mobility, lighting, seating, or anything else that helps."
                value={form.accessibilityNotes}
                onChange={(v) => update("accessibilityNotes", v)}
              />
              {form.attendanceMode === "in-person" && (
                <TextArea
                  label="Dietary needs (optional)"
                  placeholder="Vegetarian, vegan, halal, kosher, allergies, etc."
                  value={form.dietary}
                  onChange={(v) => update("dietary", v)}
                />
              )}
            </div>
          </Section>

          {/* Step 4: review + pay */}
          <Section number="4" title="Review and pay" disabled={!form.attendanceMode}>
            <div className="rounded-xl p-5" style={{ background: PAPER, border: `1px solid ${HAIRLINE}` }}>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: MUTED }}>
                    Total due today
                  </div>
                  <div className="text-xs mt-1" style={{ color: MUTED }}>
                    {form.attendanceMode === "in-person" ? "In-Person" : form.attendanceMode === "virtual" ? "Virtual" : "Pick attendance above"} &middot; {tierLabel} pricing
                  </div>
                </div>
                <div className="font-serif-display text-4xl font-bold tabular-nums" style={{ color: INK }}>
                  {livePrice !== null ? `$${livePrice}` : "..."}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm inline-flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting || !form.attendanceMode}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold text-base text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${BLUE} 100%)` }}
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting checkout…</>
                : <><CreditCard className="w-4 h-4" /> Continue to secure checkout <ArrowRight className="w-4 h-4" /></>}
            </button>

            <p className="mt-3 text-center text-[11px]" style={{ color: MUTED }}>
              Payment processed by Stripe. Your seat is reserved as soon as payment completes. Refundable through July 15.
            </p>
          </Section>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: MUTED }}>
          Need to pay by check or invoice? Email{" "}
          <a className="font-semibold" style={{ color: TEAL }} href="mailto:contact@aalb.org">contact@aalb.org</a>.
        </p>
      </div>
    </div>
  );
}

function Section({
  number, title, disabled, children,
}: {
  number: string;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-6 sm:p-8 transition-opacity"
      style={{
        borderBottom: `1px solid ${HAIRLINE}`,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : undefined,
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center font-serif-display text-sm font-bold tabular-nums"
          style={{ background: GOLD + "22", color: GOLD }}
        >
          {number}
        </span>
        <h2 className="font-serif-display text-xl font-bold" style={{ color: INK }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ModeChoice({
  selected, accent, icon: Icon, title, tagline, price, features, onClick,
}: {
  selected: boolean;
  accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  tagline: string;
  price: number;
  features: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl p-5 transition-all"
      style={{
        background: selected ? accent + "0F" : "white",
        border: selected ? `1.5px solid ${accent}` : `1px solid ${HAIRLINE}`,
        boxShadow: selected ? `0 12px 28px -16px ${accent}55` : undefined,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: accent + "1A", color: accent }}
        >
          <Icon className="w-5 h-5" />
        </span>
        <div className="flex-1">
          <div className="font-serif-display text-lg font-bold leading-tight" style={{ color: INK }}>{title}</div>
          <div className="text-xs" style={{ color: MUTED }}>{tagline}</div>
        </div>
        {selected && (
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: accent }}>
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="font-serif-display text-3xl font-bold tabular-nums" style={{ color: INK }}>${price}</span>
        <span className="text-xs" style={{ color: MUTED }}>USD</span>
      </div>
      <ul className="space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-[12px]" style={{ color: MUTED }}>
            <Check className="w-3 h-3 shrink-0" style={{ color: accent }} strokeWidth={3} />
            {f}
          </li>
        ))}
      </ul>
    </button>
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
      <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: MUTED }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </span>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-600"
        style={{ borderColor: HAIRLINE }}
      />
    </label>
  );
}

function TextArea({
  label, value, onChange, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: MUTED }}>
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="mt-1 w-full px-3 py-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-600 resize-y"
        style={{ borderColor: HAIRLINE }}
      />
    </label>
  );
}

function BigToggle({
  checked, onToggle, title, desc,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left rounded-xl p-4 transition-all"
      style={{
        background: checked ? TEAL + "0E" : "white",
        border: checked ? `1.5px solid ${TEAL}` : `1px solid ${HAIRLINE}`,
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
          style={{
            background: checked ? TEAL : "white",
            border: checked ? "none" : `1px solid ${HAIRLINE}`,
            color: "white",
          }}
        >
          {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
        </span>
        <div className="flex-1">
          <div className="text-sm font-bold" style={{ color: INK }}>{title}</div>
          <div className="text-xs mt-0.5" style={{ color: MUTED }}>{desc}</div>
        </div>
      </div>
    </button>
  );
}
