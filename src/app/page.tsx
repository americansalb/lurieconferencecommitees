import Landing from "@/components/landing/Landing";

// Re-render at most hourly: pricing (Standard -> Late on July 15) is computed
// at render time, so a fully static page would keep advertising the old rate
// after the cutoff while checkout charges the new one.
export const revalidate = 3600;

// Server-rendered public conference landing. Everyone sees the marketing
// page, including authenticated team members. Logged-in users get a
// "Dashboard" link in the nav so they can still jump back to the planning
// portal in one click.
export default function Home() {
  return <Landing />;
}
