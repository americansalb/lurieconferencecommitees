import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, CreditCard, Check, FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { tierById, SPONSOR_STATUS_LABELS } from "@/lib/sponsors";
import PayNowButton from "./PayNowButton";

export const dynamic = "force-dynamic";

export default async function SponsorStatusPage({ params }: { params: { token: string } }) {
  const sponsor = await prisma.sponsor.findUnique({
    where: { applicationToken: params.token },
  });
  if (!sponsor) notFound();

  const tier = tierById(sponsor.tier);
  const TEAL = "#0E5566";
  const accent = tier?.accent || TEAL;
  const status = SPONSOR_STATUS_LABELS[sponsor.status] || SPONSOR_STATUS_LABELS.submitted;
  const amount = tier?.amountLabel || `$${(sponsor.amountCents / 100).toFixed(0)}`;

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
            Tax-deductible under IRS code 501(c)(3). EINs: 83-3016421 and 36-2170833.
          </p>
        </div>
      </div>
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
