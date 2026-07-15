"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar, MapPin, Check, FileText, Award, Sparkles, ArrowRight,
  Loader2, CreditCard, AlertCircle, ChevronLeft, Heart,
} from "lucide-react";
import { TIERS, fullBenefits, tierById, SponsorTier, sponsorFirstName } from "@/lib/sponsors";

const TEAL = "#0E5566";
const GOLD = "#C9A14B";

function money(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

// The discounted price label for a tier, or null when the discount does not
// apply (no discount, or a no-charge tier). Mirrors the checkout rule so the
// funnel previews exactly what Stripe will charge.
function discountedLabel(tier: SponsorTier, pct: number): string | null {
  if (!pct || tier.amountCents <= 0) return null;
  return money(Math.round((tier.amountCents * (100 - pct)) / 100));
}

type SponsorView = {
  companyName: string;
  contactName: string;
  tier: string;
  inviteMessage: string | null;
  paid: boolean;
  donateFoodInstead: boolean;
  status: string;
  discountPercent: number;
};

type Step = "choose" | "details" | "done";

export default function InvitedLanding({ token, sponsor }: { token: string; sponsor: SponsorView }) {
  const initialTier = tierById(sponsor.tier);
  const [selected, setSelected] = useState<SponsorTier | null>(initialTier || null);
  const [step, setStep] = useState<Step>(initialTier ? "details" : "choose");
  // Food is an in-kind tier: default to donating a meal (paying is the opt-out),
  // unless this sponsor already recorded a choice.
  const [donateFoodInstead, setDonateFoodInstead] = useState(sponsor.donateFoodInstead || sponsor.tier === "food");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMode, setDoneMode] = useState<"food" | "paid">("paid");

  const firstName = sponsorFirstName(sponsor.contactName, sponsor.companyName);
  const pct = sponsor.discountPercent || 0;

  async function pickTier(tier: SponsorTier) {
    setSelected(tier);
    setStep("details");
    setError(null);
    // In-kind tiers (Food Sponsor) default to donating; paying is the opt-out.
    setDonateFoodInstead(!!tier.inKind);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function accept() {
    if (!selected) return;
    if (sponsor.paid) return;
    setBusy(true);
    setError(null);
    try {
      // Persist the chosen tier on the sponsor record.
      const sel = await fetch("/api/sponsors/select-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          tier: selected.id,
          donateFoodInstead: selected.id === "food" ? donateFoodInstead : false,
        }),
      });
      const selJson = await sel.json();
      if (!sel.ok) {
        setError(selJson.error || "Could not save your selection.");
        setBusy(false);
        return;
      }

      // Food-in-kind: no payment, just confirm and let our team follow up.
      if (selJson.donatesFoodInstead || !selJson.requiresPayment) {
        setDoneMode("food");
        setStep("done");
        setBusy(false);
        return;
      }

      // Exhibitor tables collect a table representative and the exhibitor
      // terms before payment. Route through the status page's completion
      // wizard instead of jumping straight into Stripe, so no one buys a
      // table without agreeing to the terms or telling us who staffs it.
      if (selected.id === "exhibitor") {
        window.location.href = `/sponsor/status/${token}`;
        return;
      }

      // Invite-only (arranged) tiers like the Welcome Kit: their portal page
      // shows the materials we need (logo, website, brochure plan, spotlight
      // contact) right next to the pay button, so route there instead of
      // jumping straight into Stripe with nothing asked.
      if (selected.inviteOnly) {
        window.location.href = `/sponsor/status/${token}`;
        return;
      }

      // Paid tier: start Stripe Checkout and redirect.
      const ck = await fetch("/api/sponsors/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const ckJson = await ck.json();
      if (!ck.ok || !ckJson.url) {
        setError(ckJson.error || "Could not start checkout.");
        setBusy(false);
        return;
      }
      window.location.href = ckJson.url;
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-10"
      style={{ background: `linear-gradient(135deg, #f7f3ea 0%, #ffffff 60%, #f0f6f7 100%)` }}>
      <div className="max-w-3xl mx-auto">
        <Hero firstName={firstName} companyName={sponsor.companyName} accent={selected?.accent || TEAL} />

        {sponsor.inviteMessage && step !== "done" && (
          <div className="mt-5 rounded-xl p-4 text-sm leading-relaxed bg-white border border-slate-200 shadow-sm"
            style={{ borderLeft: `4px solid ${selected?.accent || TEAL}` }}>
            {sponsor.inviteMessage.split("\n").map((line, i) => <p key={i} className="mb-2 last:mb-0 text-slate-700">{line}</p>)}
          </div>
        )}

        {pct > 0 && !sponsor.paid && step !== "done" && (
          <div className="mt-5 rounded-xl px-4 py-3 flex items-center gap-3 text-sm shadow-sm"
            style={{ background: "#FBF4E2", border: `1px solid #EAD9AE` }}>
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-[13px] font-extrabold"
              style={{ background: GOLD, color: "#3C2E10" }}>
              -{pct}%
            </span>
            <div className="leading-snug">
              <div className="font-bold text-[#3C2E10]">Your {pct}% partner discount is applied.</div>
              <div className="text-[12.5px] text-[#6b5a2e]">
                Every level below shows your discounted price, and it carries through to checkout.
              </div>
            </div>
          </div>
        )}

        {sponsor.paid ? (
          <PaidConfirmation companyName={sponsor.companyName} accent={selected?.accent || TEAL} />
        ) : step === "choose" ? (
          <ChooseTier onPick={pickTier} pct={pct} />
        ) : step === "details" && selected ? (
          <Details
            tier={selected}
            companyName={sponsor.companyName}
            pct={pct}
            donateFoodInstead={donateFoodInstead}
            setDonateFoodInstead={setDonateFoodInstead}
            busy={busy}
            error={error}
            onChange={() => { setSelected(null); setStep("choose"); setError(null); }}
            onAccept={accept}
          />
        ) : step === "done" && selected ? (
          <DoneFoodInKind tier={selected} companyName={sponsor.companyName} />
        ) : null}

        <FooterLinks />
      </div>
    </div>
  );
}

function Hero({ firstName, companyName, accent }: { firstName: string; companyName: string; accent: string }) {
  return (
    <div className="text-center mb-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3"
        style={{ background: accent + "15", color: accent }}>
        <Award className="w-3 h-3" /> Personal invitation
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
        {firstName ? `Hi ${firstName}.` : "Hello."}
      </h1>
      <p className="mt-3 text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
        We&rsquo;d be honored to have <strong>{companyName}</strong> partner with us on the 2026 Lurie Children&rsquo;s and AALB Conference.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />August 15 and 16, 2026</span>
        <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Lurie Children&rsquo;s, Chicago</span>
      </div>
    </div>
  );
}

function ChooseTier({ onPick, pct }: { onPick: (t: SponsorTier) => void; pct: number }) {
  const mainTiers = TIERS.filter((t) => ["supporter", "silver", "gold", "diamond"].includes(t.id));
  const specialty = TIERS.filter((t) => ["food", "asl"].includes(t.id));
  const exhibitor = TIERS.find((t) => t.id === "exhibitor")!;

  return (
    <div className="mt-2">
      <div className="text-center mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">Pick the level that&rsquo;s right for you.</h2>
        <p className="text-sm text-slate-500 mt-1">The $450 Supporter level (logo only) is generally fully tax-deductible; higher levels include tickets, so deductibility depends on the benefits received. Consult your tax advisor.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {mainTiers.map((tier, i) => (
          <TierCard key={tier.id} tier={tier} onPick={onPick} pct={pct} featured={i === mainTiers.length - 1} />
        ))}
      </div>

      <div className="text-center text-[11px] font-bold tracking-widest uppercase text-slate-400 my-4">
        or underwrite a piece of the conference
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {specialty.map((tier) => (
          <TierCard key={tier.id} tier={tier} onPick={onPick} pct={pct} />
        ))}
      </div>
      <TierCard tier={exhibitor} onPick={onPick} pct={pct} compact />
    </div>
  );
}

function TierCard({
  tier, onPick, pct, featured, compact,
}: {
  tier: SponsorTier;
  onPick: (t: SponsorTier) => void;
  pct: number;
  featured?: boolean;
  compact?: boolean;
}) {
  const benefits = fullBenefits(tier.id).slice(0, compact ? 3 : 4);
  const disc = discountedLabel(tier, pct);
  return (
    <button
      onClick={() => onPick(tier)}
      className="text-left rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md group"
      style={{
        borderColor: featured ? tier.accent : "#e2e8f0",
        boxShadow: featured ? `0 12px 30px -10px ${tier.accent}30` : undefined,
      }}
    >
      <div className="h-1.5" style={{ background: tier.accent }} />
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>
              {tier.name}
            </div>
            {disc ? (
              <div className="mt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{disc}</span>
                  <span className="text-sm text-slate-400 line-through">{tier.amountLabel}</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: GOLD }}>{pct}% off</div>
              </div>
            ) : (
              <div className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">
                {tier.amountLabel}
              </div>
            )}
          </div>
          {tier.ticketsIncluded > 0 && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
              style={{ background: tier.accentSoft, color: tier.accent }}>
              {tier.ticketsIncluded} ticket{tier.ticketsIncluded === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 mb-3">{tier.tagline}</p>
        <ul className="space-y-1.5 mb-4 text-xs text-slate-700 flex-1">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="w-3 h-3 mt-0.5 shrink-0" style={{ color: tier.accent }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="text-xs font-bold inline-flex items-center gap-1 transition-colors" style={{ color: tier.accent }}>
          Choose {tier.name.replace(" Sponsor", "")} <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </button>
  );
}

function Details({
  tier, companyName, pct, donateFoodInstead, setDonateFoodInstead, busy, error, onChange, onAccept,
}: {
  tier: SponsorTier;
  companyName: string;
  pct: number;
  donateFoodInstead: boolean;
  setDonateFoodInstead: (v: boolean) => void;
  busy: boolean;
  error: string | null;
  onChange: () => void;
  onAccept: () => void;
}) {
  const benefits = fullBenefits(tier.id);
  const usesAlternative = tier.id === "food" && donateFoodInstead;
  const disc = discountedLabel(tier, pct);
  const payLabel = disc || tier.amountLabel;
  const ctaLabel = usesAlternative
    ? "Confirm food donation"
    : `Accept and pay ${payLabel}`;
  const ctaIcon = usesAlternative ? <Heart className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />;

  return (
    <div className="mt-5">
      <button onClick={onChange} className="text-xs font-semibold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 mb-3">
        <ChevronLeft className="w-3 h-3" /> Choose a different level
      </button>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="h-2" style={{ background: tier.accent }} />
        <div className="p-6 sm:p-8">
          <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>
            {tier.name}
          </div>
          <div className="mt-1 flex items-baseline gap-3 flex-wrap">
            {tier.inKind && donateFoodInstead ? (
              <>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{tier.inKind.action}</span>
                <span className="text-sm text-slate-500">{tier.inKind.valueLabel} · includes {tier.ticketsIncluded} ticket{tier.ticketsIncluded === 1 ? "" : "s"}</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{payLabel}</span>
                {disc && <span className="text-lg text-slate-400 line-through">{tier.amountLabel}</span>}
                <span className="text-sm text-slate-500">{tier.ticketsIncluded > 0 ? `includes ${tier.ticketsIncluded} conference ticket${tier.ticketsIncluded === 1 ? "" : "s"}` : "logo recognition · no ticket included"}</span>
              </>
            )}
          </div>
          {disc && !(tier.inKind && donateFoodInstead) && (
            <div className="mt-1 text-xs font-bold uppercase tracking-wide" style={{ color: GOLD }}>
              {pct}% partner discount applied
            </div>
          )}
          <p className="mt-2 text-slate-600">{tier.tagline}</p>

          <h3 className="mt-6 text-xs font-bold text-slate-900 uppercase tracking-wide">What&rsquo;s included for {companyName}</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tier.accent }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {tier.inKind && (
            <label className="mt-5 flex items-start gap-3 p-3 rounded-lg cursor-pointer border"
              style={{ background: donateFoodInstead ? tier.accentSoft : "#fff", borderColor: donateFoodInstead ? tier.accent : "#e2e8f0" }}>
              <input
                type="checkbox"
                checked={donateFoodInstead}
                onChange={(e) => setDonateFoodInstead(e.target.checked)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-900">{tier.inKind.action} (in kind)</div>
                <div className="text-xs text-slate-600 mt-0.5">{tier.inKind.requirement}</div>
                <div className="text-xs text-slate-500 mt-1">{tier.inKind.payAlternative} Uncheck to pay instead.</div>
              </div>
            </label>
          )}

          {error && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm inline-flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={onAccept}
            disabled={busy}
            className="mt-6 w-full px-6 py-4 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 inline-flex items-center justify-center gap-2 text-base"
            style={{ background: tier.accent }}
          >
            {busy
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Working…</>
              : <>{ctaIcon} {ctaLabel}</>}
          </button>

          <p className="text-[11px] text-slate-400 mt-3 text-center">
            A 501(c)(3) nonprofit (EINs: 83-3016421 and 36-2170833); your payment may be tax-deductible, so consult your tax advisor.
            {!usesAlternative && " Payment processed by Stripe."}
            {" "}Need to pay by check or invoice? Reply to the email instead.
          </p>
        </div>
      </div>
    </div>
  );
}

function DoneFoodInKind({ tier, companyName }: { tier: SponsorTier; companyName: string }) {
  return (
    <div className="mt-5 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="h-2" style={{ background: tier.accent }} />
      <div className="p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ background: tier.accentSoft }}>
          <Sparkles className="w-7 h-7" style={{ color: tier.accent }} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Thank you, {companyName}.
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Your interest in donating food in kind is on its way to our team. Iris will follow up shortly to coordinate menu, quantities, delivery, and logistics. Vegetarian / vegan only.
        </p>
      </div>
    </div>
  );
}

function PaidConfirmation({ companyName, accent }: { companyName: string; accent: string }) {
  return (
    <div className="mt-5 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="h-2" style={{ background: accent }} />
      <div className="p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ background: accent + "20" }}>
          <Check className="w-7 h-7" style={{ color: accent }} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {companyName} is confirmed.
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Your sponsorship has been received. Thank you for partnering with us.
        </p>
      </div>
    </div>
  );
}

function FooterLinks() {
  return (
    <div className="mt-6 flex items-center justify-between flex-wrap gap-2 px-2">
      <Link href="/sponsor" className="text-xs font-semibold text-slate-500 hover:text-slate-900">
        All sponsorship levels
      </Link>
      <a href="/2026-sponsorship-prospectus.pdf" target="_blank" rel="noopener noreferrer"
        className="text-xs font-semibold inline-flex items-center gap-1 text-slate-500 hover:text-slate-900">
        <FileText className="w-3 h-3" /> Prospectus PDF
      </a>
    </div>
  );
}
