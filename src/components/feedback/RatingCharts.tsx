// The rating charts, shared by a presenter's page and the team's compiled
// view so a session reads the same in both places.
//
// One hue, three steps: the top of the scale, one below, everything else.
// Ordered light to dark so the tones read as "more" without a legend, and the
// counts are printed so nothing depends on telling the steps apart.
export const TOP = "#0E5566";
export const NEXT = "#5AA3B3";
export const REST = "#CBD5E1";

function pct(part: number, whole: number): string {
  return `${whole ? Math.round((part / whole) * 100) : 0}%`;
}

export function tone(value: number, scale: number): string {
  return value >= scale ? TOP : value >= scale - 1 ? NEXT : REST;
}

export function Legend({ scale }: { scale: number }) {
  const items = [
    { color: TOP, label: String(scale) },
    { color: NEXT, label: String(scale - 1) },
    { color: REST, label: `${scale - 2} or lower` },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Every rating on the scale as a column, counts on the caps. */
export function Distribution({ values, scale, compact }: { values: number[]; scale: number; compact?: boolean }) {
  const counts = Array.from({ length: scale }, (_, i) => values.filter((v) => Math.round(v) === i + 1).length);
  const max = Math.max(1, ...counts);
  return (
    <div role="img" aria-label={counts.map((c, i) => `${c} rated ${i + 1}`).join(", ")}>
      <div className={`flex items-end gap-2 sm:gap-3 ${compact ? "h-24" : "h-44"} border-b border-slate-200`}>
        {counts.map((c, i) => {
          const v = i + 1;
          return (
            <div key={v} className="flex-1 flex flex-col items-center justify-end h-full"
                 title={`${c} rated it ${v} (${pct(c, values.length)})`}>
              {c > 0 && <span className="text-[12px] text-slate-600 tabular-nums mb-1">{c}</span>}
              <div className="w-full max-w-[24px] rounded-t"
                   style={{ height: c ? `${Math.max(2, (c / max) * 100)}%` : 0, background: tone(v, scale) }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 sm:gap-3 mt-1.5">
        {counts.map((_, i) => (
          <div key={i} className="flex-1 text-center text-[11.5px] text-slate-400 tabular-nums">{i + 1}</div>
        ))}
      </div>
    </div>
  );
}

/** One row's share at the top, one below, and the rest, as a single bar. */
export function SplitBar({ values, scale }: { values: number[]; scale: number }) {
  const top = values.filter((v) => v >= scale).length;
  const next = values.filter((v) => v >= scale - 1 && v < scale).length;
  const rest = values.length - top - next;
  const parts = [
    { n: top, color: TOP, label: `${top} rated ${scale}` },
    { n: next, color: NEXT, label: `${next} rated ${scale - 1}` },
    { n: rest, color: REST, label: `${rest} rated ${scale - 2} or lower` },
  ].filter((p) => p.n > 0);
  return (
    <div className="flex h-3 w-full gap-[2px]">
      {parts.map((p, i) => (
        <div key={i} title={p.label}
             className={`h-full ${i === 0 ? "rounded-l" : ""} ${i === parts.length - 1 ? "rounded-r" : ""}`}
             style={{ width: `${(p.n / values.length) * 100}%`, background: p.color }} />
      ))}
    </div>
  );
}

