import Link from "next/link";
import { Calendar, MapPin, Monitor, Mail, ArrowRight, Sparkles } from "lucide-react";
import {
  E, Parchment, TicketCard, Letterhead, GoldRule, Eyebrow, Perforation, FactCell, TicketFooter, HostsLockup,
} from "./engraved";

// The post-payment confirmation, set like the engraved invitations: an
// admission ticket with a teal letterhead, gold seal, the attendee's name in
// serif, and a perforated stub with the receipt facts. Purely presentational —
// both success pages (public /register and invited /attend) feed it, and the
// dev preview screenshots it with mock data.
export default function RegistrationTicket({
  firstName, lastName, email, attendanceMode, finalPriceCents, portalHref,
}: {
  firstName: string;
  lastName?: string | null;
  email: string;
  attendanceMode: string | null;
  finalPriceCents: number | null;
  portalHref: string;
}) {
  const isVirtual = attendanceMode === "virtual";
  const fullName = [firstName, lastName || ""].join(" ").trim() || "Guest";
  const paidLabel =
    finalPriceCents == null ? null
    : finalPriceCents === 0 ? "Complimentary"
    : `$${(finalPriceCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <Parchment>
      <TicketCard>
        <Letterhead kicker="Registration Confirmed" />
        <GoldRule />

        <div className="px-7 sm:px-9 pt-7 pb-6 text-center">
          <Eyebrow>Admit One</Eyebrow>
          <div className="mt-2" style={{ fontFamily: E.serif, fontSize: 30, lineHeight: 1.2, color: E.ink }}>
            {fullName}
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed max-w-md mx-auto" style={{ color: E.soft }}>
            You&rsquo;re in. Your seat at the 2026 Lurie Children&rsquo;s &amp; AALB Conference is
            confirmed, and a receipt is on its way to <strong style={{ color: E.ink }}>{email}</strong>.
          </p>
        </div>

        <Perforation />

        <div className="px-7 sm:px-9 pt-6 pb-7">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <FactCell
              label="Dates"
              value={<span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" style={{ color: E.goldDark }} />Aug 15 &amp; 16</span>}
              sub="Saturday & Sunday, 2026"
            />
            <FactCell
              label="Attendance"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {isVirtual ? <Monitor className="w-3.5 h-3.5" style={{ color: E.goldDark }} /> : <MapPin className="w-3.5 h-3.5" style={{ color: E.goldDark }} />}
                  {isVirtual ? "Virtual" : "In-Person"}
                </span>
              }
              sub={isVirtual ? "Live stream, both days" : "Lurie Children's, Chicago"}
            />
            {paidLabel && <FactCell label="Paid" value={paidLabel} sub="Receipt by email" />}
          </div>

          <div className="mt-6 text-center">
            <Link
              href={portalHref}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-transform hover:scale-[1.02]"
              style={{ background: E.teal, boxShadow: "0 10px 24px -10px rgba(14,85,102,0.55)" }}
            >
              Open your attendee portal <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="mt-3 text-[11.5px] inline-flex items-center gap-1.5" style={{ color: E.soft }}>
              <Sparkles className="w-3 h-3" style={{ color: E.gold }} />
              Your join details, calendar file, and agenda all live there — bookmark it.
            </div>
          </div>

          <div className="mt-6 pt-5 text-center text-[11px]" style={{ borderTop: "1px solid #ECE3D0", color: E.soft }}>
            <Mail className="w-3 h-3 inline mr-1 -mt-0.5" />
            Refundable through July 15. Need a change? Email{" "}
            <a className="font-semibold" style={{ color: E.teal }} href="mailto:contact@aalb.org">contact@aalb.org</a>.
          </div>
        </div>

        <TicketFooter />
      </TicketCard>

      <HostsLockup />
      <div className="mt-4 text-center">
        <Link href="/" className="text-[11.5px] font-semibold hover:underline" style={{ color: "#8a744a" }}>
          &larr; Back to the conference site
        </Link>
      </div>
    </Parchment>
  );
}

// The honest waiting state for visitors whose payment isn't recorded yet
// (declined card, Stripe hiccup, or landing here early). Same visual family.
export function PendingTicket({ firstName, portalHref, portalLabel }: { firstName?: string | null; portalHref: string; portalLabel: string }) {
  return (
    <Parchment>
      <TicketCard>
        <Letterhead kicker="One Step Remaining" />
        <GoldRule />
        <div className="px-7 sm:px-9 py-8 text-center">
          <Eyebrow>Almost there{firstName ? `, ${firstName}` : ""}</Eyebrow>
          <div className="mt-2" style={{ fontFamily: E.serif, fontSize: 24, lineHeight: 1.3, color: E.ink }}>
            We haven&rsquo;t confirmed your payment yet.
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed max-w-md mx-auto" style={{ color: E.soft }}>
            If you just paid, refresh this page in a moment. If this message keeps showing, the
            payment may not have gone through — you can complete it from your registration page,
            or email <a className="font-semibold" style={{ color: E.teal }} href="mailto:contact@aalb.org">contact@aalb.org</a> and
            we&rsquo;ll sort it out.
          </p>
          <div className="mt-6">
            <Link
              href={portalHref}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white"
              style={{ background: E.teal, boxShadow: "0 10px 24px -10px rgba(14,85,102,0.55)" }}
            >
              {portalLabel} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <TicketFooter />
      </TicketCard>
      <HostsLockup />
    </Parchment>
  );
}
