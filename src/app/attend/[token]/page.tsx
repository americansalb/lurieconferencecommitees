import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computePrice } from "@/lib/attendees";
import AttendeeFunnel from "./AttendeeFunnel";

export const dynamic = "force-dynamic";

export default async function AttendPage({ params }: { params: { token: string } }) {
  const attendee = await prisma.attendee.findUnique({
    where: { inviteToken: params.token },
  });
  if (!attendee) notFound();

  // Mark first view (best-effort, fire-and-forget on server boundary).
  if (!attendee.viewedAt) {
    await prisma.attendee.update({
      where: { id: attendee.id },
      data: {
        viewedAt: new Date(),
        status: attendee.status === "invited" || attendee.status === "queued" ? "viewed" : attendee.status,
      },
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "viewed_invite" },
    }).catch(() => {});
  }

  const inPersonPreview = computePrice("in-person", attendee.discountPercent);

  return (
    <AttendeeFunnel
      token={params.token}
      initial={{
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        email: attendee.email,
        phone: attendee.phone || "",
        affiliation: attendee.affiliation || "",
        primaryLanguages: attendee.primaryLanguages || "",
        attendanceMode: attendee.attendanceMode,
        needsParking: attendee.needsParking,
        accessibilityNotes: attendee.accessibilityNotes || "",
        dietary: attendee.dietary || "",
        discountPercent: attendee.discountPercent,
        status: attendee.status,
        paid: attendee.paid,
        inviteMessage: attendee.inviteMessage,
      }}
      pricing={{
        inPersonBaseCents: inPersonPreview.baseCents || 0,
        inPersonFinalCents: inPersonPreview.finalCents || 0,
        virtualBaseCents: 10500,
      }}
    />
  );
}
