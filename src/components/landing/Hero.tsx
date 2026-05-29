import { Calendar, MapPin, Ticket, Award, ArrowRight, Sparkles } from "lucide-react";
import { TOKENS, CONFERENCE } from "./tokens";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative pt-40 pb-32 sm:pt-48 sm:pb-32 overflow-hidden"
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
      {/* Centered warm gold halo behind the wordmark. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 30% 40%, rgba(201,161,75,0.18) 0%, rgba(201,161,75,0.05) 40%, transparent 70%)`,
        }}
      />
      {/* Tiny crisp dots on the right, the 'feels unique' detail. */}
      <div aria-hidden className="absolute inset-0">
        <Dot top="14%" left="86%" size={6} color="rgba(255,255,255,0.18)" />
        <Dot top="22%" left="92%" size={3} color="rgba(201,161,75,0.55)" />
        <Dot top="42%" left="84%" size={10} color="rgba(201,161,75,0.18)" />
        <Dot top="58%" left="91%" size={4} color="rgba(255,255,255,0.22)" />
        <Dot top="72%" left="87%" size={6} color="rgba(201,161,75,0.30)" />
        <Dot top="14%" left="8%"  size={4} color="rgba(255,255,255,0.14)" />
        <Dot top="76%" left="6%"  size={8} color="rgba(201,161,75,0.20)" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl">
          {/* Eyebrow pill */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.22em] uppercase mb-8 border"
            style={{
              color: "#F4E9CD",
              borderColor: "rgba(201,161,75,0.45)",
              background: "rgba(201,161,75,0.10)",
            }}
          >
            <Sparkles className="w-3 h-3" style={{ color: TOKENS.gold }} />
            2nd Annual Joint Conference
          </div>

          {/* Headline. Heavy modern sans, left-aligned. */}
          <h1
            className="text-white text-[44px] sm:text-[72px] md:text-[88px] leading-[1.02] tracking-tight mb-8"
            style={{ fontWeight: 900, letterSpacing: "-0.025em" }}
          >
            2026 Lurie Children&rsquo;s
            <br />
            &amp; AALB{" "}
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
            <div className="text-xl sm:text-2xl leading-tight font-semibold" style={{ color: "white" }}>
              <span className="italic" style={{ color: TOKENS.gold }}>True Language Access:</span>{" "}
              Yesterday, Today, and Tomorrow.
            </div>
          </div>

          {/* Four info cards. */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            <InfoCard
              icon={Calendar}
              label="Date & Time"
              lines={[
                "Aug 15 (9:30am, 6:00pm)",
                "Aug 16 (9:30am, 4:00pm)",
              ]}
            />
            <InfoCard
              icon={MapPin}
              label="Location"
              lines={[
                "225 E Chicago Ave",
                `Chicago, IL (${CONFERENCE.venueShort})`,
              ]}
            />
            <InfoCard
              icon={Ticket}
              label="Registration"
              lines={[
                "$195 In-Person / $95 Virtual",
              ]}
              badge={{ text: "Standard Active", icon: Sparkles }}
            />
            <InfoCard
              icon={Award}
              label="Credits"
              lines={[
                "CEU certificates",
                "for both days",
              ]}
            />
          </div>

          {/* Two gold pill CTAs. */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
  icon: Icon, label, lines, badge,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  lines: string[];
  badge?: { text: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> };
}) {
  const BadgeIcon = badge?.icon;
  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "rgba(201,161,75,0.16)",
            color: TOKENS.gold,
          }}
        >
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
          {label}
        </span>
      </div>
      <div className="text-[13px] leading-snug" style={{ color: "white" }}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      {badge && BadgeIcon && (
        <div
          className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase"
          style={{ background: "rgba(201,161,75,0.18)", color: TOKENS.gold }}
        >
          <BadgeIcon className="w-2.5 h-2.5" />
          {badge.text}
        </div>
      )}
    </div>
  );
}
