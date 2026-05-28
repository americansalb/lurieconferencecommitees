import { Check, Monitor, MapPin, ArrowRight } from "lucide-react";
import { TOKENS } from "./tokens";
import Countdown from "./Countdown";

// Mirrors the pricing schedule from the Webflow page.
// Each tier ends at 23:59:59 Central Time on its date.
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
  // After the final deadline, fall back to the last tier.
  return SCHEDULE[SCHEDULE.length - 1];
}

const VIRTUAL_FEATURES = [
  "Live stream of both days",
  "On-demand recordings after the event",
  "Digital program and speaker materials",
  "CEU certificate of attendance",
  "Access to the virtual networking lounge",
];

const IN_PERSON_FEATURES = [
  "Both conference days at Lurie Children's, Chicago",
  "Lunch and refreshments included",
  "Printed program and conference swag",
  "CEU certificate of attendance",
  "Recordings to keep after the event",
  "In-person networking and exhibitor hall",
];

export default function Pricing() {
  const now = new Date();
  const tier = activeTier(now);
  const tierLive = PRICES[tier.id];

  return (
    <section
      id="pricing"
      className="py-24 sm:py-32 relative"
      style={{ background: `linear-gradient(180deg, ${TOKENS.creamSoft} 0%, white 100%)` }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: TOKENS.teal }}>
            Registration
          </div>
          <h2 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight" style={{ color: TOKENS.ink }}>
            Choose your experience.
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: TOKENS.muted }}>
            Join us in person at Lurie Children&rsquo;s in Chicago, or attend live from anywhere in the world. Both options include the full program and CEU certification.
          </p>
        </div>

        {/* Countdown to next pricing change */}
        <div className="max-w-md mx-auto mb-10 sm:mb-14">
          <div className="text-center mb-4">
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: TOKENS.teal }}>
              {tier.label} pricing ends in
            </div>
          </div>
          <Countdown targetIso={tier.end} accent={TOKENS.teal} />
        </div>

        {/* Two pricing cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto">
          <PriceCard
            kind="virtual"
            accent={TOKENS.blue}
            title="Virtual"
            tagline="Attend from anywhere"
            icon={Monitor}
            price={tierLive.virtual}
            tierLabel={tier.label}
            features={VIRTUAL_FEATURES}
          />
          <PriceCard
            kind="in-person"
            featured
            accent={TOKENS.teal}
            title="In-Person"
            tagline="Join us in Chicago"
            icon={MapPin}
            price={tierLive.inPerson}
            tierLabel={tier.label}
            features={IN_PERSON_FEATURES}
          />
        </div>

        {/* Pricing schedule table */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="text-center mb-3 text-[10px] font-bold tracking-widest uppercase" style={{ color: TOKENS.teal }}>
            Pricing schedule
          </div>
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: TOKENS.tealSoft }}>
                  <th className="text-left px-4 sm:px-6 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: TOKENS.teal }}>Window</th>
                  <th className="text-right px-4 sm:px-6 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: TOKENS.teal }}>Virtual</th>
                  <th className="text-right px-4 sm:px-6 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: TOKENS.teal }}>In-Person</th>
                  <th className="text-right px-4 sm:px-6 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: TOKENS.teal }}>Through</th>
                </tr>
              </thead>
              <tbody>
                {SCHEDULE.map((s) => {
                  const isActive = s.id === tier.id;
                  return (
                    <tr
                      key={s.id}
                      className="border-t border-slate-100"
                      style={isActive ? { background: TOKENS.creamSoft } : undefined}
                    >
                      <td className="px-4 sm:px-6 py-3 font-semibold" style={{ color: TOKENS.ink }}>
                        {s.label} {isActive && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white align-middle" style={{ background: TOKENS.teal }}>Active now</span>}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right tabular-nums" style={{ color: TOKENS.inkSoft }}>${PRICES[s.id].virtual}</td>
                      <td className="px-4 sm:px-6 py-3 text-right tabular-nums" style={{ color: TOKENS.inkSoft }}>${PRICES[s.id].inPerson}</td>
                      <td className="px-4 sm:px-6 py-3 text-right text-xs" style={{ color: TOKENS.muted }}>
                        {new Date(s.end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
  title, tagline, price, tierLabel, accent, featured, icon: Icon, features,
}: {
  kind: "virtual" | "in-person";
  title: string;
  tagline: string;
  price: number;
  tierLabel: string;
  accent: string;
  featured?: boolean;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  features: string[];
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-white border ${featured ? "shadow-2xl" : "shadow-sm hover:shadow-md transition-shadow"}`}
      style={{
        borderColor: featured ? accent : "#e2e8f0",
        boxShadow: featured ? `0 24px 50px -22px ${accent}55` : undefined,
      }}
    >
      {featured && (
        <div
          className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase text-white shadow-sm"
          style={{ background: accent }}
        >
          Most Chosen
        </div>
      )}
      <div className="h-1.5" style={{ background: accent }} />
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: accent + "15", color: accent }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-serif-display text-2xl font-bold" style={{ color: TOKENS.ink }}>{title}</div>
            <div className="text-xs" style={{ color: TOKENS.muted }}>{tagline}</div>
          </div>
        </div>

        <div className="mt-5 flex items-baseline gap-2">
          <span className="font-serif-display text-5xl sm:text-6xl font-bold tracking-tight" style={{ color: TOKENS.ink }}>
            ${price}
          </span>
          <span className="text-sm" style={{ color: TOKENS.muted }}>USD</span>
        </div>
        <div className="mt-1 text-xs font-semibold" style={{ color: accent }}>
          {tierLabel} pricing
        </div>

        <ul className="mt-6 space-y-2.5 text-sm" style={{ color: TOKENS.inkSoft }}>
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ background: accent + "1a", color: accent }}
              >
                <Check className="w-3 h-3" strokeWidth={3} />
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <a
          href="/register"
          className="mt-7 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-white shadow-sm hover:shadow-md transition-all"
          style={{ background: accent }}
        >
          Register Now <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
