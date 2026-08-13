// Certification choices on the /asl interpreter form, shared by the form
// itself, the accept API's validation, and the /asl-team review page.
// "none" is exclusive of the rest, and the RID member number is collected
// only when "rid" is among the selections. Keep this file free of
// server-only imports; the client renders from it.

export type AslCertOption = { key: string; label: string; detail?: string };

export const ASL_CERT_OPTIONS: AslCertOption[] = [
  { key: "rid", label: "RID certified", detail: "NIC, CI, CT, CDI, or another RID credential" },
  { key: "bei", label: "BEI certified", detail: "Any BEI level" },
  { key: "eipa", label: "EIPA", detail: "Educational Interpreter Performance Assessment" },
  { key: "state", label: "State license or QA screening" },
  { key: "other", label: "Another certification" },
  { key: "none", label: "None of these yet" },
];

export const ASL_CERT_KEYS = ASL_CERT_OPTIONS.map((o) => o.key);

export function aslCertLabel(key: string): string {
  return ASL_CERT_OPTIONS.find((o) => o.key === key)?.label || key;
}

/**
 * "RID certified (#45210) · Other: CoreCHI" style summary in option order,
 * folding the RID number and the free-text credential into their entries.
 */
export function aslCertSummary(
  certifications: string[],
  ridNumber?: string | null,
  certificationOther?: string | null
): string {
  return ASL_CERT_OPTIONS.filter((o) => certifications.includes(o.key))
    .map((o) => {
      if (o.key === "rid" && ridNumber) return `RID certified (#${ridNumber})`;
      if (o.key === "other" && certificationOther) return `Other: ${certificationOther}`;
      return o.label;
    })
    .join(" · ");
}
