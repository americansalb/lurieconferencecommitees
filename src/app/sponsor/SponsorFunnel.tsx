"use client";

import { useState, useMemo } from "react";
import {
  Check, ChevronLeft, FileText, Loader2, CreditCard, AlertCircle, Award,
  Sparkles, Calendar, MapPin, Building2, Users, Heart, ArrowRight,
} from "lucide-react";
import { TIERS, fullBenefits, SponsorTier } from "@/lib/sponsors";

const TEAL = "#0E5566";
const TEAL_DARK = "#0A3F4D";
const BLUE = "#0066B3";
const CREAM = "#F7F3EA";

type Step = "browse" | "details" | "apply" | "review" | "done";

type FormState = {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
  website: string;
  message: string;
  donateFoodInstead: boolean;
};

const EMPTY: FormState = {
  companyName: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactRole: "",
  website: "",
  message: "",
  donateFoodInstead: false,
};

export default function SponsorFunnel() {
  const [step, setStep] = useState<Step>("browse");
  const [selected, setSelected] = useState<SponsorTier | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedToken, setSubmittedToken] = useState<string | null>(null);
  const [submittedRequiresPayment, setSubmittedRequiresPayment] = useState(false);
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);

  function pick(tier: SponsorTier) {
    setSelected(tier);
    setStep("details");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToBrowse() {
    setSelected(null);
    setStep("browse");
    setError(null);
  }

  async function submit() {
    if (!selected) return;
    if (!form.companyName.trim() || !form.contactName.trim() || !form.contactEmail.trim()) {
      setError("Company, contact name, and email are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tier: selected.id,
          donateFoodInstead: selected.id === "food" ? form.donateFoodInstead : false,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Could not submit the application.");
        return;
      }
      setSubmittedToken(json.token);
      setSubmittedRequiresPayment(Boolean(json.requiresPayment));
      setStep("done");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function goToCheckout() {
    if (!submittedToken) return;
    setRedirectingToCheckout(true);
    setError(null);
    try {
      const res = await fetch("/api/sponsors/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: submittedToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error || "Could not start checkout.");
        setRedirectingToCheckout(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Could not reach the payment system. Please try again.");
      setRedirectingToCheckout(false);
    }
  }

  return (
    <div className="min-h-screen"
      style={{ background: `linear-gradient(135deg, ${CREAM} 0%, #ffffff 50%, #f0f6f7 100%)` }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {step === "browse" && <Browse onPick={pick} />}
        {step === "details" && selected && (
          <Details
            tier={selected}
            onBack={backToBrowse}
            onApply={() => setStep("apply")}
          />
        )}
        {step === "apply" && selected && (
          <Apply
            tier={selected}
            form={form}
            setForm={setForm}
            error={error}
            submitting={submitting}
            onBack={() => setStep("details")}
            onSubmit={submit}
          />
        )}
        {step === "done" && selected && (
          <Done
            tier={selected}
            companyName={form.companyName}
            donatesFoodInstead={form.donateFoodInstead && selected.id === "food"}
            requiresPayment={submittedRequiresPayment}
            redirectingToCheckout={redirectingToCheckout}
            error={error}
            onCheckout={goToCheckout}
          />
        )}
      </div>
    </div>
  );
}

function Browse({ onPick }: { onPick: (t: SponsorTier) => void }) {
  const mainTiers = TIERS.filter((t) => ["silver", "gold", "diamond"].includes(t.id));
  const specialty = TIERS.filter((t) => ["food", "asl"].includes(t.id));
  const exhibitor = TIERS.find((t) => t.id === "exhibitor")!;

  return (
    <>
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4"
          style={{ background: TEAL + "12", color: TEAL }}>
          <Sparkles className="w-3 h-3" /> Sponsorship &amp; Exhibitor Prospectus
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
          Invest in linguistic equity.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Partner with the 2nd Annual Joint Conference of Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers on language access in healthcare.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />August 15 and 16, 2026</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Lurie Children&rsquo;s, Chicago</span>
          <span className="inline-flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />Tax-deductible under IRC 501(c)(3)</span>
        </div>

        <div className="mt-6 inline-flex items-center gap-3">
          <a href="/2026-sponsorship-prospectus.pdf" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
            <FileText className="w-4 h-4" />
            Download the full prospectus (PDF)
          </a>
        </div>
      </div>

      {/* Main tiers */}
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1">Sponsorship levels</h2>
        <p className="text-sm text-slate-500 mb-5">All sponsorships are tax-deductible under IRS code 501(c)(3).</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mainTiers.map((tier, i) => (
            <TierCard key={tier.id} tier={tier} onPick={onPick} featured={i === 2} />
          ))}
        </div>
      </div>

      {/* Specialty tiers */}
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1">Underwrite a piece of the conference</h2>
        <p className="text-sm text-slate-500 mb-5">Direct support for meals or ASL interpretation, with recognition on signage and program.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specialty.map((tier) => (
            <TierCard key={tier.id} tier={tier} onPick={onPick} />
          ))}
        </div>
      </div>

      {/* Exhibitor */}
      <div className="mb-10">
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1">Exhibit at the conference</h2>
        <p className="text-sm text-slate-500 mb-5">For language service providers, nonprofits, regulatory bodies, and technology companies.</p>
        <TierCard tier={exhibitor} onPick={onPick} compact />
      </div>

      {/* Why partner */}
      <div className="mt-12 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8">
        <h2 className="text-xl font-extrabold text-slate-900 mb-5">Why partner with us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Reason icon={Heart} title="Meaningful impact" body="Support initiatives that directly improve patient outcomes in healthcare settings where language barriers create real risk." />
          <Reason icon={Users} title="Professional audience" body="Connect with interpreters, translators, healthcare administrators, language service providers, regulators, and policy leaders." />
          <Reason icon={Building2} title="Brand visibility" body="Recognition on the conference website, social media, on-site signage, the program, and pre and post conference emails." />
          <Reason icon={Award} title="Tax-deductible" body="All contributions are fully deductible under IRS code 501(c)(3). EINs: 83-3016421 and 36-2170833." />
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        Questions? Email <a className="font-semibold text-slate-600" href="mailto:contact@aalb.org">contact@aalb.org</a>.
      </p>
    </>
  );
}

function TierCard({
  tier, onPick, featured, compact,
}: {
  tier: SponsorTier;
  onPick: (t: SponsorTier) => void;
  featured?: boolean;
  compact?: boolean;
}) {
  const benefits = fullBenefits(tier.id).slice(0, compact ? 3 : 5);
  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${
        featured ? "ring-2" : ""
      }`}
      style={{
        borderColor: featured ? tier.accent : "#e2e8f0",
        boxShadow: featured ? `0 12px 30px -10px ${tier.accent}30` : undefined,
      }}
    >
      <div className="h-1.5" style={{ background: tier.accent }} />
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>
              {tier.name}
            </div>
            <div className="mt-1.5 text-3xl font-extrabold text-slate-900 tracking-tight">
              {tier.amountLabel}
            </div>
            {tier.acceptsAlternativePayment && (
              <div className="text-xs text-slate-500 mt-0.5">or {tier.acceptsAlternativePayment.label.toLowerCase()}</div>
            )}
          </div>
          {tier.ticketsIncluded > 0 && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
              style={{ background: tier.accentSoft, color: tier.accent }}>
              {tier.ticketsIncluded} ticket{tier.ticketsIncluded === 1 ? "" : "s"} included
            </span>
          )}
        </div>

        <p className="text-sm text-slate-600 mb-4">{tier.tagline}</p>

        <ul className="space-y-2 mb-5 text-sm text-slate-700 flex-1">
          {tier.inheritsFrom && (
            <li className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: tier.accent }}>
              Everything in {TIERS.find((x) => x.id === tier.inheritsFrom)?.name.replace(" Sponsor", "")}, plus:
            </li>
          )}
          {(tier.inheritsFrom ? tier.benefits : benefits).map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tier.accent }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onPick(tier)}
          className="w-full px-4 py-2.5 rounded-xl font-bold text-white shadow-sm transition-all hover:shadow"
          style={{ background: tier.accent }}
        >
          Select {tier.name.replace(" Sponsor", "")}
          <ArrowRight className="w-4 h-4 inline -mt-0.5 ml-1" />
        </button>
      </div>
    </div>
  );
}

function Reason({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: TEAL + "15" }}>
        <Icon className="w-4 h-4" style={{ color: TEAL }} />
      </div>
      <div>
        <div className="font-bold text-slate-900">{title}</div>
        <div className="text-sm text-slate-600 mt-0.5 leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

function Details({ tier, onBack, onApply }: { tier: SponsorTier; onBack: () => void; onApply: () => void }) {
  const benefits = fullBenefits(tier.id);
  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="text-xs font-semibold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 mb-4">
        <ChevronLeft className="w-3 h-3" /> Back to all levels
      </button>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="h-2" style={{ background: tier.accent }} />
        <div className="p-6 sm:p-8">
          <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>
            {tier.name}
          </div>
          <div className="mt-1 flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{tier.amountLabel}</span>
            <span className="text-sm text-slate-500">includes {tier.ticketsIncluded} conference ticket{tier.ticketsIncluded === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-2 text-slate-600">{tier.tagline}</p>

          <h3 className="mt-6 text-sm font-bold text-slate-900 uppercase tracking-wide">What&rsquo;s included</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tier.accent }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {tier.acceptsAlternativePayment && (
            <div className="mt-5 rounded-lg p-4 border" style={{ background: tier.accentSoft, borderColor: tier.accent + "33" }}>
              <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>
                Alternative
              </div>
              <div className="text-sm text-slate-700 mt-1">
                <strong>{tier.acceptsAlternativePayment.label}.</strong> {tier.acceptsAlternativePayment.note}
              </div>
            </div>
          )}

          <div className="mt-6 text-[11px] text-slate-400">
            Tax-deductible to the fullest extent allowed by law under IRS code 501(c)(3). EINs: 83-3016421 and 36-2170833.
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
            <a href="/2026-sponsorship-prospectus.pdf" target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Download full prospectus
            </a>
            <button onClick={onApply}
              className="px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all hover:shadow-lg"
              style={{ background: tier.accent }}>
              Apply for {tier.name}
              <ArrowRight className="w-4 h-4 inline -mt-0.5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Apply({
  tier, form, setForm, error, submitting, onBack, onSubmit,
}: {
  tier: SponsorTier;
  form: FormState;
  setForm: (f: FormState) => void;
  error: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="text-xs font-semibold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 mb-4">
        <ChevronLeft className="w-3 h-3" /> Back
      </button>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="h-2" style={{ background: tier.accent }} />
        <div className="p-6 sm:p-8">
          <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>
            Sponsorship application
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {tier.name}, {tier.amountLabel}
          </h2>
          <p className="text-sm text-slate-500 mt-1">Tell us about your organization and we&rsquo;ll take it from there.</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Company / organization" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} required className="sm:col-span-2" />
            <Field label="Your name" value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} required />
            <Field label="Your role" value={form.contactRole} onChange={(v) => setForm({ ...form, contactRole: v })} placeholder="e.g. Marketing Director" />
            <Field label="Email" value={form.contactEmail} onChange={(v) => setForm({ ...form, contactEmail: v })} required type="email" />
            <Field label="Phone" value={form.contactPhone} onChange={(v) => setForm({ ...form, contactPhone: v })} />
            <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://" className="sm:col-span-2" />
            <label className="block sm:col-span-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Anything you&rsquo;d like to add (optional)</span>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                placeholder="Specific session you'd like to sponsor, materials you want to distribute, scheduling notes, etc."
                className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              />
            </label>
          </div>

          {tier.acceptsAlternativePayment && (
            <label className="mt-5 flex items-start gap-3 p-3 rounded-lg cursor-pointer border"
              style={{ background: form.donateFoodInstead ? tier.accentSoft : "#fff", borderColor: form.donateFoodInstead ? tier.accent : "#e2e8f0" }}>
              <input
                type="checkbox"
                checked={form.donateFoodInstead}
                onChange={(e) => setForm({ ...form, donateFoodInstead: e.target.checked })}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-900">{tier.acceptsAlternativePayment.label}</div>
                <div className="text-xs text-slate-600 mt-0.5">{tier.acceptsAlternativePayment.note}</div>
                <div className="text-xs text-slate-500 mt-1">If checked, we&rsquo;ll coordinate directly instead of charging the {tier.amountLabel} sponsorship fee.</div>
              </div>
            </label>
          )}

          {error && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm inline-flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button onClick={onBack} className="text-sm font-semibold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 inline-flex items-center gap-2"
              style={{ background: tier.accent }}
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <>Submit application <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Done({
  tier, companyName, donatesFoodInstead, requiresPayment, redirectingToCheckout, error, onCheckout,
}: {
  tier: SponsorTier;
  companyName: string;
  donatesFoodInstead: boolean;
  requiresPayment: boolean;
  redirectingToCheckout: boolean;
  error: string | null;
  onCheckout: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="h-2" style={{ background: tier.accent }} />
        <div className="p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ background: tier.accentSoft }}>
            <Check className="w-7 h-7" style={{ color: tier.accent }} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Application received.
          </h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Thank you for submitting <strong>{companyName}</strong> as a {tier.name} for the 2026 Lurie Children&rsquo;s and AALB Conference. A confirmation has been sent to the email you provided.
          </p>

          {donatesFoodInstead ? (
            <div className="mt-6 rounded-xl p-4 text-left" style={{ background: tier.accentSoft, border: `1px solid ${tier.accent}33` }}>
              <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>
                Next step
              </div>
              <p className="mt-1 text-sm text-slate-700">
                We&rsquo;ll be in touch shortly to coordinate menu, quantities, delivery, and logistics for your food donation.
              </p>
            </div>
          ) : requiresPayment ? (
            <div className="mt-6">
              <div className="rounded-xl p-4 text-left mb-4" style={{ background: tier.accentSoft, border: `1px solid ${tier.accent}33` }}>
                <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>
                  Complete your sponsorship
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  Pay {tier.amountLabel} now with a card via Stripe to confirm your spot, or reply to the confirmation email to arrange invoice or check.
                </p>
              </div>
              <button
                onClick={onCheckout}
                disabled={redirectingToCheckout}
                className="w-full px-6 py-4 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
                style={{ background: tier.accent }}
              >
                {redirectingToCheckout ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to checkout…</> : <><CreditCard className="w-4 h-4" /> Pay {tier.amountLabel} now</>}
              </button>
              <p className="text-[11px] text-slate-400 mt-3">
                Payment processed by Stripe. Tax-deductible under IRS code 501(c)(3).
              </p>
              {error && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm inline-flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Our team will follow up directly to finalize the details.
            </p>
          )}
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
