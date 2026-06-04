import { MapPin, Train } from "lucide-react";
import { TOKENS, CONFERENCE } from "./tokens";

export default function Venue() {
  return (
    <section
      id="venue"
      className="relative py-28 sm:py-36 overflow-hidden"
      style={{ background: "white" }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[320px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 100% at 50% 100%, ${TOKENS.tealSoft} 0%, transparent 70%)`,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-20 items-center">
          {/* Photo card */}
          <div className="relative order-2 lg:order-1">
            {/* Soft warm halo behind the photo card. */}
            <div
              aria-hidden
              className="absolute -inset-6 rounded-3xl -z-10 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${TOKENS.tealSoft} 0%, ${TOKENS.blueSoft} 60%, ${TOKENS.goldSoft} 100%)`,
                filter: "blur(2px)",
                opacity: 0.55,
              }}
            />
            <div
              role="img"
              aria-label="Ann & Robert H. Lurie Children's Hospital of Chicago"
              className="aspect-[4/5] rounded-2xl bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(14,68,86,0.05) 0%, rgba(14,68,86,0.35) 100%), url(/conference/venue.jpg)`,
                backgroundColor: TOKENS.tealDark,
                boxShadow: "0 32px 60px -28px rgba(11,31,37,0.35), 0 8px 20px -12px rgba(11,31,37,0.12)",
              }}
            />
            <div
              className="absolute -bottom-5 left-5 sm:left-7 bg-white rounded-xl px-5 py-4 max-w-[260px]"
              style={{
                boxShadow: "0 18px 38px -14px rgba(11,31,37,0.28), 0 4px 10px -4px rgba(11,31,37,0.08)",
                border: `1px solid ${TOKENS.hairline}`,
              }}
            >
              <div className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: TOKENS.teal }}>
                In-person venue
              </div>
              <div className="text-sm font-bold mt-1" style={{ color: TOKENS.ink }}>
                {CONFERENCE.venueShort}
              </div>
              <div className="text-xs mt-0.5" style={{ color: TOKENS.muted }}>
                Streeterville &middot; Chicago
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <Eyebrow>The Venue</Eyebrow>

            <h2
              className="mt-6 text-4xl sm:text-5xl md:text-[58px] font-bold leading-[1.05] tracking-tight"
              style={{ color: TOKENS.ink }}
            >
              {CONFERENCE.venueShort}.
            </h2>
            <p className="mt-3 text-base font-semibold italic" style={{ color: TOKENS.blue }}>
              {CONFERENCE.venueName}
            </p>

            <p
              className="mt-6 text-base sm:text-lg leading-relaxed"
              style={{ color: TOKENS.muted }}
            >
              One of the country&rsquo;s leading pediatric hospitals, set in the heart of downtown Chicago&rsquo;s Streeterville neighborhood. The conference takes place in Lurie Children&rsquo;s conference facilities, with direct access from Michigan Avenue and the lakefront.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Detail
                icon={MapPin}
                accent={TOKENS.teal}
                accentSoft={TOKENS.tealSoft}
                label="Address"
                value={CONFERENCE.venueAddress}
              />
              <Detail
                icon={Train}
                accent={TOKENS.blue}
                accentSoft={TOKENS.blueSoft}
                label="Getting there"
                value="Short walk from the CTA Red Line. Streeterville parking garages within two blocks."
              />
            </div>
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
      <span
        className="text-[10px] font-bold tracking-[0.32em] uppercase"
        style={{ color: TOKENS.gold }}
      >
        {children}
      </span>
    </div>
  );
}

function Detail({
  icon: Icon, accent, accentSoft, label, value,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
  accentSoft: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl bg-white p-4"
      style={{
        border: `1px solid ${TOKENS.hairline}`,
        boxShadow: "0 4px 12px -6px rgba(11,31,37,0.06)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
        style={{ background: accentSoft, color: accent }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-[10px] font-bold tracking-[0.25em] uppercase mb-1.5" style={{ color: accent }}>
        {label}
      </div>
      <div className="text-sm leading-relaxed" style={{ color: TOKENS.inkSoft }}>
        {value}
      </div>
    </div>
  );
}
