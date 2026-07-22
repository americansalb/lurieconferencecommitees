import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
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
          2nd Joint Conference
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
          <div className="text-xl sm:text-2xl leading-snug max-w-2xl mx-auto">
            <span className="italic" style={{ color: TOKENS.gold }}>True Language Access:</span>{" "}
            <span style={{ color: "white" }}>
              Yesterday, Today, and Tomorrow.
            </span>
          </div>
        </div>

        {/* One-line key facts. The full when/format/tickets/CEUs cards live in
            ConferenceDetails, below the speakers, so the lineup leads. */}
        <div
          className="mb-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[15px] sm:text-base font-semibold"
          style={{ color: "rgba(255,255,255,0.88)" }}
        >
          <span>August 15&ndash;16, 2026</span>
          <span aria-hidden style={{ color: TOKENS.gold }}>&middot;</span>
          <span>Chicago + Virtual</span>
          <span aria-hidden style={{ color: TOKENS.gold }}>&middot;</span>
          <span>${live.inPerson} / ${live.virtual}</span>
          <span aria-hidden style={{ color: TOKENS.gold }}>&middot;</span>
          <span>10+ CEU hours</span>
        </div>

        {/* Registration leads; the agenda rides shotgun. */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
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
          <a
            href="#program"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-[15px] transition-colors"
            style={{
              border: "1.5px solid rgba(255,255,255,0.55)",
              color: "#FFFFFF",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <CalendarDays className="w-4 h-4" /> View Agenda
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
