import { MapPin, Train } from "lucide-react";
import { TOKENS, CONFERENCE } from "./tokens";

export default function Venue() {
  return (
    <section id="venue" className="py-24 sm:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <div
              className="absolute -inset-3 rounded-3xl -z-10"
              style={{ background: `linear-gradient(135deg, ${TOKENS.tealSoft} 0%, ${TOKENS.cream} 100%)` }}
            />
            <div
              role="img"
              aria-label="Ann & Robert H. Lurie Children's Hospital of Chicago"
              className="aspect-[4/5] rounded-2xl shadow-2xl ring-1 ring-slate-200 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(135deg, ${TOKENS.tealDark}cc 0%, ${TOKENS.blue}66 100%), url(/conference/venue.jpg)`,
                backgroundColor: TOKENS.tealDark,
              }}
            />
            <div className="absolute -bottom-5 -right-3 sm:-right-5 bg-white rounded-2xl shadow-xl px-5 py-4 border border-slate-100 max-w-[240px]">
              <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: TOKENS.teal }}>
                In-person venue
              </div>
              <div className="text-sm font-bold mt-1" style={{ color: TOKENS.ink }}>
                {CONFERENCE.venueShort}
              </div>
              <div className="text-xs mt-0.5" style={{ color: TOKENS.muted }}>
                Streeterville &middot; Downtown Chicago
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div
              className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase mb-3"
              style={{ color: TOKENS.teal }}
            >
              The Venue
            </div>
            <h2 className="font-serif-display text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight" style={{ color: TOKENS.ink }}>
              {CONFERENCE.venueName}
            </h2>
            <p className="mt-6 text-base sm:text-lg leading-relaxed" style={{ color: TOKENS.muted }}>
              One of the country&rsquo;s leading pediatric hospitals, set in the heart of downtown Chicago&rsquo;s Streeterville neighborhood. The conference takes place in Lurie Children&rsquo;s conference facilities, with direct access from Michigan Avenue and the lakefront.
            </p>

            <div className="mt-8 space-y-3">
              <DetailRow
                icon={MapPin}
                title="Address"
                lines={[CONFERENCE.venueAddress]}
              />
              <DetailRow
                icon={Train}
                title="Getting there"
                lines={[
                  "Walking distance from the CTA Red Line",
                  "Parking garages available throughout Streeterville",
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailRow({
  icon: Icon, title, lines,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  lines: string[];
}) {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: TOKENS.tealSoft, color: TOKENS.teal }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: TOKENS.teal }}>
          {title}
        </div>
        <div className="mt-1 space-y-0.5 text-sm leading-relaxed" style={{ color: TOKENS.inkSoft }}>
          {lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
