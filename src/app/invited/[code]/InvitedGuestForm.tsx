"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, MapPin, Monitor } from "lucide-react";

// The complimentary-guest RSVP. Deliberately quieter than the public funnel:
// no prices, no steps, no urgency — an invitation card. Ivory on deep teal,
// gold accents, four fields and one decision (in the room or on the stream).

const GOLD = "#C9A14B";
const GOLD_SOFT = "#E8C56F";
const INK = "#10222A";

export default function InvitedGuestForm({ code, demoState }: { code: string; demoState?: "success" | null }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [mode, setMode] = useState<"in-person" | "virtual" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ already: boolean; first: string } | null>(
    demoState === "success" ? { already: false, first: "Maria" } : null
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!mode) {
      setError("Please choose how you'll join us.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/attendees/invited", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, firstName, lastName, email, affiliation, attendanceMode: mode }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setDone({ already: !!json.already, first: firstName.trim().split(/\s+/)[0] || "there" });
      } else {
        setError(json.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "radial-gradient(120% 90% at 50% 0%, #12404E 0%, #0B2A33 55%, #071D24 100%)" }}
    >
      <div className="w-full max-w-lg">
        <div className="rounded-[28px] overflow-hidden shadow-2xl" style={{ background: "#FDFBF6" }}>
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${GOLD_SOFT}, ${GOLD}, ${GOLD_SOFT})` }} />
          <div className="px-7 sm:px-10 py-10">
            {!done ? (
              <>
                <div className="text-center">
                  <div className="text-[11px] font-bold tracking-[0.34em] uppercase" style={{ color: GOLD }}>
                    You are invited
                  </div>
                  <h1 className="mt-4 text-[26px] sm:text-3xl font-bold leading-tight tracking-tight" style={{ color: INK }}>
                    2026 Lurie Children&rsquo;s<br />&amp; AALB Conference
                  </h1>
                  <p className="mt-3 text-[13.5px] text-slate-500">
                    True Language Access: Yesterday, Today, and Tomorrow
                  </p>
                  <p className="mt-1.5 text-[13.5px] font-semibold" style={{ color: INK }}>
                    August 15&ndash;16, 2026 · Chicago &amp; live stream
                  </p>
                  <div className="mx-auto mt-6 mb-7 h-px w-24" style={{ background: GOLD }} />
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Please join us as our guest. Your registration is complimentary, with our thanks.
                  </p>
                </div>

                <form onSubmit={submit} className="mt-7 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <Field label="First name" value={firstName} onChange={setFirstName} required autoComplete="given-name" />
                    <Field label="Last name" value={lastName} onChange={setLastName} required autoComplete="family-name" />
                  </div>
                  <Field label="Email" value={email} onChange={setEmail} required type="email" autoComplete="email" />
                  <Field label="Organization (optional)" value={affiliation} onChange={setAffiliation} />

                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <ModeCard
                      active={mode === "in-person"}
                      onClick={() => setMode("in-person")}
                      icon={<MapPin className="w-4 h-4" />}
                      title="In person"
                      sub="Lurie Children's, Chicago"
                    />
                    <ModeCard
                      active={mode === "virtual"}
                      onClick={() => setMode("virtual")}
                      icon={<Monitor className="w-4 h-4" />}
                      title="Virtual"
                      sub="Live stream, both days"
                    />
                  </div>

                  {error && <div className="text-sm font-semibold text-rose-600 text-center pt-1">{error}</div>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-[15px] transition-all disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${GOLD_SOFT} 0%, ${GOLD} 100%)`,
                      color: "#3C2E10",
                      boxShadow: "0 14px 34px -12px rgba(201,161,75,0.55)",
                    }}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {submitting ? "Reserving your seat…" : "Accept the invitation"}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                <p className="mt-5 text-center text-[11.5px] text-slate-400 leading-relaxed">
                  This link admits invited guests of Ann &amp; Robert H. Lurie Children&rsquo;s Hospital
                  of Chicago and Americans Against Language Barriers.
                </p>
              </>
            ) : (
              <div className="text-center py-6">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${GOLD_SOFT}, ${GOLD})` }}
                >
                  <Check className="w-8 h-8" style={{ color: "#3C2E10" }} strokeWidth={2.5} />
                </div>
                <div className="mt-6 text-[11px] font-bold tracking-[0.34em] uppercase" style={{ color: GOLD }}>
                  {done.already ? "Already with us" : "Your seat is reserved"}
                </div>
                <h1 className="mt-3 text-3xl font-bold tracking-tight" style={{ color: INK }}>
                  {done.already ? `Welcome back, ${done.first}.` : `We look forward to seeing you, ${done.first}.`}
                </h1>
                <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                  {done.already
                    ? "You were already registered — we've re-sent your personal portal link so everything is one click away."
                    : "Your confirmation and personal portal link are on their way to your inbox, with the joining details, calendar file, and agenda."}
                </p>
                <p className="mt-6 text-[11.5px] text-slate-400">August 15&ndash;16, 2026 · Chicago &amp; live stream</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, required, type = "text", autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="mt-1 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none transition-colors focus:border-[#C9A14B] focus:ring-2 focus:ring-[#C9A14B]/20"
      />
    </label>
  );
}

function ModeCard({
  active, onClick, icon, title, sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border-2 p-4 text-left transition-all"
      style={active
        ? { borderColor: GOLD, background: "#FBF4E2", boxShadow: "0 8px 22px -12px rgba(201,161,75,0.5)" }
        : { borderColor: "#E2E8F0", background: "#FFFFFF" }}
    >
      <div className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: active ? "#8A6A20" : "#334155" }}>
        {icon} {title}
      </div>
      <div className="mt-0.5 text-[11.5px] text-slate-500">{sub}</div>
    </button>
  );
}
