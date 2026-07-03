import { notFound } from "next/navigation";
import RegistrationTicket, { PendingTicket } from "@/components/attend/RegistrationTicket";

// Dev-only visual harness for the registration confirmation ticket (and its
// pending state via ?state=pending), for design review and screenshots.
export default function ConfirmationPreview({ searchParams }: { searchParams: { state?: string; mode?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();
  if (searchParams?.state === "pending") {
    return <PendingTicket firstName="Miriam" portalHref="#" portalLabel="Complete your registration" />;
  }
  return (
    <RegistrationTicket
      firstName="Miriam"
      lastName="Patel"
      email="miriam@example.org"
      attendanceMode={searchParams?.mode === "virtual" ? "virtual" : "in-person"}
      finalPriceCents={searchParams?.mode === "virtual" ? 10500 : 21000}
      portalHref="#"
    />
  );
}
