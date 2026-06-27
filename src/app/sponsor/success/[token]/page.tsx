import Link from "next/link";
import { Check, Calendar, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { tierById } from "@/lib/sponsors";
import { retrieveCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { confirmSponsorPaid } from "@/lib/sponsor-confirm";

export const dynamic = "force-dynamic";

export default async function SponsorSuccessPage({
  params, searchParams,
}: {
  params: { token: string };
  searchParams: { cs?: string };
}) {
  let sponsor = await prisma.sponsor.findUnique({
    where: { applicationToken: params.token },
  });

  // Webhook-independent confirmation: Stripe just sent them here after paying,
  // so if we haven't recorded it yet, verify the session straight from Stripe
  // and confirm. This self-heals a missed or delayed webhook instead of leaving
  // a paid sponsor stuck at "awaiting payment" with no email.
  if (sponsor && !sponsor.paid && isStripeConfigured()) {
    const sessionId = searchParams?.cs || sponsor.stripeSessionId;
    if (sessionId) {
      try {
        const verified = await retrieveCheckoutSession(sessionId);
        if (verified?.paid) {
          await confirmSponsorPaid(sponsor.id, {
            paymentIntentId: verified.paymentIntentId,
            amountTotal: verified.amountTotal,
            sessionId: verified.id,
            source: "success_page",
          });
          sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: params.token } });
        }
      } catch (e) {
        console.error("[sponsor success] payment verify failed", e);
      }
    }
  }
  const tier = sponsor ? tierById(sponsor.tier) : null;
  const TEAL = "#0E5566";

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `linear-gradient(135deg, #f7f3ea 0%, #ffffff 60%, #f0f6f7 100%)` }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="h-1.5" style={{ background: tier?.accent || TEAL }} />
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ background: (tier?.accentSoft || TEAL + "15") }}>
            <Check className="w-8 h-8" style={{ color: tier?.accent || TEAL }} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Thank you{sponsor ? `, ${sponsor.contactName.split(" ")[0]}` : ""}.</h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {sponsor ? `${sponsor.companyName} is confirmed as a ${tier?.name || "sponsor"} of the 2026 Lurie Children's and AALB Conference.` : "Your sponsorship is confirmed."}
            {" "}A receipt and confirmation are on their way to your inbox.
          </p>

          <div className="rounded-xl p-4 mb-5 text-left" style={{ background: TEAL + "08" }}>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: TEAL }}>
              The conference
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Calendar className="w-4 h-4" style={{ color: TEAL }} />
              August 15 and 16, 2026
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            A 501(c)(3) nonprofit (EINs: 83-3016421 and 36-2170833). Your payment may be tax-deductible, so consult your tax advisor.
          </p>

          <Link href={`/sponsor/status/${params.token}`} className="mt-4 inline-block text-sm font-semibold" style={{ color: TEAL }}>
            View your sponsorship
          </Link>
        </div>
      </div>
    </div>
  );
}
