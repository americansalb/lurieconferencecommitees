"use client";

import { Check } from "lucide-react";
import { C } from "@/components/funnel/Wizard";

// Exhibitor terms shown in-flow (apply wizard + completion wizard) and agreed
// to before any exhibitor payment. Modeled on the presenter policy so the two
// agreements read like the same conference. Plain boilerplate; the program
// team should review and adjust the wording to match conference policy.
export function ExhibitorTermsContent() {
  return (
    <div className="space-y-3" style={{ color: C.muted }}>
      <Clause title="1. Exhibit space">
        Your fee reserves one exhibitor table in the conference hall with two chairs. Table placement is assigned at the organizers&rsquo; discretion. The space is for your organization&rsquo;s own display and engagement with attendees and may not be shared, sublet, assigned, or transferred to another party.
      </Clause>
      <Clause title="2. Setup, staffing, and teardown">
        You agree to set up, staff, and remove your exhibit only during the times communicated by the program team. Your table should be staffed by your designated representative during exhibit hours. Materials, equipment, and giveaways must fit within your assigned space and may not obstruct aisles, exits, or neighboring tables.
      </Clause>
      <Clause title="3. Conduct">
        Exhibitors agree to abide by the conference code of conduct, including respect for attendees, staff, and venue personnel, accessibility requirements, and the conference&rsquo;s policies prohibiting harassment and discrimination. The organizers may require removal of any display or representative found in violation, without refund.
      </Clause>
      <Clause title="4. Liability and insurance">
        You are responsible for your own property, personnel, and activities at the conference. Lurie Children&rsquo;s, Americans Against Language Barriers (AALB), and the venue are not liable for loss, theft, damage, or injury arising from your participation. You are responsible for carrying any insurance you deem necessary and agree to indemnify and hold the hosts harmless from claims arising out of your exhibit.
      </Clause>
      <Clause title="5. Name, logo, and marketing">
        You grant Lurie Children&rsquo;s and AALB a non-exclusive, royalty-free license to use your organization&rsquo;s name and logo to acknowledge your participation on the conference website, signage, program, and related communications. You represent that you have the right to grant this license and that your materials do not infringe any third-party rights.
      </Clause>
      <Clause title="6. Payment, cancellation, and refunds">
        Your table is confirmed when payment is received. Cancellations requested in writing on or before July 1, 2026 may be refunded less any non-recoverable costs; cancellations after that date, and no-shows, forfeit the fee. The organizers may cancel or reschedule the conference, in which case fees will be refunded or credited.
      </Clause>
      <Clause title="7. Privacy">
        Information you provide is used by the conference organizers to plan, communicate, and document the event, and is shared with vendors only as needed to deliver event services.
      </Clause>
      <Clause title="8. Governing terms">
        These terms are governed by the laws of the State of Illinois without regard to conflict of laws principles, with disputes resolved in the state or federal courts of Cook County, Illinois. If any provision is held unenforceable, the remaining provisions remain in effect. Questions may be directed to the program team at the address used to reach you.
      </Clause>
    </div>
  );
}

function Clause({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12.5px] font-semibold" style={{ color: C.inkSoft }}>{title}</div>
      <div className="text-[12.5px] leading-relaxed mt-0.5">{children}</div>
    </div>
  );
}

// Scrollable terms + a required attestation checkbox. Used wherever an
// exhibitor commits (apply wizard, completion wizard).
export function ExhibitorTermsAgree({
  agreed, onChange,
}: {
  agreed: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <div
        className="rounded-xl border bg-white overflow-y-auto p-4"
        style={{ borderColor: C.hairline, maxHeight: 280 }}
      >
        <ExhibitorTermsContent />
      </div>
      <button
        type="button"
        onClick={() => onChange(!agreed)}
        className="w-full text-left rounded-xl p-3.5 transition-all"
        style={{
          background: agreed ? C.teal + "0C" : "white",
          border: agreed ? `1.5px solid ${C.teal}` : `1.5px solid ${C.hairline}`,
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="w-5 h-5 mt-px rounded-md flex items-center justify-center shrink-0 transition-all"
            style={{ background: agreed ? C.teal : "white", border: agreed ? "none" : `1.5px solid ${C.hairline}` }}
          >
            {agreed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </span>
          <span className="text-[13.5px] font-medium leading-snug" style={{ color: C.inkSoft }}>
            I have read and agree to the Exhibitor Terms above on behalf of my organization.
          </span>
        </div>
      </button>
    </div>
  );
}
