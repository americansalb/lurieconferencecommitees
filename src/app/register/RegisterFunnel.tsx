"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Monitor, User, Mail, Sparkles, Calendar, CreditCard,
  UtensilsCrossed, Accessibility, Languages, Pencil, Check, Tag, X, Loader2,
} from "lucide-react";
import {
  C, WizardShell, StepFrame, Question, TextInput, TextArea, ChoiceCard,
  PrimaryButton, InlineError, Hint, useEnterKey,
} from "@/components/funnel/Wizard";

type Mode = "in-person" | "virtual";

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  primaryLanguages: string;
  attendanceMode: Mode | "";
  accessibilityNotes: string;
  dietary: string;
};

const EMPTY: Form = {
  firstName: "", lastName: "", email: "", phone: "",
  primaryLanguages: "", attendanceMode: "",
  accessibilityNotes: "", dietary: "",
};

const STEPS = ["Attendance", "Your name", "Contact", "Personalize", "Review"];
const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function RegisterFunnel({
  tierLabel, tierEnd, inPersonPrice, virtualPrice,
}: {
  tierLabel: string;
  tierEnd: string;
  inPersonPrice: number;
  virtualPrice: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Discount code: entered on the review step, validated server-side so the
  // shown total always matches what the server will charge.
  const [codeInput, setCodeInput] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ code: string; label: string; finalCents: number; discountCents: number } | null>(null);

  const price = form.attendanceMode === "in-person" ? inPersonPrice
    : form.attendanceMode === "virtual" ? virtualPrice : null;
  const isInPerson = form.attendanceMode === "in-person";

  async function applyCode() {
    const code = codeInput.trim();
    if (!code) return;
    setCodeBusy(true);
    setCodeError(null);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, attendanceMode: form.attendanceMode }),
      });
      const json = await res.json();
      if (json.ok) {
        setApplied({ code: json.code, label: json.label, finalCents: json.finalCents, discountCents: json.discountCents });
        setCodeError(null);
      } else {
        setApplied(null);
        setCodeError(json.error || "That code isn't valid.");
      }
    } catch {
      setCodeError("Couldn't check that code. Try again.");
    } finally {
      setCodeBusy(false);
    }
  }

  function clearCode() {
    setApplied(null);
    setCodeInput("");
    setCodeError(null);
  }

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function goBack() {
    setError(null);
    if (step === 0) { router.push("/"); return; }
    setStep((s) => s - 1);
  }

  // Picking a mode auto-advances after a beat so the selection registers.
  function pickMode(m: Mode) {
    set("attendanceMode", m);
    setError(null);
    setTimeout(() => setStep(1), 360);
  }

  const next = useCallback(() => {
    setError(null);
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        setError("Please share your first and last name.");
        return;
      }
    }
    if (step === 2) {
      if (!emailOk(form.email)) {
        setError("That email doesn't look right, we'll send your ticket there.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, form]);

  async function submit() {
    setError(null);
    if (!form.attendanceMode || !form.firstName.trim() || !form.lastName.trim() || !emailOk(form.email)) {
      setError("Something's missing above. Use Edit to fix it.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/attendees/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, discountCode: applied?.code || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error || "Could not start checkout. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Network hiccup. Please try again.");
      setSubmitting(false);
    }
  }

  // Enter advances on the simple input steps.
  useEnterKey(next, step === 1 || step === 2);

  // Pin to Chicago time so the 11:59 PM CDT cutoff never renders as the next day.
  const tierEndDate = new Date(tierEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/Chicago" });

  return (
    <WizardShell eyebrow="Register" current={step} total={STEPS.length} onBack={goBack}>
      {/* STEP 0: attendance mode */}
      {step === 0 && (
        <StepFrame stepKey={0}>
          <Question
            title={<>Reserve your seat.</>}
            sub={<>August 15 and 16, 2026 · Lurie Children&rsquo;s, Chicago. {tierLabel} pricing through {tierEndDate}.</>}
          />
          <div className="grid grid-cols-1 gap-3 wiz-stagger">
            <ChoiceCard
              selected={isInPerson}
              accent={C.teal}
              icon={MapPin}
              title="In person"
              tagline="Join us in Chicago"
              price={`$${inPersonPrice}`}
              features={["Lunch + materials", "CEU certificate", "Session recordings after"]}
              onClick={() => pickMode("in-person")}
            />
            <ChoiceCard
              selected={form.attendanceMode === "virtual"}
              accent={C.blue}
              icon={Monitor}
              title="Virtual"
              tagline="Attend from anywhere"
              price={`$${virtualPrice}`}
              features={["Live stream", "CEU certificate", "On-demand replays"]}
              onClick={() => pickMode("virtual")}
            />
          </div>
          <Hint>Tap a card to continue. You can change this later.</Hint>
        </StepFrame>
      )}

      {/* STEP 1: name */}
      {step === 1 && (
        <StepFrame stepKey={1}>
          <Question title={<>What&rsquo;s your name?</>} sub="The name that goes on your badge and CEU certificate." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput label="First name" required value={form.firstName} onChange={(v) => set("firstName", v)} autoFocus />
            <TextInput label="Last name" required value={form.lastName} onChange={(v) => set("lastName", v)} />
          </div>
          <InlineError message={error} />
          <div className="mt-7">
            <PrimaryButton onClick={next}>Continue</PrimaryButton>
          </div>
          <Hint>Press Enter ↵ to continue</Hint>
        </StepFrame>
      )}

      {/* STEP 2: contact */}
      {step === 2 && (
        <StepFrame stepKey={2}>
          <Question title={<>Where can we reach you?</>} sub="Your ticket, receipt, and join link all go to your email." />
          <div className="space-y-3">
            <TextInput label="Email" required type="email" inputMode="email" value={form.email} onChange={(v) => set("email", v)} autoFocus placeholder="you@example.org" />
            <TextInput label="Phone (optional)" type="tel" inputMode="tel" value={form.phone} onChange={(v) => set("phone", v)} placeholder="For day-of updates only" />
          </div>
          <InlineError message={error} />
          <div className="mt-7">
            <PrimaryButton onClick={next}>Continue</PrimaryButton>
          </div>
          <Hint>Press Enter ↵ to continue</Hint>
        </StepFrame>
      )}

      {/* STEP 3: personalize (all optional) */}
      {step === 3 && (
        <StepFrame stepKey={3}>
          <Question
            title={<>Make it yours.</>}
            sub="All optional. Share anything that helps us host you well."
          />
          <div className="space-y-3 wiz-stagger">
            <div className="rounded-xl p-4 bg-white" style={{ border: `1.5px solid ${C.hairline}` }}>
              <div className="flex items-center gap-2 mb-2.5">
                <Languages className="w-4 h-4" style={{ color: C.teal }} />
                <span className="text-[13px] font-semibold" style={{ color: C.inkSoft }}>Languages you work in</span>
              </div>
              <TextInput label="" value={form.primaryLanguages} onChange={(v) => set("primaryLanguages", v)} placeholder="e.g. English, Spanish, ASL" />
            </div>
            <div className="rounded-xl p-4 bg-white" style={{ border: `1.5px solid ${C.hairline}` }}>
              <div className="flex items-center gap-2 mb-2.5">
                <Accessibility className="w-4 h-4" style={{ color: C.teal }} />
                <span className="text-[13px] font-semibold" style={{ color: C.inkSoft }}>Accessibility accommodations</span>
              </div>
              <TextArea label="" value={form.accessibilityNotes} onChange={(v) => set("accessibilityNotes", v)} rows={2} placeholder="ASL, captioning, mobility, seating, lighting, or anything that helps." />
            </div>
            {isInPerson && (
              <div className="rounded-xl p-4 bg-white" style={{ border: `1.5px solid ${C.hairline}` }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <UtensilsCrossed className="w-4 h-4" style={{ color: C.teal }} />
                  <span className="text-[13px] font-semibold" style={{ color: C.inkSoft }}>Dietary needs</span>
                </div>
                <TextInput label="" value={form.dietary} onChange={(v) => set("dietary", v)} placeholder="Vegetarian, vegan, halal, kosher, allergies…" />
              </div>
            )}
          </div>
          <div className="mt-7">
            <PrimaryButton onClick={next}>Continue to review</PrimaryButton>
          </div>
        </StepFrame>
      )}

      {/* STEP 4: review & pay */}
      {step === 4 && (
        <StepFrame stepKey={4}>
          <Question title={<>Look good?</>} sub="One tap to secure checkout. Refundable through July 15." />

          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: `1.5px solid ${C.hairline}`, boxShadow: "0 18px 44px -28px rgba(11,31,37,0.3)" }}>
            {/* attendance + price banner */}
            <div className="p-5 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealDeep} 100%)` }}>
              <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.14)", color: "white" }}>
                {isInPerson ? <MapPin className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              </span>
              <div className="flex-1">
                <div className="text-white font-bold text-[15px]">{isInPerson ? "In-person" : "Virtual"} registration</div>
                <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.7)" }}>{tierLabel} pricing · August 15 and 16, 2026</div>
              </div>
              <div className="text-right">
                {applied ? (
                  <>
                    <div className="text-[13px] line-through tabular-nums leading-none" style={{ color: "rgba(255,255,255,0.55)" }}>{price !== null ? `$${price}` : "..."}</div>
                    <div className="text-[30px] font-bold text-white tabular-nums leading-none mt-0.5">${(applied.finalCents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                  </>
                ) : (
                  <div className="text-[30px] font-bold text-white tabular-nums leading-none">{price !== null ? `$${price}` : "..."}</div>
                )}
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: C.hairline }}>
              <SummaryRow label="Name" value={`${form.firstName} ${form.lastName}`.trim() || "..."} onEdit={() => setStep(1)} />
              <SummaryRow label="Email" value={form.email || "..."} onEdit={() => setStep(2)} />
              {form.phone && <SummaryRow label="Phone" value={form.phone} onEdit={() => setStep(2)} />}
              {(form.primaryLanguages || form.accessibilityNotes || (isInPerson && form.dietary)) && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: C.mutedSoft }}>Preferences</span>
                    <button onClick={() => setStep(3)} className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: C.teal }}>
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.primaryLanguages && <Chip icon={Languages}>{form.primaryLanguages}</Chip>}
                    {form.accessibilityNotes && <Chip icon={Accessibility}>Accommodations noted</Chip>}
                    {isInPerson && form.dietary && <Chip icon={UtensilsCrossed}>{form.dietary}</Chip>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Discount code */}
          <div className="mt-4">
            {applied ? (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(16,133,102,0.08)", border: "1px solid rgba(16,133,102,0.25)" }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(16,133,102,0.15)" }}>
                  <Check className="w-4 h-4" style={{ color: "#0E8566" }} strokeWidth={3} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold" style={{ color: "#0B5C46" }}>
                    Code {applied.code} applied · {applied.label}
                  </div>
                  <div className="text-[12px]" style={{ color: C.muted }}>
                    You save ${(applied.discountCents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}.
                  </div>
                </div>
                <button onClick={clearCode} className="inline-flex items-center gap-1 text-[12px] font-semibold shrink-0" style={{ color: C.muted }}>
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-stretch gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.mutedSoft }} />
                    <input
                      value={codeInput}
                      onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCode(); } }}
                      placeholder="Discount code"
                      autoCapitalize="characters"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-[14px] font-semibold tracking-wide outline-none"
                      style={{ border: `1.5px solid ${codeError ? "#E0716A" : C.hairline}`, background: "white", color: C.ink }}
                    />
                  </div>
                  <button
                    onClick={applyCode}
                    disabled={codeBusy || !codeInput.trim()}
                    className="px-4 rounded-xl text-[13px] font-bold shrink-0 inline-flex items-center gap-1.5 disabled:opacity-50"
                    style={{ border: `1.5px solid ${C.teal}`, color: C.teal }}
                  >
                    {codeBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Apply
                  </button>
                </div>
                {codeError && <div className="text-[12px] mt-1.5 font-medium" style={{ color: "#C0564F" }}>{codeError}</div>}
              </div>
            )}
          </div>

          <InlineError message={error} />

          <div className="mt-6">
            <PrimaryButton onClick={submit} loading={submitting} icon={CreditCard}>Continue to secure checkout</PrimaryButton>
          </div>
          <Hint>
            Payment handled by Stripe. Your seat is reserved the moment payment clears.<br />
            Pay by check or invoice? Email{" "}
            <a className="font-semibold" style={{ color: C.teal }} href="mailto:contact@aalb.org">contact@aalb.org</a>.
          </Hint>
        </StepFrame>
      )}
    </WizardShell>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="px-5 py-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold tracking-wider uppercase" style={{ color: C.mutedSoft }}>{label}</div>
        <div className="text-[15px] font-semibold truncate" style={{ color: C.ink }}>{value}</div>
      </div>
      <button onClick={onEdit} className="inline-flex items-center gap-1 text-[12px] font-semibold shrink-0" style={{ color: C.teal }}>
        <Pencil className="w-3 h-3" /> Edit
      </button>
    </div>
  );
}

function Chip({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: C.teal + "0E", color: C.inkSoft, border: `1px solid ${C.teal}22` }}>
      <Icon className="w-3 h-3" /> {children}
    </span>
  );
}
