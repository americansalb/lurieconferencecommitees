import { prisma } from "@/lib/db";
import { buildExhibitorGuide, guideFilename } from "@/lib/guide-pdf";
import { compAllowance, seatSummary, teamFor, teamUrl } from "@/lib/sponsor-team";
import { tierById } from "@/lib/sponsors";

// The exhibitor's own guide, built fresh on every request, so the team list and
// the unclaimed-seat count on the personal page are true at the moment they
// download it rather than at the moment we last emailed them.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const sponsor = await prisma.sponsor.findUnique({
    where: { teamToken: params.token },
    select: {
      id: true, companyName: true, contactName: true, tier: true,
      customTierName: true, ticketsIncluded: true, mergedIntoId: true,
    },
  });
  if (!sponsor || sponsor.mergedIntoId) return new Response("Not found", { status: 404 });

  const team = await teamFor(sponsor.id);
  const seats = seatSummary(team, compAllowance(sponsor));

  const pdf = await buildExhibitorGuide({
    companyName: sponsor.companyName,
    contactName: sponsor.contactName,
    tierName: sponsor.customTierName || tierById(sponsor.tier)?.name || "Exhibitor",
    teamUrl: teamUrl(params.token),
    seatsIncluded: seats.allowance,
    seatsRemaining: seats.remaining,
    team: team.map((m) => ({
      name: `${m.firstName} ${m.lastName}`.trim() || m.email,
      comp: m.comp,
    })),
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${guideFilename("exhibitor", sponsor.companyName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
