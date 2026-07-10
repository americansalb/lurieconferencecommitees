"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

type Field =
  | { key: string; label: string; type: "text" | "textarea"; placeholder?: string; hint?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; hint?: string };

// The complimentary-tickets / attendance questions, shown to every in-kind
// sponsor first: Food and ASL sponsorships include two seats (see TIERS), so
// we invite them to claim both.
const ATTEND_FIELDS: Field[] = [
  { key: "attend", label: "Will you join us at the conference?", type: "select", options: [
    { value: "", label: "Let us know…" },
    { value: "Yes, in person", label: "Yes — in person in Chicago" },
    { value: "Yes, online", label: "Yes — online" },
    { value: "Not sure yet", label: "Not sure yet" },
    { value: "Can't attend this year", label: "Can't make it this year" },
  ] },
  { key: "attendeeName", label: "Who is the first ticket for?", type: "text", placeholder: "Name for your first complimentary ticket" },
  { key: "attendeeEmail", label: "Their email", type: "text", placeholder: "Where we'll send the ticket" },
  { key: "attendee2Name", label: "Who is the second ticket for?", type: "text", placeholder: "Name for your second ticket (optional)" },
  { key: "attendee2Email", label: "Their email", type: "text", placeholder: "Where we'll send the second ticket" },
];

// The coordination questions, per kind. Food and ASL sponsors see different
// fields; the answers are saved as a flat string map on the sponsor record.
const FOOD_FIELDS: Field[] = [
  { key: "provide", label: "What you'll provide", type: "textarea", placeholder: "e.g. A tray of vegan entrées for lunch, about 60 servings", hint: "We expect about 70–80 attendees in person, so even part of a meal goes a long way." },
  { key: "day", label: "Which day", type: "select", options: [
    { value: "", label: "Select a day…" },
    { value: "Saturday, August 15", label: "Saturday, August 15 (9:30 AM–6:30 PM)" },
    { value: "Sunday, August 16", label: "Sunday, August 16 (9:00 AM–4:00 PM)" },
    { value: "Either day", label: "Either day works" },
  ] },
  { key: "meal", label: "Which meal", type: "text", placeholder: "e.g. Lunch, breakfast, reception" },
  { key: "fulfillment", label: "Delivery or pickup", type: "select", options: [
    { value: "", label: "Select…" },
    { value: "We'll deliver to Lurie Children's", label: "We'll deliver to Lurie Children's" },
    { value: "Please arrange pickup", label: "Please arrange pickup from us" },
  ] },
  { key: "window", label: "Drop-off / pickup window", type: "text", placeholder: "e.g. 10:30–11:00 AM" },
  { key: "dayOfContact", label: "Day-of contact", type: "text", placeholder: "Name and cell number for the day" },
  { key: "allergens", label: "Ingredient & allergen notes", type: "textarea", placeholder: "Nuts, gluten, soy, etc., per dish, so we can serve everyone safely" },
  { key: "setup", label: "Setup needs", type: "textarea", placeholder: "Serving equipment, warming, power, table space" },
];

const ASL_FIELDS: Field[] = [
  { key: "coverage", label: "Coverage you can provide", type: "textarea", placeholder: "Which sessions, day, or hours your interpreters can cover", hint: "About 70–80 attendees in person plus a virtual audience, across Saturday, August 15 and Sunday, August 16." },
  { key: "interpreters", label: "Interpreters", type: "text", placeholder: "How many, and any team or relay preferences" },
  { key: "mode", label: "On-site or remote", type: "select", options: [
    { value: "", label: "Select…" },
    { value: "On-site", label: "On-site, in person" },
    { value: "Remote (VRI)", label: "Remote (VRI)" },
  ] },
  { key: "equipment", label: "Equipment / sightline needs", type: "text", placeholder: "Anything your team needs to work well" },
  { key: "dayOfContact", label: "Day-of contact", type: "text", placeholder: "Name and cell number for the day" },
  { key: "materials", label: "Materials to send in advance", type: "textarea", placeholder: "Agenda, slides, or a glossary, so your interpreters can prepare" },
];

// Welcome Kit sponsors (invite-only, remote presence): what we need is their
// brochure and, on the Spotlight tier, the contact details we announce to
// virtual attendees. No ticket section — these tiers include none.
const WELCOME_FIELDS: Field[] = [
  { key: "brochure", label: "Your brochure", type: "select", options: [
    { value: "", label: "How will you get it to us?" },
    { value: "We'll ship printed brochures", label: "We'll ship printed brochures to you" },
    { value: "We'll send print-ready artwork", label: "We'll send print-ready artwork for you to print" },
    { value: "Not sure yet", label: "Not sure yet — let's coordinate by email" },
  ], hint: "We expect about 70–80 in-person attendees; one insert goes into every welcome kit." },
  { key: "brochureNotes", label: "Brochure notes", type: "textarea", placeholder: "Format, size, quantity you can send, shipping timing — anything we should know" },
];
const SPOTLIGHT_FIELDS: Field[] = [
  { key: "spotlightContact", label: "How should virtual attendees reach you?", type: "text", placeholder: "e.g. info@yourorg.com · (800) 555-0100", hint: "We'll share your name, website, and this contact right before the virtual networking session." },
  { key: "spotlightNotes", label: "Anything you'd like mentioned", type: "textarea", placeholder: "A sentence about your services, an offer for attendees — optional" },
];

export default function LogisticsForm({
  token, kind, initial,
}: {
  token: string;
  kind: "food" | "asl" | "welcome-kit" | "welcome-kit-plus";
  initial: Record<string, string> | null;
}) {
  const isWelcome = kind === "welcome-kit" || kind === "welcome-kit-plus";
  const detailFields =
    kind === "asl" ? ASL_FIELDS
    : kind === "welcome-kit" ? WELCOME_FIELDS
    : kind === "welcome-kit-plus" ? [...WELCOME_FIELDS, ...SPOTLIGHT_FIELDS]
    : FOOD_FIELDS;
  // The complimentary-ticket section only applies to food/ASL (two seats each);
  // Welcome Kit tiers include no tickets.
  const attendFields = isWelcome ? [] : ATTEND_FIELDS;
  const fields = [...attendFields, ...detailFields];
  const seed = () => {
    const o: Record<string, string> = {};
    for (const f of fields) o[f.key] = initial?.[f.key] || "";
    return o;
  };
  const [values, setValues] = useState<Record<string, string>>(seed);
  const [saved, setSaved] = useState<Record<string, string>>(seed);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dirty = fields.some((f) => (values[f.key] || "").trim() !== (saved[f.key] || "").trim());
  const set = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  async function save() {
    setErr(null);
    setBusy(true);
    setDone(false);
    try {
      const res = await fetch("/api/sponsors/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, logistics: values }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not save those details.");
      setSaved({ ...values });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save those details.");
    } finally {
      setBusy(false);
    }
  }

  const renderField = (f: Field) => (
    <label key={f.key} className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{f.label}</span>
      {f.type === "textarea" ? (
        <textarea
          value={values[f.key]}
          onChange={(e) => set(f.key, e.target.value)}
          placeholder={f.placeholder}
          rows={2}
          className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 resize-y"
        />
      ) : f.type === "select" ? (
        <select
          value={values[f.key]}
          onChange={(e) => set(f.key, e.target.value)}
          className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 bg-white"
        >
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={values[f.key]}
          onChange={(e) => set(f.key, e.target.value)}
          placeholder={f.placeholder}
          className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
        />
      )}
      {"hint" in f && f.hint ? <span className="mt-1 block text-[11px] text-slate-400">{f.hint}</span> : null}
    </label>
  );

  return (
    <div>
      {!isWelcome && (
        <>
          <div className="text-sm font-semibold text-slate-700">Your seats at the conference</div>
          <p className="text-xs text-slate-500 mt-0.5">
            Your sponsorship includes two complimentary tickets — we&rsquo;d love to have you there, in person or online. Entirely optional.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {ATTEND_FIELDS.map(renderField)}
          </div>
        </>
      )}

      <div className={`text-sm font-semibold text-slate-700 ${isWelcome ? "" : "mt-5 pt-4 border-t border-slate-200/70"}`}>
        {kind === "asl" ? "Interpretation details" : isWelcome ? "Welcome kit details" : "Food details"}
      </div>
      <p className="text-xs text-slate-500 mt-0.5">
        Fill in whatever you can now; you can come back and update it anytime.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3">
        {detailFields.map(renderField)}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
          style={{ background: "#0E5566" }}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save details
        </button>
        {done && <span className="text-xs font-semibold text-emerald-600">Saved</span>}
        {err && <span className="text-xs text-rose-600">{err}</span>}
      </div>
    </div>
  );
}
