import { ChevronDown } from "lucide-react";
import { TOKENS } from "./tokens";

// Mirrors the 7+ Q&As on the existing Webflow page. Copy is preserved
// in tone and intent; treat this as a working baseline that the program
// team can edit in place.
const FAQS: { q: string; a: string }[] = [
  {
    q: "What is the conference about?",
    a: "The 2026 Lurie Children's and AALB Conference is the 2nd Annual Joint Conference of Ann & Robert H. Lurie Children's Hospital of Chicago and Americans Against Language Barriers. The 2026 theme, True Language Access: Yesterday, Today, and Tomorrow, explores the past, present, and future of language access in healthcare across two full days of talks, panels, and workshops.",
  },
  {
    q: "Can I attend virtually?",
    a: "Yes. The conference is offered as a hybrid event. The Virtual ticket gives you a live stream of both days, on-demand recordings afterward, digital materials, a CEU certificate of attendance, and access to a virtual networking lounge. You can attend from anywhere in the world.",
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
    a: "Multiple Streeterville parking garages are within two blocks of the hospital. We will share a list of partner hotels with conference rates closer to the event. If you need assistance with hotel booking, please reach out to our team.",
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
    a: "Absolutely. ASL interpretation is provided throughout the conference. Accessible seating is available, and lactation and quiet rooms are available on request. The registration form includes a field for additional accommodations, or you can email us directly at contact@aalb.org.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24 sm:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: TOKENS.teal }}>
            FAQ
          </div>
          <h2 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight" style={{ color: TOKENS.ink }}>
            Frequently asked questions.
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow open:shadow-md"
            >
              <summary className="cursor-pointer list-none flex items-center gap-4 p-5 sm:p-6">
                <span
                  className="flex-shrink-0 font-serif-display text-base font-bold tabular-nums px-2.5 py-0.5 rounded-md"
                  style={{ background: TOKENS.tealSoft, color: TOKENS.teal }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-base sm:text-lg font-bold leading-snug" style={{ color: TOKENS.ink }}>
                  {f.q}
                </span>
                <ChevronDown
                  className="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-180"
                  style={{ color: TOKENS.teal }}
                />
              </summary>
              <div className="px-5 sm:px-6 pb-6 pt-0 pl-[3.5rem] sm:pl-[3.75rem] text-sm sm:text-base leading-relaxed" style={{ color: TOKENS.inkSoft }}>
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
