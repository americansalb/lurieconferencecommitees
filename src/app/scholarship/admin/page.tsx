import { redirect } from "next/navigation";

// The review screen lives at /scholarships, next to the other admin pages, and
// the applicant form at /scholarship. Two URLs a letter apart is a trap, so the
// address somebody would reasonably guess lands on the right page instead of a
// 404.
export default function ScholarshipAdminRedirect() {
  redirect("/scholarships");
}
