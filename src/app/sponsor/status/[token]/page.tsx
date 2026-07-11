import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Calendar, MapPin, CreditCard, Check, FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { tierById, fullBenefits, SPONSOR_STATUS_LABELS } from "@/lib/sponsors";
import PayNowButton from "./PayNowButton";
import ExhibitorCompletionWizard from "./ExhibitorCompletionWizard";
import LogoUploader from "./LogoUploader";
import WebsiteField from "./WebsiteField";
import LogisticsForm from "./LogisticsForm";
import PostPaymentDetailsForm from "./PostPaymentDetailsForm";

export const dynamic = "force-dynamic";

export default async function SponsorStatusPage({ params }: { params: { token: string } }) {
  const sponsor = await prisma.sponsor.findUnique({
    where: { applicationToken: params.token },
    include: { logo: { select: { mime: true } } },
  });
  if (!sponsor) notFound();

  // Invitees who haven't picked a tier yet belong on the invitation page,
  // not the status page (which assumes a chosen level).
  if (sponsor.tier === "undecided" && !sponsor.paid) {
    redirect(`/sponsor/invited/${params.token}`);
  }

  const tier = tierById(sponsor.tier);
  const TEAL = "#0E5566";
  const accent = tier?.accent || TEAL;
  // In-kind Food / ASL sponsors don't pay: their portal collects a logo, a
  // website link, and the coordination logistics (the things the acceptance
  // letter asks for) instead of a payment. The exhibitor path has its own
  // wizard above.
  const isInKind = sponsor.tier === "food" || sponsor.tier === "asl" || sponsor.tier === "captioning";
  // Welcome Kit (invite-only remote) sponsors pay, but we also need their
  // materials: logo, website, brochure plan, and — on the Spotlight tier — the
  // contact we announce to virtual attendees. Shown alongside the pay button
  // so the asks are visible before and after payment.
  const isWelcomeKit = sponsor.tier === "welcome-kit" || sponsor.tier === "welcome-kit-plus";
  const logisticsKind: "food" | "asl" | "captioning" | "welcome-kit" | "welcome-kit-plus" =
    sponsor.tier === "asl" ? "asl"
    : sponsor.tier === "captioning" ? "captioning"
    : sponsor.tier === "welcome-kit" ? "welcome-kit"
    : sponsor.tier === "welcome-kit-plus" ? "welcome-kit-plus"
    : "food";
  // sponsor.logistics is stored as a JSON string map; narrow it for the form.
  const logistics =
    sponsor.logistics && typeof sponsor.logistics === "object" && !Array.isArray(sponsor.logistics)
      ? (sponsor.logistics as Record<string, string>)
      : null;
  const status = SPONSOR_STATUS_LABELS[sponsor.status] || SPONSOR_STATUS_LABELS.submitted;
  // VIP courtesy discount: show what they actually owe/paid, not the list price,
  // matching the funnel and what Stripe charges. Applies to any paid level
  // (including the exhibitor table); a complimentary table shows no discount.
  const pct = sponsor.discountPercent || 0;
  const applyDiscount = pct > 0 && !!tier && tier.amountCents > 0 && sponsor.amountCents > 0;
  const fullLabel = tier?.amountLabel || `$${(sponsor.amountCents / 100).toFixed(0)}`;
  const amount = applyDiscount && tier
    ? `$${Math.round(Math.round((tier.amountCents * (100 - pct)) / 100) / 100).toLocaleString("en-US")}`
    : fullLabel;

  // Accepted, unpaid exhibitors complete their table details, agree to the
  // terms, and pay through a full-screen wizard (matches the apply funnel)
  // rather than the status card.
  if (tier && sponsor.tier === "exhibitor" && !sponsor.paid && !sponsor.donateFoodInstead) {
    const free = sponsor.amountCents === 0;
    return (
      <ExhibitorCompletionWizard
        token={params.token}
        companyName={sponsor.companyName}
        free={free}
        tier={{ name: tier.name, amountLabel: free ? "Complimentary" : amount, ticketsIncluded: tier.ticketsIncluded, accent, accentSoft: tier.accentSoft }}
        benefits={fullBenefits(sponsor.tier)}
        hasLogo={!!sponsor.logo}
        initial={{
          registreeName: sponsor.registreeName || "",
          registreeEmail: sponsor.registreeEmail || "",
          dietary: sponsor.dietary || "",
          accessibility: sponsor.accessibility || "",
          wantsLogo: sponsor.wantsLogo,
        }}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-10"
      style={{ background: `linear-gradient(135deg, #f7f3ea 0%, #ffffff 60%, #f0f6f7 100%)` }}>
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="h-1.5" style={{ background: accent }} />
        <div className="p-6 sm:p-8">
          <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: accent }}>
            Sponsorship application
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {sponsor.companyName}
          </h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700">{tier?.name || sponsor.tier}</span>
            <span className="text-sm text-slate-500">&middot; {amount}</span>
            {applyDiscount && (
              <>
                <span className="text-xs text-slate-400 line-through">{fullLabel}</span>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "#FBF4E2", color: "#9A7B2E" }}>{pct}% partner discount</span>
              </>
            )}
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${status.color}`}>{status.label}</span>
          </div>

          {sponsor.donateFoodInstead && (
            <div className="mt-5 rounded-lg p-3 text-sm" style={{ background: tier?.accentSoft || "#f8fafc" }}>
              You opted to donate food in kind. Our team will coordinate menu, quantities, and delivery directly.
            </div>
          )}

          {!sponsor.paid && !sponsor.donateFoodInstead && sponsor.amountCents > 0 && (
            <div className="mt-6">
              <div className="text-xs text-slate-500 mb-3">
                Pay {amount} now with a card via Stripe, or reply to the confirmation email to arrange invoice or check.
              </div>
              <PayNowButton token={params.token} accent={accent} amountLabel={amount} />
            </div>
          )}

          {sponsor.paid && (
            <div className="mt-5 rounded-lg p-3 text-sm flex items-center gap-2" style={{ background: tier?.accentSoft || "#f8fafc", color: accent }}>
              <Check className="w-4 h-4" /> Payment received. Keep your confirmation email as a receipt for tax purposes.
            </div>
          )}

          {sponsor.tier === "exhibitor" && sponsor.paid && !sponsor.registreeName && (
            <PostPaymentDetailsForm token={params.token} accent={accent} />
          )}

          {(sponsor.tier === "exhibitor" || isInKind || isWelcomeKit || sponsor.wantsLogo || sponsor.logo || sponsor.paid) && (
            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">
                {isInKind || isWelcomeKit ? "Feature your organization" : "Your logo"}
              </div>
              <LogoUploader token={params.token} sponsorId={sponsor.id} companyName={sponsor.companyName} hasLogo={!!sponsor.logo} />
              {(isInKind || isWelcomeKit) && (
                <div className="mt-4 pt-4 border-t border-slate-200/70">
                  <WebsiteField token={params.token} initial={sponsor.website || ""} />
                </div>
              )}
              {(isInKind || isWelcomeKit) && (
                <div className="mt-4 pt-4 border-t border-slate-200/70">
                  <LogisticsForm token={params.token} kind={logisticsKind} initial={logistics} />
                </div>
              )}
              {(sponsor.registreeName || sponsor.dietary || sponsor.accessibility) && (
                <dl className="mt-4 pt-3 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {sponsor.registreeName && <Detail label="Table representative" value={`${sponsor.registreeName}${sponsor.registreeEmail ? ` · ${sponsor.registreeEmail}` : ""}`} />}
                  {sponsor.dietary && <Detail label="Dietary" value={sponsor.dietary} />}
                  {sponsor.accessibility && <Detail label="Accessibility" value={sponsor.accessibility} />}
                </dl>
              )}
            </div>
          )}

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Info icon={Calendar} label="Dates" value="August 15 and 16, 2026" />
            <Info icon={MapPin} label="Venue" value="Lurie Children's, Chicago" />
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <Link href="/sponsor" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
              ← All sponsorship levels
            </Link>
            <a href="/2026-sponsorship-prospectus.pdf" target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: TEAL }}>
              <FileText className="w-3.5 h-3.5" /> Prospectus PDF
            </a>
          </div>

          <p className="mt-6 text-[11px] text-slate-400">
            A 501(c)(3) nonprofit (EINs: 83-3016421 and 36-2170833). Your payment may be tax-deductible, so consult your tax advisor.
          </p>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function Info({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg p-3 border border-slate-100 bg-slate-50">
      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        {value}
      </div>
    </div>
  );
}
