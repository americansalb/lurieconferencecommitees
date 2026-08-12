import { Plus } from "lucide-react";
import { TOKENS } from "./tokens";

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is the conference about?",
    a: "The 2026 Lurie Children's and AALB Conference is the 2nd Joint Conference of Ann & Robert H. Lurie Children's Hospital of Chicago and Americans Against Language Barriers. The 2026 theme, True Language Access: Yesterday, Today, and Tomorrow, explores the past, present, and future of language access in healthcare across two full days of talks, panels, and workshops.",
  },
  {
    q: "Can I attend virtually?",
    a: "Yes. The conference is offered as a hybrid event. The Virtual ticket gives you a live stream of both days, digital materials, and on-demand recordings of most sessions afterward. You can attend from anywhere in the world. Please read the two answers below before registering if recordings or CEUs are the reason you are coming: not every session is recorded, and CEUs require live attendance.",
  },
  {
    q: "Will every session be recorded?",
    a: "We record as much as we can, and the vast majority of sessions and workshops will be recorded. It isn't always possible, though. Recording is ultimately the presenter's call, and a few ask us not to. This year we expect the sessions led by Jane Crandall Kontrimas and Wilma Alvarado-Little to be live only, and there may be one or two others as presenters finalize their permissions. If a particular session is the reason you are registering, it is worth attending that one live.",
  },
  {
    q: "Is the conference CEU accredited?",
    a: "Yes. The conference will be accredited for 10+ hours of NBCMI, CCHI and RID CEUs, so medical interpreters and ASL interpreters can both claim their hours. CEUs are earned by attending live. See the next answer for what that requires. Additional discipline-specific accreditation details will be announced as the program is finalized.",
  },
  {
    q: "Can I earn CEUs by watching the recordings on my own time?",
    a: "No. CEUs are not available for self-paced or on-demand viewing. Our accreditors require live attendance, which for virtual attendees means being present in the live session with your camera on and visible for the duration. Watching a recording afterward does not qualify, and neither does joining live with your camera off. You are welcome to watch the recordings either way. They just cannot be credited.",
  },
  {
    q: "How is registration priced?",
    a: "Late pricing is in effect: Virtual is $115 and In-Person is $225. Registration stays open through the conference itself. The Pricing section on this page shows the live schedule and the rate that is active right now, and registrations are non-refundable, so it is worth reading the refund policy before you pay.",
  },
  {
    q: "Where is the in-person venue?",
    a: "Ann & Robert H. Lurie Children's Hospital of Chicago, located at 225 E Chicago Ave in the Streeterville neighborhood of downtown Chicago. The hospital is a short walk from the CTA Red Line and from Michigan Avenue.",
  },
  {
    q: "What about parking?",
    a: "Multiple Streeterville parking garages are within two blocks of the hospital. Attendees arrange their own parking.",
  },
  {
    q: "Is there a dress code?",
    a: "Business casual throughout the conference. On Day 2 we invite attendees who feel comfortable to wear traditional or cultural clothing as a celebration of the linguistic and cultural communities we serve.",
  },
  {
    q: "How do I become a sponsor?",
    a: "Visit our Sponsorship page to review the Silver, Gold, and Diamond tiers, along with the Food Sponsor and ASL Interpreter Sponsor options. Exhibitor tables are sold out for 2026 and the $450 Supporter level is closed, so both appear on the page greyed out. Email contact@aalb.org if you would like to be told first should an exhibitor table free up. The conference is presented jointly by Lurie Children's and Americans Against Language Barriers, both 501(c)(3) nonprofits, and sponsorship levels that include tickets may be deductible as a business expense, or as a charitable contribution to the extent the payment exceeds the value of those benefits. Please consult your tax advisor.",
  },
  {
    q: "Can I request accessibility accommodations?",
    a: "Absolutely. ASL interpretation is provided throughout the conference, and the registration form includes a field for additional accommodations. You can also email us directly at contact@aalb.org.",
  },
];

export default function FAQ() {
  return (
    <section
      id="faq"
      className="relative py-28 sm:py-36 overflow-hidden"
      style={{ background: "white" }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 100% at 50% 0%, ${TOKENS.tealSoft} 0%, transparent 70%)`,
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Eyebrow>FAQ</Eyebrow>
          <h2
            className="mt-6 text-4xl sm:text-5xl md:text-[58px] font-bold leading-[1.05] tracking-tight"
            style={{ color: TOKENS.ink }}
          >
            Frequently{" "}
            <span className="italic font-medium" style={{ color: TOKENS.teal }}>asked.</span>
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="group bg-white rounded-2xl border overflow-hidden transition-all"
              style={{
                borderColor: TOKENS.hairline,
                boxShadow: "0 6px 18px -10px rgba(11,31,37,0.08)",
              }}
            >
              <summary className="cursor-pointer list-none flex items-start gap-5 p-6 sm:p-7 group-hover:bg-slate-50/40 transition-colors">
                <span
                  className="text-sm font-bold tabular-nums mt-1 italic shrink-0"
                  style={{ color: TOKENS.gold }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex-1 text-base sm:text-lg font-bold leading-snug"
                  style={{ color: TOKENS.ink }}
                >
                  {f.q}
                </span>
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all group-open:rotate-45"
                  style={{ background: TOKENS.tealSoft, color: TOKENS.teal }}
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
              </summary>
              <div
                className="px-6 sm:px-7 pb-7 pt-0 text-[15px] leading-relaxed"
                style={{ color: TOKENS.muted, paddingLeft: "calc(1.5rem + 22px)" }}
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="w-8 h-px" style={{ background: TOKENS.gold }} />
      <span className="text-[10px] font-bold tracking-[0.32em] uppercase" style={{ color: TOKENS.gold }}>
        {children}
      </span>
      <span className="w-8 h-px" style={{ background: TOKENS.gold }} />
    </div>
  );
}
