"use client";

import { useEffect, useState } from "react";
import { TOKENS } from "./tokens";

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
    return <div className="h-[80px]" />;
  }

  return (
    <div className="flex items-stretch divide-x rounded-xl border" style={{ borderColor: TOKENS.hairline, background: "white" }}>
      {cells.map((c) => (
        <div key={c.label} className="flex-1 px-2 py-4 text-center" style={{ borderColor: TOKENS.hairline }}>
          <div
            className="font-serif-display text-3xl sm:text-4xl font-bold leading-none tabular-nums"
            style={{ color: accent }}
          >
            {c.value}
          </div>
          <div className="mt-1.5 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: TOKENS.muted }}>
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
