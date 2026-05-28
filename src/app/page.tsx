import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Landing from "@/components/landing/Landing";

// Server-rendered public conference landing. Authenticated team members
// are bounced to the planning dashboard before any HTML is emitted, so
// search engines and unauthenticated visitors always get the marketing page.
export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");
  return <Landing />;
}
