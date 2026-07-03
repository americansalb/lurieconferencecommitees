import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { retrieveCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { confirmAttendeePaid } from "@/lib/attendee-mail";
import RegistrationTicket, { PendingTicket } from "@/components/attend/RegistrationTicket";

export const dynamic = "force-dynamic";

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
  if (!attendee) notFound();

  if (!attendee.paid) {
    return (
      <PendingTicket
        firstName={attendee.firstName}
        portalHref={`/register?resume=${params.token}`}
        portalLabel="Complete your registration"
      />
    );
  }

  return (
    <RegistrationTicket
      firstName={attendee.firstName}
      lastName={attendee.lastName}
      email={attendee.email}
      attendanceMode={attendee.attendanceMode}
      finalPriceCents={attendee.finalPriceCents}
      portalHref={`/attend/${params.token}`}
    />
  );
}
