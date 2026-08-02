import { prisma } from "@/lib/db";
import { buildAttendeeGuide, guideFilename } from "@/lib/guide-pdf";
import { appUrl } from "@/lib/presenters";

// The attendee's own guide, built fresh on every request.
//
// Generating rather than storing means the personal page always reflects what
// we hold right now: someone who updates their dietary note in the portal and
// downloads again immediately sees the correction, so the copy in their inbox
// is never the one that quietly went stale.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const attendee = await prisma.attendee.findUnique({
    where: { inviteToken: params.token },
    include: { sponsor: { select: { companyName: true } } },
  });
  if (!attendee) return new Response("Not found", { status: 404 });

  const pdf = await buildAttendeeGuide({
    firstName: attendee.firstName,
    lastName: attendee.lastName,
    affiliation: attendee.affiliation,
    attendanceMode: attendee.attendanceMode,
    attendDay: attendee.attendDay,
    portalUrl: `${appUrl()}/attend/${attendee.inviteToken}`,
    dietary: attendee.dietary,
    accessibilityNotes: attendee.accessibilityNotes,
    primaryLanguages: attendee.primaryLanguages,
    needsParking: attendee.needsParking,
    sponsorName: attendee.sponsor?.companyName ?? null,
  });

  const name = `${attendee.firstName} ${attendee.lastName}`.trim();
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${guideFilename("attendee", name)}"`,
      // Personal, and cheap to rebuild. Never let a proxy hand it to anyone else.
      "Cache-Control": "private, no-store",
    },
  });
}
