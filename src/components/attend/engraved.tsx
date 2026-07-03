import React from "react";

// The engraved gold-foil design language of the sponsor/alumni letters,
// translated to web pages: parchment ground, cream card, deep-teal letterhead
// with the gold "2026" seal, Georgia serif display, gold hairline rules.
// Shared by the registration confirmation ticket and the attendee portal so
// the pages feel like the invitation that brought people here.

export const E = {
  teal: "#0E5566",
  tealDeep: "#0C3B4B",
  ink: "#0B1F25",
  soft: "#5A6E76",
  gold: "#C9A14B",
  goldDark: "#9C7A2E",
  goldSoft: "#F4E9CD",
  cream: "#FBF8F1",
  creamBorder: "#E4DAC4",
  parchment: "linear-gradient(180deg,#F0EBDD 0%,#E6DECB 100%)",
  goldRule: "linear-gradient(90deg,#9C7A2E 0%,#F4E9CD 50%,#9C7A2E 100%)",
  serif: "Georgia, 'Times New Roman', serif",
};

// Full-page parchment backdrop with a faint gold glow behind the card.
export function Parchment({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-10 sm:py-14" style={{ background: E.parchment }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(600px 320px at 50% 12%, rgba(201,161,75,0.14), transparent 70%)" }}
      />
      <div className="relative max-w-xl mx-auto">{children}</div>
    </div>
  );
}

// The engraved gold seal with the year, as on the letters.
export function Seal({ size = 92 }: { size?: number }) {
  return (
    <div
      className="rounded-full inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg,#F4E9CD 0%,#D9B863 28%,#C9A14B 52%,#9C7A2E 78%,#E7D5A4 100%)",
        border: "2px solid #F4E9CD",
        boxShadow: "0 6px 16px rgba(0,0,0,0.30), inset 0 1px 2px rgba(255,255,255,0.55)",
      }}
    >
      <span style={{ fontFamily: E.serif, fontSize: size * 0.28, color: "#3C2E10", fontWeight: 700, letterSpacing: 1 }}>
        2026
      </span>
    </div>
  );
}

// Deep-teal letterhead head for the cream card.
export function Letterhead({ kicker, children }: { kicker: string; children?: React.ReactNode }) {
  return (
    <div
      className="text-center px-6 pt-9 pb-7"
      style={{ background: `linear-gradient(160deg, ${E.teal} 0%, ${E.tealDeep} 100%)` }}
    >
      <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.35em", color: E.goldSoft }}>
        Lurie Children&rsquo;s &middot; AALB
      </div>
      <div className="mt-1.5 text-[8.5px] font-bold uppercase" style={{ letterSpacing: "0.3em", color: "#7FA7B1" }}>
        {kicker}
      </div>
      <div className="mt-5 mb-4">
        <Seal />
      </div>
      <div style={{ fontFamily: E.serif, fontSize: 25, lineHeight: 1.25, color: "#fff" }}>
        The Second Joint Conference
      </div>
      <div className="mt-1 italic" style={{ fontFamily: E.serif, fontSize: 13.5, color: "#A9C6CD" }}>
        on Language Access in American Healthcare
      </div>
      <div className="mt-3 text-[10px] font-bold uppercase" style={{ letterSpacing: "0.28em", color: "#7FA7B1" }}>
        August 15&ndash;16, 2026 &middot; Chicago
      </div>
      {children}
    </div>
  );
}

export function GoldRule() {
  return <div style={{ height: 3, background: E.goldRule }} />;
}

// Tiny tracked-caps gold label, as on the letters.
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: E.goldDark }}>
      {children}
    </div>
  );
}

// A perforated ticket divider: dashed line with punched half-circles at the
// card edges, so the card reads as an admission ticket.
export function Perforation() {
  const hole: React.CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#EDE7D8",
    boxShadow: "inset 0 1px 3px rgba(12,59,75,0.18)",
  };
  return (
    <div className="relative my-1" aria-hidden>
      <div className="absolute -left-[11px] top-1/2 -translate-y-1/2" style={hole} />
      <div className="absolute -right-[11px] top-1/2 -translate-y-1/2" style={hole} />
      <div className="mx-6 border-t-2 border-dashed" style={{ borderColor: "#DCCFA9" }} />
    </div>
  );
}

// The cream ticket card wrapper.
export function TicketCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: E.cream,
        border: `1px solid ${E.creamBorder}`,
        boxShadow: "0 18px 48px rgba(12,59,75,0.18)",
      }}
    >
      {children}
    </div>
  );
}

// A labeled fact cell in the gold-washed style of the letters' recognition box.
export function FactCell({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: "#FBF4E2", border: "1px solid #EAD9AE" }}
    >
      <div className="text-[9px] font-bold uppercase mb-1" style={{ letterSpacing: "0.22em", color: E.goldDark }}>
        {label}
      </div>
      <div className="text-[15px] font-bold leading-snug" style={{ color: "#3C2E10", fontFamily: E.serif }}>
        {value}
      </div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: "#8a744a" }}>{sub}</div>}
    </div>
  );
}

// Footer strip matching the letters' deep-teal footer.
export function TicketFooter() {
  return (
    <div
      className="text-center px-6 py-5"
      style={{ background: `linear-gradient(180deg, ${E.tealDeep} 0%, #0A3340 100%)` }}
    >
      <div style={{ fontFamily: E.serif, fontSize: 12.5, letterSpacing: 0.5, color: E.goldSoft }}>
        2026 Lurie Children&rsquo;s &amp; AALB Conference
      </div>
      <div className="mt-1 text-[10.5px]" style={{ color: "#9FB6BC" }}>
        conference.aalb.org &middot; contact@aalb.org
      </div>
      <div className="mt-1 text-[9.5px]" style={{ color: "#5F7E86" }}>
        501(c)(3) &middot; EINs 83-3016421 and 36-2170833
      </div>
    </div>
  );
}

// Host logo lockup on parchment, below the card.
export function HostsLockup() {
  return (
    <div className="mt-6 flex items-center justify-center gap-5 opacity-80">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/aalb.png" alt="Americans Against Language Barriers" className="h-8 w-auto" />
      <span className="w-px h-6" style={{ background: "#CBBD98" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/lurie.png" alt="Ann & Robert H. Lurie Children's Hospital of Chicago" className="h-7 w-auto" />
    </div>
  );
}
