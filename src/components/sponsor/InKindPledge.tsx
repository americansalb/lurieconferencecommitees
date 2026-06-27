"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Heart, UtensilsCrossed, Accessibility } from "lucide-react";

const TEAL = "#0E5566";
const TEAL_DEEP = "#0C3B4B";
const GOLD = "#C9A14B";

export type InKind = "food" | "asl";

type Props = {
  kind: InKind;
  token: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  alreadyPledged: boolean;
};

const CONFIG = {
  food: {
    Icon: UtensilsCrossed,
    eyebrow: "In-Kind Sponsorship · Vegan & Vegetarian Food",
    sponsorLabel: "Food Sponsor",
    title: (
      <>Help us feed a fully<br />plant-based conference.</>
    ),
    body: (company: string) => (
      <>This will be our <strong className="text-white">third meat-free conference in a row</strong>. A gathering devoted to making sure no one goes unheard should not put meat on the table, and an all-plant-based event of this size is only possible with kitchens like <strong className="text-white">{company}</strong>.</>
    ),
    cardTitle: "What could you provide?",
    cardSub: "A rough idea is perfect, we’ll sort the details together.",
    fieldLabel: "Your plant-based offering",
    fieldPlaceholder: "e.g. 50 vegan sandwiches and a big salad, or trays of tacos for ~100",
    qtyLabel: "Estimated servings (optional)",
    qtyPlaceholder: "e.g. 75",
    arrangements: [
      { id: "donate", label: "We’ll donate it", sub: "Our gift to the conference" },
      { id: "partial", label: "Donate part, you buy the rest", sub: "However the math works for us" },
      { id: "discuss", label: "Let’s talk it through", sub: "We’d like to discuss the options" },
    ],
    submit: "Confirm your in-kind food sponsorship",
    recognition: "in-kind food donations",
  },
  asl: {
    Icon: Accessibility,
    eyebrow: "In-Kind Sponsorship · ASL Interpretation",
    sponsorLabel: "ASL Interpreter Sponsor",
    title: (
      <>Help us keep the conference<br />fully accessible in ASL.</>
    ),
    body: (company: string) => (
      <>This is a conference about making sure no one goes unheard, and that has to include our Deaf and hard-of-hearing attendees. Keeping every session interpreted in American Sign Language is only possible with interpreters from teams like <strong className="text-white">{company}</strong>.</>
    ),
    cardTitle: "What could you provide?",
    cardSub: "A rough idea is perfect, we’ll sort the schedule together.",
    fieldLabel: "Interpreting you could donate",
    fieldPlaceholder: "e.g. two certified ASL interpreters for one day, or a team across both days",
    qtyLabel: "Interpreters or hours (optional)",
    qtyPlaceholder: "e.g. 2 interpreters, both days",
    arrangements: [
      { id: "donate", label: "We’ll donate the interpreting", sub: "Our gift to the conference" },
      { id: "partial", label: "Donate some hours, you cover the rest", sub: "However it works for our team" },
      { id: "discuss", label: "Let’s talk it through", sub: "We’d like to discuss the options" },
    ],
    submit: "Confirm your in-kind ASL sponsorship",
    recognition: "in-kind donations of services",
  },
} as const;

export default function InKindPledge(props: Props) {
  const c = CONFIG[props.kind];
  const [done, setDone] = useState(props.alreadyPledged);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [provide, setProvide] = useState("");
  const [servings, setServings] = useState("");
  const [arrangement, setArrangement] = useState("donate");
  const [contactName, setContactName] = useState(props.contactName);
  const [contactEmail, setContactEmail] = useState(props.contactEmail);
  const [contactPhone, setContactPhone] = useState(props.contactPhone);

  async function submit() {
    if (!provide.trim()) { setError("Please tell us what you could provide."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sponsors/inkind-pledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: props.token, provide, servings, arrangement,
          contactName, contactEmail, contactPhone,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error || "Something went wrong. Please try again."); return; }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#f6f8fa 0%,#eef3f4 100%)" }}>
      <div style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)` }}>
        <div className="max-w-2xl mx-auto px-5 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: GOLD }}>
            <c.Icon className="w-4 h-4" /> {c.eyebrow}
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white leading-tight">{c.title}</h1>
          <div className="mx-auto my-5 h-[3px] w-12 rounded-full" style={{ background: GOLD }} />
          <p className="text-[15px] leading-relaxed text-white/85 max-w-xl mx-auto">{c.body(props.companyName)}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 -mt-8 pb-16">
        {done ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center" style={{ boxShadow: "0 16px 40px -24px rgba(11,31,37,0.3)" }}>
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: "#ECFDF5" }}>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">You&rsquo;re an {c.sponsorLabel}. Thank you.</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 max-w-md mx-auto">
              {props.companyName} is on our sponsor list, and our team will reach out shortly to coordinate the details. Nothing is final until we talk, so there&rsquo;s no pressure on the specifics yet. We&rsquo;re grateful.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: TEAL }}>
              <Heart className="w-4 h-4" style={{ color: GOLD }} /> 2026 Lurie Children&rsquo;s &amp; AALB Conference
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8" style={{ boxShadow: "0 16px 40px -24px rgba(11,31,37,0.3)" }}>
            <div className="flex items-center gap-2 text-slate-900">
              <c.Icon className="w-5 h-5" style={{ color: TEAL }} />
              <h2 className="text-lg font-extrabold">{c.cardTitle}</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">{c.cardSub}</p>

            <label className="block mt-5 text-[11px] font-bold uppercase tracking-wide text-slate-500">{c.fieldLabel}</label>
            <textarea
              value={provide}
              onChange={(e) => setProvide(e.target.value)}
              rows={3}
              placeholder={c.fieldPlaceholder}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 resize-none"
            />

            <label className="block mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-500">{c.qtyLabel}</label>
            <input
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder={c.qtyPlaceholder}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
            />

            <label className="block mt-5 text-[11px] font-bold uppercase tracking-wide text-slate-500">How would you like to do it?</label>
            <div className="mt-2 grid gap-2">
              {c.arrangements.map((a) => {
                const active = arrangement === a.id;
                return (
                  <button type="button" key={a.id} onClick={() => setArrangement(a.id)}
                    className={`text-left rounded-xl border px-4 py-3 transition-colors ${active ? "border-teal-500 bg-teal-50/60" : "border-slate-200 hover:bg-slate-50"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border-[5px] ${active ? "border-teal-600" : "border-slate-300"}`} />
                      <span className="text-sm font-bold text-slate-800">{a.label}</span>
                    </div>
                    <div className="text-[12px] text-slate-500 ml-6">{a.sub}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Who should we coordinate with?</div>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact name" className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500" />
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone (optional)" className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500" />
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email" className="sm:col-span-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500" />
            </div>

            {error && <div className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

            <button onClick={submit} disabled={submitting}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)` }}>
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <c.Icon className="w-5 h-5" />}
              {c.submit}
            </button>
            <p className="mt-3 text-[12px] text-center text-slate-400">
              {c.recognition.charAt(0).toUpperCase() + c.recognition.slice(1)} are tax-deductible to a 501(c)(3) (EINs 83-3016421 and 36-2170833). A donation receipt is available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
