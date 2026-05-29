import { Check, Monitor, MapPin, ArrowRight } from "lucide-react";
import { TOKENS } from "./tokens";
import { SCHEDULE, PRICES, activeTier } from "./pricing-data";
import Countdown from "./Countdown";

const VIRTUAL_FEATURES = [
  "Live stream of both days",
  "On-demand recordings after the event",
  "Digital program and speaker materials",
  "CEU certificate of attendance",
];

const IN_PERSON_FEATURES = [
  "Both conference days at Lurie Children's, Chicago",
  "Lunch and refreshments included",
  "Printed program and conference materials",
  "CEU certificate of attendance",
  "Recordings to keep after the event",
];

export default function Pricing() {
  const now = new Date();
  const tier = activeTier(now);
  const tierLive = PRICES[tier.id];

  return (
    <section
      id="pricing"
      className="relative py-28 sm:py-36 overflow-hidden"
      style={{ background: "white" }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 100% at 50% 0%, rgba(201,161,75,0.10) 0%, transparent 70%)`,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <Eyebrow>Registration</Eyebrow>
          <h2
            className="font-serif-display mt-6 text-4xl sm:text-5xl md:text-[58px] font-bold leading-[1.05] tracking-tight"
            style={{ color: TOKENS.ink }}
          >
            Choose your{" "}
            <span className="italic font-medium" style={{ color: TOKENS.teal }}>experience.</span>
          </h2>
          <p
            className="mt-7 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: TOKENS.muted }}
          >
            Join us in person at Lurie Children&rsquo;s in Chicago, or attend live from anywhere in the world. Both options include the full program and CEU certification.
          </p>
        </div>

        {/* Countdown */}
        <div className="max-w-md mx-auto mb-8">
          <div className="text-center mb-4">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase"
              style={{ background: TOKENS.goldSoft, color: TOKENS.gold }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: TOKENS.gold, boxShadow: `0 0 6px ${TOKENS.gold}` }}
              />
              {tier.label} pricing ends in
            </span>
          </div>
          <Countdown targetIso={tier.end} accent={TOKENS.teal} />
        </div>

        {/* Savings comparison: a soft prompt sitting between the countdown
            and the cards, only shown when there is a more expensive tier
            coming. */}
        <SavingsNote tier={tier} tierLive={tierLive} />

        {/* Two pricing cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto">
          <PriceCard
            accent={TOKENS.blue}
            accentSoft={TOKENS.blueSoft}
            title="Virtual"
            tagline="Attend from anywhere"
            icon={Monitor}
            price={tierLive.virtual}
            tierLabel={tier.label}
            features={VIRTUAL_FEATURES}
          />
          <PriceCard
            featured
            accent={TOKENS.teal}
            accentSoft={TOKENS.tealSoft}
            title="In-Person"
            tagline="Join us in Chicago"
            icon={MapPin}
            price={tierLive.inPerson}
            tierLabel={tier.label}
            features={IN_PERSON_FEATURES}
          />
        </div>

        {/* Schedule */}
        <div className="mt-14 max-w-3xl mx-auto">
          <div className="text-center mb-4 text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: TOKENS.gold }}>
            Pricing schedule
          </div>
          <div
            className="rounded-2xl bg-white overflow-hidden"
            style={{
              border: `1px solid ${TOKENS.hairline}`,
              boxShadow: "0 6px 18px -10px rgba(11,31,37,0.08)",
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: TOKENS.paper, borderBottom: `1px solid ${TOKENS.hairline}` }}>
                  <th className="text-left px-5 sm:px-6 py-4 font-bold text-[10px] uppercase tracking-[0.22em]" style={{ color: TOKENS.muted }}>Window</th>
                  <th className="text-right px-5 sm:px-6 py-4 font-bold text-[10px] uppercase tracking-[0.22em]" style={{ color: TOKENS.muted }}>Virtual</th>
                  <th className="text-right px-5 sm:px-6 py-4 font-bold text-[10px] uppercase tracking-[0.22em]" style={{ color: TOKENS.muted }}>In-Person</th>
                  <th className="text-right px-5 sm:px-6 py-4 font-bold text-[10px] uppercase tracking-[0.22em]" style={{ color: TOKENS.muted }}>Through</th>
                </tr>
              </thead>
              <tbody>
                {SCHEDULE.map((s, i) => {
                  const isActive = s.id === tier.id;
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderTop: i > 0 ? `1px solid ${TOKENS.hairline}` : undefined,
                        background: isActive ? `linear-gradient(90deg, ${TOKENS.goldSoft} 0%, ${TOKENS.tealSoft} 100%)` : undefined,
                      }}
                    >
                      <td className="px-5 sm:px-6 py-4 font-semibold" style={{ color: TOKENS.ink }}>
                        {s.label}
                        {isActive && (
                          <span
                            className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white align-middle tracking-widest uppercase"
                            style={{ background: TOKENS.teal }}
                          >
                            Now
                          </span>
                        )}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-right tabular-nums font-semibold" style={{ color: TOKENS.inkSoft }}>${PRICES[s.id].virtual}</td>
                      <td className="px-5 sm:px-6 py-4 text-right tabular-nums font-semibold" style={{ color: TOKENS.inkSoft }}>${PRICES[s.id].inPerson}</td>
                      <td className="px-5 sm:px-6 py-4 text-right text-xs" style={{ color: TOKENS.muted }}>
                        {new Date(s.end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="w-8 h-px" style={{ background: TOKENS.gold }} />
      <span className="text-[10px] font-bold tracking-[0.32em] uppercase" style={{ color: TOKENS.gold }}>
        {children}
      </span>
      <span className="w-8 h-px" style={{ background: TOKENS.gold }} />
    </div>
  );
}

function PriceCard({
  title, tagline, price, tierLabel, accent, accentSoft, featured, icon: Icon, features,
}: {
  title: string;
  tagline: string;
  price: number;
  tierLabel: string;
  accent: string;
  accentSoft: string;
  featured?: boolean;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  features: string[];
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-white flex flex-col transition-all hover:-translate-y-0.5"
      style={{
        border: `${featured ? 1.5 : 1}px solid ${featured ? accent : TOKENS.hairline}`,
        boxShadow: featured
          ? `0 24px 50px -22px ${accent}66, 0 6px 18px -10px rgba(11,31,37,0.08)`
          : "0 12px 32px -16px rgba(11,31,37,0.14), 0 2px 6px -3px rgba(11,31,37,0.06)",
      }}
    >
      <div className="h-1.5" style={{ background: accent }} />
      <div className="p-8 sm:p-10 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: accentSoft, color: accent }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-serif-display text-2xl font-bold leading-none" style={{ color: TOKENS.ink }}>
                {title}
              </div>
              <div className="text-xs mt-1" style={{ color: TOKENS.muted }}>{tagline}</div>
            </div>
          </div>
          {featured && (
            <span
              className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{ background: accent, color: "white" }}
            >
              Most Chosen
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-serif-display text-6xl font-bold tracking-tight" style={{ color: TOKENS.ink }}>
            ${price}
          </span>
          <span className="text-sm" style={{ color: TOKENS.muted }}>USD</span>
        </div>
        <div className="mt-1.5 text-xs font-semibold" style={{ color: accent }}>
          {tierLabel} pricing
        </div>

        <div className="my-7 h-px" style={{ background: TOKENS.hairline }} />

        <ul className="space-y-3 text-[15px] flex-1" style={{ color: TOKENS.inkSoft }}>
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <span
                className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: accentSoft, color: accent }}
              >
                <Check className="w-3 h-3" strokeWidth={3} />
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <a
          href="/register"
          className="mt-8 w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full font-bold text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)`,
            boxShadow: `0 12px 28px -12px ${accent}80`,
          }}
        >
          Register Now <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function SavingsNote({
  tier, tierLive,
}: {
  tier: { id: string; label: string; end: string };
  tierLive: { virtual: number; inPerson: number };
}) {
  const idx = SCHEDULE.findIndex((s) => s.id === tier.id);
  if (idx < 0 || idx >= SCHEDULE.length - 1) return null;
  const next = SCHEDULE[idx + 1];
  const nextPrice = PRICES[next.id];
  const save = nextPrice.inPerson - tierLive.inPerson;
  if (save <= 0) return null;
  return (
    <p className="text-center text-sm mb-14 max-w-md mx-auto" style={{ color: TOKENS.muted }}>
      Save{" "}
      <span style={{ color: TOKENS.gold, fontWeight: 700 }}>${save}</span>{" "}
      per in-person ticket by registering before{" "}
      {new Date(tier.end).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.
    </p>
  );
}
