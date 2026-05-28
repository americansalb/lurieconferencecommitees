import { Check, Monitor, MapPin, ArrowRight } from "lucide-react";
import { TOKENS } from "./tokens";
import Countdown from "./Countdown";

// Pricing schedule mirrors the Webflow page. Each tier ends at 23:59:59
// Central Time on its date.
const SCHEDULE = [
  { id: "early",    label: "Early Bird", end: "2026-04-15T23:59:59-05:00" },
  { id: "standard", label: "Standard",   end: "2026-06-15T23:59:59-05:00" },
  { id: "late",     label: "Late",       end: "2026-08-15T23:59:59-05:00" },
] as const;

const PRICES: Record<typeof SCHEDULE[number]["id"], { virtual: number; inPerson: number }> = {
  early:    { virtual:  95, inPerson: 195 },
  standard: { virtual: 105, inPerson: 210 },
  late:     { virtual: 115, inPerson: 225 },
};

function activeTier(now: Date) {
  for (const t of SCHEDULE) {
    if (now.getTime() <= new Date(t.end).getTime()) return t;
  }
  return SCHEDULE[SCHEDULE.length - 1];
}

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
    <section id="pricing" className="py-28 sm:py-36 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: TOKENS.gold }}>
              Registration
            </span>
            <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
          </div>
          <h2
            className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight"
            style={{ color: TOKENS.ink }}
          >
            Choose your experience.
          </h2>
          <p
            className="mt-7 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: TOKENS.muted }}
          >
            Join us in person at Lurie Children&rsquo;s in Chicago, or attend live from anywhere in the world. Both options include the full program and CEU certification.
          </p>
        </div>

        {/* Countdown */}
        <div className="max-w-md mx-auto mb-14">
          <div className="text-center mb-5">
            <div className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: TOKENS.teal }}>
              {tier.label} pricing ends in
            </div>
          </div>
          <Countdown targetIso={tier.end} accent={TOKENS.teal} />
        </div>

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
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="text-center mb-4 text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: TOKENS.teal }}>
            Pricing schedule
          </div>
          <div className="rounded-2xl border overflow-hidden bg-white" style={{ borderColor: TOKENS.hairline }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${TOKENS.hairline}` }}>
                  <th className="text-left px-5 sm:px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em]" style={{ color: TOKENS.muted }}>Window</th>
                  <th className="text-right px-5 sm:px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em]" style={{ color: TOKENS.muted }}>Virtual</th>
                  <th className="text-right px-5 sm:px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em]" style={{ color: TOKENS.muted }}>In-Person</th>
                  <th className="text-right px-5 sm:px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em]" style={{ color: TOKENS.muted }}>Through</th>
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
                        background: isActive ? TOKENS.tealSoft : undefined,
                      }}
                    >
                      <td className="px-5 sm:px-6 py-4 font-semibold" style={{ color: TOKENS.ink }}>
                        {s.label}
                        {isActive && (
                          <span
                            className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded text-white align-middle tracking-wider uppercase"
                            style={{ background: TOKENS.teal }}
                          >
                            Now
                          </span>
                        )}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-right tabular-nums" style={{ color: TOKENS.inkSoft }}>${PRICES[s.id].virtual}</td>
                      <td className="px-5 sm:px-6 py-4 text-right tabular-nums" style={{ color: TOKENS.inkSoft }}>${PRICES[s.id].inPerson}</td>
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
      className="relative rounded-2xl overflow-hidden bg-white border flex flex-col"
      style={{
        borderColor: featured ? accent : TOKENS.hairline,
        borderWidth: featured ? 1.5 : 1,
      }}
    >
      <div className="h-1" style={{ background: accent }} />
      <div className="p-8 sm:p-10 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
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
              className="text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded"
              style={{ background: accentSoft, color: accent }}
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
                className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
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
          className="mt-8 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-bold text-white transition-colors"
          style={{ background: accent }}
        >
          Register Now <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
