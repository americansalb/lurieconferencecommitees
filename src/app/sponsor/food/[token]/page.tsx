import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import FoodPledge from "./FoodPledge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Become a Food Sponsor: 2026 Lurie Children's & AALB Conference",
};

export default async function FoodPledgePage({ params }: { params: { token: string } }) {
  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: params.token } });
  if (!sponsor) notFound();

  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "food_pledge_viewed" },
  }).catch(() => { /* ignore */ });

  const alreadyPledged =
    sponsor.donateFoodInstead &&
    !["invited", "prospect", "queued"].includes(sponsor.status);

  return (
    <FoodPledge
      token={params.token}
      companyName={sponsor.companyName}
      contactName={sponsor.contactName}
      contactEmail={sponsor.contactEmail}
      contactPhone={sponsor.contactPhone || ""}
      alreadyPledged={alreadyPledged}
    />
  );
}
