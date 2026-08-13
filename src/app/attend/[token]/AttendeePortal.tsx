import Link from "next/link";
import { Calendar, MapPin, Monitor, Video, CalendarPlus, ListChecks, Mail, Train, Ticket, FileDown } from "lucide-react";
import {
  E, Parchment, TicketCard, GoldRule, Eyebrow, Perforation, FactCell, TicketFooter, HostsLockup, Seal,
} from "@/components/attend/engraved";
import { zoomDaysFor } from "@/lib/virtual-event";
import LocalTimeHint from "./LocalTimeHint";
import PortalDetailsForm from "./PortalDetailsForm";

// The returning home for a paid attendee, set in the same engraved gold-foil
// language as the invitation letters and the confirmation ticket: their
// admission stub up top, then joining details, calendar, and agenda.
// Presentational so it can be rendered server-side or screenshotted with
// mock data (see /dev/portal-preview).
export default function AttendeePortal({
  token, firstName, email, attendanceMode, attendDay, finalPriceCents, agendaUrl, details,
}: {
  token: string;
  firstName: string;
  email: string;
  attendanceMode: string | null;
  /** One-day virtual tickets: "sat" | "sun". Null = both days. */
  attendDay?: string | null;
  finalPriceCents: number | null;
  agendaUrl: string;
  // Post-payment logistics (parking, dietary, accessibility, …), collected
  // here instead of before the pay button. Optional so preview harnesses can
  // omit it.
  details?: {
    phone: string;
    affiliation: string;
    primaryLanguages: string;
    needsParking: boolean | null;
    accessibilityNotes: string;
    dietary: string;
  };
}) {
  const isVirtual = attendanceMode === "virtual";
  const zoomDays = zoomDaysFor(attendDay);
  const virtualDaysLabel =
    zoomDays.length === 2 ? "both days" : `${zoomDays[0].shortLabel} only`;
  const paidLabel =
    finalPriceCents == null ? null
    : finalPriceCents === 0 ? "Complimentary"
    : `$${(finalPriceCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <Parchment>
      <TicketCard>
        {/* Compact letterhead: the portal is a returning page, so the head is
            shorter than the confirmation ticket's but keeps the seal. */}
        <div
          className="px-7 sm:px-9 py-6 flex items-center gap-5"
          style={{ background: `linear-gradient(160deg, ${E.teal} 0%, ${E.tealDeep} 100%)` }}
        >
          <div className="shrink-0"><Seal size={72} /></div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase" style={{ letterSpacing: "0.3em", color: E.goldSoft }}>
              Lurie Children&rsquo;s &middot; AALB
            </div>
            <div className="mt-1" style={{ fontFamily: E.serif, fontSize: 21, lineHeight: 1.25, color: "#fff" }}>
              Your Attendee Portal
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: "#7FA7B1" }}>
              August 15&ndash;16, 2026 &middot; Chicago
            </div>
          </div>
        </div>
        <GoldRule />

        <div className="px-7 sm:px-9 pt-6 pb-5">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div>
              <Eyebrow>Admitted</Eyebrow>
              <div className="mt-1.5" style={{ fontFamily: E.serif, fontSize: 26, lineHeight: 1.2, color: E.ink }}>
                You&rsquo;re going, {firstName}.
              </div>
            </div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "#16a34a14", color: "#15803d", border: "1px solid #16a34a33" }}
            >
              <Ticket className="w-3 h-3" /> Confirmed
            </div>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: E.soft }}>
            This page is your ticket home for the conference, so bookmark it. Everything below
            stays current as the event approaches.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <FactCell
              label="Dates"
              value={<span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" style={{ color: E.goldDark }} />Aug 15 &amp; 16</span>}
              sub="Sat 9:30–6:30 · Sun 9:00–4:00"
            />
            <FactCell
              label="Attendance"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {isVirtual ? <Monitor className="w-3.5 h-3.5" style={{ color: E.goldDark }} /> : <MapPin className="w-3.5 h-3.5" style={{ color: E.goldDark }} />}
                  {isVirtual ? "Virtual" : "In-Person"}
                </span>
              }
              sub={isVirtual ? `Live stream, ${virtualDaysLabel}` : "Streeterville, Chicago"}
            />
            {paidLabel && <FactCell label="Paid" value={paidLabel} sub="Receipt in your inbox" />}
          </div>
        </div>

        <Perforation />

        <div className="px-7 sm:px-9 pt-6 pb-7">
          {isVirtual ? (
            <section>
              <Eyebrow>Joining live on Zoom</Eyebrow>
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: E.soft }}>
                {zoomDays.length === 2
                  ? "One room per day, and this page always has the links."
                  : `Your ticket covers ${zoomDays[0].label}, and this page always has the link.`}{" "}
                All times are US Central Time (Chicago). Please be signed in 15 minutes before the
                first session; early sign-in keeps the register clear for CEU tracking.
              </p>
              {zoomDays.map((d) => (
                <div
                  key={d.key}
                  className="mt-3 rounded-xl px-4 py-4"
                  style={{ background: E.cream, border: "1.5px solid " + E.gold }}
                >
                  <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.2em", color: "#8a744a" }}>
                    Day {d.dayNumber} &middot; {d.label}
                  </div>
                  <p className="mt-1.5 text-[12.5px]" style={{ color: E.soft }}>
                    Zoom opens at <strong style={{ color: E.ink }}>{d.opensCT} CT</strong> &middot;
                    be signed in by <strong style={{ color: E.ink }}>{d.signInByCT} CT</strong>
                  </p>
                  <LocalTimeHint
                    opensMs={d.opensMs}
                    signInByMs={d.signInByMs}
                    className="mt-1 text-[11.5px] font-bold"
                    style={{ color: E.teal }}
                  />
                  <a
                    href={`/z/${token}/${d.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: E.teal, boxShadow: "0 10px 24px -10px rgba(14,85,102,0.55)" }}
                  >
                    <Video className="w-4 h-4" /> Join {d.shortLabel} on Zoom
                  </a>
                  <p className="mt-2 text-[11.5px]" style={{ color: "#8a744a" }}>
                    Meeting ID: {d.meetingId}
                  </p>
                </div>
              ))}
            </section>
          ) : (
            <section>
              <Eyebrow>The venue</Eyebrow>
              <div className="mt-2.5 rounded-xl overflow-hidden" style={{ border: "1px solid #EAD9AE" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/conference/venue.jpg" alt="Ann & Robert H. Lurie Children's Hospital of Chicago" className="w-full h-36 object-cover" />
                <div className="px-4 py-3" style={{ background: "#FBF4E2" }}>
                  <div className="text-[14px] font-bold" style={{ color: "#3C2E10", fontFamily: E.serif }}>
                    Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: "#8a744a" }}>
                    225 E Chicago Ave, Chicago, IL 60611
                  </div>
                  <div className="mt-1.5 text-[11.5px] inline-flex items-center gap-1.5" style={{ color: "#8a744a" }}>
                    <Train className="w-3 h-3" /> Short walk from the CTA Red Line &middot; parking garages within two blocks
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={`/attend/${token}/event.ics`}
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors hover:brightness-[0.98]"
              style={{ background: E.cream, border: "1.5px solid " + E.gold }}
            >
              <CalendarPlus className="w-5 h-5 shrink-0" style={{ color: E.goldDark }} />
              <div>
                <div className="text-[13.5px] font-bold" style={{ color: E.ink }}>Add to calendar</div>
                <div className="text-[11px]" style={{ color: E.soft }}>Both days, .ics file</div>
              </div>
            </a>
            <Link
              href={agendaUrl}
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors hover:brightness-[0.98]"
              style={{ background: E.cream, border: "1.5px solid " + E.gold }}
            >
              <ListChecks className="w-5 h-5 shrink-0" style={{ color: E.goldDark }} />
              <div>
                <div className="text-[13.5px] font-bold" style={{ color: E.ink }}>See the agenda</div>
                <div className="text-[11px]" style={{ color: E.soft }}>Sessions &amp; speakers</div>
              </div>
            </Link>
          </div>

          {/* In-person only. The guide is about getting to the hospital and
              checking in, so it is neither useful nor published for people
              joining online. */}
          {!isVirtual && (
            <a
              href="/guides/attendee-guide.pdf"
              className="mt-2.5 flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors hover:brightness-[0.98]"
              style={{ background: E.cream, border: "1.5px solid " + E.gold }}
            >
              <FileDown className="w-5 h-5 shrink-0" style={{ color: E.goldDark }} />
              <div>
                <div className="text-[13.5px] font-bold" style={{ color: E.ink }}>Your conference guide</div>
                <div className="text-[11px]" style={{ color: E.soft }}>
                  PDF. Getting here, check-in, what to bring, meals, and claiming your CEUs.
                </div>
              </div>
            </a>
          )}

          {details && (
            <PortalDetailsForm token={token} attendanceMode={attendanceMode} initial={details} />
          )}

          <div className="mt-6 pt-5 text-[11px]" style={{ borderTop: "1px solid #ECE3D0", color: E.soft }}>
            <Mail className="w-3 h-3 inline mr-1 -mt-0.5" />
            Need to change anything? Email{" "}
            <a className="font-semibold" style={{ color: E.teal }} href="mailto:contact@aalb.org">contact@aalb.org</a>.{" "}
            <a className="font-semibold" style={{ color: E.teal }} href="/refund-policy">Refund policy</a>.
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
