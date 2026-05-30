"use client";

import type { Form } from "../useProposalForm";
import { Field, PillGroup, SceneEyebrow } from "./_atoms";

const FORMATS = ["Talk", "Panel", "Workshop", "Fireside chat", "Lightning"];
const LENGTHS = ["20 min", "30 min", "45 min", "60 min", "90 min"];
const TRACKS = [
  "Clinical practice",
  "Interpreter training",
  "Policy and access",
  "Technology",
  "Patient and family voice",
  "Research and outcomes",
];
const DAYS = ["August 15", "August 16", "Either day"];

export function SceneShape({
  form, update,
}: {
  form: Form;
  update: (k: keyof Form, v: string) => void;
}) {
  return (
    <section data-scene="shape">
      <SceneEyebrow>The shape</SceneEyebrow>

      <PillGroup
        label="Format"
        value={form.sessionFormat}
        options={FORMATS}
        onChange={(v) => update("sessionFormat", v)}
      />
      <PillGroup
        label="Length"
        value={form.sessionLength}
        options={LENGTHS}
        onChange={(v) => update("sessionLength", v)}
      />
      <PillGroup
        label="Best fit track"
        value={form.sessionTrack}
        options={TRACKS}
        onChange={(v) => update("sessionTrack", v)}
      />
      <PillGroup
        label="Preferred day"
        value={form.preferredDay}
        options={DAYS}
        onChange={(v) => update("preferredDay", v)}
      />

      <div className="mt-4">
        <Field
          label="Co-presenters (optional)"
          placeholder="Names and affiliations, one per line."
          value={form.coPresenters}
          onChange={(v) => update("coPresenters", v)}
        />
      </div>
    </section>
  );
}
