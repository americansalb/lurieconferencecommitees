"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CONFERENCE, TOKENS } from "@/components/landing/tokens";
import {
  ASL_DAYS,
  CONFERENCE_TZ,
  sameClockAsChicago,
  slotTimeLabel,
  slotWeekdayLabel,
  slotsForDay,
  type AslSlot,
} from "@/lib/asl-slots";

// The standalone acceptance flow for invited ASL interpreters.
//
// A connection check starts the moment the page loads and keeps sampling in
// the background while the form is filled in: at least one minute of data is
// required before the acceptance can be sent, and sampling stops entirely at
// five minutes. The rate field is validated server-side only, so the budget
// ceiling never appears anywhere in this bundle.

const MIN_TEST_SECONDS = 60;
const MAX_TEST_SECONDS = 300;
const CYCLE_GAP_MS = 8_000;
const SLOW_CYCLE_GAP_MS = 20_000;
const START_DOWN_BYTES = 1_500_000;
const MAX_DOWN_BYTES = 5_000_000;
const MIN_DOWN_BYTES = 400_000;

type SpeedView = {
  down: number | null;
  up: number | null;
  ping: number | null;
  samples: number;
  running: boolean;
  failed: boolean;
};

type Engine = {
  started: boolean;
  running: boolean;
  startedAtMs: number;
  cycles: number;
  nextDownBytes: number;
  downs: { mbps: number; bytes: number; ms: number }[];
  ups: { mbps: number; bytes: number; ms: number }[];
  pings: number[];
  failures: number;
  totalDownBytes: number;
  totalUpBytes: number;
};

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  const m = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  return Math.round(m * 100) / 100;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i += 65536) {
    crypto.getRandomValues(out.subarray(i, Math.min(i + 65536, n)));
  }
  return out;
}

async function samplePing(e: Engine) {
  const t0 = performance.now();
  try {
    const res = await fetch(`/api/asl/speedtest?bytes=0&r=${Math.random()}`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    await res.json();
    e.pings.push(performance.now() - t0);
  } catch {
    e.failures++;
  }
}

async function sampleDown(e: Engine) {
  const bytes = e.nextDownBytes;
  const t0 = performance.now();
  try {
    const res = await fetch(`/api/asl/speedtest?bytes=${bytes}&r=${Math.random()}`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    const buf = await res.arrayBuffer();
    const ms = performance.now() - t0;
    const mbps = (buf.byteLength * 8) / (ms / 1000) / 1e6;
    e.downs.push({ mbps: Math.round(mbps * 100) / 100, bytes: buf.byteLength, ms: Math.round(ms) });
    e.totalDownBytes += buf.byteLength;
    // Adapt the sample size to the link so slow connections are not buried
    // and fast ones get a payload big enough to measure.
    if (ms < 900) e.nextDownBytes = Math.min(Math.round(e.nextDownBytes * 1.8), MAX_DOWN_BYTES);
    else if (ms > 5000) e.nextDownBytes = Math.max(Math.round(e.nextDownBytes / 2), MIN_DOWN_BYTES);
  } catch {
    e.failures++;
  }
}

async function sampleUp(e: Engine) {
  const bytes = Math.min(Math.max(Math.round(e.nextDownBytes / 2), 300_000), 3_000_000);
  const payload = randomBytes(bytes);
  const t0 = performance.now();
  try {
    const res = await fetch("/api/asl/speedtest", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: payload as unknown as BodyInit,
      cache: "no-store",
    });
    if (!res.ok) throw new Error();
    await res.json();
    const ms = performance.now() - t0;
    const mbps = (bytes * 8) / (ms / 1000) / 1e6;
    e.ups.push({ mbps: Math.round(mbps * 100) / 100, bytes, ms: Math.round(ms) });
    e.totalUpBytes += bytes;
  } catch {
    e.failures++;
  }
}

const COMMON_TZS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Puerto_Rico",
];

const STEP_TITLES = ["", "About you", "Your timezone", "Your availability", "Your rate", "Review and accept"];

const INPUT_CLS =
  "mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] text-[#0B1F25] outline-none transition focus:border-[#2A8FCC] focus:ring-2 focus:ring-[#2A8FCC33] disabled:opacity-60";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold tracking-wide" style={{ color: TOKENS.inkSoft }}>
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[12px]" style={{ color: TOKENS.muted }}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-[13px] font-medium text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full px-7 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: TOKENS.teal }}
    >
      {children}
    </button>
  );
}

export default function InterpreterFlow() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  // About you
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ridNumber, setRidNumber] = useState("");
  const [yearsFluent, setYearsFluent] = useState("");
  const [yearsInterpreting, setYearsInterpreting] = useState("");
  const [aboutErrors, setAboutErrors] = useState<Record<string, string>>({});

  // Timezone
  const [tzDetected, setTzDetected] = useState("");
  const [tzChoice, setTzChoice] = useState("");
  const [tzPickerOpen, setTzPickerOpen] = useState(false);

  // Availability
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [availabilityError, setAvailabilityError] = useState("");

  // Rate + notes
  const [rate, setRate] = useState("");
  const [rateError, setRateError] = useState("");
  const [rateChecking, setRateChecking] = useState(false);
  const [notes, setNotes] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Connection check
  const engineRef = useRef<Engine>({
    started: false,
    running: false,
    startedAtMs: 0,
    cycles: 0,
    nextDownBytes: START_DOWN_BYTES,
    downs: [],
    ups: [],
    pings: [],
    failures: 0,
    totalDownBytes: 0,
    totalUpBytes: 0,
  });
  const [speedView, setSpeedView] = useState<SpeedView>({
    down: null,
    up: null,
    ping: null,
    samples: 0,
    running: true,
    failed: false,
  });
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    setMounted(true);
    const clock = setInterval(() => setNowMs(Date.now()), 1000);
    setNowMs(Date.now());

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      setTzDetected(tz);
      setTzChoice((prev) => prev || tz);
    } catch {
      /* picker still works */
    }

    const e = engineRef.current;
    if (!e.started) {
      // Deliberately never cancelled on unmount: the page is standalone, and
      // the loop stops itself at MAX_TEST_SECONDS or on successful submit.
      e.started = true;
      e.running = true;
      e.startedAtMs = Date.now();
      const publish = () => {
        setSpeedView({
          down: median(e.downs.map((d) => d.mbps)),
          up: median(e.ups.map((u) => u.mbps)),
          ping: median(e.pings) === null ? null : Math.round(median(e.pings)!),
          samples: e.downs.length + e.ups.length,
          running: e.running,
          failed:
            e.downs.length + e.ups.length + e.pings.length === 0 &&
            e.failures >= 6,
        });
      };
      (async () => {
        while (e.running) {
          const elapsed = (Date.now() - e.startedAtMs) / 1000;
          if (elapsed >= MAX_TEST_SECONDS) break;
          await samplePing(e);
          await sampleDown(e);
          if (e.cycles % 2 === 1) await sampleUp(e);
          e.cycles++;
          publish();
          // After enough samples the picture is stable: keep the check alive
          // but lighter for the rest of the five-minute window.
          await sleep(e.downs.length >= 10 ? SLOW_CYCLE_GAP_MS : CYCLE_GAP_MS);
        }
        e.running = false;
        publish();
      })();
    }
    return () => clearInterval(clock);
  }, []);

  const elapsedSec = mounted && engineRef.current.startedAtMs
    ? Math.floor((nowMs - engineRef.current.startedAtMs) / 1000)
    : 0;
  const testSecondsLeft = Math.max(0, MIN_TEST_SECONDS - elapsedSec);

  const allTzs = useMemo(() => {
    try {
      const sup = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.(
        "timeZone"
      );
      if (sup && sup.length) return sup;
    } catch {
      /* fall through */
    }
    return COMMON_TZS;
  }, []);

  const tz = tzChoice || CONFERENCE_TZ;
  const tzIsChicagoClock = useMemo(() => (mounted ? sameClockAsChicago(tz) : true), [mounted, tz]);

  const clockLabel = useMemo(() => {
    if (!mounted || !nowMs) return "";
    try {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZone: tz,
      }).format(new Date(nowMs));
    } catch {
      return "";
    }
  }, [mounted, nowMs, tz]);

  function validateAbout(): boolean {
    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) errs.fullName = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Please enter a valid email address.";
    if (!phone.trim()) errs.phone = "Please enter a phone number we can reach you at.";
    if (!ridNumber.trim()) errs.ridNumber = "Please enter your RID member number.";
    const yf = Math.round(Number(yearsFluent));
    if (!yearsFluent.trim() || !Number.isFinite(yf) || yf < 0 || yf > 90)
      errs.yearsFluent = "Please enter a number of years.";
    const yi = Math.round(Number(yearsInterpreting));
    if (!yearsInterpreting.trim() || !Number.isFinite(yi) || yi < 0 || yi > 90)
      errs.yearsInterpreting = "Please enter a number of years.";
    setAboutErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function toggleSlot(id: string) {
    setAvailabilityError("");
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setDay(day: (typeof ASL_DAYS)[number], on: boolean) {
    setAvailabilityError("");
    setSelected((prev) => {
      const next = new Set(prev);
      for (const slot of slotsForDay(day)) {
        if (on) next.add(slot.id);
        else next.delete(slot.id);
      }
      return next;
    });
  }

  function parseRateCents(): number | null {
    const cleaned = rate.replace(/[$,\s]/g, "");
    const n = Number(cleaned);
    if (!cleaned || !Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  }

  async function continueFromRate() {
    const cents = parseRateCents();
    if (cents === null) {
      setRateError("Please enter your hourly rate in dollars.");
      return;
    }
    setRateChecking(true);
    setRateError("");
    try {
      const res = await fetch("/api/asl/fee-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyCents: cents }),
      });
      if (res.ok) {
        setStep(5);
      } else {
        const j = await res.json().catch(() => ({}));
        setRateError(j?.error || "Please check your rate and try again.");
      }
    } catch {
      setRateError("We could not verify your rate just now. Please try again.");
    } finally {
      setRateChecking(false);
    }
  }

  async function submit() {
    const cents = parseRateCents();
    if (cents === null) {
      setStep(4);
      setRateError("Please enter your hourly rate in dollars.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    const e = engineRef.current;
    const body = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      ridNumber: ridNumber.trim(),
      yearsFluent: Math.round(Number(yearsFluent)),
      yearsInterpreting: Math.round(Number(yearsInterpreting)),
      timezone: tz,
      availability: Array.from(selected),
      hourlyCents: cents,
      notes: notes.trim(),
      speed: {
        downMbps: median(e.downs.map((d) => d.mbps)),
        upMbps: median(e.ups.map((u) => u.mbps)),
        pingMs: median(e.pings),
        seconds: Math.min(Math.floor((Date.now() - e.startedAtMs) / 1000), MAX_TEST_SECONDS),
        detail: {
          downs: e.downs.slice(-20),
          ups: e.ups.slice(-20),
          pings: e.pings.slice(-40).map((p) => Math.round(p)),
          failures: e.failures,
          totalDownBytes: e.totalDownBytes,
          totalUpBytes: e.totalUpBytes,
        },
      },
    };
    try {
      const res = await fetch("/api/asl/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        e.running = false;
        setDone(true);
        return;
      }
      const j = await res.json().catch(() => ({}));
      if (res.status === 422) {
        setStep(4);
        setRateError(j?.error || "Please check your rate.");
      } else {
        setSubmitError(j?.error || "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function localRangeLabel(daySlots: AslSlot[]): string {
    const chosen = daySlots.filter((s) => selected.has(s.id));
    if (!chosen.length) return "";
    const ranges: { from: AslSlot; to: AslSlot }[] = [];
    for (const slot of chosen) {
      const last = ranges[ranges.length - 1];
      if (last && slot.hourCT === last.to.hourCT + 1) last.to = slot;
      else ranges.push({ from: slot, to: slot });
    }
    return ranges
      .map((r) => `${slotTimeLabel(r.from, tz)} to ${slotTimeLabel(r.to, tz, true)}`)
      .join(", ");
  }

  const speedPill = (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium"
      style={{ borderColor: TOKENS.hairline, background: TOKENS.paper, color: TOKENS.inkSoft }}
      title="A quick connection check runs in the background while you fill this out. It helps us plan video interpreting."
    >
      <span
        className={`h-2 w-2 rounded-full ${speedView.running ? "animate-pulse" : ""}`}
        style={{ background: speedView.failed ? "#DC2626" : speedView.running ? TOKENS.gold : "#16A34A" }}
        aria-hidden
      />
      {!mounted
        ? "Connection check"
        : speedView.failed
          ? "Connection check not responding"
          : speedView.running
            ? speedView.down !== null
              ? `Checking connection · ${speedView.down} Mbps`
              : "Checking connection"
            : speedView.down !== null
              ? `Connection check done · ${speedView.down} Mbps`
              : "Connection check done"}
    </div>
  );

  const stepCount = 5;
  const progressPct = done ? 100 : step === 0 ? 0 : (step / stepCount) * 100;

  return (
    <div
      className="min-h-screen px-4 py-8 sm:py-14"
      style={{
        background: `radial-gradient(1200px 500px at 85% -10%, ${TOKENS.blueDeep}55, transparent 60%), linear-gradient(175deg, ${TOKENS.tealDark} 0%, ${TOKENS.tealDeep} 100%)`,
      }}
    >
      <div className="mx-auto w-full max-w-2xl">
        <p
          className="mb-5 text-center text-[12px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#CFE3E9" }}
        >
          {CONFERENCE.name}
        </p>

        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Progress + connection status */}
          <div className="border-b px-6 py-4 sm:px-9" style={{ borderColor: TOKENS.hairline }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-semibold" style={{ color: TOKENS.muted }}>
                {done
                  ? "All set"
                  : step === 0
                    ? "ASL interpreter invitation"
                    : `Step ${step} of ${stepCount} · ${STEP_TITLES[step]}`}
              </span>
              {speedPill}
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full" style={{ background: TOKENS.tealSoft }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: TOKENS.gold }}
              />
            </div>
          </div>

          <div className="px-6 py-8 sm:px-9 sm:py-10">
            {done ? (
              <div className="text-center">
                <div
                  className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: TOKENS.tealSoft }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      stroke={TOKENS.teal}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: TOKENS.ink }}>
                  Thank you, {fullName.trim().split(/\s+/)[0] || "friend"}.
                </h1>
                <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: TOKENS.inkSoft }}>
                  Your acceptance is in. We will email you shortly to confirm your hours and the
                  day-of details. If anything changes before the conference, write to{" "}
                  <a href={`mailto:${CONFERENCE.contactEmail}`} className="font-semibold underline" style={{ color: TOKENS.blueDeep }}>
                    {CONFERENCE.contactEmail}
                  </a>
                  .
                </p>
                <p className="mt-4 text-[13px]" style={{ color: TOKENS.muted }}>
                  Spotted a mistake? Open this page again and resubmit with the same email; the
                  newer answers replace the old ones.
                </p>
              </div>
            ) : step === 0 ? (
              <div>
                <h1 className="text-[28px] font-bold leading-tight sm:text-[32px]" style={{ color: TOKENS.ink }}>
                  Will you interpret with us?
                </h1>
                <div className="mt-2 h-[3px] w-14 rounded-full" style={{ background: TOKENS.gold }} />
                <p className="mt-5 text-[15px] leading-relaxed" style={{ color: TOKENS.inkSoft }}>
                  You are invited to join the ASL interpreting team for the{" "}
                  <strong>{CONFERENCE.name}</strong>: {CONFERENCE.theme}. Sessions run{" "}
                  <strong>Saturday, August 15 and Sunday, August 16</strong> at {CONFERENCE.venueShort} in
                  Chicago, with a virtual audience watching the livestream.
                </p>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: TOKENS.inkSoft }}>
                  This short form is how you accept. It covers who you are, which hours you can
                  cover on each day, and your hourly rate. It takes about five minutes.
                </p>
                <div
                  className="mt-5 rounded-xl border px-4 py-3.5 text-[13.5px] leading-relaxed"
                  style={{ borderColor: TOKENS.hairline, background: TOKENS.paper, color: TOKENS.muted }}
                >
                  While you fill this out, we run a quick connection check in the background. Remote
                  interpreting happens over live video, so this helps us plan who can cover the
                  stream. Nothing is installed and it stops on its own.
                </div>
                <div className="mt-7">
                  <PrimaryButton onClick={() => setStep(1)}>Begin</PrimaryButton>
                </div>
              </div>
            ) : step === 1 ? (
              <div>
                <h2 className="text-xl font-bold" style={{ color: TOKENS.ink }}>
                  About you
                </h2>
                <p className="mt-1.5 text-[14px]" style={{ color: TOKENS.muted }}>
                  So we can credential you and reach you quickly around the event.
                </p>
                <div className="mt-6 grid gap-5">
                  <Field label="Full name" error={aboutErrors.fullName}>
                    <input
                      className={INPUT_CLS}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      placeholder="First and last name"
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Email" error={aboutErrors.email}>
                      <input
                        className={INPUT_CLS}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                    </Field>
                    <Field label="Mobile phone" error={aboutErrors.phone}>
                      <input
                        className={INPUT_CLS}
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        placeholder="(555) 555-5555"
                      />
                    </Field>
                  </div>
                  <Field
                    label="RID member number"
                    hint="Your Registry of Interpreters for the Deaf member number."
                    error={aboutErrors.ridNumber}
                  >
                    <input
                      className={INPUT_CLS}
                      value={ridNumber}
                      onChange={(e) => setRidNumber(e.target.value)}
                      placeholder="e.g. 45210"
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Years fluent in ASL" error={aboutErrors.yearsFluent}>
                      <input
                        className={INPUT_CLS}
                        type="number"
                        min={0}
                        max={90}
                        inputMode="numeric"
                        value={yearsFluent}
                        onChange={(e) => setYearsFluent(e.target.value)}
                        placeholder="e.g. 15"
                      />
                    </Field>
                    <Field label="Years interpreting in ASL" error={aboutErrors.yearsInterpreting}>
                      <input
                        className={INPUT_CLS}
                        type="number"
                        min={0}
                        max={90}
                        inputMode="numeric"
                        value={yearsInterpreting}
                        onChange={(e) => setYearsInterpreting(e.target.value)}
                        placeholder="e.g. 8"
                      />
                    </Field>
                  </div>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-[14px] font-medium"
                    style={{ color: TOKENS.muted }}
                    onClick={() => setStep(0)}
                  >
                    Back
                  </button>
                  <PrimaryButton onClick={() => validateAbout() && setStep(2)}>Continue</PrimaryButton>
                </div>
              </div>
            ) : step === 2 ? (
              <div>
                <h2 className="text-xl font-bold" style={{ color: TOKENS.ink }}>
                  Verify your timezone
                </h2>
                <p className="mt-1.5 text-[14px]" style={{ color: TOKENS.muted }}>
                  The conference runs on Chicago time. Once your timezone is confirmed, the next
                  step shows every hour in your own local time.
                </p>
                <div
                  className="mt-6 rounded-xl border px-5 py-6 text-center"
                  style={{ borderColor: TOKENS.hairline, background: TOKENS.paper }}
                >
                  <p className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: TOKENS.muted }}>
                    {tz === tzDetected ? "We detected your timezone as" : "Selected timezone"}
                  </p>
                  <p className="mt-1 text-[17px] font-bold" style={{ color: TOKENS.ink }}>
                    {mounted ? tz.replace(/_/g, " ") : ""}
                  </p>
                  <p className="mt-3 text-[30px] font-bold tabular-nums" style={{ color: TOKENS.teal }}>
                    {clockLabel || "…"}
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: TOKENS.muted }}>
                    If this clock matches the time where you will be that weekend, you are set.
                  </p>
                </div>
                {tzPickerOpen ? (
                  <div className="mt-4">
                    <Field label="Choose your timezone">
                      <select className={INPUT_CLS} value={tz} onChange={(e) => setTzChoice(e.target.value)}>
                        {!allTzs.includes(tz) ? <option value={tz}>{tz}</option> : null}
                        <optgroup label="Common">
                          {COMMON_TZS.map((z) => (
                            <option key={`c-${z}`} value={z}>
                              {z.replace(/_/g, " ")}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="All timezones">
                          {allTzs.map((z) => (
                            <option key={z} value={z}>
                              {z.replace(/_/g, " ")}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </Field>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="mt-4 text-[14px] font-semibold underline"
                    style={{ color: TOKENS.blueDeep }}
                    onClick={() => setTzPickerOpen(true)}
                  >
                    That is not my timezone
                  </button>
                )}
                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-[14px] font-medium"
                    style={{ color: TOKENS.muted }}
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <PrimaryButton onClick={() => setStep(3)} disabled={!mounted || !tz}>
                    This clock is right, continue
                  </PrimaryButton>
                </div>
              </div>
            ) : step === 3 ? (
              <div>
                <h2 className="text-xl font-bold" style={{ color: TOKENS.ink }}>
                  Which hours can you cover?
                </h2>
                <p className="mt-1.5 text-[14px]" style={{ color: TOKENS.muted }}>
                  Check every hour you are available to interpret.
                  {!tzIsChicagoClock
                    ? ` Times are shown in your local time (${tz.replace(/_/g, " ")}), with Chicago time underneath.`
                    : " All times are Chicago time."}
                </p>
                {ASL_DAYS.map((day) => {
                  const daySlots = slotsForDay(day);
                  const chosen = daySlots.filter((s) => selected.has(s.id)).length;
                  return (
                    <div key={day.key} className="mt-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-[15px] font-bold" style={{ color: TOKENS.ink }}>
                          {day.label}
                          <span className="ml-2 text-[13px] font-medium" style={{ color: TOKENS.muted }}>
                            {chosen} of {daySlots.length} hours
                          </span>
                        </h3>
                        <div className="flex gap-3 text-[13px] font-semibold">
                          <button type="button" style={{ color: TOKENS.blueDeep }} onClick={() => setDay(day, true)}>
                            Select all
                          </button>
                          <button type="button" style={{ color: TOKENS.muted }} onClick={() => setDay(day, false)}>
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {daySlots.map((slot) => {
                          const on = selected.has(slot.id);
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggleSlot(slot.id)}
                              className="rounded-lg border px-3 py-2.5 text-left text-[13.5px] transition"
                              style={
                                on
                                  ? { background: TOKENS.teal, borderColor: TOKENS.teal, color: "#fff" }
                                  : { background: "#fff", borderColor: TOKENS.hairline, color: TOKENS.inkSoft }
                              }
                            >
                              <span className="block font-semibold">
                                {mounted ? (
                                  <>
                                    {slotWeekdayLabel(slot, tz)} {slotTimeLabel(slot, tz)} to{" "}
                                    {slotTimeLabel(slot, tz, true)}
                                  </>
                                ) : (
                                  "…"
                                )}
                              </span>
                              {mounted && !tzIsChicagoClock ? (
                                <span className="mt-0.5 block text-[11.5px]" style={{ color: on ? "#D8E8ED" : TOKENS.mutedSoft }}>
                                  {slotTimeLabel(slot, CONFERENCE_TZ)} to {slotTimeLabel(slot, CONFERENCE_TZ, true)} CT
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {availabilityError ? (
                  <p className="mt-4 text-[13px] font-medium text-red-600" role="alert">
                    {availabilityError}
                  </p>
                ) : null}
                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-[14px] font-medium"
                    style={{ color: TOKENS.muted }}
                    onClick={() => setStep(2)}
                  >
                    Back
                  </button>
                  <PrimaryButton
                    onClick={() => {
                      if (!selected.size) {
                        setAvailabilityError("Please check at least one hour, or write to us if none of these work.");
                        return;
                      }
                      setStep(4);
                    }}
                  >
                    Continue
                  </PrimaryButton>
                </div>
              </div>
            ) : step === 4 ? (
              <div>
                <h2 className="text-xl font-bold" style={{ color: TOKENS.ink }}>
                  Your rate
                </h2>
                <p className="mt-1.5 text-[14px]" style={{ color: TOKENS.muted }}>
                  Tell us your hourly rate for this event. We pay per interpreted hour.
                </p>
                <div className="mt-6 max-w-xs">
                  <Field label="Hourly rate (USD)" error={rateError}>
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute left-3.5 top-1/2 mt-[3px] -translate-y-1/2 text-[15px] font-semibold"
                        style={{ color: TOKENS.muted }}
                      >
                        $
                      </span>
                      <input
                        className={`${INPUT_CLS} pl-8`}
                        inputMode="decimal"
                        value={rate}
                        onChange={(e) => {
                          setRate(e.target.value);
                          setRateError("");
                        }}
                        placeholder="0.00"
                        aria-label="Hourly rate in US dollars"
                      />
                    </div>
                  </Field>
                </div>
                <div className="mt-6">
                  <Field label="Anything else we should know? (optional)">
                    <textarea
                      className={INPUT_CLS}
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Teaming preferences, breaks, equipment, travel notes…"
                    />
                  </Field>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-[14px] font-medium"
                    style={{ color: TOKENS.muted }}
                    onClick={() => setStep(3)}
                  >
                    Back
                  </button>
                  <PrimaryButton onClick={continueFromRate} disabled={rateChecking}>
                    {rateChecking ? "Checking…" : "Continue"}
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold" style={{ color: TOKENS.ink }}>
                  Review and accept
                </h2>
                <p className="mt-1.5 text-[14px]" style={{ color: TOKENS.muted }}>
                  One last look before you send it.
                </p>
                <dl className="mt-6 grid gap-4 text-[14.5px]">
                  {[
                    ["Name", fullName.trim(), 1],
                    ["Email", email.trim(), 1],
                    ["Phone", phone.trim(), 1],
                    ["RID member number", ridNumber.trim(), 1],
                    ["Fluent in ASL", `${yearsFluent} year${yearsFluent === "1" ? "" : "s"}`, 1],
                    ["Interpreting in ASL", `${yearsInterpreting} year${yearsInterpreting === "1" ? "" : "s"}`, 1],
                    ["Timezone", tz.replace(/_/g, " "), 2],
                    ["Hourly rate", rate ? `$${rate.replace(/[$\s]/g, "")}` : "", 4],
                  ].map(([label, value, target]) => (
                    <div key={label as string} className="flex items-start justify-between gap-4 border-b pb-3" style={{ borderColor: TOKENS.hairline }}>
                      <div>
                        <dt className="text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: TOKENS.muted }}>
                          {label}
                        </dt>
                        <dd className="mt-0.5 font-medium" style={{ color: TOKENS.ink }}>
                          {value || "…"}
                        </dd>
                      </div>
                      <button
                        type="button"
                        className="text-[13px] font-semibold"
                        style={{ color: TOKENS.blueDeep }}
                        onClick={() => setStep(target as number)}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                  <div className="flex items-start justify-between gap-4 border-b pb-3" style={{ borderColor: TOKENS.hairline }}>
                    <div>
                      <dt className="text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: TOKENS.muted }}>
                        Availability · {selected.size} hour{selected.size === 1 ? "" : "s"}
                      </dt>
                      {ASL_DAYS.map((day) => {
                        const label = localRangeLabel(slotsForDay(day));
                        return label ? (
                          <dd key={day.key} className="mt-0.5 font-medium" style={{ color: TOKENS.ink }}>
                            {day.label.split(",")[0]}: {label}
                            {!tzIsChicagoClock ? " (your time)" : ""}
                          </dd>
                        ) : null;
                      })}
                    </div>
                    <button
                      type="button"
                      className="text-[13px] font-semibold"
                      style={{ color: TOKENS.blueDeep }}
                      onClick={() => setStep(3)}
                    >
                      Edit
                    </button>
                  </div>
                  <div>
                    <dt className="text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: TOKENS.muted }}>
                      Connection check
                    </dt>
                    <dd className="mt-0.5 font-medium" style={{ color: TOKENS.ink }}>
                      {speedView.down !== null ? `${speedView.down} Mbps down` : "measuring…"}
                      {speedView.up !== null ? ` · ${speedView.up} Mbps up` : ""}
                      {speedView.ping !== null ? ` · ${speedView.ping} ms ping` : ""}
                    </dd>
                  </div>
                </dl>
                {submitError ? (
                  <p className="mt-4 text-[13.5px] font-medium text-red-600" role="alert">
                    {submitError}
                  </p>
                ) : null}
                <p className="mt-5 text-[12.5px] leading-relaxed" style={{ color: TOKENS.muted }}>
                  By accepting, you agree that we may contact you by email or phone to schedule and
                  confirm your interpreting hours for August 15 and 16.
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-[14px] font-medium"
                    style={{ color: TOKENS.muted }}
                    onClick={() => setStep(4)}
                  >
                    Back
                  </button>
                  <PrimaryButton onClick={submit} disabled={submitting || testSecondsLeft > 0}>
                    {submitting
                      ? "Sending…"
                      : testSecondsLeft > 0
                        ? `Connection check finishing · ${testSecondsLeft}s`
                        : "Accept the invitation"}
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[12.5px]" style={{ color: "#B7D0D8" }}>
          Questions? Write to{" "}
          <a href={`mailto:${CONFERENCE.contactEmail}`} className="font-semibold underline">
            {CONFERENCE.contactEmail}
          </a>
          . {CONFERENCE.venueName} · {CONFERENCE.venueAddress}
        </p>
      </div>
    </div>
  );
}
