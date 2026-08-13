"use client";

import { useEffect, useState } from "react";

// Translates the fixed Chicago times into the viewer's own clock, which only
// their browser can know. Renders nothing until mounted (so the server
// markup never mismatches) and nothing at all when the viewer is already on
// Chicago time, where the hint would just repeat the line above it.
export default function LocalTimeHint({
  opensMs,
  signInByMs,
  className,
  style,
}: {
  opensMs: number;
  signInByMs: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    try {
      const fmtIn = (ms: number, timeZone?: string) =>
        new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          ...(timeZone ? { timeZone } : {}),
        }).format(new Date(ms));
      if (fmtIn(opensMs) === fmtIn(opensMs, "America/Chicago")) return;
      const zone = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
        .formatToParts(new Date(opensMs))
        .find((p) => p.type === "timeZoneName")?.value;
      setText(
        `In your local time${zone ? ` (${zone})` : ""}: opens ${fmtIn(opensMs)}, be signed in by ${fmtIn(signInByMs)}`
      );
    } catch {
      /* the CT labels still carry the information */
    }
  }, [opensMs, signInByMs]);
  if (!text) return null;
  return (
    <p className={className} style={style}>
      {text}
    </p>
  );
}
