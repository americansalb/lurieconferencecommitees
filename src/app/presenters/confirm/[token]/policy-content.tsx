export function PolicyContent() {
  return (
    <>
      <Section title="1. Participation">
        Acceptance of an invitation is a commitment to be present in person on the dates and at the times communicated by the program team. Substantial changes to your assigned format, length, day, or content require advance written approval from the program team. Failure to appear without timely notice may forfeit any honorarium and may affect future invitations.
      </Section>
      <Section title="2. Content and intellectual property">
        You retain ownership of your original presentation materials. You grant Lurie Children&apos;s and Americans Against Language Barriers (AALB) a non exclusive, worldwide, royalty free license to record, reproduce, transmit, distribute, and publicly display your presentation and likeness for the purposes of the conference, post conference education, accreditation, marketing, and archival use. You represent that you have the right to grant this license and that your materials do not infringe any third party rights. You will provide attribution to the conference in any external publication of these materials.
      </Section>
      <Section title="3. Photography, video, and audio">
        The conference will produce photography and audio or video recordings of public sessions. By accepting this invitation you consent to the capture and editorial use of your image, voice, and remarks for educational, promotional, and historical purposes by Lurie Children&apos;s and AALB and their authorized partners. Specific opt in permissions for session recording, social media use, and continuing education credit are collected separately in the portal.
      </Section>
      <Section title="4. Continuing education credit">
        If you opt in to continuing education use, you authorize the conference to register your session with applicable accrediting bodies, distribute approved post session materials, and provide attendee assessment data. You agree to meet documentation timelines that the program team will share, including learning objectives, references, and disclosures of any commercial relationships.
      </Section>
      <Section title="5. Disclosure of conflicts">
        You will disclose in writing any financial relationships with commercial interests relevant to your presentation. The program team may require modifications to mitigate identified conflicts, consistent with applicable accreditation standards.
      </Section>
      <Section title="6. Honorarium and reimbursement">
        Any honorarium offered is stated in your invitation and is paid following the conference, subject to United States tax withholding and reporting requirements. Travel reimbursement, when offered, is capped at the amount stated in your invitation, requires original itemized receipts, and follows the conference reimbursement guidelines that the program team will share. Government employees are responsible for compliance with their agency&apos;s ethics rules, including any limits or required pre approvals on honoraria, gifts, and travel.
      </Section>
      <Section title="7. Code of conduct">
        Presenters agree to abide by the conference code of conduct, including respect for attendees, staff, and venue personnel, accessibility requirements, and the conference&apos;s policies prohibiting harassment and discrimination. The program team may decline to platform any presenter found in violation.
      </Section>
      <Section title="8. Cancellation and withdrawal">
        If circumstances change after acceptance, notify the program team in writing as soon as possible. Withdrawals after July 1, 2026 may be limited to substitution by mutual agreement, and may forfeit any honorarium previously committed.
      </Section>
      <Section title="9. Privacy">
        Information you provide in this portal is used by the conference organizers to plan, communicate, and document the event, and is shared with vendors only as needed to deliver event services. Honorarium and reimbursement records are retained as required by tax and audit policies.
      </Section>
      <Section title="10. Governing terms">
        These terms are governed by the laws of the State of Illinois without regard to conflict of laws principles. Disputes will be resolved in the state or federal courts of Cook County, Illinois. If any provision is held unenforceable, the remaining provisions remain in effect. Questions about this policy may be directed to the program team at the address used to send your invitation.
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-semibold text-slate-900 mb-1">{title}</div>
      <div className="text-slate-600">{children}</div>
    </div>
  );
}
