import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computePrice, oneDayInviteBaseCents } from "@/lib/attendees";
import { getEventSettings } from "@/lib/event-settings";
import AttendeeFunnel from "./AttendeeFunnel";
import AttendeePortal from "./AttendeePortal";

export const dynamic = "force-dynamic";

export default async function AttendPage({ params }: { params: { token: string } }) {
  const attendee = await prisma.attendee.findUnique({
    where: { inviteToken: params.token },
  });
  if (!attendee) notFound();

  // Already paid: this is now their returning portal, not the registration funnel.
  if (attendee.paid) {
    const settings = await getEventSettings();
    return (
      <AttendeePortal
        token={params.token}
        firstName={attendee.firstName}
        email={attendee.email}
        attendanceMode={attendee.attendanceMode}
        finalPriceCents={attendee.finalPriceCents}
        joinUrl={settings.joinUrl}
        agendaUrl={settings.agendaUrl}
        details={{
          phone: attendee.phone || "",
          affiliation: attendee.affiliation || "",
          primaryLanguages: attendee.primaryLanguages || "",
          needsParking: attendee.needsParking,
          accessibilityNotes: attendee.accessibilityNotes || "",
          dietary: attendee.dietary || "",
        }}
      />
    );
  }

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
  const virtualPreview = computePrice("virtual", attendee.discountPercent);
  const oneDayBase = oneDayInviteBaseCents();

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
        attendDay: attendee.attendDay,
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
        virtualBaseCents: virtualPreview.baseCents || 0,
        virtualFinalCents: virtualPreview.finalCents || 0,
        oneDayBaseCents: oneDayBase,
        oneDayFinalCents: Math.round(oneDayBase * (100 - attendee.discountPercent) / 100),
      }}
    />
  );
}
