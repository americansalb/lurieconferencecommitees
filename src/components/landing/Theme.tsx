import { TOKENS } from "./tokens";

const PILLARS = [
  {
    eyebrow: "Yesterday",
    title: "Where we came from.",
    body: "We honor the educators, interpreters, and advocates whose decades of work laid the foundation for language access as a civil right. The history of this field is the history of patients fighting to be heard.",
  },
  {
    eyebrow: "Today",
    title: "Where we stand.",
    body: "We confront the gap between policy and practice in modern healthcare: where standards exist on paper but break down at the bedside, and where interpreters carry the weight of every difficult conversation.",
  },
  {
    eyebrow: "Tomorrow",
    title: "Where we are going.",
    body: "We imagine the systems, training, and technology that could make true language access the default, not the exception, for every patient and family in every clinical setting.",
  },
];

export default function Theme() {
  return (
    <section id="theme" className="py-28 sm:py-36 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <Eyebrow>2026 Theme</Eyebrow>
          <h2
            className="font-serif-display mt-6 text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight"
            style={{ color: TOKENS.ink }}
          >
            True Language Access:
            <br />
            <span className="italic font-medium" style={{ color: TOKENS.teal }}>
              Yesterday, Today, and Tomorrow.
            </span>
          </h2>
          <p
            className="mt-7 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: TOKENS.muted }}
          >
            A two-day exploration of where the field has been, where it stands, and where it has to go. Three lenses, one through-line: the patient&rsquo;s right to be understood.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px rounded-2xl overflow-hidden" style={{ background: TOKENS.hairline }}>
          {PILLARS.map((p, i) => (
            <div key={p.eyebrow} className="bg-white p-8 sm:p-10 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="font-serif-display text-xs font-bold tabular-nums px-2 py-0.5 rounded"
                  style={{ background: TOKENS.tealSoft, color: TOKENS.teal }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-[10px] font-bold tracking-[0.25em] uppercase"
                  style={{ color: TOKENS.teal }}
                >
                  {p.eyebrow}
                </span>
              </div>
              <h3
                className="font-serif-display text-2xl sm:text-[28px] font-bold leading-tight mb-4"
                style={{ color: TOKENS.ink }}
              >
                {p.title}
              </h3>
              <p className="text-[15px] leading-relaxed" style={{ color: TOKENS.muted }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a
            href="/proposal"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white text-sm transition-colors"
            style={{ background: TOKENS.teal }}
          >
            Submit a Speaker Proposal
          </a>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
      <span
        className="text-[10px] font-bold tracking-[0.3em] uppercase"
        style={{ color: TOKENS.gold }}
      >
        {children}
      </span>
      <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
    </div>
  );
}
