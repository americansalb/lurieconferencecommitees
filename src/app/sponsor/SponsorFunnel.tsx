"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, FileText, CreditCard, Calendar, MapPin, Award,
  Heart, Users, Building2, Pencil, ArrowRight, Plus,
} from "lucide-react";
import {
  C, WizardShell, StepFrame, Question, TextInput, TextArea, ToggleRow,
  PrimaryButton, InlineError, Hint, useEnterKey,
} from "@/components/funnel/Wizard";
import { TIERS, fullBenefits, SponsorTier } from "@/lib/sponsors";
import ExhibitorDetailsForm, { TableNotice, EMPTY_EXHIBITOR, type ExhibitorDetails } from "@/components/sponsor/ExhibitorDetailsForm";
import { ExhibitorTermsAgree } from "@/components/sponsor/ExhibitorTerms";
import type { LogoValue } from "@/components/sponsor/LogoUpload";

// Flow: browse (compare every tier, full width) → details (one tier) →
// apply (company + contact) → [exhibit: table details, exhibitor tier only] →
// review ("look good?") → done (pay / next steps). Browse stays wide because
// choosing a sponsorship level is a comparison decision; the rest are focused,
// one-thing-per-screen steps.
type Step = "browse" | "details" | "apply" | "exhibit" | "review" | "done";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SponsorFunnel() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("browse");
  const [selected, setSelected] = useState<SponsorTier | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [exhibitor, setExhibitor] = useState<ExhibitorDetails>(EMPTY_EXHIBITOR);
  const [exhibitorAgreed, setExhibitorAgreed] = useState(false);
  const [logo, setLogo] = useState<LogoValue>(null);
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedToken, setSubmittedToken] = useState<string | null>(null);
  const [submittedRequiresPayment, setSubmittedRequiresPayment] = useState(false);
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);

  const setF = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function toTop() {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function pick(tier: SponsorTier) {
    setSelected(tier);
    setShowMore(false);
    setError(null);
    setStep("details");
    toTop();
  }

  function goBack() {
    setError(null);
    if (step === "browse") { router.push("/"); return; }
    if (step === "details") { setSelected(null); setStep("browse"); }
    else if (step === "apply") setStep("details");
    else if (step === "exhibit") setStep("apply");
    else if (step === "review") setStep(selected?.id === "exhibitor" ? "exhibit" : "apply");
    toTop();
  }

  // Apply step is the only one with required text fields. Phone is required
  // alongside company/name/email; the program team always needs a number to
  // coordinate logistics, signage, and on-site details with a sponsor.
  function validateApply(): string | null {
    if (!form.companyName.trim()) return "Tell us which organization you're with.";
    if (!form.contactName.trim()) return "We need a contact name.";
    if (!EMAIL_RE.test(form.contactEmail.trim())) return "Please share a valid email so we can reach you.";
    if (!form.contactPhone.trim()) return "A phone number lets us coordinate the details with you.";
    if (selected?.id === "exhibitor" && !form.website.trim()) return "Please add your organization's website.";
    return null;
  }

  function fromApply() {
    const err = validateApply();
    if (err) { setError(err); return; }
    setError(null);
    setStep(selected?.id === "exhibitor" ? "exhibit" : "review");
    toTop();
  }

  function fromExhibit() {
    if (!exhibitor.registreeName.trim()) { setError("Please add the name of whoever will staff your table."); return; }
    if (!EMAIL_RE.test(exhibitor.registreeEmail.trim())) { setError("Please add a valid email for your table representative."); return; }
    if (!exhibitorAgreed) { setError("Please review and agree to the exhibitor terms to continue."); return; }
    setError(null);
    setStep("review");
    toTop();
  }

  useEnterKey(() => { if (step === "apply") fromApply(); else if (step === "exhibit") fromExhibit(); }, step === "apply" || step === "exhibit");

  async function submit() {
    if (!selected) return;
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
          ...(selected.id === "exhibitor" ? {
            registreeName: exhibitor.registreeName,
            registreeEmail: exhibitor.registreeEmail,
            dietary: exhibitor.dietary,
            accessibility: exhibitor.accessibility,
            wantsLogo: exhibitor.wantsLogo,
            agreedToTerms: exhibitorAgreed,
            logo: exhibitor.wantsLogo && logo ? { dataUrl: logo.dataUrl, name: logo.name } : undefined,
          } : {}),
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
      toTop();
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

  // Done is terminal; its own calm confirmation screen, no rail or counter.
  if (step === "done" && selected) {
    return (
      <Done
        tier={selected}
        companyName={form.companyName}
        donatesFoodInstead={form.donateFoodInstead && selected.id === "food"}
        requiresPayment={submittedRequiresPayment}
        redirectingToCheckout={redirectingToCheckout}
        error={error}
        onCheckout={goToCheckout}
      />
    );
  }

  const flow: Step[] = selected?.id === "exhibitor"
    ? ["browse", "details", "apply", "exhibit", "review"]
    : ["browse", "details", "apply", "review"];
  const current = Math.max(0, flow.indexOf(step));

  return (
    <WizardShell
      eyebrow={selected?.id === "exhibitor" ? "Exhibitor" : "Sponsorship"}
      current={current}
      total={flow.length}
      onBack={goBack}
      wide={step === "browse"}
    >
      {step === "browse" && (
        <StepFrame stepKey="browse">
          <Browse onPick={pick} />
        </StepFrame>
      )}

      {step === "details" && selected && (
        <StepFrame stepKey={`details-${selected.id}`}>
          <Details tier={selected} onApply={() => { setStep("apply"); toTop(); }} />
        </StepFrame>
      )}

      {step === "apply" && selected && (
        <StepFrame stepKey="apply">
          <Question
            title={<>Tell us about your organization.</>}
            sub={<><AccentChip tier={selected} /> <span className="ml-1">{selected.amountLabel}</span></>}
          />
          <div className="space-y-3">
            <TextInput label={selected.id === "exhibitor" ? "Full name of your organization" : "Company / organization"} value={form.companyName} onChange={(v) => setF("companyName", v)} required autoFocus />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput label="Your name" value={form.contactName} onChange={(v) => setF("contactName", v)} required />
              <TextInput label="Email" value={form.contactEmail} onChange={(v) => setF("contactEmail", v)} required type="email" inputMode="email" />
            </div>
            <TextInput label="Phone" value={form.contactPhone} onChange={(v) => setF("contactPhone", v)} required type="tel" inputMode="tel" placeholder="So we can coordinate the details" />
            {selected.id === "exhibitor" && (
              <TextInput label="Website" value={form.website} onChange={(v) => setF("website", v)} required placeholder="https://" inputMode="url" />
            )}

            {selected.acceptsAlternativePayment && (
              <ToggleRow
                checked={form.donateFoodInstead}
                onToggle={() => setF("donateFoodInstead", !form.donateFoodInstead)}
                title={selected.acceptsAlternativePayment.label}
                desc={`${selected.acceptsAlternativePayment.note} We'll coordinate directly instead of charging the ${selected.amountLabel} fee.`}
                icon={Heart}
              />
            )}

            {showMore ? (
              <div className="space-y-3">
                <TextInput label="Your role" value={form.contactRole} onChange={(v) => setF("contactRole", v)} placeholder="e.g. Marketing Director" />
                {selected.id !== "exhibitor" && (
                  <TextInput label="Website" value={form.website} onChange={(v) => setF("website", v)} placeholder="https://" inputMode="url" />
                )}
                <TextArea label="Anything you'd like to add" value={form.message} onChange={(v) => setF("message", v)} rows={3} placeholder="A session you'd like to sponsor, materials to distribute, scheduling notes…" hint="optional" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowMore(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold transition-colors hover:bg-black/[0.02]"
                style={{ color: C.muted, border: `1.5px dashed ${C.hairline}` }}
              >
                <Plus className="w-4 h-4" /> Add role, website, or a note
              </button>
            )}
          </div>

          <InlineError message={error} />

          <div className="mt-7">
            <PrimaryButton onClick={fromApply}>Continue to review</PrimaryButton>
          </div>
          <Hint>Required: organization, name, email, and phone. Everything else is optional.</Hint>
        </StepFrame>
      )}

      {step === "exhibit" && selected && (
        <StepFrame stepKey="exhibit">
          <Question
            title={<>Your exhibitor table.</>}
            sub={<>A few details so we can set up your space and your representative&rsquo;s day.</>}
          />
          <ExhibitorDetailsForm value={exhibitor} onChange={setExhibitor} logo={logo} onLogo={setLogo} />
          <div className="mt-6 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.gold }}>Exhibitor terms</div>
          <div className="mt-3"><ExhibitorTermsAgree agreed={exhibitorAgreed} onChange={setExhibitorAgreed} /></div>
          <InlineError message={error} />
          <div className="mt-7">
            <PrimaryButton onClick={fromExhibit}>Continue to review</PrimaryButton>
          </div>
          <Hint>The logo is optional and included at no charge. Everything else helps us prepare for your team on site.</Hint>
        </StepFrame>
      )}

      {step === "review" && selected && (
        <StepFrame stepKey="review">
          <Question
            title={<>Look good?</>}
            sub={
              selected.id === "food" && form.donateFoodInstead
                ? "One step from confirming. We'll coordinate your food donation directly, with nothing to pay."
                : "One step from confirming your sponsorship. You can pay by card next, or arrange an invoice or check."
            }
          />

          <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: C.hairline }}>
            <div className="p-5 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.hairline}` }}>
              <div className="min-w-0">
                <AccentChip tier={selected} />
                <div className="text-[26px] font-bold mt-2 tabular-nums" style={{ color: C.ink }}>
                  {selected.amountLabel}
                </div>
                <div className="text-[13px]" style={{ color: C.muted }}>
                  {selected.ticketsIncluded > 0
                    ? `includes ${selected.ticketsIncluded} conference ticket${selected.ticketsIncluded === 1 ? "" : "s"}`
                    : "logo recognition · no ticket included"}
                </div>
              </div>
              <button onClick={() => { setStep("details"); toTop(); }} className="inline-flex items-center gap-1 text-[12px] font-semibold shrink-0" style={{ color: C.teal }}>
                <Pencil className="w-3 h-3" /> Change
              </button>
            </div>

            <div className="p-5 space-y-1 divide-y" style={{ borderColor: C.hairline }}>
              <SummaryRow label="Organization" value={form.companyName || "Not provided"} onEdit={editApply} />
              <SummaryRow label="Contact" value={[form.contactName, form.contactRole].filter(Boolean).join(" · ") || "Not provided"} onEdit={editApply} />
              <SummaryRow label="Email" value={form.contactEmail || "Not provided"} onEdit={editApply} />
              <SummaryRow label="Phone" value={form.contactPhone || "Not provided"} onEdit={editApply} />
              {form.website && <SummaryRow label="Website" value={form.website} onEdit={editApply} />}
              {form.message && <SummaryRow label="Note" value={form.message} onEdit={editApply} />}
              {form.donateFoodInstead && selected.id === "food" && (
                <SummaryRow label="In kind" value="Donating food instead of the fee" onEdit={editApply} />
              )}
              {selected.id === "exhibitor" && (
                <>
                  <SummaryRow label="Table rep" value={exhibitor.registreeName || "Not provided"} onEdit={editExhibit} />
                  <SummaryRow label="Rep email" value={exhibitor.registreeEmail || "Not provided"} onEdit={editExhibit} />
                  {exhibitor.dietary && <SummaryRow label="Dietary / allergies" value={exhibitor.dietary} onEdit={editExhibit} />}
                  {exhibitor.accessibility && <SummaryRow label="Accessibility" value={exhibitor.accessibility} onEdit={editExhibit} />}
                  <SummaryRow label="Website logo" value={exhibitor.wantsLogo ? (logo ? logo.name : "Yes (no file uploaded yet)") : "Not displaying"} onEdit={editExhibit} />
                  <SummaryRow label="Exhibitor terms" value={exhibitorAgreed ? "Agreed" : "Not agreed"} onEdit={editExhibit} />
                </>
              )}
            </div>
          </div>

          {selected.id === "exhibitor" && <div className="mt-4"><TableNotice /></div>}

          <InlineError message={error} />

          <div className="mt-7">
            <PrimaryButton onClick={submit} loading={submitting}>Submit application</PrimaryButton>
          </div>
          <Hint>A 501(c)(3) nonprofit (EINs 83-3016421 and 36-2170833). Your payment may be tax-deductible as a business expense, or as a charitable contribution beyond the value of any benefits received. Consult your tax advisor.</Hint>
        </StepFrame>
      )}
    </WizardShell>
  );

  function editApply() { setStep("apply"); toTop(); }
  function editExhibit() { setStep("exhibit"); toTop(); }
}

function AccentChip({ tier }: { tier: SponsorTier }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase align-middle"
      style={{ background: tier.accentSoft, color: tier.accent }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.accent }} />
      {tier.name}
    </span>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: C.gold }}>{label}</div>
        <div className="text-[14px] mt-0.5 break-words" style={{ color: C.ink }}>{value}</div>
      </div>
      <button onClick={onEdit} className="inline-flex items-center gap-1 text-[12px] font-semibold shrink-0" style={{ color: C.teal }}>
        <Pencil className="w-3 h-3" /> Edit
      </button>
    </div>
  );
}

function Browse({ onPick }: { onPick: (t: SponsorTier) => void }) {
  const mainTiers = TIERS.filter((t) => ["supporter", "silver", "gold", "diamond"].includes(t.id));
  const specialty = TIERS.filter((t) => ["food", "asl"].includes(t.id));
  const exhibitor = TIERS.find((t) => t.id === "exhibitor")!;

  return (
    <>
      {/* Hero (the gold eyebrow above is rendered by the shell) */}
      <div className="text-center mb-10">
        <h1 className="font-bold tracking-tight leading-[1.05] text-[34px] sm:text-[48px]" style={{ color: C.ink }}>
          Invest in linguistic equity.
        </h1>
        <p className="mt-4 text-[15px] sm:text-[17px] leading-relaxed max-w-2xl mx-auto" style={{ color: C.muted }}>
          Partner with the 2nd Joint Conference of Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago and Americans Against Language Barriers on language access in healthcare.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px]" style={{ color: C.mutedSoft }}>
          <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />August 15 and 16, 2026</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Lurie Children&rsquo;s, Chicago</span>
          <span className="inline-flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />501(c)(3) &middot; may be tax-deductible</span>
        </div>
        <div className="mt-6">
          <a href="/2026-sponsorship-prospectus.pdf" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-full bg-white shadow-sm transition-all hover:-translate-y-0.5"
            style={{ color: C.inkSoft, border: `1.5px solid ${C.hairline}` }}>
            <FileText className="w-4 h-4" />
            Download the full prospectus (PDF)
          </a>
        </div>
      </div>

      <TierGroup
        title="Sponsorship levels"
        sub="The $450 Supporter level (logo only) is generally fully tax-deductible; higher levels include tickets, so deductibility depends on the benefits received. Consult your tax advisor."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mainTiers.map((tier, i) => (
            <TierCard key={tier.id} tier={tier} onPick={onPick} featured={i === mainTiers.length - 1} />
          ))}
        </div>
      </TierGroup>

      <TierGroup
        title="Underwrite a piece of the conference"
        sub="Direct support for meals or ASL interpretation, with recognition on signage and program."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specialty.map((tier) => (
            <TierCard key={tier.id} tier={tier} onPick={onPick} />
          ))}
        </div>
      </TierGroup>

      <TierGroup
        title="Exhibit at the conference"
        sub="For language service providers, nonprofits, regulatory bodies, and technology companies."
      >
        <TierCard tier={exhibitor} onPick={onPick} compact />
      </TierGroup>

      {/* Why partner */}
      <div className="mt-12 bg-white rounded-2xl p-6 sm:p-8" style={{ border: `1px solid ${C.hairline}`, boxShadow: "0 6px 18px -14px rgba(11,31,37,0.25)" }}>
        <h2 className="text-[22px] font-bold mb-5" style={{ color: C.ink }}>Why partner with us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Reason icon={Heart} title="Meaningful impact" body="Support initiatives that directly improve patient outcomes in healthcare settings where language barriers create real risk." />
          <Reason icon={Users} title="Professional audience" body="Connect with interpreters, translators, healthcare administrators, language service providers, regulators, and policy leaders." />
          <Reason icon={Building2} title="Brand visibility" body="Recognition on the conference website, social media, on-site signage, the program, and pre and post conference emails." />
          <Reason icon={Award} title="Tax-deductible" body="We're a 501(c)(3) (EINs 83-3016421 and 36-2170833). The $450 logo-only Supporter level is generally fully deductible; for levels that include tickets or a table, your payment may be deductible as a business expense, or as a charitable contribution beyond the value of those benefits. Consult your tax advisor." />
        </div>
      </div>

      <p className="text-center text-[12px] mt-8" style={{ color: C.mutedSoft }}>
        Questions? Email <a className="font-semibold" style={{ color: C.muted }} href="mailto:contact@aalb.org">contact@aalb.org</a>.
      </p>
    </>
  );
}

function TierGroup({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-[20px] sm:text-[22px] font-bold" style={{ color: C.ink }}>{title}</h2>
      <p className="text-[13px] mt-1 mb-5" style={{ color: C.muted }}>{sub}</p>
      {children}
    </div>
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
      className="rounded-2xl bg-white overflow-hidden flex flex-col transition-all hover:-translate-y-0.5"
      style={{
        border: featured ? `2px solid ${tier.accent}` : `1.5px solid ${C.hairline}`,
        boxShadow: featured
          ? `0 18px 40px -20px ${tier.accent}77`
          : "0 6px 18px -14px rgba(11,31,37,0.25)",
      }}
    >
      <div className="h-1.5" style={{ background: tier.accent }} />
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>
              {tier.name}
            </div>
            <div className="mt-1.5 text-[30px] font-bold tabular-nums leading-none" style={{ color: C.ink }}>
              {tier.amountLabel}
            </div>
            {tier.acceptsAlternativePayment && (
              <div className="text-[12px] mt-1" style={{ color: C.muted }}>or {tier.acceptsAlternativePayment.label.toLowerCase()}</div>
            )}
          </div>
          {tier.ticketsIncluded > 0 && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
              style={{ background: tier.accentSoft, color: tier.accent }}>
              {tier.ticketsIncluded} ticket{tier.ticketsIncluded === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <p className="text-[13px] mb-4" style={{ color: C.muted }}>{tier.tagline}</p>

        <ul className="space-y-2 mb-5 text-[13px] flex-1" style={{ color: C.inkSoft }}>
          {tier.inheritsFrom && (
            <li className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: tier.accent }}>
              Everything in {TIERS.find((x) => x.id === tier.inheritsFrom)?.name.replace(" Sponsor", "")}, plus:
            </li>
          )}
          {(tier.inheritsFrom ? tier.benefits : benefits).map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tier.accent }} strokeWidth={3} />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onPick(tier)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-full font-bold text-[14px] text-white transition-all hover:shadow-lg"
          style={{ background: tier.accent, boxShadow: `0 12px 26px -14px ${tier.accent}` }}
        >
          Choose {tier.name.replace(" Sponsor", "")}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Reason({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: C.teal + "14" }}>
        <Icon className="w-4 h-4" style={{ color: C.teal }} />
      </div>
      <div>
        <div className="font-bold" style={{ color: C.ink }}>{title}</div>
        <div className="text-[13px] mt-0.5 leading-relaxed" style={{ color: C.muted }}>{body}</div>
      </div>
    </div>
  );
}

function Details({ tier, onApply }: { tier: SponsorTier; onApply: () => void }) {
  const benefits = fullBenefits(tier.id);
  return (
    <>
      <Question
        title={<>The {tier.name.replace(" Sponsor", "")} level.</>}
        sub={tier.tagline}
      />

      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: C.hairline }}>
        <div className="h-1.5" style={{ background: tier.accent }} />
        <div className="p-5 sm:p-6">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-[36px] font-bold tabular-nums leading-none" style={{ color: C.ink }}>{tier.amountLabel}</span>
            <span className="text-[13px]" style={{ color: C.muted }}>{tier.ticketsIncluded > 0 ? `includes ${tier.ticketsIncluded} conference ticket${tier.ticketsIncluded === 1 ? "" : "s"}` : "logo recognition · no ticket included"}</span>
          </div>

          <div className="text-[11px] font-bold tracking-widest uppercase mt-6 mb-3" style={{ color: C.gold }}>What&rsquo;s included</div>
          <ul className="space-y-2 text-[14px]" style={{ color: C.inkSoft }}>
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tier.accent }} strokeWidth={3} />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {tier.acceptsAlternativePayment && (
            <div className="mt-5 rounded-xl p-4" style={{ background: tier.accentSoft, border: `1px solid ${tier.accent}33` }}>
              <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>Alternative</div>
              <div className="text-[13px] mt-1" style={{ color: C.inkSoft }}>
                <strong>{tier.acceptsAlternativePayment.label}.</strong> {tier.acceptsAlternativePayment.note}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-7">
        <PrimaryButton onClick={onApply}>Apply for {tier.name.replace(" Sponsor", "")}</PrimaryButton>
      </div>

      <p className="mt-4 text-center text-[12px]" style={{ color: C.mutedSoft }}>
        <a href="/2026-sponsorship-prospectus.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold" style={{ color: C.muted }}>
          <FileText className="w-3.5 h-3.5" /> Download the full prospectus
        </a>
      </p>
    </>
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
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(120% 75% at 50% -8%, rgba(201,161,75,0.10), transparent 60%),
          radial-gradient(110% 60% at 50% 112%, rgba(42,143,204,0.09), transparent 60%),
          ${C.paper}`,
      }}
    >
      <div className="max-w-md mx-auto px-5 sm:px-6 pt-16 pb-24">
        <div className="flex items-center justify-center gap-2.5 mb-8 opacity-90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/lurie-icon.png" alt="Lurie Children's" className="h-6 w-auto" />
          <span className="w-px h-4" style={{ background: C.hairline }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/aalb-icon.png" alt="AALB" className="h-6 w-auto" />
        </div>

        <div className="rounded-2xl border bg-white overflow-hidden text-center" style={{ borderColor: C.hairline }}>
          <div className="h-1.5" style={{ background: tier.accent }} />
          <div className="p-7">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: tier.accentSoft }}>
              <Check className="w-7 h-7" style={{ color: tier.accent }} strokeWidth={3} />
            </div>
            <h1 className="text-[28px] font-bold tracking-tight" style={{ color: C.ink }}>
              Application received.
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.muted }}>
              Thank you for submitting <strong style={{ color: C.inkSoft }}>{companyName}</strong> as a {tier.name} for the 2026 Lurie Children&rsquo;s and AALB Conference. A confirmation is on its way to your inbox.
            </p>

            {donatesFoodInstead ? (
              <div className="mt-6 rounded-xl p-4 text-left" style={{ background: tier.accentSoft, border: `1px solid ${tier.accent}33` }}>
                <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>Next step</div>
                <p className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
                  We&rsquo;ll be in touch shortly to coordinate menu, quantities, delivery, and logistics for your food donation.
                </p>
              </div>
            ) : requiresPayment ? (
              <div className="mt-6 text-left">
                <div className="rounded-xl p-4 mb-4" style={{ background: tier.accentSoft, border: `1px solid ${tier.accent}33` }}>
                  <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>Complete your sponsorship</div>
                  <p className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
                    Pay {tier.amountLabel} now by card to confirm your spot, or reply to the confirmation email to arrange an invoice or check.
                  </p>
                </div>
                <PrimaryButton onClick={onCheckout} loading={redirectingToCheckout} icon={CreditCard}>
                  Pay {tier.amountLabel} now
                </PrimaryButton>
                <p className="text-[11px] text-center mt-3" style={{ color: C.mutedSoft }}>
                  Payment processed by Stripe. We&rsquo;re a 501(c)(3); your payment may be tax-deductible &mdash; consult your tax advisor.
                </p>
                <InlineError message={error} />
              </div>
            ) : (
              <p className="mt-4 text-[13px]" style={{ color: C.muted }}>
                Our team will follow up directly to finalize the details.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
