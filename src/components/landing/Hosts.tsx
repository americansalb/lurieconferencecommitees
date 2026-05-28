import { ArrowUpRight } from "lucide-react";
import { TOKENS } from "./tokens";

const HOSTS = [
  {
    name: "Ann & Robert H. Lurie Children's Hospital of Chicago",
    short: "Lurie Children's",
    body: "One of the nation's top pediatric hospitals, ranked among the best in the country for children's care. Lurie Children's serves families from every linguistic and cultural community in the Chicago region and beyond.",
    accent: TOKENS.blue,
    accentSoft: TOKENS.blueSoft,
    href: "https://www.luriechildrens.org",
  },
  {
    name: "Americans Against Language Barriers",
    short: "AALB",
    body: "A 501(c)(3) nonprofit dedicated to closing the gap in language access for healthcare, education, and public services. AALB convenes interpreters, advocates, clinicians, and patients around a single mission: no one should go without care because of the language they speak.",
    accent: TOKENS.teal,
    accentSoft: TOKENS.tealSoft,
    href: "https://www.aalb.org",
  },
];

export default function Hosts() {
  return (
    <section id="hosts" className="py-28 sm:py-36 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: TOKENS.gold }}>
              Brought to you by
            </span>
            <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
          </div>
          <h2
            className="font-serif-display text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight"
            style={{ color: TOKENS.ink }}
          >
            Two organizations,{" "}
            <span className="italic font-medium" style={{ color: TOKENS.teal }}>one mission.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {HOSTS.map((h) => (
            <a
              key={h.short}
              href={h.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl bg-white border p-8 sm:p-10 transition-colors hover:border-slate-300"
              style={{ borderColor: TOKENS.hairline }}
            >
              <div className="flex items-start justify-between mb-7">
                <div
                  className="px-2.5 py-1 rounded text-[10px] font-bold tracking-[0.25em] uppercase"
                  style={{ background: h.accentSoft, color: h.accent }}
                >
                  Host
                </div>
                <ArrowUpRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{ color: TOKENS.muted }}
                />
              </div>
              <div className="font-serif-display text-3xl font-bold mb-3" style={{ color: h.accent }}>
                {h.short}
              </div>
              <div className="text-[13px] font-semibold mb-5" style={{ color: TOKENS.muted }}>
                {h.name}
              </div>
              <p className="text-[15px] leading-relaxed" style={{ color: TOKENS.inkSoft }}>
                {h.body}
              </p>
            </a>
          ))}
        </div>

        <p
          className="mt-16 text-center text-sm max-w-2xl mx-auto"
          style={{ color: TOKENS.muted }}
        >
          Presented jointly by Lurie Children&rsquo;s and AALB in service of patients, families, and the professionals who keep their care in their own language.
        </p>
      </div>
    </section>
  );
}
