"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Pencil, Check } from "lucide-react";
import {
  C, WizardShell, StepFrame, Question, PrimaryButton, InlineError, Hint, useEnterKey,
} from "@/components/funnel/Wizard";
import ExhibitorDetailsForm, { TableNotice, type ExhibitorDetails } from "@/components/sponsor/ExhibitorDetailsForm";
import { ExhibitorTermsAgree } from "@/components/sponsor/ExhibitorTerms";
import type { LogoValue } from "@/components/sponsor/LogoUpload";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "details" | "terms" | "pay";

// The post-acceptance "complete your table & pay" flow, rebuilt as a wizard so
// it matches the application funnel instead of a single dense form. Rendered
// full-screen by the status page for unpaid exhibitors.
export default function ExhibitorCompletionWizard({
  token, companyName, tier, benefits, hasLogo, initial, free = false,
}: {
  token: string;
  companyName: string;
  tier: { name: string; amountLabel: string; ticketsIncluded: number; accent: string; accentSoft: string };
  benefits: string[];
  hasLogo: boolean;
  initial: ExhibitorDetails;
  free?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState<ExhibitorDetails>(initial);
  const [logo, setLogo] = useState<LogoValue>(null);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flow: Step[] = ["details", "terms", "pay"];
  const current = Math.max(0, flow.indexOf(step));

  function toTop() {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setError(null);
    if (step === "details") { router.push("/sponsor"); return; }
    if (step === "terms") setStep("details");
    else if (step === "pay") setStep("terms");
    toTop();
  }

  function fromDetails() {
    if (!details.registreeName.trim()) { setError("Please add who will staff your table."); return; }
    if (!EMAIL_RE.test(details.registreeEmail.trim())) { setError("Please add a valid email for your table representative."); return; }
    setError(null);
    setStep("terms");
    toTop();
  }

  function fromTerms() {
    if (!agreed) { setError("Please review and agree to the exhibitor terms to continue."); return; }
    setError(null);
    setStep("pay");
    toTop();
  }

  useEnterKey(() => { if (step === "details") fromDetails(); else if (step === "terms") fromTerms(); }, step !== "pay");

  async function saveAndPay() {
    setBusy(true); setError(null);
    try {
      const save = await fetch("/api/sponsors/exhibitor-details", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token, ...details, agreedToTerms: true,
          logo: details.wantsLogo && logo ? { dataUrl: logo.dataUrl, name: logo.name } : undefined,
        }),
      });
      if (!save.ok) { const j = await save.json().catch(() => ({})); throw new Error(j.error || "Could not save your details."); }

      // Complimentary table: no Stripe, just claim and confirm.
      if (free) {
        const res = await fetch("/api/sponsors/claim-table", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.ok) throw new Error(j.error || "Could not confirm your table.");
        window.location.href = `/sponsor/success/${token}`;
        return;
      }

      const res = await fetch("/api/sponsors/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const j = await res.json();
      if (!res.ok || !j.url) throw new Error(j.error || "Could not start checkout.");
      window.location.href = j.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <WizardShell eyebrow="Exhibitor" current={current} total={flow.length} onBack={goBack}>
      {step === "details" && (
        <StepFrame stepKey="details">
          <Question
            title={<>Let&rsquo;s set up your table.</>}
            sub={<><strong style={{ color: C.inkSoft }}>{companyName}</strong> · {tier.amountLabel}, includes {tier.ticketsIncluded} conference ticket{tier.ticketsIncluded === 1 ? "" : "s"}. A few details so we can prepare your space and your representative&rsquo;s day.</>}
          />
          {hasLogo && !logo && (
            <div className="mb-3 text-xs inline-flex items-center gap-1.5" style={{ color: C.teal }}>
              <Check className="w-3.5 h-3.5" /> A logo is already on file. Upload again to replace it.
            </div>
          )}
          <ExhibitorDetailsForm value={details} onChange={setDetails} logo={logo} onLogo={setLogo} />
          <InlineError message={error} />
          <div className="mt-7"><PrimaryButton onClick={fromDetails}>Continue</PrimaryButton></div>
          <Hint>The logo is optional and included at no charge. Everything else helps us prepare for your team on site.</Hint>
        </StepFrame>
      )}

      {step === "terms" && (
        <StepFrame stepKey="terms">
          <Question
            title={<>The exhibitor terms.</>}
            sub={<>A quick read before you confirm. These cover your table, conduct, liability, and cancellation.</>}
          />
          <ExhibitorTermsAgree agreed={agreed} onChange={setAgreed} />
          <InlineError message={error} />
          <div className="mt-7"><PrimaryButton onClick={fromTerms}>{free ? "Continue" : "Continue to payment"}</PrimaryButton></div>
        </StepFrame>
      )}

      {step === "pay" && (
        <StepFrame stepKey="pay">
          <Question
            title={free ? <>Claim your complimentary table.</> : <>Ready to confirm.</>}
            sub={free ? <>No payment needed, this table is on us. Confirm the details below and you&rsquo;re set.</> : <>Pay by card to secure your table. Tax-deductible under IRS code 501(c)(3).</>}
          />

          <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: C.hairline }}>
            <div className="p-5 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.hairline}` }}>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase" style={{ background: tier.accentSoft, color: tier.accent }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.accent }} />
                  {tier.name}
                </span>
                <div className="text-[26px] font-bold mt-2 tabular-nums" style={{ color: C.ink }}>{tier.amountLabel}</div>
                <div className="text-[13px]" style={{ color: C.muted }}>includes {tier.ticketsIncluded} conference ticket{tier.ticketsIncluded === 1 ? "" : "s"}</div>
              </div>
            </div>
            <div className="p-5 space-y-1 divide-y" style={{ borderColor: C.hairline }}>
              <SummaryRow label="Organization" value={companyName} />
              <SummaryRow label="Table rep" value={details.registreeName || "Not provided"} onEdit={() => { setStep("details"); toTop(); }} />
              <SummaryRow label="Rep email" value={details.registreeEmail || "Not provided"} onEdit={() => { setStep("details"); toTop(); }} />
              {details.dietary && <SummaryRow label="Dietary / allergies" value={details.dietary} onEdit={() => { setStep("details"); toTop(); }} />}
              {details.accessibility && <SummaryRow label="Accessibility" value={details.accessibility} onEdit={() => { setStep("details"); toTop(); }} />}
              <SummaryRow label="Website logo" value={details.wantsLogo ? (logo ? logo.name : hasLogo ? "On file" : "Yes (no file uploaded yet)") : "Not displaying"} onEdit={() => { setStep("details"); toTop(); }} />
            </div>
          </div>

          <div className="mt-4"><TableNotice /></div>

          {benefits.length > 0 && (
            <ul className="mt-4 space-y-2 text-[13px]" style={{ color: C.inkSoft }}>
              {benefits.slice(0, 5).map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tier.accent }} strokeWidth={3} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          <InlineError message={error} />
          <div className="mt-7"><PrimaryButton onClick={saveAndPay} loading={busy} icon={free ? Check : CreditCard}>{free ? "Claim your table" : `Pay ${tier.amountLabel}`}</PrimaryButton></div>
          <Hint>{free ? "No charge. We will email your confirmation once you claim." : "Payment processed by Stripe. EINs 83-3016421 and 36-2170833."}</Hint>
        </StepFrame>
      )}
    </WizardShell>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: C.gold }}>{label}</div>
        <div className="text-[14px] mt-0.5 break-words" style={{ color: C.ink }}>{value}</div>
      </div>
      {onEdit && (
        <button onClick={onEdit} className="inline-flex items-center gap-1 text-[12px] font-semibold shrink-0" style={{ color: C.teal }}>
          <Pencil className="w-3 h-3" /> Edit
        </button>
      )}
    </div>
  );
}
