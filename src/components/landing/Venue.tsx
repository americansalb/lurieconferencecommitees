import { TOKENS, CONFERENCE } from "./tokens";

export default function Venue() {
  return (
    <section id="venue" className="py-28 sm:py-36" style={{ background: TOKENS.paper }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center">
          {/* Photo card */}
          <div className="relative order-2 lg:order-1">
            <div
              role="img"
              aria-label="Ann & Robert H. Lurie Children's Hospital of Chicago"
              className="aspect-[4/5] rounded-2xl bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(6,42,54,0.05) 0%, rgba(6,42,54,0.35) 100%), url(/conference/venue.jpg)`,
                backgroundColor: TOKENS.tealDeep,
              }}
            />
            <div
              className="absolute -bottom-5 left-5 sm:left-7 bg-white rounded-xl px-5 py-4 max-w-[260px]"
              style={{ boxShadow: "0 12px 32px -10px rgba(11,31,37,0.25)" }}
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
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: TOKENS.gold }}>
                The Venue
              </span>
            </div>

            <h2
              className="font-serif-display text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight"
              style={{ color: TOKENS.ink }}
            >
              {CONFERENCE.venueShort}.
            </h2>
            <p className="mt-3 text-base font-medium" style={{ color: TOKENS.blueDeep }}>
              {CONFERENCE.venueName}
            </p>

            <p
              className="mt-6 text-base sm:text-lg leading-relaxed"
              style={{ color: TOKENS.muted }}
            >
              One of the country&rsquo;s leading pediatric hospitals, set in the heart of downtown Chicago&rsquo;s Streeterville neighborhood. The conference takes place in Lurie Children&rsquo;s conference facilities, with direct access from Michigan Avenue and the lakefront.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <Detail
                label="Address"
                value={CONFERENCE.venueAddress}
              />
              <Detail
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.25em] uppercase mb-2" style={{ color: TOKENS.teal }}>
        {label}
      </div>
      <div className="text-sm leading-relaxed" style={{ color: TOKENS.inkSoft }}>
        {value}
      </div>
    </div>
  );
}
