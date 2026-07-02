"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

type Field =
  | { key: string; label: string; type: "text" | "textarea"; placeholder?: string; hint?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] };

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

export default function LogisticsForm({
  token, kind, initial,
}: {
  token: string;
  kind: "food" | "asl";
  initial: Record<string, string> | null;
}) {
  const fields = kind === "asl" ? ASL_FIELDS : FOOD_FIELDS;
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

  return (
    <div>
      <div className="text-sm font-semibold text-slate-700">
        {kind === "asl" ? "Interpretation details" : "Food details"}
      </div>
      <p className="text-xs text-slate-500 mt-0.5">
        Fill in whatever you can now; you can come back and update it anytime.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3">
        {fields.map((f) => (
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
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
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
