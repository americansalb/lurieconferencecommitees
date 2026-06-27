import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isCompExhibitor, isFoodProspect, isAslProspect } from "@/lib/sponsors";
import InvitedLanding from "./InvitedLanding";

export const dynamic = "force-dynamic";

export default async function SponsorInvitedPage({ params, searchParams }: { params: { token: string }; searchParams: { pay?: string } }) {
  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: params.token } });
  if (!sponsor) notFound();

  // A complimentary exhibitor table skips "pick a level" and goes straight to
  // claiming their table.
  if (isCompExhibitor(sponsor) && !sponsor.paid) {
    redirect(`/sponsor/status/${params.token}`);
  }

  // Food and ASL sponsors lead with the donate-first pledge funnel, not the
  // paid tier funnel. ?pay=1 lets them through to pay financially if they'd
  // rather do that.
  if (!sponsor.paid && !searchParams?.pay) {
    if (isFoodProspect(sponsor)) redirect(`/sponsor/food/${params.token}`);
    if (isAslProspect(sponsor)) redirect(`/sponsor/asl/${params.token}`);
  }

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
        discountPercent: sponsor.discountPercent ?? 0,
      }}
    />
  );
}
