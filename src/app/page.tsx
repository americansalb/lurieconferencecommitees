import Landing from "@/components/landing/Landing";

// Server-rendered public conference landing. Everyone sees the marketing
// page, including authenticated team members. Logged-in users get a
// "Dashboard" link in the nav so they can still jump back to the planning
// portal in one click.
export default function Home() {
  return <Landing />;
}
