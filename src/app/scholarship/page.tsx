import type { Metadata } from "next";
import ScholarshipFunnel from "./ScholarshipFunnel";
import { AWARD_COUNT } from "@/lib/scholarship";

export const metadata: Metadata = {
  title: "Scholarship seats · 2026 Lurie Children's & AALB Conference",
  description:
    `${AWARD_COUNT} free in-person seats at the 2026 Lurie Children's & AALB Conference, for AALB alumni and current students.`,
};

export default function ScholarshipPage() {
  return <ScholarshipFunnel />;
}
