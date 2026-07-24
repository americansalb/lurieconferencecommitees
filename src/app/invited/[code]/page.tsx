import { prisma } from "@/lib/db";
import InvitedGuestForm from "./InvitedGuestForm";

// Complimentary guest RSVP, e.g. /invited/GUEST. The path's code must be a
// live full-comp guest code (percent, 100 off both modes) created on the
// Discounts page — so the team can mint separate links per circle (board,
// speakers' guests…), watch redemptions per link, cap or expire them, and
// kill a leaked link by deactivating its code. An inactive or non-guest code
// renders the graceful closed card instead of a 404.

export const dynamic = "force-dynamic";

export default async function InvitedGuestPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code || "").trim().toUpperCase();
  const guestCode = code
    ? await prisma.discountCode.findUnique({
        where: { code },
        select: { code: true, active: true, kind: true, virtualValue: true, inPersonValue: true, expiresAt: true, maxRedemptions: true, redeemedCount: true },
      })
    : null;

  const open =
    !!guestCode &&
    guestCode.active &&
    guestCode.kind === "percent" &&
    guestCode.virtualValue === 100 &&
    guestCode.inPersonValue === 100 &&
    (!guestCode.expiresAt || guestCode.expiresAt > new Date()) &&
    (guestCode.maxRedemptions == null || guestCode.redeemedCount < guestCode.maxRedemptions);

  if (!open) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, #12404E 0%, #0B2A33 55%, #071D24 100%)" }}
      >
        <div className="w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl" style={{ background: "#FDFBF6" }}>
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(to right, #E8C56F, #C9A14B, #E8C56F)" }} />
          <div className="px-8 py-12 text-center">
            <div className="text-[11px] font-bold tracking-[0.34em] uppercase" style={{ color: "#C9A14B" }}>
              2026 Lurie Children&rsquo;s &amp; AALB Conference
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight" style={{ color: "#10222A" }}>
              This invitation link isn&rsquo;t active.
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              It may have expired or reached capacity. Please reach out to the person who invited
              you, or write to <a href="mailto:contact@aalb.org" className="font-semibold" style={{ color: "#0066B3" }}>contact@aalb.org</a> and
              we&rsquo;ll take care of you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <InvitedGuestForm code={guestCode!.code} />;
}
