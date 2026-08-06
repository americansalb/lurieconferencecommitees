import Landing from "@/components/landing/Landing";
import { prisma } from "@/lib/db";
import { allPublicTiersClosed } from "@/lib/sponsors";

// Re-render at most hourly: pricing (Standard -> Late on July 15) is computed
// at render time, so a fully static page would keep advertising the old rate
// after the cutoff while checkout charges the new one.
export const revalidate = 3600;

// Server-rendered public conference landing. Everyone sees the marketing
// page, including authenticated team members. Logged-in users get a
// "Dashboard" link in the nav so they can still jump back to the planning
// portal in one click.
// Sponsor artwork comes from the logo each partner uploaded to their own
// record, served by the public logo route. That is the copy they sent us, so
// nothing here is redrawn or approximated, and a new sponsor's mark appears as
// soon as they upload it without anyone committing a file.
async function uploadedSponsorLogos(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.sponsor.findMany({
      where: { mergedIntoId: null, logo: { isNot: null } },
      select: { id: true, companyName: true },
    });
    return Object.fromEntries(rows.map((r) => [r.companyName, `/api/sponsors/${r.id}/logo`]));
  } catch {
    // The landing page must render even if the database is unreachable; the
    // committed files in /public/partners still carry the rest.
    return {};
  }
}

export default async function Home() {
  return <Landing uploadedLogos={await uploadedSponsorLogos()} sponsorshipClosed={allPublicTiersClosed()} />;
}
