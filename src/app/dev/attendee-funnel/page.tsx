import { notFound } from "next/navigation";
import AttendeeFunnel from "@/app/attend/[token]/AttendeeFunnel";

// Dev-only visual harness for the attendee funnel, so its pricing UI can be
// eyeballed without a live invite token. Never served in production.
export default function AttendeeFunnelPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <AttendeeFunnel
      token="demo-token"
      startStep={0}
      initial={{
        firstName: "Miriam", lastName: "Patel", email: "miriam@example.org",
        phone: "", affiliation: "", primaryLanguages: "",
        attendanceMode: null, attendDay: null, needsParking: null, accessibilityNotes: "", dietary: "",
        discountPercent: 25, status: "viewed", paid: false, inviteMessage: null,
      }}
      pricing={{
        inPersonBaseCents: 21000, inPersonFinalCents: 15750,
        virtualBaseCents: 10500, virtualFinalCents: 7875,
        oneDayBaseCents: 6900, oneDayFinalCents: 5175,
      }}
    />
  );
}
