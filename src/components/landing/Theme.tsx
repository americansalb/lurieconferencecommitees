import { Clock3, Compass, Telescope } from "lucide-react";
import { TOKENS } from "./tokens";

const PILLARS = [
  {
    key: "yesterday",
    title: "Yesterday",
    icon: Clock3,
    body: "We honor the educators, interpreters, and advocates whose decades of work laid the foundation for language access as a civil right. The history of this field is the history of patients fighting to be heard.",
  },
  {
    key: "today",
    title: "Today",
    icon: Compass,
    body: "We confront the gap between policy and practice in modern healthcare: where standards exist on paper but break down at the bedside, and where interpreters carry the weight of every difficult conversation.",
  },
  {
    key: "tomorrow",
    title: "Tomorrow",
    icon: Telescope,
    body: "We imagine the systems, training, and technology that could make true language access the default, not the exception, for every patient and family in every clinical setting.",
  },
];

export default function Theme() {
  return (
    <section
      id="theme"
      className="py-24 sm:py-32 relative"
      style={{ background: TOKENS.cream }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div
            className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase mb-4"
            style={{ color: TOKENS.teal }}
          >
            2026 Theme
          </div>
          <h2 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight" style={{ color: TOKENS.ink }}>
            True Language Access:
            <br />
            <span className="italic font-medium" style={{ color: TOKENS.teal }}>
              Yesterday, Today, and Tomorrow.
            </span>
          </h2>
          <p className="mt-7 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: TOKENS.muted }}>
            A two-day exploration of where the field has been, where it stands, and where it has to go. Three lenses, one through-line: the patient&rsquo;s right to be understood.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                className="relative bg-white rounded-2xl p-7 sm:p-8 border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute -top-3 left-7 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase text-white shadow-sm"
                  style={{ background: TOKENS.teal }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: TOKENS.tealSoft, color: TOKENS.teal }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif-display text-2xl font-bold mb-3" style={{ color: TOKENS.ink }}>
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: TOKENS.muted }}>
                  {p.body}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <a
            href="/proposal"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-sm hover:shadow-md transition-all text-sm"
            style={{ background: `linear-gradient(135deg, ${TOKENS.teal} 0%, ${TOKENS.blue} 100%)` }}
          >
            Submit a Speaker Proposal
          </a>
        </div>
      </div>
    </section>
  );
}
