import type { Metadata } from "next";
import InterpreterFlow from "./InterpreterFlow";

// The standalone ASL interpreter invitation for August 15 and 16. Shared by
// link with prospective interpreters; not part of site navigation and kept
// out of search results.

export const metadata: Metadata = {
  title: "ASL Interpreter Invitation",
  description:
    "Accept the invitation to interpret the 2026 Lurie Children's and AALB Conference, August 15 and 16.",
  robots: { index: false, follow: false },
};

export default function AslInvitePage() {
  return <InterpreterFlow />;
}
