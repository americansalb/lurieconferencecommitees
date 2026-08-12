"use client";

import { useState } from "react";
import {
  Check, ChevronRight, ChevronLeft, MapPin, Monitor, Calendar,
  Sparkles, Loader2, CreditCard, AlertCircle, Tag, X, Pencil,
} from "lucide-react";

type Pricing = {
  inPersonBaseCents: number;
  inPersonFinalCents: number;
  virtualBaseCents: number;
  virtualFinalCents: number;
  oneDayBaseCents: number;
  oneDayFinalCents: number;
};

type Initial = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  affiliation: string;
  primaryLanguages: string;
  attendanceMode: string | null;
  attendDay: string | null;
  needsParking: boolean | null;
  accessibilityNotes: string;
  dietary: string;
  discountPercent: number;
  status: string;
  paid: boolean;
  inviteMessage: string | null;
};

const TEAL = "#0E5566";
const BLUE = "#0066B3";
const GOLD = "#C99A2E";

function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dollarsNoCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

// Two steps to payment, on purpose. The email already made the case; the page
// only needs the decision (how will you attend) and the payment. Everything
// that used to gate the pay button — phone, organization, languages, parking,
// dietary, accessibility — is collected AFTER payment in the attendee portal,
// where it can't cost a registration.
export default function AttendeeFunnel({
  token,
  initial,
  pricing,
  startStep,
}: {
  token: string;
  initial: Initial;
  pricing: Pricing;
  // Optional starting step. Used only by the dev preview harness to land on
  // the review step without a live DB; production always starts at 0 (or 1
  // if already paid, though page.tsx renders the portal for paid attendees).
  startStep?: 0 | 1;
}) {
  const [step, setStep] = useState<0 | 1>(startStep ?? (initial.paid ? 1 : 0));
  const [data, setData] = useState(initial);
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional discount code, validated server-side and stacked on top of the
  // personal-invite price. Cleared if attendance mode changes so a code that
  // only applies to one mode can't linger on the wrong total.
  const [codeInput, setCodeInput] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ code: string; label: string; finalCents: number; discountCents: number } | null>(null);

  function clearAppliedCode() {
    setApplied(null);
    setCodeInput("");
    setCodeError(null);
  }

  function pickMode(mode: "in-person" | "virtual") {
    setData((prev) => ({ ...prev, attendanceMode: mode, attendDay: null }));
    if (applied) clearAppliedCode();
  }

  function pickOneDay(day: "sat" | "sun") {
    setData((prev) => ({ ...prev, attendanceMode: "virtual", attendDay: day }));
    if (applied) clearAppliedCode();
  }

  async function applyCode() {
    const code = codeInput.trim();
    if (!code) return;
    if (!data.attendanceMode) { setCodeError("Pick how you'll attend first."); return; }
    setCodeBusy(true);
    setCodeError(null);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, attendanceMode: data.attendanceMode, attendDay: data.attendDay || undefined, token }),
      });
      const json = await res.json();
      if (json.ok) {
        setApplied({ code: json.code, label: json.label, finalCents: json.finalCents, discountCents: json.discountCents });
        setCodeError(null);
      } else {
        setApplied(null);
        setCodeError(json.error || "That code isn't valid.");
      }
    } catch {
      setCodeError("Couldn't check that code. Try again.");
    } finally {
      setCodeBusy(false);
    }
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
          attendanceMode: data.attendanceMode,
          attendDay: data.attendDay,
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

  async function advance() {
    if (!data.attendanceMode) {
      setError("Pick how you'd like to attend first.");
      return;
    }
    const saved = await persist();
    if (saved) setStep(1);
  }

  async function checkout() {
    setSubmitting(true);
    setError(null);
    const saved = await persist();
    if (!saved) { setSubmitting(false); return; }

    try {
      const res = await fetch("/api/attendees/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, discountCode: applied?.code || undefined }),
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

  const isOneDay = data.attendanceMode === "virtual" && (data.attendDay === "sat" || data.attendDay === "sun");
  const finalCents = data.attendanceMode === "in-person"
    ? pricing.inPersonFinalCents
    : isOneDay
    ? pricing.oneDayFinalCents
    : data.attendanceMode === "virtual"
    ? pricing.virtualFinalCents
    : 0;
  const baseCents = data.attendanceMode === "in-person"
    ? pricing.inPersonBaseCents
    : isOneDay
    ? pricing.oneDayBaseCents
    : data.attendanceMode === "virtual"
    ? pricing.virtualBaseCents
    : 0;
  const savings = baseCents - finalCents;
  // What the attendee actually pays: personal-invite price, minus a code if
  // one is applied. The server recomputes this authoritatively at checkout.
  const payableCents = applied ? applied.finalCents : finalCents;

  const attendanceLabel = data.attendanceMode === "in-person"
    ? "In-person"
    : isOneDay
    ? `Virtual · ${data.attendDay === "sat" ? "Saturday only" : "Sunday only"}`
    : data.attendanceMode === "virtual"
    ? "Virtual, both days"
    : "Not yet selected";

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
            AALB &amp; Lurie Children&rsquo;s Conference
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            True Language Access: Yesterday, Today, and Tomorrow
          </p>
          <p className="text-xs text-slate-400 mt-2 inline-flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> August 15 &amp; 16, 2026 &middot; Chicago &amp; live online
          </p>
        </div>

        {/* Progress: two steps, pick then pay. */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1].map((i) => (
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

          {/* Step 0: choose how to attend */}
          {step === 0 && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
                Welcome, {data.firstName}. Save your seat.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Two days on language access in healthcare at Lurie Children&rsquo;s in Chicago, streamed
                live everywhere, with 10+ CEU hours (will be accredited by NBCMI, CCHI and RID).
                {data.discountPercent > 0 && (
                  <> Your personal <strong style={{ color: TEAL }}>{data.discountPercent}% discount</strong> is already applied to every price below.</>
                )}
              </p>

              {data.inviteMessage && (
                <div className="mt-4 px-4 py-3 rounded-lg border-l-4 text-sm text-slate-700 leading-relaxed"
                  style={{ background: "#f8fafc", borderColor: BLUE }}>
                  {data.inviteMessage}
                </div>
              )}

              {/* Who's registering: prefilled, editable without retyping. */}
              <div className="mt-5 flex items-center justify-between gap-3 rounded-lg px-4 py-3 bg-slate-50 border border-slate-200">
                {editingName ? (
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <input
                      value={data.firstName}
                      onChange={(e) => setData((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="First name"
                      className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 bg-white"
                    />
                    <input
                      value={data.lastName}
                      onChange={(e) => setData((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="Last name"
                      className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 bg-white"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-slate-700 min-w-0">
                    <span className="font-semibold">{data.firstName} {data.lastName}</span>
                    <span className="text-slate-400"> &middot; {data.email}</span>
                  </div>
                )}
                <button
                  onClick={() => setEditingName((v) => !v)}
                  className="text-xs font-semibold shrink-0 inline-flex items-center gap-1 text-slate-500 hover:text-slate-700"
                >
                  {editingName ? <><Check className="w-3.5 h-3.5" /> Done</> : <><Pencil className="w-3 h-3" /> Edit</>}
                </button>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">How will you attend?</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ModeCard
                    selected={data.attendanceMode === "in-person"}
                    onClick={() => pickMode("in-person")}
                    icon={MapPin}
                    title="In-person"
                    subtitle="On site at Lurie Children's, Chicago"
                    badge={dollars(pricing.inPersonFinalCents)}
                    badgeOriginal={data.discountPercent > 0 ? dollarsNoCents(pricing.inPersonBaseCents) : undefined}
                  />
                  <ModeCard
                    selected={data.attendanceMode === "virtual" && !isOneDay}
                    onClick={() => pickMode("virtual")}
                    icon={Monitor}
                    title="Virtual, both days"
                    subtitle="Live stream all sessions"
                    badge={dollars(pricing.virtualFinalCents)}
                    badgeOriginal={data.discountPercent > 0 ? dollarsNoCents(pricing.virtualBaseCents) : undefined}
                  />
                </div>

                {/* One-day virtual: the cheapest yes. The invite emails mention
                    it, so it must exist here, not only on the public page. */}
                <div
                  className="mt-3 rounded-xl border-2 p-4 transition-all"
                  style={{
                    borderColor: isOneDay ? TEAL : "#e2e8f0",
                    background: isOneDay ? TEAL + "08" : "#fff",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        Virtual, one day only
                        {isOneDay && <Check className="w-3.5 h-3.5" style={{ color: TEAL }} />}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">Can&rsquo;t do both days? Join the stream for one.</div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-extrabold text-slate-900">{dollars(pricing.oneDayFinalCents)}</span>
                      {data.discountPercent > 0 && <span className="text-xs text-slate-400 line-through">{dollarsNoCents(pricing.oneDayBaseCents)}</span>}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <DayButton label="Saturday, Aug 15" selected={data.attendDay === "sat"} onClick={() => pickOneDay("sat")} />
                    <DayButton label="Sunday, Aug 16" selected={data.attendDay === "sun"} onClick={() => pickOneDay("sun")} />
                  </div>
                </div>
              </div>

              {error && <ErrorBanner msg={error} />}

              <button
                onClick={advance}
                disabled={saving || !data.attendanceMode}
                className="mt-6 w-full px-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                style={{ background: TEAL }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue to payment <ChevronRight className="w-4 h-4" /></>}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-3">
                One more screen: review your total, then pay securely via Stripe.
              </p>
            </div>
          )}

          {/* Step 1: review + pay */}
          {step === 1 && (
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
                    <SummaryRow label="Attendance" value={attendanceLabel} />
                  </div>

                  <div className="rounded-xl p-4 mb-4" style={{ background: TEAL + "08", border: `1px solid ${TEAL}22` }}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-slate-600">
                        {data.attendanceMode === "in-person" ? "In-person standard" : isOneDay ? "Virtual one-day standard" : "Virtual standard"}
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
                    {applied && (
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-sm font-semibold inline-flex items-center gap-1.5" style={{ color: GOLD }}>
                          <Tag className="w-3.5 h-3.5" /> Code {applied.code} ({applied.label})
                        </span>
                        <span className="text-sm font-semibold" style={{ color: GOLD }}>−{dollars(applied.discountCents)}</span>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t flex items-baseline justify-between" style={{ borderColor: TEAL + "22" }}>
                      <span className="text-sm font-bold text-slate-900">Total today</span>
                      <span className="text-2xl font-extrabold text-slate-900">{dollars(payableCents)}</span>
                    </div>
                  </div>

                  {/* Discount code */}
                  <div className="mb-5">
                    {applied ? (
                      <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#d1fae5" }}>
                          <Check className="w-4 h-4" style={{ color: "#059669" }} strokeWidth={3} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold text-emerald-800">Code {applied.code} applied</div>
                          <div className="text-[12px] text-emerald-700">You save {dollars(applied.discountCents)}.</div>
                        </div>
                        <button onClick={clearAppliedCode} className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-slate-700 shrink-0">
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-stretch gap-2">
                          <div className="relative flex-1">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              value={codeInput}
                              onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(null); }}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCode(); } }}
                              placeholder="Discount code (optional)"
                              autoCapitalize="characters"
                              className={`w-full pl-9 pr-3 py-2.5 text-sm font-semibold tracking-wide border rounded-lg outline-none transition-colors ${
                                codeError ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10" : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                              }`}
                            />
                          </div>
                          <button
                            onClick={applyCode}
                            disabled={codeBusy || !codeInput.trim()}
                            className="px-4 rounded-lg text-sm font-bold shrink-0 inline-flex items-center gap-1.5 border-2 transition-colors disabled:opacity-50"
                            style={{ borderColor: TEAL, color: TEAL }}
                          >
                            {codeBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Apply
                          </button>
                        </div>
                        {codeError && <div className="text-[12px] mt-1.5 font-medium text-rose-600">{codeError}</div>}
                      </div>
                    )}
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
                  {/* Read before paying, not discovered afterwards. */}
                  <p className="text-[11.5px] text-slate-500 text-center mt-2">
                    Registrations are non-refundable. In-person can be switched to virtual at no extra cost.{" "}
                    <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-teal-800">
                      Refund policy
                    </a>
                  </p>
                  <div className="mt-4 text-center">
                    <button onClick={() => setStep(0)} className="text-xs font-semibold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
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

function DayButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
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

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="mt-3 mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm inline-flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {msg}
    </div>
  );
}
