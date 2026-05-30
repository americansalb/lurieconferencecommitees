"use client";

import type { Form } from "../useProposalForm";
import { BigTitleInput, MUTED, SceneEyebrow, TextArea } from "./_atoms";

export function SceneIdea({
  form, update, errors,
}: {
  form: Form;
  update: (k: keyof Form, v: string) => void;
  errors: Set<keyof Form>;
}) {
  const words = form.talkAbstract.trim() ? form.talkAbstract.trim().split(/\s+/).length : 0;
  // Average reading speed approx 220 wpm. Translate into a friendly "X-minute read".
  const seconds = Math.max(15, Math.round((words / 220) * 60));
  const readEstimate = seconds < 60
    ? `${seconds} sec read`
    : `${Math.round(seconds / 60)} min read`;
  const tooLong = words > 500;

  return (
    <section data-scene="idea">
      <SceneEyebrow>The idea</SceneEyebrow>

      <div className="mb-6">
        <BigTitleInput
          value={form.talkTitle}
          onChange={(v) => update("talkTitle", v)}
          placeholder="What would you call this session?"
          error={errors.has("talkTitle")}
        />
      </div>

      <div className="mb-5">
        <TextArea
          label="Abstract"
          required
          placeholder="What's the session about, who's it for, why this year."
          value={form.talkAbstract}
          onChange={(v) => update("talkAbstract", v)}
          rows={6}
          error={errors.has("talkAbstract")}
          hint={
            <span style={{ color: tooLong ? "#dc2626" : MUTED }}>
              {words} word{words === 1 ? "" : "s"} &middot; {readEstimate}
            </span>
          }
        />
      </div>

      <TextArea
        label="Three things attendees will leave with"
        placeholder="One per line. Three is the sweet spot."
        value={form.learningObjectives}
        onChange={(v) => update("learningObjectives", v)}
        rows={3}
      />
    </section>
  );
}
