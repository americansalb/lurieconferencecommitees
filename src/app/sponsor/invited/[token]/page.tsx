import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Check, FileText, Award } from "lucide-react";
import { prisma } from "@/lib/db";
import { tierById, fullBenefits } from "@/lib/sponsors";
import AcceptInvitationButton from "./AcceptInvitationButton";

export const dynamic = "force-dynamic";

export default async function SponsorInvitedPage({ params }: { params: { token: string } }) {
  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: params.token } });
  if (!sponsor) notFound();
  const tier = tierById(sponsor.tier);
  if (!tier) notFound();

  // Log the view (idempotent enough; no FK constraint on duplicate)
  if (sponsor.status === "invited") {
    await prisma.sponsorEvent.create({
      data: { sponsorId: sponsor.id, type: "invite_viewed" },
    }).catch(() => { /* ignore */ });
  }

  const benefits = fullBenefits(tier.id);
  const TEAL = "#0E5566";

  return (
    <div className="min-h-screen px-4 py-10"
      style={{ background: `linear-gradient(135deg, #f7f3ea 0%, #ffffff 60%, #f0f6f7 100%)` }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3"
            style={{ background: tier.accent + "15", color: tier.accent }}>
            <Award className="w-3 h-3" /> Personal invitation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Hi {sponsor.contactName.split(" ")[0]}.
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            We&rsquo;d be honored to have <strong>{sponsor.companyName}</strong> as a {tier.name.replace(" Sponsor", "")} sponsor of the 2026 Lurie Children&rsquo;s and AALB Conference.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="h-2" style={{ background: tier.accent }} />
          <div className="p-6 sm:p-8">
            {sponsor.inviteMessage && (
              <div className="rounded-lg p-4 mb-6 text-sm leading-relaxed"
                style={{ background: tier.accentSoft, color: "#1e293b", border: `1px solid ${tier.accent}33` }}>
                {sponsor.inviteMessage.split("\n").map((line, i) => <p key={i} className="mb-2 last:mb-0">{line}</p>)}
              </div>
            )}

            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: tier.accent }}>
              {tier.name}
            </div>
            <div className="mt-1 flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{tier.amountLabel}</span>
              <span className="text-sm text-slate-500">includes {tier.ticketsIncluded} conference ticket{tier.ticketsIncluded === 1 ? "" : "s"}</span>
            </div>
            <p className="mt-2 text-slate-600">{tier.tagline}</p>

            <h3 className="mt-6 text-xs font-bold text-slate-900 uppercase tracking-wide">What&rsquo;s included</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tier.accent }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Info icon={Calendar} label="Dates" value="August 15 and 16, 2026" />
              <Info icon={MapPin} label="Venue" value="Lurie Children's, Chicago" />
            </div>

            {sponsor.paid ? (
              <div className="mt-6 rounded-lg p-4 text-sm flex items-center gap-2" style={{ background: tier.accentSoft, color: tier.accent }}>
                <Check className="w-5 h-5" /> Your sponsorship has been received. Thank you.
              </div>
            ) : (
              <div className="mt-7">
                <AcceptInvitationButton token={params.token} accent={tier.accent} amountLabel={tier.amountLabel} />
                <p className="text-[11px] text-slate-400 mt-3 text-center">
                  Tax-deductible under IRS code 501(c)(3). EINs: 83-3016421 and 36-2170833. Payment processed by Stripe. Need to pay by check or invoice instead? Simply reply to the email.
                </p>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <Link href="/sponsor" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                ← All sponsorship levels
              </Link>
              <a href="/2026-sponsorship-prospectus.pdf" target="_blank" rel="noopener noreferrer"
                className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: TEAL }}>
                <FileText className="w-3.5 h-3.5" /> Prospectus PDF
              </a>
            </div>
          </div>
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
