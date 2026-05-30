"use client";

import type { Form } from "../useProposalForm";
import { SceneEyebrow, TextArea } from "./_atoms";

export function SceneNotes({
  form, update,
}: {
  form: Form;
  update: (k: keyof Form, v: string) => void;
}) {
  return (
    <section data-scene="notes">
      <SceneEyebrow>For the program team</SceneEyebrow>
      <p className="text-[12px] mb-3" style={{ color: "#5A6E76" }}>
        Optional. Nothing here appears on your card.
      </p>
      <TextArea
        label="Anything we should know"
        placeholder="Constraints, prior work, video links, why this room needs to hear this."
        value={form.presenterMessage}
        onChange={(v) => update("presenterMessage", v)}
        rows={4}
      />
    </section>
  );
}
