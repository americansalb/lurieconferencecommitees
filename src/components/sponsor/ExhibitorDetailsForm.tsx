"use client";

import { Table2, Armchair, Shuffle } from "lucide-react";
import LogoUpload, { type LogoValue } from "./LogoUpload";

export type ExhibitorDetails = {
  registreeName: string;
  registreeEmail: string;
  dietary: string;
  accessibility: string;
  wantsLogo: boolean;
};

export const EMPTY_EXHIBITOR: ExhibitorDetails = {
  registreeName: "", registreeEmail: "", dietary: "", accessibility: "", wantsLogo: true,
};

export function TableNotice() {
  return (
    <div className="rounded-xl border border-[#0066B3]/20 bg-[#0066B3]/[0.04] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[#0066B3] mb-2">Your exhibitor table</div>
      <ul className="space-y-1.5 text-[13px] text-slate-600">
        <li className="flex items-center gap-2"><Table2 className="w-4 h-4 text-[#0066B3] shrink-0" /> One rectangular table in the exhibitor hall</li>
        <li className="flex items-center gap-2"><Shuffle className="w-4 h-4 text-[#0066B3] shrink-0" /> Placement is randomly assigned</li>
        <li className="flex items-center gap-2"><Armchair className="w-4 h-4 text-[#0066B3] shrink-0" /> 2 chairs per table included</li>
      </ul>
    </div>
  );
}

export default function ExhibitorDetailsForm({
  value, onChange, logo, onLogo,
}: {
  value: ExhibitorDetails;
  onChange: (v: ExhibitorDetails) => void;
  logo: LogoValue;
  onLogo: (v: LogoValue) => void;
}) {
  const set = <K extends keyof ExhibitorDetails>(k: K, v: ExhibitorDetails[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-4">
      <TableNotice />

      <Field label="Name of the attendee staffing your table" required value={value.registreeName} onChange={(v) => set("registreeName", v)} placeholder="Who will represent you on site?" />
      <Field label="Their email" required value={value.registreeEmail} onChange={(v) => set("registreeEmail", v)} type="email" hint="we'll send their conference ticket and details here" />
      <AreaField label="Dietary needs or allergies" value={value.dietary} onChange={(v) => set("dietary", v)} placeholder="Vegetarian, vegan, gluten-free, allergies…" hint="optional" />
      <AreaField label="Accessibility needs" value={value.accessibility} onChange={(v) => set("accessibility", v)} placeholder="Anything we can do to make the day work better for them." hint="optional" />

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:bg-slate-50">
        <input type="checkbox" checked={value.wantsLogo} onChange={(e) => set("wantsLogo", e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#0066B3]" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-800">Show our logo on the conference website</span>
          <span className="block text-[12px] text-slate-500">Included at no charge. Upload a high-resolution logo and we&rsquo;ll feature it.</span>
        </span>
      </label>
      {value.wantsLogo && <LogoUpload value={logo} onChange={onLogo} />}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, type, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-slate-600">{label}{required && <span className="text-rose-500"> *</span>}{hint && <span className="font-normal text-slate-400"> · {hint}</span>}</span>
      <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15" />
    </label>
  );
}

function AreaField({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-slate-600">{label}{hint && <span className="font-normal text-slate-400"> · {hint}</span>}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2}
        className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15 resize-none" />
    </label>
  );
}
