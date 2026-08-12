"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Check, Mail, Users, Calendar, MapPin, Award, Monitor,
} from "lucide-react";
import {
  C, WizardShell, StepFrame, Question, TextInput, TextArea, ToggleRow,
  PrimaryButton, InlineError, Hint, useEnterKey,
} from "@/components/funnel/Wizard";

// Ten free in-person seats for AALB alumni and current students.
//
// The questions are the point. A scholarship form that asks for a name and a
// tick box gathers nothing to decide on, and then the decision gets made on who
// applied first, which is not a decision. These ask three things that are
// genuinely hard to answer without having done the work: what you have seen,
// why this room, and what happens after. They are open-ended and unhurried, and
// the form says plainly that they are what gets read.
//
// Eligibility is checked first, against the training roster we already hold, so
// nobody writes three paragraphs and is then told they are not eligible.

type Step = "intro" | "check" | "about" | "answers" | "practical" | "review" | "done";

const AWARD_COUNT = 10;

type Verdict = {
  eligible: boolean;
  standing: "alumni" | "student" | "former" | "unknown";
  firstName: string;
  lastName: string;
  cohort: string | null;
  message: string;
  alreadyApplied: string | null;
};

type Form = {
  firstName: string;
  lastName: string;
  phone: string;
  currentRole: string;
  languages: string;
  whyAttend: string;
  barrierSeen: string;
  whatTheyWillDo: string;
  costBarrier: string;
  accessibility: string;
  dietary: string;
  virtualInstead: boolean;
};

const EMPTY: Form = {
  firstName: "", lastName: "", phone: "", currentRole: "", languages: "",
  whyAttend: "", barrierSeen: "", whatTheyWillDo: "", costBarrier: "",
  accessibility: "", dietary: "", virtualInstead: false,
};

const STEPS: Step[] = ["intro", "check", "about", "answers", "practical", "review"];

export default function ScholarshipFunnel() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [email, setEmail] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setF = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function toTop() {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError(null);
    const i = STEPS.indexOf(step);
    if (i <= 0) { router.push("/"); return; }
    setStep(STEPS[i - 1]);
    toTop();
  }

  async function check() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter the email address you trained with us under.");
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/scholarship?email=${encodeURIComponent(email.trim())}`);
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Could not check that address."); return; }
      setVerdict(j);
      if (j.eligible && !j.alreadyApplied) {
        setForm((f) => ({
          ...f,
          firstName: f.firstName || j.firstName || "",
          lastName: f.lastName || j.lastName || "",
        }));
        setStep("about");
        toTop();
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  function fromAbout() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("We need your name for the seat.");
      return;
    }
    setError(null);
    setStep("answers");
    toTop();
  }

  function fromAnswers() {
    if (!form.whyAttend.trim() || !form.barrierSeen.trim() || !form.whatTheyWillDo.trim()) {
      setError("All three of these are read by the committee, so please answer each one.");
      return;
    }
    setError(null);
    setStep("practical");
    toTop();
  }

  useEnterKey(() => {
    if (step === "check") void check();
    else if (step === "about") fromAbout();
  }, step === "check" || step === "about");

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/scholarship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: email.trim() }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) { setError(j.error || "Could not send the application."); return; }
      setStep("done");
      toTop();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done") return <Done firstName={form.firstName} />;

  const idx = Math.max(0, STEPS.indexOf(step));

  return (
    <WizardShell eyebrow="Scholarship" current={idx} total={STEPS.length} onBack={back}>
      {step === "intro" && (
        <StepFrame stepKey="intro">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-5"
            style={{ background: "#E6EEF0", color: C.teal }}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="text-[12px] font-bold tracking-wide uppercase">
              {AWARD_COUNT} seats &middot; AALB alumni and students
            </span>
          </div>

          <Question
            title={<>A seat at the conference,<br />on us.</>}
            sub={`We are holding ${AWARD_COUNT} free in-person seats at the 2026 Lurie Children's & AALB Conference for people who trained with AALB. No fee, no deposit, nothing to pay back.`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
            <Fact icon={Calendar} label="August 15 and 16" sub="Both days" />
            <Fact icon={MapPin} label="Lurie Children's" sub="Streeterville, Chicago" />
            <Fact icon={Award} label="10+ CEU hours" sub="NBCMI, CCHI and RID" />
          </div>

          <div
            className="rounded-2xl p-5 mb-7"
            style={{ background: "white", border: `1.5px solid ${C.hairline}` }}
          >
            <div className="text-[13px] font-bold mb-2" style={{ color: C.ink }}>
              What we are asking for
            </div>
            <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
              Three questions, answered in your own words. They are about what you have seen in
              this work and what you would do with two days in a room full of the people who
              built this field. There is no word count and no right answer. We read every
              application ourselves, and these answers are what the decision is made on.
            </p>
          </div>

          <PrimaryButton onClick={() => { setStep("check"); toTop(); }}>Start</PrimaryButton>
          <Hint>Takes about ten minutes. You cannot save and come back, so set aside the time.</Hint>
        </StepFrame>
      )}

      {step === "check" && (
        <StepFrame stepKey="check">
          <Question
            title="First, let us find you."
            sub="These seats are for AALB alumni and current students. Use the email address you trained with us under, and we will check the roster. Nothing to upload."
          />
          <TextInput
            label="Your email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.org"
            autoFocus
            required
          />
          <InlineError message={error} />

          {verdict && !verdict.eligible && (
            <div
              className="mt-5 rounded-2xl p-5"
              style={{ background: "#FFF9EC", border: "1.5px solid #EBDCB6" }}
            >
              <div className="text-[13.5px] font-bold mb-1.5" style={{ color: "#7C5C10" }}>
                We could not confirm this address
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: "#7C5C10" }}>
                {verdict.message}
              </p>
              <a
                href="mailto:contact@aalb.org?subject=Scholarship%20eligibility"
                className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-bold"
                style={{ color: C.teal }}
              >
                <Mail className="w-4 h-4" /> contact@aalb.org
              </a>
            </div>
          )}

          {verdict?.alreadyApplied && (
            <div
              className="mt-5 rounded-2xl p-5"
              style={{ background: "#E6EEF0", border: `1.5px solid ${C.teal}33` }}
            >
              <div className="text-[13.5px] font-bold mb-1" style={{ color: C.teal }}>
                You have already applied
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                We have your application from{" "}
                {new Date(verdict.alreadyApplied).toLocaleDateString("en-US", {
                  month: "long", day: "numeric",
                })}
                . One each, and yours is in. If something has changed, write to contact@aalb.org
                rather than applying again.
              </p>
            </div>
          )}

          <div className="mt-6">
            <PrimaryButton onClick={check} loading={checking}>Check my eligibility</PrimaryButton>
          </div>
        </StepFrame>
      )}

      {step === "about" && verdict && (
        <StepFrame stepKey="about">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4"
            style={{ background: "#ECFDF5", color: "#047857" }}
          >
            <Check className="w-3.5 h-3.5" />
            <span className="text-[12px] font-bold">
              {verdict.message}
              {verdict.cohort ? ` Session ${verdict.cohort}.` : ""}
            </span>
          </div>

          <Question
            title="Tell us who you are now."
            sub="Since you trained with us, things will have moved on. This is the part we do not know."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput label="First name" value={form.firstName} onChange={(v) => setF("firstName", v)} required />
            <TextInput label="Last name" value={form.lastName} onChange={(v) => setF("lastName", v)} required />
          </div>
          <TextInput
            label="What are you doing now?"
            value={form.currentRole}
            onChange={(v) => setF("currentRole", v)}
            placeholder="Staff interpreter at a clinic, freelance, still studying, working outside the field…"
          />
          <Hint>Including &ldquo;not interpreting at the moment&rdquo;. It is not held against anyone.</Hint>
          <TextInput
            label="Which languages do you work in?"
            value={form.languages}
            onChange={(v) => setF("languages", v)}
            placeholder="Spanish and English, ASL, Arabic…"
          />
          <TextInput
            label="Phone"
            value={form.phone}
            onChange={(v) => setF("phone", v)}
            type="tel"
            placeholder="Only if you are awarded a seat"
          />
          <InlineError message={error} />
          <div className="mt-6">
            <PrimaryButton onClick={fromAbout}>Continue</PrimaryButton>
          </div>
        </StepFrame>
      )}

      {step === "answers" && (
        <StepFrame stepKey="answers">
          <Question
            title="Now the three that matter."
            sub="Take your time. Nobody is counting words, and a plain answer from someone who has been in the room beats a polished one that has not."
          />

          <TextArea
            label="Describe a moment when a language barrier changed what happened to a patient."
            value={form.barrierSeen}
            onChange={(v) => setF("barrierSeen", v)}
            rows={6}
            placeholder="Something you witnessed or were part of. No names, no identifying details."
          />
          <Hint>
            Please leave out anything that could identify a patient. We are asking what you saw
            happen, not who it happened to.
          </Hint>

          <div className="mt-7">
            <TextArea
              label="Why this conference, and why now?"
              value={form.whyAttend}
              onChange={(v) => setF("whyAttend", v)}
              rows={6}
              placeholder="What are you hoping to come away with, or which session made you apply?"
            />
          </div>

          <div className="mt-7">
            <TextArea
              label="What would you do with it afterwards?"
              value={form.whatTheyWillDo}
              onChange={(v) => setF("whatTheyWillDo", v)}
              rows={6}
              placeholder="Something concrete, in your own setting or your own community. Small counts."
            />
            <Hint>
              This is the one that decides most of it. A seat given away twice over, once to you
              and once to whoever you take it back to, is the seat we are trying to give.
            </Hint>
          </div>

          <InlineError message={error} />
          <div className="mt-7">
            <PrimaryButton onClick={fromAnswers}>Continue</PrimaryButton>
          </div>
        </StepFrame>
      )}

      {step === "practical" && (
        <StepFrame stepKey="practical">
          <Question
            title="A few practical things."
            sub="None of these are required, and none of them count against you."
          />

          <TextArea
            label="Is cost the reason you are applying? Tell us about it if you would like to."
            value={form.costBarrier}
            onChange={(v) => setF("costBarrier", v)}
            rows={4}
            placeholder="Optional. Only if it helps us understand your situation."
          />
          <Hint>Left blank is fine. Nobody has to make a case for needing this.</Hint>

          <div className="mt-7">
            <ToggleRow
              title="I would rather have a virtual seat"
              desc="Chicago is not possible for me, but I would still attend online. Virtual seats are unlimited, so saying yes does not use up one of the ten."
              checked={form.virtualInstead}
              onToggle={() => setF("virtualInstead", !form.virtualInstead)}
              icon={Monitor}
            />
          </div>

          <div className="mt-7">
            <TextInput
              label="Any access needs we should plan for?"
              value={form.accessibility}
              onChange={(v) => setF("accessibility", v)}
              placeholder="ASL, captioning, seating, a quiet space between sessions…"
            />
            <TextInput
              label="Anything we should know about food?"
              value={form.dietary}
              onChange={(v) => setF("dietary", v)}
              placeholder="Allergies, or what you do not eat. Lunch is meat free both days."
            />
          </div>

          <InlineError message={error} />
          <div className="mt-7">
            <PrimaryButton onClick={() => { setError(null); setStep("review"); toTop(); }}>Review it</PrimaryButton>
          </div>
        </StepFrame>
      )}

      {step === "review" && (
        <StepFrame stepKey="review">
          <Question
            title="Read it back before you send."
            sub="Once it is in, it is in. You can go back and change anything."
          />

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "white", border: `1.5px solid ${C.hairline}` }}
          >
            <Row label="Name" value={`${form.firstName} ${form.lastName}`.trim()} />
            <Row label="Email" value={email} />
            {form.currentRole && <Row label="Doing now" value={form.currentRole} />}
            {form.languages && <Row label="Languages" value={form.languages} />}
            <Row label="A barrier you saw" value={form.barrierSeen} long />
            <Row label="Why this conference" value={form.whyAttend} long />
            <Row label="What you would do after" value={form.whatTheyWillDo} long />
            {form.costBarrier && <Row label="On cost" value={form.costBarrier} long />}
            {form.virtualInstead && <Row label="Seat" value="Virtual instead of in person" />}
            {form.accessibility && <Row label="Access" value={form.accessibility} />}
            {form.dietary && <Row label="Food" value={form.dietary} />}
          </div>

          <InlineError message={error} />
          <div className="mt-7">
            <PrimaryButton onClick={submit} loading={submitting} icon={Check}>Send my application</PrimaryButton>
          </div>
          <Hint>You will get an email confirming we have it.</Hint>
        </StepFrame>
      )}
    </WizardShell>
  );
}

function Fact({ icon: Icon, label, sub }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl px-4 py-3.5" style={{ background: "white", border: `1.5px solid ${C.hairline}` }}>
      <Icon className="w-4 h-4 mb-2" style={{ color: C.gold }} />
      <div className="text-[13.5px] font-bold leading-tight" style={{ color: C.ink }}>{label}</div>
      <div className="text-[11.5px] mt-0.5" style={{ color: C.mutedSoft }}>{sub}</div>
    </div>
  );
}

function Row({ label, value, long }: { label: string; value: string; long?: boolean }) {
  return (
    <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.hairline}` }}>
      <div className="text-[10.5px] font-bold uppercase tracking-wider mb-1" style={{ color: C.mutedSoft }}>
        {label}
      </div>
      <div
        className={`text-[14px] leading-relaxed ${long ? "whitespace-pre-wrap" : ""}`}
        style={{ color: C.ink }}
      >
        {value}
      </div>
    </div>
  );
}

function Done({ firstName }: { firstName: string }) {
  const first = (firstName || "").trim();
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-16"
      style={{
        background: `radial-gradient(120% 75% at 50% -8%, rgba(201,161,75,0.10), transparent 60%), ${C.paper}`,
      }}
    >
      <div className="w-full max-w-lg text-center">
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-6"
          style={{ background: "#ECFDF5", color: "#047857" }}
        >
          <Check className="w-7 h-7" strokeWidth={2.5} />
        </div>
        <h1 className="text-[30px] sm:text-[36px] font-bold tracking-tight leading-tight" style={{ color: C.ink }}>
          {first ? `Thank you, ${first}.` : "Thank you."}
        </h1>
        <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: C.muted }}>
          Your application is in, and a confirmation is on its way to your inbox. Every application
          is read by the committee after applications close, and everyone hears back either way.
        </p>
        <div
          className="mt-7 rounded-2xl px-5 py-4 text-left"
          style={{ background: "white", border: `1.5px solid ${C.hairline}` }}
        >
          <div className="flex items-start gap-3">
            <Users className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.gold }} />
            <p className="text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
              You do not have to wait on the outcome to register. Registrations are non-refundable,
              so if you are set on coming either way, write to us before you pay and we will tell you
              where your application stands.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="mailto:contact@aalb.org?subject=Scholarship%20application"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-bold text-white"
              style={{ background: C.teal }}
            >
              <Mail className="w-3.5 h-3.5" /> Email us first
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-bold bg-white"
              style={{ border: `1.5px solid ${C.hairline}`, color: C.inkSoft }}
            >
              <Monitor className="w-3.5 h-3.5" /> Back to the conference
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
