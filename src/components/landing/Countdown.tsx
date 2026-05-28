"use client";

import { useEffect, useState } from "react";

type Cell = { label: string; value: string };

export default function Countdown({ targetIso, accent }: { targetIso: string; accent: string }) {
  const [cells, setCells] = useState<Cell[] | null>(null);

  useEffect(() => {
    function tick() {
      const target = new Date(targetIso).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCells([
        { label: "Days",    value: String(d).padStart(2, "0") },
        { label: "Hours",   value: String(h).padStart(2, "0") },
        { label: "Minutes", value: String(m).padStart(2, "0") },
        { label: "Seconds", value: String(s).padStart(2, "0") },
      ]);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!cells) {
    return <div className="h-[88px]" />;
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-xl bg-white/90 backdrop-blur shadow-sm border border-white/40 px-2 sm:px-4 py-3 text-center"
        >
          <div className="font-serif-display text-3xl sm:text-4xl font-bold leading-none tabular-nums" style={{ color: accent }}>
            {c.value}
          </div>
          <div className="mt-1 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-slate-500">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
