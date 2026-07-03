import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import InKindPledge from "@/components/sponsor/InKindPledge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "In-Kind ASL Interpreter Sponsorship: 2026 Lurie Children's & AALB Conference",
};

export default async function AslPledgePage({ params }: { params: { token: string } }) {
  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: params.token } });
  if (!sponsor) notFound();

  // A paid sponsor clicking the pledge link from their original invitation
  // belongs on their status page; the pledge form would offer to rewrite a
  // completed payment into a $0 in-kind record.
  if (sponsor.paid) redirect(`/sponsor/status/${params.token}`);

  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "inkind_pledge_viewed", meta: "asl" },
  }).catch(() => { /* ignore */ });

  const alreadyPledged =
    sponsor.amountCents === 0 &&
    !["invited", "prospect", "queued"].includes(sponsor.status);

  return (
    <InKindPledge
      kind="asl"
      token={params.token}
      companyName={sponsor.companyName}
      contactName={sponsor.contactName}
      contactEmail={sponsor.contactEmail}
      contactPhone={sponsor.contactPhone || ""}
      alreadyPledged={alreadyPledged}
    />
  );
}
