import Link from "next/link";
import type { Metadata } from "next";
import { TOKENS } from "@/components/landing/tokens";

export const metadata: Metadata = {
  title: "Refund Policy · 2026 Lurie Children's & AALB Conference",
  description:
    "Conference registrations are non-refundable. In-person registrations can be converted to virtual attendance at no additional cost.",
};

// Linked from both checkout flows, so someone can read the terms before paying
// rather than discovering them afterwards.
export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen" style={{ background: TOKENS.paper }}>
      <div className="max-w-2xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <Link href="/" className="text-[12px] font-bold tracking-[0.22em] uppercase" style={{ color: TOKENS.gold }}>
          &larr; 2026 Lurie Children&rsquo;s &amp; AALB Conference
        </Link>

        <h1
          className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{ color: TOKENS.ink }}
        >
          Refund policy
        </h1>

        <div className="mt-8 rounded-2xl bg-white px-6 sm:px-8 py-7 sm:py-8" style={{ border: `1px solid ${TOKENS.hairline}` }}>
          <p className="text-[15.5px] leading-relaxed" style={{ color: TOKENS.inkSoft }}>
            All conference registrations are non-refundable. However, if you registered for in-person
            attendance and are no longer able to attend in person, we would be happy to convert your
            registration to virtual attendance at no additional cost. Please note that no refund or credit
            will be issued for the difference in registration fees.
          </p>
          <p className="mt-5 text-[15.5px] leading-relaxed" style={{ color: TOKENS.inkSoft }}>
            If you are unable to attend either in person or virtually, you will still have access to the
            available conference recordings after the event. However, CEUs are only available to attendees
            who participate live, either in person or virtually, and therefore cannot be claimed by viewing
            the recordings afterward.
          </p>
        </div>

        <p className="mt-7 text-[14px] leading-relaxed" style={{ color: TOKENS.muted }}>
          Need to switch to virtual attendance, or have a question about your registration? Email{" "}
          <a href="mailto:contact@aalb.org" className="font-semibold" style={{ color: TOKENS.teal }}>
            contact@aalb.org
          </a>{" "}
          and we will take care of it.
        </p>
      </div>
    </main>
  );
}
