"use client";

import { useState } from "react";
import {
  Check, ChevronRight, ChevronLeft, MapPin, Monitor, Calendar,
  Sparkles, Car, Accessibility, Utensils, Loader2, CreditCard, AlertCircle,
} from "lucide-react";

type Pricing = {
  inPersonBaseCents: number;
  inPersonFinalCents: number;
  virtualBaseCents: number;
};

type Initial = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  affiliation: string;
  primaryLanguages: string;
  attendanceMode: string | null;
  needsParking: boolean | null;
  accessibilityNotes: string;
  dietary: string;
  discountPercent: number;
  status: string;
  paid: boolean;
  inviteMessage: string | null;
};

const TEAL = "#0E5566";
const TEAL_DARK = "#0A3F4D";
const BLUE = "#0066B3";
const GOLD = "#C99A2E";

function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dollarsNoCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function AttendeeFunnel({
  token,
  initial,
  pricing,
}: {
  token: string;
  initial: Initial;
  pricing: Pricing;
}) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(initial.paid ? 3 : 0);
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Initial>(key: K, value: Initial[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function persist(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendees/confirm/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          affiliation: data.affiliation || null,
          primaryLanguages: data.primaryLanguages || null,
          attendanceMode: data.attendanceMode,
          needsParking: data.needsParking,
          accessibilityNotes: data.accessibilityNotes || null,
          dietary: data.dietary || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Could not save");
        return false;
      }
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function checkout() {
    if (!data.attendanceMode) {
      setError("Pick how you'd like to attend first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const saved = await persist();
    if (!saved) { setSubmitting(false); return; }

    try {
      const res = await fetch("/api/attendees/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error || "Could not start checkout");
        setSubmitting(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Could not reach the payment system. Please try again.");
      setSubmitting(false);
    }
  }

  async function advance() {
    const saved = await persist();
    if (saved) setStep((s) => Math.min(3, (s + 1)) as typeof step);
  }

  const finalCents = data.attendanceMode === "in-person"
    ? pricing.inPersonFinalCents
    : data.attendanceMode === "virtual"
    ? pricing.virtualBaseCents
    : 0;
  const baseCents = data.attendanceMode === "in-person"
    ? pricing.inPersonBaseCents
    : data.attendanceMode === "virtual"
    ? pricing.virtualBaseCents
    : 0;
  const savings = baseCents - finalCents;

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, #f7f3ea 0%, #ffffff 60%, #f0f6f7 100%)` }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3"
            style={{ background: TEAL + "12", color: TEAL }}>
            <Sparkles className="w-3 h-3" /> 2026 Conference Invitation
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Lurie Children&rsquo;s &amp; AALB Conference
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            True Language Access: Yesterday, Today, and Tomorrow
          </p>
          <p className="text-xs text-slate-400 mt-2 inline-flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> August 15 &amp; 16, 2026 &middot; Chicago
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? 36 : 16,
                background: i <= step ? TEAL : "#e2e8f0",
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="h-1.5" style={{ background: `linear-gradient(to right, ${TEAL} 0%, ${TEAL} 50%, ${BLUE} 50%, ${BLUE} 100%)` }} />

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3">
                Welcome, {data.firstName}.
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                The conference is dedicated to language access in healthcare:
                two days of sessions on current practice and what is shifting
                in standards, technology, and policy. Held in person at Ann
                &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago,
                with full virtual attendance also available.
              </p>

              {data.inviteMessage && (
                <div className="mt-5 px-4 py-3 rounded-lg border-l-4 text-sm text-slate-700 leading-relaxed"
                  style={{ background: "#f8fafc", borderColor: BLUE }}>
                  {data.inviteMessage}
                </div>
              )}

              <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
                {[
                  "10+ hours of continuing education credit, submitted through CCHI, NBCMI, RID, and ATA",
                  "Attend in person in Chicago or fully online from anywhere",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: TEAL }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-lg p-4 bg-white"
                style={{ border: `1px solid #e2e8f0`, borderLeftWidth: 3, borderLeftColor: TEAL }}>
                <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: TEAL }}>
                  {data.discountPercent}% off &middot; in-person registration
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{dollars(pricing.inPersonFinalCents)}</span>
                  <span className="text-sm text-slate-400 line-through">{dollarsNoCents(pricing.inPersonBaseCents)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1.5">
                  Your invitation rate, applied automatically at checkout. Virtual attendance is also available at the standard {dollarsNoCents(pricing.virtualBaseCents)}.
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                <button
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all hover:shadow-lg"
                  style={{ background: TEAL }}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 inline ml-1 -mt-0.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Contact + attendance mode */}
          {step === 1 && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">Your details</h2>
              <p className="text-sm text-slate-500 mb-5">We&rsquo;ve pre-filled what we have. Please correct anything that&rsquo;s wrong.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="First name" value={data.firstName} onChange={(v) => update("firstName", v)} required />
                <Field label="Last name" value={data.lastName} onChange={(v) => update("lastName", v)} required />
                <Field label="Email" value={data.email} disabled className="sm:col-span-2" />
                <Field label="Phone" value={data.phone} onChange={(v) => update("phone", v)} placeholder="(555) 555-1212" />
                <Field label="Organization" value={data.affiliation} onChange={(v) => update("affiliation", v)} placeholder="Optional" />
                <Field label="Working language(s)" value={data.primaryLanguages} onChange={(v) => update("primaryLanguages", v)} placeholder="e.g. English, Spanish, ASL" className="sm:col-span-2" />
              </div>

              <div className="mt-7">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">How will you attend?</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ModeCard
                    selected={data.attendanceMode === "in-person"}
                    onClick={() => update("attendanceMode", "in-person")}
                    icon={MapPin}
                    title="In-person"
                    subtitle="On site at Lurie Children's, Chicago"
                    badge={dollars(pricing.inPersonFinalCents)}
                    badgeOriginal={data.discountPercent > 0 ? dollarsNoCents(pricing.inPersonBaseCents) : undefined}
                  />
                  <ModeCard
                    selected={data.attendanceMode === "virtual"}
                    onClick={() => update("attendanceMode", "virtual")}
                    icon={Monitor}
                    title="Virtual"
                    subtitle="Live stream all sessions"
                    badge={dollars(pricing.virtualBaseCents)}
                  />
                </div>
              </div>

              {error && <ErrorBanner msg={error} />}
              <StepNav onBack={() => setStep(0)} onNext={advance} saving={saving} disabled={!data.attendanceMode} />
            </div>
          )}

          {/* Step 2: Logistics */}
          {step === 2 && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">Almost there</h2>
              <p className="text-sm text-slate-500 mb-5">Help us set up the right experience for you.</p>

              {data.attendanceMode === "in-person" && (
                <div className="mb-5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" /> Parking at Lurie Children&rsquo;s
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <YesNoMaybe label="Yes" selected={data.needsParking === true} onClick={() => update("needsParking", true)} />
                    <YesNoMaybe label="No" selected={data.needsParking === false} onClick={() => update("needsParking", false)} />
                    <YesNoMaybe label="Not sure" selected={data.needsParking === null} onClick={() => update("needsParking", null)} />
                  </div>
                </div>
              )}

              <div className="mb-5">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Accessibility className="w-3.5 h-3.5" /> Accessibility accommodations
                </div>
                <textarea
                  value={data.accessibilityNotes}
                  onChange={(e) => update("accessibilityNotes", e.target.value)}
                  placeholder="ASL interpreter, CART, DeafBlind support, wheelchair access, sensory-friendly space, anything else we should know."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                />
              </div>

              {data.attendanceMode === "in-person" && (
                <div className="mb-5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5" /> Dietary preferences
                  </div>
                  <textarea
                    value={data.dietary}
                    onChange={(e) => update("dietary", e.target.value)}
                    placeholder="Vegetarian, vegan, gluten-free, allergies…"
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  />
                </div>
              )}

              {error && <ErrorBanner msg={error} />}
              <StepNav onBack={() => setStep(1)} onNext={advance} saving={saving} />
            </div>
          )}

          {/* Step 3: Review + pay */}
          {step === 3 && (
            <div className="p-6 sm:p-8">
              {data.paid ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
                    style={{ background: TEAL + "15" }}>
                    <Check className="w-7 h-7" style={{ color: TEAL }} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">You&rsquo;re all set</h2>
                  <p className="text-sm text-slate-500">A confirmation email is on its way.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">Review &amp; confirm</h2>
                  <p className="text-sm text-slate-500 mb-5">Looks good? Lock in your spot with secure card payment via Stripe.</p>

                  <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
                    <SummaryRow label="Name" value={`${data.firstName} ${data.lastName}`} />
                    <SummaryRow label="Email" value={data.email} />
                    <SummaryRow
                      label="Attendance"
                      value={data.attendanceMode === "in-person" ? "In-person" : data.attendanceMode === "virtual" ? "Virtual" : "Not yet selected"}
                    />
                    {data.attendanceMode === "in-person" && (
                      <SummaryRow label="Parking" value={
                        data.needsParking === true ? "Yes, please" :
                        data.needsParking === false ? "Not needed" : "Will figure out"
                      } />
                    )}
                  </div>

                  <div className="rounded-xl p-4 mb-5" style={{ background: TEAL + "08", border: `1px solid ${TEAL}22` }}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-slate-600">
                        {data.attendanceMode === "in-person" ? "In-person standard" : "Virtual standard"}
                      </span>
                      <span className="text-sm text-slate-500">{dollarsNoCents(baseCents)}</span>
                    </div>
                    {savings > 0 && (
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-sm font-semibold" style={{ color: TEAL }}>
                          Personal invite discount ({data.discountPercent}%)
                        </span>
                        <span className="text-sm font-semibold" style={{ color: TEAL }}>−{dollars(savings)}</span>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t flex items-baseline justify-between" style={{ borderColor: TEAL + "22" }}>
                      <span className="text-sm font-bold text-slate-900">Total today</span>
                      <span className="text-2xl font-extrabold text-slate-900">{dollars(finalCents)}</span>
                    </div>
                  </div>

                  {error && <ErrorBanner msg={error} />}

                  <button
                    onClick={checkout}
                    disabled={submitting || !data.attendanceMode}
                    className="w-full px-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    style={{ background: TEAL }}
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to checkout…</>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Continue to secure payment</>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-3">
                    Payment processed by Stripe. We never see or store your card details.
                  </p>
                  <div className="mt-4 text-center">
                    <button onClick={() => setStep(2)} className="text-xs font-semibold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
                      <ChevronLeft className="w-3 h-3" /> Back
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Questions? Reply to the email that brought you here and we&rsquo;ll get back to you personally.
        </p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, required, disabled, className,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      <input
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        className={`mt-1 w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors ${
          disabled
            ? "bg-slate-50 text-slate-500 border-slate-200"
            : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
        }`}
      />
    </label>
  );
}

function ModeCard({
  selected, onClick, icon: Icon, title, subtitle, badge, badgeOriginal,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
  badge: string;
  badgeOriginal?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition-all ${
        selected ? "shadow-md" : "hover:border-slate-300"
      }`}
      style={{
        borderColor: selected ? TEAL : "#e2e8f0",
        background: selected ? TEAL + "08" : "#fff",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: selected ? TEAL + "20" : "#f1f5f9" }}>
          <Icon className="w-5 h-5" style={{ color: selected ? TEAL : "#64748b" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            {title}
            {selected && <Check className="w-3.5 h-3.5" style={{ color: TEAL }} />}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-extrabold text-slate-900">{badge}</span>
            {badgeOriginal && <span className="text-xs text-slate-400 line-through">{badgeOriginal}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

function YesNoMaybe({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 rounded-lg border text-sm font-semibold transition-all ${
        selected ? "shadow-sm" : "hover:bg-slate-50"
      }`}
      style={{
        borderColor: selected ? TEAL : "#e2e8f0",
        background: selected ? TEAL + "10" : "#fff",
        color: selected ? TEAL : "#475569",
      }}
    >
      {label}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function StepNav({
  onBack, onNext, saving, disabled,
}: {
  onBack: () => void;
  onNext: () => void;
  saving: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <button onClick={onBack} className="text-sm font-semibold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <button
        onClick={onNext}
        disabled={saving || disabled}
        className="px-5 py-2.5 rounded-xl font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 inline-flex items-center gap-1.5"
        style={{ background: TEAL }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ChevronRight className="w-4 h-4" /></>}
      </button>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="mt-3 mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm inline-flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {msg}
    </div>
  );
}
