import { notFound } from "next/navigation";
import ExhibitorCompletionWizard from "@/app/sponsor/status/[token]/ExhibitorCompletionWizard";

// Dev-only visual harness for the exhibitor completion wizard, so it can be
// eyeballed without seeding an accepted, unpaid exhibitor in the database.
// Never served in production. The "Pay" action will fail against the demo
// token — that's expected; this is for layout only.
export default function ExhibitorWizardPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <ExhibitorCompletionWizard
      token="demo-token"
      companyName="Maya Bridge Language Services"
      tier={{ name: "Exhibitor Table", amountLabel: "$650", ticketsIncluded: 1, accent: "#0066B3", accentSoft: "#E6F0F8" }}
      benefits={[
        "One exhibitor table in the conference hall",
        "Two chairs and table-side signage",
        "One conference ticket for your representative",
        "Your logo on the conference website",
        "Recognition in the printed program",
      ]}
      hasLogo={false}
      initial={{ registreeName: "", registreeEmail: "", dietary: "", accessibility: "", wantsLogo: true }}
    />
  );
}
