import { Calendar, Globe, Ticket, Award, ArrowRight, Sparkles } from "lucide-react";
import { TOKENS } from "./tokens";
import { activeTier, PRICES } from "./pricing-data";

export default function Hero() {
  const tier = activeTier(new Date());
  const live = PRICES[tier.id];

  return (
    <section
      id="top"
      className="relative pt-28 pb-32 sm:pt-36 sm:pb-36 overflow-hidden"
      style={{ background: TOKENS.tealDark }}
    >
      {/* Base vertical gradient. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${TOKENS.teal} 0%, ${TOKENS.tealDark} 60%, ${TOKENS.tealDeep} 100%)`,
        }}
      />
      {/* Centered warm gold halo. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 35%, rgba(201,161,75,0.20) 0%, rgba(201,161,75,0.05) 40%, transparent 70%)`,
        }}
      />
      {/* Crisp dot details. */}
      <div aria-hidden className="absolute inset-0">
        <Dot top="14%" left="86%" size={6} color="rgba(255,255,255,0.18)" />
        <Dot top="22%" left="92%" size={3} color="rgba(201,161,75,0.55)" />
        <Dot top="58%" left="91%" size={4} color="rgba(255,255,255,0.22)" />
        <Dot top="72%" left="87%" size={6} color="rgba(201,161,75,0.30)" />
        <Dot top="14%" left="8%"  size={4} color="rgba(255,255,255,0.14)" />
        <Dot top="42%" left="6%"  size={10} color="rgba(201,161,75,0.18)" />
        <Dot top="76%" left="6%"  size={8} color="rgba(201,161,75,0.20)" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow pill */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.22em] uppercase mb-9 border"
          style={{
            color: "#F4E9CD",
            borderColor: "rgba(201,161,75,0.45)",
            background: "rgba(201,161,75,0.10)",
          }}
        >
          <Sparkles className="w-3 h-3" style={{ color: TOKENS.gold }} />
          2nd Annual Joint Conference
        </div>

        {/* Headline. */}
        <h1
          className="text-white text-[44px] sm:text-[68px] md:text-[84px] leading-[1.01] tracking-tight mb-8 max-w-4xl mx-auto"
          style={{ fontWeight: 900, letterSpacing: "-0.025em" }}
        >
          2026 Lurie Children&rsquo;s &amp; AALB{" "}
          <span
            style={{
              color: TOKENS.gold,
              textShadow: "0 0 36px rgba(201,161,75,0.45), 0 0 8px rgba(201,161,75,0.30)",
            }}
          >
            Conference
          </span>
        </h1>

        {/* Theme */}
        <div className="mb-12">
          <span
            className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.22em] uppercase mb-3"
            style={{
              color: TOKENS.gold,
              border: `1px solid rgba(201,161,75,0.45)`,
              background: "rgba(201,161,75,0.06)",
            }}
          >
            2026 Theme
          </span>
          <div className="font-serif-display text-xl sm:text-2xl leading-snug max-w-2xl mx-auto">
            <span className="italic" style={{ color: TOKENS.gold }}>True Language Access:</span>{" "}
            <span style={{ color: "white" }}>
              Yesterday, Today, and Tomorrow.
            </span>
          </div>
        </div>

        {/* Info cards: single row at desktop, 2x2 mobile. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12 max-w-4xl mx-auto">
          <InfoCard
            icon={Calendar}
            label="When"
            primary="Aug 15 and 16"
            secondary="9:30am to 6:00pm CDT, both days"
          />
          <InfoCard
            icon={Globe}
            label="Format"
            primary="In-Person and Live Virtual"
            secondary="Attend from Chicago or anywhere"
          />
          <InfoCard
            icon={Ticket}
            label="Tickets"
            primary={`$${live.inPerson} / $${live.virtual}`}
            secondary="In-person / Virtual"
            badge={`${tier.label} pricing`}
            accent
          />
          <InfoCard
            icon={Award}
            label="Accreditation"
            primary="10+ hours of CEUs"
            secondary="Certificate for both days"
          />
        </div>

        {/* Two gold pill CTAs. */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <a
            href="/proposal"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-[15px] transition-all"
            style={{
              background: `linear-gradient(135deg, #E8C56F 0%, ${TOKENS.gold} 100%)`,
              color: "#3C2E10",
              boxShadow: "0 14px 34px -12px rgba(201,161,75,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset",
            }}
          >
            Submit a Proposal <ArrowRight className="w-4 h-4" />
          </a>
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

      {/* Hairline gold seam to the next section. */}
      <div
        aria-hidden
        className="absolute bottom-0 inset-x-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${TOKENS.gold}55 50%, transparent 100%)`,
        }}
      />
    </section>
  );
}

function Dot({ top, left, size, color }: { top: string; left: string; size: number; color: string }) {
  return (
    <span
      className="absolute rounded-full"
      style={{
        top, left,
        width: size, height: size,
        background: color,
        boxShadow: color.includes("201,161,75") ? `0 0 ${size * 2}px ${color}` : undefined,
      }}
    />
  );
}

function InfoCard({
  icon: Icon, label, primary, secondary, badge, accent,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  primary: string;
  secondary: string;
  badge?: string;
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
      {/* Subtle radial highlight in the top-left corner of each card. */}
      <div
        aria-hidden
        className="absolute -top-12 -left-12 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: accent
            ? "radial-gradient(circle, rgba(201,161,75,0.25) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Label row with bigger icon tile */}
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

      {/* Big primary value */}
      <div
        className="relative font-serif-display text-[26px] sm:text-[28px] font-bold leading-[1.05] mb-2 tracking-tight"
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

      {badge && (
        <div
          className="relative inline-flex items-center gap-1.5 mt-4 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-[0.18em] uppercase self-start"
          style={{
            background: "rgba(201,161,75,0.30)",
            color: "#FBEFCE",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 12px rgba(201,161,75,0.20)",
          }}
        >
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: TOKENS.gold, boxShadow: `0 0 6px ${TOKENS.gold}` }}
          />
          {badge}
        </div>
      )}
    </div>
  );
}
