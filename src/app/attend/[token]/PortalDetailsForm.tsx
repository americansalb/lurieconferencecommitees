"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

// Post-payment logistics, collected in the portal where it can't cost a
// registration: these questions used to sit between the invite email and the
// pay button. All optional; saves through the same confirm endpoint the
// funnel uses.
export default function PortalDetailsForm({
  token,
  attendanceMode,
  initial,
}: {
  token: string;
  attendanceMode: string | null;
  initial: {
    phone: string;
    affiliation: string;
    primaryLanguages: string;
    needsParking: boolean | null;
    accessibilityNotes: string;
    dietary: string;
  };
}) {
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inPerson = attendanceMode === "in-person";

  function update<K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendees/confirm/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: data.phone || null,
          affiliation: data.affiliation || null,
          primaryLanguages: data.primaryLanguages || null,
          needsParking: data.needsParking,
          accessibilityNotes: data.accessibilityNotes || null,
          dietary: data.dietary || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Could not save. Try again.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const label = "block text-[11px] font-bold uppercase tracking-wider mb-1.5";
  const input = "w-full px-3 py-2.5 text-sm rounded-lg outline-none border transition-colors bg-white";
  const inputStyle = { borderColor: "#EAD9AE" } as const;

  return (
    <section className="mt-6">
      <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: "#8a744a" }}>
        Help us set you up
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "#5A6E76" }}>
        Two minutes, all optional{inPerson ? " — it shapes catering, parking, and accommodations" : " — it helps us support you on the stream"}.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className={label} style={{ color: "#8a744a" }}>Working language(s)</span>
          <input value={data.primaryLanguages} onChange={(e) => update("primaryLanguages", e.target.value)} placeholder="e.g. English, Spanish, ASL" className={input} style={inputStyle} />
        </div>
        <div>
          <span className={label} style={{ color: "#8a744a" }}>Organization</span>
          <input value={data.affiliation} onChange={(e) => update("affiliation", e.target.value)} placeholder="Where you work or study" className={input} style={inputStyle} />
        </div>
        <div className={inPerson ? "" : "sm:col-span-2"}>
          <span className={label} style={{ color: "#8a744a" }}>Phone</span>
          <input value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="For day-of updates only" className={input} style={inputStyle} />
        </div>
        {inPerson && (
          <div>
            <span className={label} style={{ color: "#8a744a" }}>Parking at Lurie Children&rsquo;s</span>
            <div className="grid grid-cols-3 gap-1.5">
              {([["Yes", true], ["No", false], ["Not sure", null]] as const).map(([l, v]) => (
                <button
                  key={l}
                  onClick={() => update("needsParking", v)}
                  className="py-2.5 rounded-lg border text-[13px] font-semibold transition-colors"
                  style={data.needsParking === v
                    ? { borderColor: "#0E5566", background: "#0E556610", color: "#0E5566" }
                    : { borderColor: "#EAD9AE", background: "#fff", color: "#5A6E76" }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
        {inPerson && (
          <div className="sm:col-span-2">
            <span className={label} style={{ color: "#8a744a" }}>Dietary preferences</span>
            <input value={data.dietary} onChange={(e) => update("dietary", e.target.value)} placeholder="Vegetarian, vegan, gluten-free, allergies…" className={input} style={inputStyle} />
          </div>
        )}
        <div className="sm:col-span-2">
          <span className={label} style={{ color: "#8a744a" }}>Accessibility accommodations</span>
          <textarea
            value={data.accessibilityNotes}
            onChange={(e) => update("accessibilityNotes", e.target.value)}
            placeholder="ASL interpreter, CART, DeafBlind support, wheelchair access, sensory-friendly space, anything else we should know."
            rows={2}
            className={input}
            style={inputStyle}
          />
        </div>
      </div>

      {error && <p className="mt-2 text-[12px] font-medium text-rose-600">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
        style={{ background: "#0E5566" }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved</> : "Save details"}
      </button>
    </section>
  );
}
