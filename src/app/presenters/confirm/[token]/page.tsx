import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import PresenterFlow from "./PresenterFlow";

export const dynamic = "force-dynamic";

export default async function PresenterConfirmPage({ params }: { params: { token: string } }) {
  const presenter = await prisma.presenter.findUnique({
    where: { token: params.token },
    select: {
      id: true, email: true, name: true, affiliation: true, jobTitle: true,
      pronouns: true, phone: true,
      role: true,
      talkTitle: true, talkAbstract: true, sessionFormat: true, sessionTrack: true,
      sessionLength: true, qaLength: true, coPresenters: true, preferredDay: true,
      learningObjectives: true,
      honorariumAmount: true, travelReimbursement: true, presenterMessage: true,
      bio: true, websiteUrl: true, linkedinUrl: true, twitterHandle: true,
      headshotMime: true,
      avNotes: true, needsMic: true, needsProjector: true, needsAudio: true,
      needsInternet: true, needsRecording: true, needsClicker: true,
      travelMode: true, travelOrigin: true, travelArrival: true, travelDeparture: true,
      needsHotel: true, hotelNotes: true, needsParking: true,
      dietary: true, allergies: true, accessibilityNeeds: true, emergencyContact: true,
      agreedToRecord: true, recordingWaived: true, agreedToPhoto: true, agreedToTerms: true,
      agreedToCe: true, agreedToHeadshot: true,
      status: true, confirmedAt: true, requestedChanges: true,
      token: true,
    },
  });

  if (!presenter) notFound();

  await prisma.presenterEvent.create({
    data: { presenterId: presenter.id, type: "opened" },
  });

  return (
    <PresenterFlow
      token={params.token}
      initial={{
        ...presenter,
        travelArrival: presenter.travelArrival ? presenter.travelArrival.toISOString() : null,
        travelDeparture: presenter.travelDeparture ? presenter.travelDeparture.toISOString() : null,
      }}
      headshotUrl={presenter.headshotMime ? `/api/presenters/headshot/${presenter.id}` : null}
    />
  );
}
