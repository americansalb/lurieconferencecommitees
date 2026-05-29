import { Calendar, MapPin, Ticket, Award, ArrowRight, Sparkles } from "lucide-react";
import { TOKENS, CONFERENCE } from "./tokens";
import { activeTier, PRICES, SCHEDULE } from "./pricing-data";
import Countdown from "./Countdown";

export default function Hero() {
  const tier = activeTier(new Date());
  const live = PRICES[tier.id];
  // Find the next tier for the comparison line.
  const idx = SCHEDULE.findIndex((s) => s.id === tier.id);
  const next = idx >= 0 && idx < SCHEDULE.length - 1 ? SCHEDULE[idx + 1] : null;
  const nextLive = next ? PRICES[next.id] : null;

  return (
    <section
      id="top"
      className="relative pt-24 pb-28 sm:pt-32 sm:pb-32 overflow-hidden"
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
          background: `radial-gradient(ellipse 70% 60% at 30% 40%, rgba(201,161,75,0.18) 0%, rgba(201,161,75,0.05) 40%, transparent 70%)`,
        }}
      />
      {/* Crisp dot details. */}
      <div aria-hidden className="absolute inset-0">
        <Dot top="14%" left="58%" size={6} color="rgba(255,255,255,0.18)" />
        <Dot top="22%" left="92%" size={3} color="rgba(201,161,75,0.55)" />
        <Dot top="42%" left="54%" size={10} color="rgba(201,161,75,0.18)" />
        <Dot top="58%" left="95%" size={4} color="rgba(255,255,255,0.22)" />
        <Dot top="72%" left="56%" size={6} color="rgba(201,161,75,0.30)" />
        <Dot top="14%" left="8%"  size={4} color="rgba(255,255,255,0.14)" />
        <Dot top="76%" left="6%"  size={8} color="rgba(201,161,75,0.20)" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-10 lg:gap-14 items-start">
          {/* LEFT: copy + info cards + CTAs */}
          <div>
            {/* Eyebrow pill */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.22em] uppercase mb-7 border"
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
              className="text-white text-[40px] sm:text-[56px] md:text-[68px] leading-[1.02] tracking-tight mb-8"
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

            {/* Inline 2026 theme. */}
            <div className="mb-9">
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
              <div className="font-serif-display text-xl sm:text-2xl leading-snug">
                <span className="italic" style={{ color: TOKENS.gold }}>True Language Access:</span>{" "}
                <span style={{ color: "white" }}>
                  Yesterday, Today, and Tomorrow.
                </span>
              </div>
            </div>

            {/* Info cards: 2x2 grid in this column. */}
            <div className="grid grid-cols-2 gap-3 mb-9">
              <InfoCard
                icon={Calendar}
                label="Date & Time"
                primary="August 15 + 16"
                secondary="9:30am, 6:00pm CDT"
              />
              <InfoCard
                icon={MapPin}
                label="Location"
                primary={CONFERENCE.venueShort}
                secondary="225 E Chicago Ave"
              />
              <InfoCard
                icon={Ticket}
                label="Registration"
                primary={`$${live.inPerson} / $${live.virtual}`}
                secondary="In-Person / Virtual"
                badge={`${tier.label} Active`}
                accent
              />
              <InfoCard
                icon={Award}
                label="Credits"
                primary="CEU"
                secondary="for both days"
              />
            </div>

            {/* Two gold pill CTAs. */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href="/proposal"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-[15px] transition-all"
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-[15px] transition-all"
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

          {/* RIGHT: countdown card with joint hands at the top */}
          <RightPanel
            tier={tier}
            live={live}
            next={next}
            nextLive={nextLive}
          />
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

function RightPanel({
  tier, live, next, nextLive,
}: {
  tier: { id: string; label: string; end: string };
  live: { virtual: number; inPerson: number };
  next: { id: string; label: string; end: string } | null;
  nextLive: { virtual: number; inPerson: number } | null;
}) {
  return (
    <aside
      className="relative rounded-2xl p-6 sm:p-7"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(201,161,75,0.30)",
        boxShadow:
          "0 24px 60px -28px rgba(0,0,0,0.45), 0 0 0 1px rgba(201,161,75,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Joint hand marks centered at the top of the panel, on a small
          white pill so the brand circles read cleanly against the
          dark teal hero. */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0" style={{ boxShadow: "0 6px 16px -6px rgba(0,0,0,0.25)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/lurie-icon.png" alt="Lurie Children's" className="h-10 w-10" />
        </span>
        <span className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0" style={{ boxShadow: "0 6px 16px -6px rgba(0,0,0,0.25)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/aalb-icon.png" alt="AALB" className="h-10 w-10" />
        </span>
      </div>

      {/* Heading */}
      <div className="text-center mb-5">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-[0.25em] uppercase mb-3"
          style={{ background: "rgba(201,161,75,0.18)", color: TOKENS.gold }}
        >
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: TOKENS.gold, boxShadow: `0 0 8px ${TOKENS.gold}` }}
          />
          {tier.label} pricing ends in
        </div>
        <Countdown targetIso={tier.end} accent={TOKENS.gold} />
      </div>

      {/* Pricing comparison */}
      <div className="rounded-xl p-4 mt-2" style={{ background: "rgba(0,0,0,0.20)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
            Now
          </span>
          <span className="font-serif-display text-xl font-bold tabular-nums" style={{ color: "white" }}>
            ${live.inPerson} <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>/ ${live.virtual}</span>
          </span>
        </div>
        {next && nextLive && (
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "rgba(255,255,255,0.40)" }}>
              After {new Date(tier.end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span className="text-sm font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.55)" }}>
              ${nextLive.inPerson} / ${nextLive.virtual}
            </span>
          </div>
        )}
      </div>

      {next && nextLive && (
        <p className="mt-3 text-center text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.62)" }}>
          Save{" "}
          <span style={{ color: TOKENS.gold, fontWeight: 700 }}>
            ${nextLive.inPerson - live.inPerson}
          </span>{" "}
          per in-person ticket by locking in {tier.label} now.
        </p>
      )}

      <a
        href="/register"
        className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold text-[14px] transition-all"
        style={{
          background: `linear-gradient(135deg, #E8C56F 0%, ${TOKENS.gold} 100%)`,
          color: "#3C2E10",
          boxShadow: "0 10px 26px -10px rgba(201,161,75,0.50)",
        }}
      >
        Lock in {tier.label} <ArrowRight className="w-4 h-4" />
      </a>
    </aside>
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
      className="rounded-2xl px-4 py-4 flex flex-col"
      style={{
        background: accent ? "rgba(201,161,75,0.10)" : "rgba(255,255,255,0.05)",
        border: accent
          ? "1px solid rgba(201,161,75,0.35)"
          : "1px solid rgba(255,255,255,0.10)",
        boxShadow: accent ? "0 8px 24px -12px rgba(201,161,75,0.40)" : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{
            background: "rgba(201,161,75,0.18)",
            color: TOKENS.gold,
          }}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
          {label}
        </span>
      </div>
      <div className="text-[18px] font-extrabold leading-none mb-1" style={{ color: "white" }}>
        {primary}
      </div>
      <div className="text-[12px] leading-snug" style={{ color: "rgba(255,255,255,0.62)" }}>
        {secondary}
      </div>
      {badge && (
        <div
          className="inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase self-start"
          style={{ background: "rgba(201,161,75,0.22)", color: TOKENS.gold }}
        >
          <Sparkles className="w-2.5 h-2.5" />
          {badge}
        </div>
      )}
    </div>
  );
}
