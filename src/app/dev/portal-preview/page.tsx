import { notFound } from "next/navigation";
import AttendeePortal from "@/app/attend/[token]/AttendeePortal";

// Dev-only visual harness for the attendee portal, so it can be eyeballed and
// screenshotted without a live token. ?mode=virtual shows the virtual variant,
// and ?join=none shows it before the live link exists, which is the state every
// virtual attendee is actually in right now.
export default function PortalPreview({ searchParams }: { searchParams: { mode?: string; join?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();
  const virtual = searchParams?.mode === "virtual";
  const noJoin = searchParams?.join === "none";
  return (
    <AttendeePortal
      token="demo-token"
      firstName="Miriam"
      email="miriam@example.org"
      attendanceMode={virtual ? "virtual" : "in-person"}
      finalPriceCents={virtual ? 10500 : 21000}
      joinUrl={virtual && !noJoin ? "https://example.zoom.us/j/000" : null}
      agendaUrl="/#speakers"
    />
  );
}
