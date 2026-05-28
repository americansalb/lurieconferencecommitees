import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import InvitedLanding from "./InvitedLanding";

export const dynamic = "force-dynamic";

export default async function SponsorInvitedPage({ params }: { params: { token: string } }) {
  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: params.token } });
  if (!sponsor) notFound();

  // Log the view once (best effort). Subsequent views are harmless.
  if (sponsor.status === "invited") {
    await prisma.sponsorEvent.create({
      data: { sponsorId: sponsor.id, type: "invite_viewed" },
    }).catch(() => { /* ignore */ });
  }

  return (
    <InvitedLanding
      token={params.token}
      sponsor={{
        companyName: sponsor.companyName,
        contactName: sponsor.contactName,
        tier: sponsor.tier,
        inviteMessage: sponsor.inviteMessage,
        paid: sponsor.paid,
        donateFoodInstead: sponsor.donateFoodInstead,
        status: sponsor.status,
      }}
    />
  );
}
