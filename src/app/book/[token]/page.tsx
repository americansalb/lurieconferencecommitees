import BookingPage from "./BookingPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Book a meeting — 2026 Lurie Children's & AALB Conference",
};

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <BookingPage token={token} />;
}
