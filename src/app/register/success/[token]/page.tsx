import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Calendar, MapPin, Monitor, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { retrieveCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { confirmAttendeePaid } from "@/lib/attendee-mail";

export const dynamic = "force-dynamic";

const TEAL = "#0E4456";
const TEAL_DEEP = "#0C3B4B";
const BLUE = "#2A8FCC";
const GOLD = "#C9A14B";
const INK = "#0B1F25";
const MUTED = "#5A6E76";

export default async function RegistrationSuccessPage({
  params, searchParams,
}: {
  params: { token: string };
  searchParams: { cs?: string };
}) {
  let attendee = await prisma.attendee.findUnique({ where: { inviteToken: params.token } });
  if (!attendee) notFound();

  // Webhook-independent confirmation, same as the sponsor success page: Stripe
  // just sent them here after paying, so if the webhook hasn't landed (or was
  // never configured for attendee sessions), verify the session directly and
  // confirm — this is what actually sends the confirmation email. The session
  // must be paid AND provably this attendee's own checkout; confirmAttendeePaid
  // additionally requires the amount to match.
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
          if (!attendee) notFound();
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
        console.error("[register success] payment verify failed", e);
      }
    }
  }

  const isInPerson = attendee.attendanceMode === "in-person";
  const ModeIcon = isInPerson ? MapPin : Monitor;
  const modeLabel = isInPerson ? "In-Person" : "Virtual";
  const priceDisplay = attendee.finalPriceCents
    ? `$${(attendee.finalPriceCents / 100).toFixed(2)}`
    : null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)` }}
    >
      <div className="max-w-lg w-full">
        <div
          className="bg-white rounded-2xl overflow-hidden text-center"
          style={{ boxShadow: "0 32px 80px -32px rgba(0,0,0,0.45)" }}
        >
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${TEAL} 0%, ${BLUE} 50%, ${GOLD} 100%)` }} />
          <div className="p-8 sm:p-10">
            {attendee.paid ? (
              <>
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5"
                  style={{ background: TEAL + "15", color: TEAL }}
                >
                  <Check className="w-8 h-8" strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: INK }}>
                  You&rsquo;re in, {attendee.firstName}.
                </h1>
                <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: MUTED }}>
                  Your registration for the 2026 Lurie Children&rsquo;s and AALB Conference is confirmed. A receipt is on its way to <strong style={{ color: INK }}>{attendee.email}</strong>.
                </p>
              </>
            ) : (
              <>
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5"
                  style={{ background: GOLD + "20", color: GOLD }}
                >
                  <Sparkles className="w-7 h-7" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: INK }}>
                  Finalizing your seat&hellip;
                </h1>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: MUTED }}>
                  We haven&rsquo;t been able to confirm your payment yet. If you just paid, refresh this
                  page in a moment. If this message keeps showing, the payment may not have gone
                  through — email <a className="font-semibold" style={{ color: TEAL }} href="mailto:contact@aalb.org">contact@aalb.org</a> and
                  we&rsquo;ll sort it out.
                </p>
              </>
            )}

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <ReceiptCell label="Dates" value="August 15 and 16, 2026" icon={Calendar} />
              <ReceiptCell label="Attendance" value={modeLabel} icon={ModeIcon} />
              {priceDisplay && <ReceiptCell label={attendee.paid ? "Paid" : "Amount due"} value={priceDisplay} icon={Check} />}
            </div>

            <p className="mt-8 text-[11px]" style={{ color: MUTED }}>
              Refundable through July 15. Need to make a change? Email{" "}
              <a className="font-semibold" style={{ color: TEAL }} href="mailto:contact@aalb.org">contact@aalb.org</a> and we&rsquo;ll take care of it.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs font-semibold text-white/70 hover:text-white">
            ← Back to the conference
          </Link>
        </div>
      </div>
    </div>
  );
}

function ReceiptCell({
  label, value, icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div className="rounded-lg p-3" style={{ background: "#F6F1E6" }}>
      <div className="text-[9px] font-bold tracking-[0.22em] uppercase mb-1" style={{ color: TEAL }}>
        {label}
      </div>
      <div className="text-sm font-bold inline-flex items-center gap-1.5" style={{ color: INK }}>
        <Icon className="w-3.5 h-3.5" />
        {value}
      </div>
    </div>
  );
}
