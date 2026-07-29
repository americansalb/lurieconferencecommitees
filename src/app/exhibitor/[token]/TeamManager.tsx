"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Plus, Trash2, Ticket, CreditCard, Copy, Users } from "lucide-react";

type Member = {
  id: string; name: string; email: string; comp: boolean; paid: boolean;
  status: string; attendanceMode: string | null; payUrl: string | null;
};
type Prefill = {
  firstName: string; lastName: string; email: string;
  dietary: string; accessibilityNotes: string;
};
type Data = {
  prefill: Prefill | null;
  company: string;
  tierName: string;
  seats: { allowance: number; used: number; remaining: number };
  team: Member[];
};

const TEAL = "#0E5566", GOLD = "#C99A2E", GREEN = "#059669";

export default function TeamManager({ token, shareUrl }: { token: string; shareUrl: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const BLANK = {
    firstName: "", lastName: "", email: "", attendanceMode: "in-person",
    phone: "", primaryLanguages: "", dietary: "", accessibilityNotes: "",
    needsParking: null as boolean | null,
  };
  const [form, setForm] = useState(BLANK);
  // True while the form is showing back what their application already told
  // us, so the copy asks them to confirm rather than to fill it in.
  const [confirming, setConfirming] = useState(false);
  const [justAdded, setJustAdded] = useState<{ comp: boolean; payUrl: string | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/sponsors/team/${token}`);
      if (r.ok) setData(await r.json());
      else setError((await r.json().catch(() => ({}))).error || "Could not load your list.");
    } catch {
      setError("Could not load your list.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Drop their application details into the form the first time we see them.
  const prefillKey = data?.prefill ? data.prefill.email + data.prefill.firstName : null;
  useEffect(() => {
    if (!data?.prefill) return;
    setForm((f) => ({
      ...f,
      firstName: data.prefill!.firstName,
      lastName: data.prefill!.lastName,
      email: data.prefill!.email,
      dietary: data.prefill!.dietary,
      accessibilityNotes: data.prefill!.accessibilityNotes,
    }));
    setConfirming(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillKey]);

  async function add() {
    setSaving(true);
    setError(null);
    setJustAdded(null);
    try {
      const r = await fetch(`/api/sponsors/team/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) { setError(j.error || "Could not add that person."); return; }
      setJustAdded({ comp: j.comp, payUrl: j.payUrl || null });
      setForm({ ...BLANK, attendanceMode: form.attendanceMode });
      setConfirming(false);
      await load();
    } catch {
      setError("Could not add that person.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/sponsors/team/${token}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  if (loading && !data) {
    return <div className="text-sm text-slate-400 animate-pulse py-10 text-center">Loading your list…</div>;
  }
  if (!data) {
    return <div className="text-sm text-rose-600 py-10 text-center">{error || "This link is no longer active."}</div>;
  }

  const { seats } = data;

  return (
    <div>
      {/* Seat allowance */}
      <div className="rounded-2xl bg-white p-5 mb-4" style={{ border: "1px solid #E2E8F0", boxShadow: "0 8px 22px -16px rgba(11,31,37,0.18)" }}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            Your tickets
          </div>
          <div className="text-[12px] text-slate-500">{data.tierName}</div>
        </div>
        {seats.allowance > 0 ? (
          <>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tabular-nums" style={{ color: seats.remaining > 0 ? TEAL : "#94a3b8" }}>
                {seats.remaining}
              </span>
              <span className="text-sm text-slate-600">
                of {seats.allowance} included {seats.allowance === 1 ? "ticket" : "tickets"} still available
              </span>
            </div>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: seats.allowance }, (_, i) => (
                <div key={i} className="h-2 flex-1 rounded-full" style={{ background: i < seats.used ? TEAL : "#E2E8F0" }} />
              ))}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Your level does not include complimentary tickets, but anyone you add below is registered under {data.company} and pays the standard rate.
          </p>
        )}
      </div>

      {/* The list */}
      <div className="rounded-2xl bg-white p-5 mb-4" style={{ border: "1px solid #E2E8F0", boxShadow: "0 8px 22px -16px rgba(11,31,37,0.18)" }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: TEAL }}>
          <Users className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Who is coming ({data.team.length})
        </div>
        {data.team.length === 0 ? (
          <p className="text-sm text-slate-500">Nobody added yet. Add your first person below.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.team.map((m) => (
              <li key={m.id} className="py-2.5 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                  <div className="text-xs text-slate-400">{m.email}</div>
                </div>
                {m.comp ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-1" style={{ background: "#E8F1F3", color: TEAL }}>
                    <Ticket className="w-3 h-3 inline mr-0.5 -mt-0.5" /> Included ticket
                  </span>
                ) : m.paid ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-1" style={{ background: "#ECFDF5", color: GREEN }}>
                    <Check className="w-3 h-3 inline mr-0.5 -mt-0.5" /> Registered
                  </span>
                ) : (
                  <a
                    href={m.payUrl || "#"}
                    className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-1"
                    style={{ background: "#FEF3C7", color: "#92400E" }}
                  >
                    <CreditCard className="w-3 h-3 inline mr-0.5 -mt-0.5" /> Needs to register
                  </a>
                )}
                <button
                  onClick={() => remove(m.id)}
                  title="Remove from your list"
                  className="text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add someone */}
      <div className="rounded-2xl bg-white p-5 mb-4" style={{ border: "1px solid #E2E8F0", boxShadow: "0 8px 22px -16px rgba(11,31,37,0.18)" }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: TEAL }}>
          {confirming ? "Confirm your table representative" : "Add someone"}
        </div>
        {confirming && (
          <p className="text-[12.5px] text-slate-500 mb-3">
            This is what you told us on your application. Change anything that has moved on, then confirm.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="First name"
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500"
          />
          <input
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Last name"
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            type="email"
            className="sm:col-span-2 px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500"
          />
          <div className="sm:col-span-2 flex gap-2">
            {(["in-person", "virtual"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setForm({ ...form, attendanceMode: mode })}
                className="flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-colors"
                style={form.attendanceMode === mode
                  ? { borderColor: TEAL, background: TEAL + "10", color: TEAL }
                  : { borderColor: "#E2E8F0", background: "#fff", color: "#64748B" }}
              >
                {mode === "in-person" ? "In person" : "Virtual"}
              </button>
            ))}
          </div>

          {/* The same questions every other attendee answers, so this person
              lands in the accommodations and catering lists like anyone else. */}
          <input
            value={form.primaryLanguages}
            onChange={(e) => setForm({ ...form, primaryLanguages: e.target.value })}
            placeholder="Working language(s), e.g. English, Spanish, ASL"
            className="sm:col-span-2 px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500"
          />
          <input
            value={form.dietary}
            onChange={(e) => setForm({ ...form, dietary: e.target.value })}
            placeholder="Dietary needs or allergies (optional)"
            className="sm:col-span-2 px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500"
          />
          <textarea
            value={form.accessibilityNotes}
            onChange={(e) => setForm({ ...form, accessibilityNotes: e.target.value })}
            placeholder="Accessibility accommodations (optional). ASL, CART, wheelchair access, a quiet space, anything else."
            rows={2}
            className="sm:col-span-2 px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500"
          />
          {form.attendanceMode === "in-person" && (
            <div className="sm:col-span-2">
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Parking at Lurie Children&rsquo;s?</div>
              <div className="grid grid-cols-3 gap-1.5">
                {([["Yes", true], ["No", false], ["Not sure", null]] as const).map(([label, v]) => (
                  <button
                    key={label}
                    onClick={() => setForm({ ...form, needsParking: v })}
                    className="py-2 rounded-lg border text-[13px] font-semibold transition-colors"
                    style={form.needsParking === v
                      ? { borderColor: TEAL, background: TEAL + "10", color: TEAL }
                      : { borderColor: "#E2E8F0", background: "#fff", color: "#64748B" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <div className="mt-2 text-[13px] font-medium text-rose-600">{error}</div>}
        {justAdded && (
          <div className="mt-2 text-[13px] rounded-lg px-3 py-2" style={{ background: "#ECFDF5", color: "#065F46" }}>
            {justAdded.comp
              ? "Added on one of your included tickets. Nothing else to do for them."
              : "Added. Your included tickets are used up, so they will need to register at the standard rate."}
            {justAdded.payUrl && (
              <> <a href={justAdded.payUrl} className="font-bold underline">Open their registration link</a>.</>
            )}
          </div>
        )}

        <button
          onClick={add}
          disabled={saving || !form.firstName.trim() || !form.email.trim()}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white disabled:opacity-50"
          style={{ background: TEAL }}
        >
          {saving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : confirming
              ? <><Check className="w-4 h-4" /> Confirm and register them</>
              : <><Plus className="w-4 h-4" /> Add to our list</>}
        </button>
        <p className="mt-2 text-[11.5px] text-slate-400">
          {seats.remaining > 0
            ? `The next ${seats.remaining === 1 ? "person uses your last included ticket" : `${seats.remaining} people use your included tickets`}. After that, anyone you add registers at the standard rate and still shows up under ${data.company}.`
            : `Your included tickets are used. Anyone you add now registers at the standard rate and still shows up under ${data.company}.`}
        </p>
      </div>

      {/* Shareable link */}
      <div className="rounded-2xl p-5" style={{ background: "#FBF4E2", border: "1px solid #EAD9AE" }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#8A6A20" }}>
          Share with your team
        </div>
        <p className="text-[13px] leading-relaxed mb-3" style={{ color: "#6B5316" }}>
          Send this link to colleagues and they can add themselves. Everyone who signs up through it is recorded under {data.company}, so you and we both know exactly who is coming.
        </p>
        <div className="flex items-stretch gap-2">
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 px-3 py-2.5 text-[12.5px] rounded-lg bg-white border"
            style={{ borderColor: "#EAD9AE", color: "#6B5316" }}
          />
          <button
            onClick={copyLink}
            className="px-4 rounded-lg text-sm font-bold shrink-0 inline-flex items-center gap-1.5 text-white"
            style={{ background: "#8A6A20" }}
          >
            {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
          </button>
        </div>
      </div>
    </div>
  );
}
