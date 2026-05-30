"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ArrowRight, Loader2 } from "lucide-react";

import { useProposalForm, type Form } from "./useProposalForm";
import { SpeakerCard, EXEMPLAR } from "./SpeakerCard";
import { InputColumn } from "./InputColumn";

const TEAL = "#0E4456";
const TEAL_DARK = "#0A3F4D";
const TEAL_DEEP = "#0C3B4B";
const GOLD = "#C9A14B";
const GOLD_SOFT = "#F4E9CD";
const MUTED = "#5A6E76";

const SESSION_STORAGE_KEY = "proposal:lastCard";

export default function ProposalFunnel() {
  const api = useProposalForm();
  const [submitting, setSubmitting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [showMobileCard, setShowMobileCard] = useState(false);
  const [pulseMobile, setPulseMobile] = useState(false);
  // Surface field-level error styling only after the user has tried to send.
  // Pre-submit, everything reads as "in progress".
  const [revealErrors, setRevealErrors] = useState(false);
  const router = useRouter();

  // While nothing real has been entered, render the exemplar in the preview.
  const displayedForm = useMemo<Form>(() => {
    const empty =
      !api.form.name && !api.form.talkTitle && !api.form.talkAbstract && !api.form.headshotDataUrl;
    return empty ? EXEMPLAR : api.form;
  }, [api.form]);

  const isExemplar = displayedForm === EXEMPLAR;

  // Pulse the mobile peek bar whenever the form changes meaningfully.
  useEffect(() => {
    if (isExemplar) return;
    setPulseMobile(true);
    const t = setTimeout(() => setPulseMobile(false), 600);
    return () => clearTimeout(t);
  }, [
    api.form.name, api.form.talkTitle, api.form.talkAbstract, api.form.headshotDataUrl,
    api.form.sessionFormat, api.form.sessionLength, api.form.sessionTrack, api.form.preferredDay,
    api.form.bio, api.form.affiliation, api.form.jobTitle, api.form.pronouns, api.form.learningObjectives,
    isExemplar,
  ]);

  async function submit() {
    setError(null);
    const missing = api.validate();
    if (missing.length > 0) {
      setRevealErrors(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      // Surface the first missing field to the user in plain words.
      const labels: Record<string, string> = {
        name: "your name",
        email: "a valid email",
        talkTitle: "a working title",
        talkAbstract: "an abstract",
      };
      setError("Almost there. We still need " + labels[missing[0]] + ".");
      const el = document.querySelector<HTMLInputElement>(`[data-scene] input, [data-scene] textarea`);
      if (el) el.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/presenters/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Could not send. Please try again.");
        setSubmitting(false);
        return;
      }
      // Snapshot the card so the success page can render it as its hero.
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(api.form));
      } catch { /* private mode, ignore */ }
      // Play the print transition, then route.
      setPrinting(true);
      setTimeout(() => router.push(`/proposal/success/${json.token}`), 1100);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="relative min-h-screen"
      style={{ background: TEAL_DARK }}
    >
      {/* Background layers */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DARK} 55%, ${TEAL_DEEP} 100%)` }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 70% 25%, rgba(201,161,75,0.18) 0%, rgba(201,161,75,0.04) 40%, transparent 70%)`,
        }}
      />

      {/* Sticky top strip */}
      <div className="sticky top-0 z-30">
        <div
          className="backdrop-blur-md"
          style={{
            background: "rgba(10,63,77,0.82)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/70 hover:text-white">
              <ChevronLeft className="w-3 h-3" />
              Conference
            </Link>
            <CompletenessMeter value={api.completeness} />
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/55 tabular-nums">
              {String(api.completeness).padStart(2, "0")}% READY
            </span>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-32 lg:pb-20">
        {/* Page intro */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.24em] uppercase mb-5 border"
            style={{
              color: "#F4E9CD",
              borderColor: "rgba(201,161,75,0.45)",
              background: "rgba(201,161,75,0.08)",
            }}
          >
            Call for proposals
          </div>
          <h1
            className="font-serif-display text-white text-[40px] sm:text-[56px] leading-[1.02] tracking-tight font-bold"
          >
            Make the page.
          </h1>
          <p className="mt-3 text-white/75 text-sm sm:text-base">
            Type on the left. The card on the right becomes your speaker page if the program team books you.
          </p>
        </div>

        {/* Split */}
        <AnimatePresence>
          {!printing && (
            <motion.div
              key="split"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start"
            >
              {/* Left: inputs */}
              <div className="relative">
                <InputColumn
                  api={api}
                  missingSet={revealErrors ? new Set(api.missing) : new Set()}
                  onPhotoError={setError}
                />
              </div>

              {/* Right: card */}
              <div className="hidden lg:block sticky top-24">
                <CardWithPrint isPrinting={printing}>
                  <SpeakerCard
                    form={displayedForm}
                    isExemplar={isExemplar}
                    shake={shake}
                  />
                </CardWithPrint>

                {/* Submit pill anchored to the card */}
                <div className="flex justify-center mt-6">
                  <SubmitButton
                    onClick={submit}
                    disabled={submitting}
                    isValid={api.isValid}
                  />
                </div>

                {error && (
                  <div className="mt-4 text-center text-[12px] font-semibold" style={{ color: "#fecaca" }}>
                    {error}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Print transition stage */}
        <AnimatePresence>
          {printing && (
            <motion.div
              key="print"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center px-6"
              style={{ background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)` }}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1.0 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                <SpeakerCard form={api.form} isExemplar={false} />
                {/* Print sweep */}
                <motion.div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none rounded-[20px] overflow-hidden"
                  initial={{ opacity: 1 }}
                >
                  <motion.div
                    initial={{ y: "-100%" }}
                    animate={{ y: "120%" }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                    className="absolute inset-x-0 h-24"
                    style={{
                      background: `linear-gradient(180deg, rgba(201,161,75,0) 0%, rgba(201,161,75,0.40) 50%, rgba(201,161,75,0) 100%)`,
                    }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile peek + sheet */}
      {!printing && (
        <MobilePeek
          show={!showMobileCard}
          pulse={pulseMobile}
          form={displayedForm}
          onTap={() => setShowMobileCard(true)}
        />
      )}
      <AnimatePresence>
        {showMobileCard && !printing && (
          <MobileSheet
            form={displayedForm}
            isExemplar={isExemplar}
            onClose={() => setShowMobileCard(false)}
            onSubmit={submit}
            isValid={api.isValid}
            submitting={submitting}
            error={error}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CompletenessMeter({ value }: { value: number }) {
  return (
    <div className="flex-1 max-w-[200px] mx-3 hidden sm:block">
      <div
        className="relative h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <motion.span
          className="absolute inset-y-0 left-0"
          animate={{ width: `${value}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 24 }}
          style={{
            background: `linear-gradient(90deg, ${GOLD} 0%, #2A8FCC 100%)`,
            boxShadow: `0 0 12px ${GOLD}55`,
          }}
        />
      </div>
    </div>
  );
}

function CardWithPrint({ children }: { isPrinting: boolean; children: React.ReactNode }) {
  return <div className="relative">{children}</div>;
}

function SubmitButton({
  onClick, disabled, isValid,
}: {
  onClick: () => void;
  disabled: boolean;
  isValid: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      animate={isValid ? { boxShadow: [
        "0 14px 34px -12px rgba(201,161,75,0.55)",
        "0 14px 34px -12px rgba(201,161,75,0.90)",
        "0 14px 34px -12px rgba(201,161,75,0.55)",
      ] } : undefined}
      transition={isValid ? { duration: 1.6, repeat: 2 } : {}}
      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-[15px] transition-all disabled:opacity-60"
      style={{
        background: `linear-gradient(135deg, #E8C56F 0%, ${GOLD} 100%)`,
        color: "#3C2E10",
        opacity: isValid ? 1 : 0.85,
      }}
    >
      {disabled
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending&hellip;</>
        : <>Send your speaker card <ArrowRight className="w-4 h-4" /></>}
    </motion.button>
  );
}

function MobilePeek({
  show, pulse, form, onTap,
}: {
  show: boolean;
  pulse: boolean;
  form: Form;
  onTap: () => void;
}) {
  if (!show) return null;
  const title = form.talkTitle || "Your working title";
  return (
    <button
      type="button"
      onClick={onTap}
      className="lg:hidden fixed bottom-3 inset-x-3 z-20 flex items-center gap-3 p-3 rounded-2xl"
      style={{
        background: "rgba(10,40,52,0.96)",
        border: "1px solid rgba(201,161,75,0.20)",
        boxShadow: "0 20px 50px -20px rgba(0,0,0,0.55)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full overflow-hidden shrink-0"
        style={{ background: "#F4E9CD20", border: `1px solid ${GOLD}` }}
      >
        {form.headshotDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.headshotDataUrl} alt="" className="w-full h-full object-cover" />
        ) : null}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-[9px] font-bold tracking-[0.24em] uppercase" style={{ color: GOLD }}>
          Your speaker card
        </div>
        <div className="text-[13px] font-bold text-white truncate font-serif-display">
          {title}
        </div>
      </div>
      <motion.span
        animate={pulse ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.6 }}
        transition={pulse ? { duration: 0.7 } : {}}
        className="absolute top-0 inset-x-3 h-px"
        style={{ background: GOLD, boxShadow: `0 0 6px ${GOLD}` }}
      />
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>
        Preview
      </span>
    </button>
  );
}

function MobileSheet({
  form, isExemplar, onClose, onSubmit, isValid, submitting, error,
}: {
  form: Form;
  isExemplar: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isValid: boolean;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <motion.div
      key="sheet"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 180, damping: 24 }}
      className="lg:hidden fixed inset-0 z-50 flex flex-col"
      style={{ background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)` }}
    >
      <div className="flex items-center justify-between px-4 h-12">
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/70"
        >
          Keep editing
        </button>
        <span className="text-[10px] tracking-[0.24em] uppercase" style={{ color: GOLD_SOFT }}>
          Your card
        </span>
        <span className="w-12" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-2">
        <SpeakerCard form={form} isExemplar={isExemplar} />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4" style={{ background: `linear-gradient(180deg, transparent 0%, ${TEAL_DEEP} 60%)` }}>
        <SubmitButton onClick={onSubmit} disabled={submitting} isValid={isValid} />
        {error && (
          <div className="mt-2 text-center text-[12px] font-semibold" style={{ color: "#fecaca" }}>
            {error}
          </div>
        )}
      </div>
    </motion.div>
  );
}
