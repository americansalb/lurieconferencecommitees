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
      // Summary only — never the file bytes — for the slides panel on the
      // confirmed screen.
      slideNotes: true,
      slide: { select: { fileName: true, sizeBytes: true, linkUrl: true, updatedAt: true, createdAt: true } },
    },
  });

  if (!presenter) notFound();

  await prisma.presenterEvent.create({
    data: { presenterId: presenter.id, type: "opened" },
  });

  const { slide, slideNotes, ...rest } = presenter;

  return (
    <PresenterFlow
      token={params.token}
      initial={{
        ...rest,
        travelArrival: rest.travelArrival ? rest.travelArrival.toISOString() : null,
        travelDeparture: rest.travelDeparture ? rest.travelDeparture.toISOString() : null,
      }}
      headshotUrl={rest.headshotMime ? `/api/presenters/headshot/${rest.id}` : null}
      slideNotes={slideNotes}
      slide={slide ? {
        fileName: slide.fileName,
        sizeBytes: slide.sizeBytes,
        linkUrl: slide.linkUrl,
        updatedAt: (slide.updatedAt || slide.createdAt).toISOString(),
      } : null}
    />
  );
}
