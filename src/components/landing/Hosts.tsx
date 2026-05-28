import { TOKENS } from "./tokens";

const HOSTS = [
  {
    name: "Ann & Robert H. Lurie Children's Hospital of Chicago",
    short: "Lurie Children's",
    body: "One of the nation's top pediatric hospitals, ranked among the best in the country for children's care. Lurie Children's serves families from every linguistic and cultural community in the Chicago region and beyond.",
    monogram: "L",
    gradient: `linear-gradient(135deg, ${TOKENS.blue} 0%, ${TOKENS.teal} 100%)`,
    href: "https://www.luriechildrens.org",
  },
  {
    name: "Americans Against Language Barriers",
    short: "AALB",
    body: "A 501(c)(3) nonprofit dedicated to closing the gap in language access for healthcare, education, and public services. AALB convenes interpreters, advocates, clinicians, and patients around a single mission: no one should go without care because of the language they speak.",
    monogram: "A",
    gradient: `linear-gradient(135deg, ${TOKENS.teal} 0%, ${TOKENS.tealDark} 100%)`,
    href: "https://www.aalb.org",
  },
];

export default function Hosts() {
  return (
    <section
      id="hosts"
      className="py-24 sm:py-32"
      style={{ background: `linear-gradient(180deg, white 0%, ${TOKENS.creamSoft} 100%)` }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: TOKENS.teal }}>
            Brought to you by
          </div>
          <h2 className="font-serif-display text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight" style={{ color: TOKENS.ink }}>
            Two organizations, <span className="italic font-medium" style={{ color: TOKENS.teal }}>one mission.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {HOSTS.map((h) => (
            <a
              key={h.short}
              href={h.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl bg-white border border-slate-200 p-7 sm:p-9 hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center font-serif-display text-2xl font-bold text-white shadow-md"
                  style={{ background: h.gradient }}
                >
                  {h.monogram}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: TOKENS.teal }}>
                    Host
                  </div>
                  <div className="text-base sm:text-lg font-extrabold leading-tight" style={{ color: TOKENS.ink }}>
                    {h.short}
                  </div>
                </div>
              </div>
              <h3 className="font-serif-display text-xl sm:text-2xl font-bold leading-snug mb-3" style={{ color: TOKENS.ink }}>
                {h.name}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: TOKENS.muted }}>
                {h.body}
              </p>
            </a>
          ))}
        </div>

        <p className="mt-12 text-center text-sm" style={{ color: TOKENS.muted }}>
          Presented jointly by Lurie Children&rsquo;s and AALB in service of patients, families, and the professionals who keep their care in their own language.
        </p>
      </div>
    </section>
  );
}
