import Link from "next/link";
import { Check, Clock, Calendar, Mail } from "lucide-react";
import { prisma } from "@/lib/db";
import { retrieveCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { confirmAttendeePaid } from "@/lib/attendee-mail";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params, searchParams,
}: {
  params: { token: string };
  searchParams: { cs?: string };
}) {
  let attendee = await prisma.attendee.findUnique({
    where: { inviteToken: params.token },
  });

  // Webhook-independent confirmation (same as the sponsor and public-register
  // success pages): verify the session straight from Stripe and confirm, so a
  // missed webhook can't leave a paid attendee unconfirmed with no email. The
  // session must be paid and provably this attendee's own checkout; the amount
  // is checked inside confirmAttendeePaid.
  if (attendee && !attendee.paid && isStripeConfigured()) {
    const sessionId = searchParams?.cs || attendee.stripeSessionId;
    if (sessionId) {
      try {
        const verified = await retrieveCheckoutSession(sessionId);
        const belongsToAttendee = verified?.metadata?.attendeeId === attendee.id;
        if (verified?.paid && belongsToAttendee) {
          await confirmAttendeePaid(attendee.id, {
            paymentIntentId: verified.paymentIntentId,
            amountTotal: verified.amountTotal,
            sessionId: verified.id,
            source: "success_page",
          });
          attendee = await prisma.attendee.findUnique({ where: { inviteToken: params.token } });
        } else if (verified?.paid && !belongsToAttendee) {
          await prisma.attendeeEvent.create({
            data: {
              attendeeId: attendee.id,
              type: "payment_session_mismatch",
              meta: `session ${verified.id} does not belong to this attendee`,
            },
          }).catch(() => {});
        }
      } catch (e) {
        console.error("[attend success] payment verify failed", e);
      }
    }
  }

  const TEAL = "#0E5566";
  const BLUE = "#0066B3";
  // Only claim a confirmation email is coming once the payment is recorded —
  // a declined card or a Stripe hiccup lands here too.
  const isPaid = !!attendee?.paid;

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `linear-gradient(135deg, #f7f3ea 0%, #ffffff 60%, #f0f6f7 100%)` }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="h-1.5" style={{ background: `linear-gradient(to right, ${TEAL} 0%, ${TEAL} 50%, ${BLUE} 50%, ${BLUE} 100%)` }} />
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ background: TEAL + "15" }}>
            {isPaid
              ? <Check className="w-8 h-8" style={{ color: TEAL }} />
              : <Clock className="w-8 h-8" style={{ color: TEAL }} />}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            {isPaid
              ? <>You&rsquo;re in{attendee?.firstName ? `, ${attendee.firstName}` : ""}.</>
              : <>Almost there{attendee?.firstName ? `, ${attendee.firstName}` : ""}.</>}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {isPaid
              ? <>Your spot at the 2026 Lurie Children&rsquo;s &amp; AALB Conference is confirmed. A receipt and confirmation are on their way to your inbox.</>
              : <>We haven&rsquo;t been able to confirm your payment yet. If you just paid, refresh this page in a moment — or head back to your registration page to complete payment.</>}
          </p>

          <div className="rounded-xl p-4 mb-5 text-left" style={{ background: TEAL + "08" }}>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: TEAL }}>
              The big days
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Calendar className="w-4 h-4" style={{ color: TEAL }} />
              August 15 &amp; 16, 2026
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago
            </div>
          </div>

          <Link
            href={`/attend/${params.token}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: TEAL }}
          >
            <Mail className="w-3.5 h-3.5" /> {isPaid ? "View my registration" : "Back to my registration"}
          </Link>
        </div>
      </div>
    </div>
  );
}
