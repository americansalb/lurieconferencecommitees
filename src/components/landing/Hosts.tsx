import { ArrowUpRight } from "lucide-react";
import { TOKENS } from "./tokens";

const HOSTS = [
  {
    name: "Ann & Robert H. Lurie Children's Hospital of Chicago",
    short: "Lurie Children's",
    body: "One of the nation's top pediatric hospitals, ranked among the best in the country for children's care. Lurie Children's serves families from every linguistic and cultural community in the Chicago region and beyond.",
    monogram: "L",
    accent: TOKENS.blue,
    accentDeep: TOKENS.blueDeep,
    accentSoft: TOKENS.blueSoft,
    href: "https://www.luriechildrens.org",
  },
  {
    name: "Americans Against Language Barriers",
    short: "AALB",
    body: "A 501(c)(3) nonprofit dedicated to closing the gap in language access for healthcare, education, and public services. AALB convenes interpreters, advocates, clinicians, and patients around a single mission: no one should go without care because of the language they speak.",
    monogram: "A",
    accent: TOKENS.teal,
    accentDeep: TOKENS.tealDark,
    accentSoft: TOKENS.tealSoft,
    href: "https://www.aalb.org",
  },
];

export default function Hosts() {
  return (
    <section
      id="hosts"
      className="relative py-28 sm:py-36 overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${TOKENS.paper} 0%, white 50%, ${TOKENS.paper} 100%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 60% at 50% 50%, rgba(201,161,75,0.07) 0%, transparent 70%)`,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Eyebrow>Brought to you by</Eyebrow>
          <h2
            className="font-serif-display mt-6 text-4xl sm:text-5xl md:text-[58px] font-bold leading-[1.05] tracking-tight"
            style={{ color: TOKENS.ink }}
          >
            Two organizations,
            <br />
            <span className="italic font-medium" style={{ color: TOKENS.teal }}>
              one mission.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {HOSTS.map((h) => (
            <a
              key={h.short}
              href={h.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl bg-white p-8 sm:p-10 transition-all hover:-translate-y-0.5"
              style={{
                border: `1px solid ${TOKENS.hairline}`,
                boxShadow: "0 12px 32px -16px rgba(11,31,37,0.16), 0 2px 6px -3px rgba(11,31,37,0.06)",
              }}
            >
              <div className="flex items-start justify-between mb-7">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center font-serif-display text-[56px] font-bold leading-none"
                  style={{
                    background: h.accentSoft,
                    color: h.accentDeep,
                    boxShadow: `inset 0 -2px 0 ${h.accent}1a`,
                  }}
                >
                  {h.monogram}
                </div>
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ background: TOKENS.paper, color: h.accent }}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div
                className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2"
                style={{ color: h.accent }}
              >
                Host
              </div>
              <div
                className="font-serif-display text-2xl sm:text-[28px] font-bold leading-tight mb-2"
                style={{ color: h.accent }}
              >
                {h.short}
              </div>
              <div className="text-[12px] font-semibold mb-5" style={{ color: TOKENS.mutedSoft }}>
                {h.name}
              </div>
              <p className="text-[15px] leading-relaxed" style={{ color: TOKENS.inkSoft }}>
                {h.body}
              </p>
            </a>
          ))}
        </div>

        <p
          className="mt-16 text-center text-sm max-w-2xl mx-auto italic font-serif-display"
          style={{ color: TOKENS.muted }}
        >
          Presented jointly in service of patients, families, and the professionals who keep their care in their own language.
        </p>
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
