import { notFound } from "next/navigation";
import AttendeePortal from "@/app/attend/[token]/AttendeePortal";

// Dev-only visual harness for the attendee portal, so it can be eyeballed and
// screenshotted without a live token. ?mode=virtual shows the virtual variant
// with the per-day Zoom rooms; add &day=sat or &day=sun for a one-day ticket.
export default function PortalPreview({ searchParams }: { searchParams: { mode?: string; day?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();
  const virtual = searchParams?.mode === "virtual";
  const day = searchParams?.day === "sat" || searchParams?.day === "sun" ? searchParams.day : null;
  return (
    <AttendeePortal
      token="demo-token"
      firstName="Miriam"
      email="miriam@example.org"
      attendanceMode={virtual ? "virtual" : "in-person"}
      attendDay={virtual ? day : null}
      finalPriceCents={virtual ? 10500 : 21000}
      agendaUrl="/#speakers"
    />
  );
}
