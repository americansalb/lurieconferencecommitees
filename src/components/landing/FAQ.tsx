import { Plus } from "lucide-react";
import { TOKENS } from "./tokens";

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is the conference about?",
    a: "The 2026 Lurie Children's and AALB Conference is the 2nd Annual Joint Conference of Ann & Robert H. Lurie Children's Hospital of Chicago and Americans Against Language Barriers. The 2026 theme, True Language Access: Yesterday, Today, and Tomorrow, explores the past, present, and future of language access in healthcare across two full days of talks, panels, and workshops.",
  },
  {
    q: "Can I attend virtually?",
    a: "Yes. The conference is offered as a hybrid event. The Virtual ticket gives you a live stream of both days, on-demand recordings afterward, digital materials, and a CEU certificate of attendance. You can attend from anywhere in the world.",
  },
  {
    q: "Is the conference CEU accredited?",
    a: "Yes. Attendees receive a CEU certificate of attendance for both days of the conference. Additional discipline-specific accreditation details will be announced as the program is finalized.",
  },
  {
    q: "How is registration priced?",
    a: "Pricing is tiered: Early Bird through April 15, Standard through June 15, and Late through August 15. Virtual runs from $95 to $115; In-Person runs from $195 to $225. The Pricing section on this page shows the live schedule and which tier is active right now.",
  },
  {
    q: "Where is the in-person venue?",
    a: "Ann & Robert H. Lurie Children's Hospital of Chicago, located at 225 E Chicago Ave in the Streeterville neighborhood of downtown Chicago. The hospital is a short walk from the CTA Red Line and from Michigan Avenue.",
  },
  {
    q: "What about parking and hotels?",
    a: "Multiple Streeterville parking garages are within two blocks of the hospital. We will share a list of partner hotels with conference rates closer to the event.",
  },
  {
    q: "Is there a dress code?",
    a: "Business casual throughout the conference. On Day 2 we invite attendees who feel comfortable to wear traditional or cultural clothing as a celebration of the linguistic and cultural communities we serve.",
  },
  {
    q: "How do I become a sponsor?",
    a: "Visit our Sponsorship page to review the Silver, Gold, and Diamond tiers, as well as Food Sponsor, ASL Interpreter Sponsor, and Exhibitor Table options. All sponsorships are tax-deductible to the fullest extent allowed by law under IRS code 501(c)(3).",
  },
  {
    q: "Can I request accessibility accommodations?",
    a: "Absolutely. ASL interpretation is provided throughout the conference, and the registration form includes a field for additional accommodations. You can also email us directly at contact@aalb.org.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-28 sm:py-36" style={{ background: TOKENS.paper }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: TOKENS.gold }}>
              FAQ
            </span>
            <span className="w-6 h-px" style={{ background: TOKENS.gold }} />
          </div>
          <h2
            className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight"
            style={{ color: TOKENS.ink }}
          >
            Frequently asked.
          </h2>
        </div>

        <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: TOKENS.hairline }}>
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="group"
              style={{ borderTop: i > 0 ? `1px solid ${TOKENS.hairline}` : undefined }}
            >
              <summary className="cursor-pointer list-none flex items-start gap-5 p-6 sm:p-7">
                <span
                  className="font-serif-display text-sm font-bold tabular-nums mt-0.5 shrink-0"
                  style={{ color: TOKENS.gold }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex-1 text-base sm:text-lg font-semibold leading-snug"
                  style={{ color: TOKENS.ink }}
                >
                  {f.q}
                </span>
                <Plus
                  className="w-4 h-4 flex-shrink-0 mt-1 transition-transform group-open:rotate-45"
                  style={{ color: TOKENS.teal }}
                />
              </summary>
              <div
                className="px-6 sm:px-7 pb-7 pt-0 text-[15px] leading-relaxed"
                style={{ color: TOKENS.muted, paddingLeft: "calc(2.5rem + 20px)" }}
              >
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
