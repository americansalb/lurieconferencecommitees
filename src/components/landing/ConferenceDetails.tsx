import { Calendar, Globe, Ticket, Award, ArrowRight } from "lucide-react";
import { TOKENS } from "./tokens";
import { activeTier, PRICES } from "./pricing-data";

// The when/format/tickets/CEUs cards, moved out of the Hero so the page opens
// lean (headline → speakers) and the logistics land after the lineup has done
// the selling. Same glassy card treatment, on the same deep teal.
export default function ConferenceDetails() {
  const tier = activeTier(new Date());
  const live = PRICES[tier.id];

  return (
    <section
      id="details"
      className="relative py-16 sm:py-20 overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${TOKENS.teal} 0%, ${TOKENS.tealDark} 100%)` }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 70% 80% at 50% 0%, rgba(201,161,75,0.14) 0%, transparent 65%)` }}
      />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          <InfoCard
            icon={Calendar}
            label="When"
            primary="August 15 and 16"
            secondary={<>Aug 15: 9:30 a.m.&ndash;6:30 p.m.<br />Aug 16: 9:00 a.m.&ndash;4:00 p.m. CDT</>}
          />
          <InfoCard
            icon={Globe}
            label="Format"
            primary="Hybrid Conference"
            secondary="In-Person and Virtual"
            accent
          />
          <InfoCard
            icon={Ticket}
            label="Tickets"
            primary={`$${live.inPerson} / $${live.virtual}`}
            secondary="In-person / Virtual"
          />
          <InfoCard
            icon={Award}
            label="Accreditation"
            primary="10+ hours of CEUs"
            secondary="NBCMI &amp; CCHI CEUs"
          />
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-[15px] transition-all"
            style={{
              background: `linear-gradient(135deg, #E8C56F 0%, ${TOKENS.gold} 100%)`,
              color: "#3C2E10",
              boxShadow: "0 14px 34px -12px rgba(201,161,75,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset",
            }}
          >
            Register Now <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  icon: Icon, label, primary, secondary, accent,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  primary: string;
  secondary: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col text-left overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{
        background: accent
          ? "linear-gradient(160deg, rgba(201,161,75,0.18) 0%, rgba(201,161,75,0.06) 100%)"
          : "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 100%)",
        border: accent
          ? "1px solid rgba(201,161,75,0.50)"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: accent
          ? "0 16px 40px -16px rgba(201,161,75,0.45), inset 0 1px 0 rgba(255,255,255,0.10)"
          : "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div
        aria-hidden
        className="absolute -top-12 -left-12 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: accent
            ? "radial-gradient(circle, rgba(201,161,75,0.25) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
        }}
      />
      <div className="relative flex items-center justify-between mb-5">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: accent ? "rgba(201,161,75,0.25)" : "rgba(255,255,255,0.10)",
            color: TOKENS.gold,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
          }}
        >
          <Icon className="w-5 h-5" />
        </span>
        <span
          className="text-[9px] font-bold tracking-[0.28em] uppercase"
          style={{ color: accent ? "rgba(244,233,205,0.85)" : "rgba(255,255,255,0.45)" }}
        >
          {label}
        </span>
      </div>
      <div
        className="relative text-[26px] sm:text-[28px] font-bold leading-[1.05] mb-2 tracking-tight"
        style={{
          color: "white",
          textShadow: accent ? "0 0 24px rgba(201,161,75,0.30)" : undefined,
        }}
      >
        {primary}
      </div>
      <div className="relative text-[13px] leading-snug" style={{ color: "rgba(255,255,255,0.68)" }}>
        {secondary}
      </div>
    </div>
  );
}
