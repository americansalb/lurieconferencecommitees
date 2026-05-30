"use client";

import type { Form } from "../useProposalForm";
import { Field, SceneEyebrow, TextArea } from "./_atoms";
import { HeadshotDrop } from "../HeadshotDrop";

export function ScenePerson({
  form, update, setHeadshot, clearHeadshot, errors, onPhotoError,
}: {
  form: Form;
  update: (k: keyof Form, v: string) => void;
  setHeadshot: (dataUrl: string, name: string) => void;
  clearHeadshot: () => void;
  errors: Set<keyof Form>;
  onPhotoError: (msg: string) => void;
}) {
  return (
    <section data-scene="person">
      <SceneEyebrow>The person</SceneEyebrow>

      <div className="mb-5">
        <HeadshotDrop
          dataUrl={form.headshotDataUrl}
          fileName={form.headshotName}
          onSelect={setHeadshot}
          onClear={clearHeadshot}
          onSizeError={onPhotoError}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="sm:col-span-2">
          <Field
            label="Full name"
            value={form.name}
            onChange={(v) => update("name", v)}
            required
            error={errors.has("name")}
          />
        </div>
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => update("email", v)}
          required
          error={errors.has("email")}
        />
        <Field
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(v) => update("phone", v)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="sm:col-span-2">
          <Field
            label="Affiliation"
            placeholder="Hospital, university, company, or independent"
            value={form.affiliation}
            onChange={(v) => update("affiliation", v)}
          />
        </div>
        <Field
          label="Role or title"
          value={form.jobTitle}
          onChange={(v) => update("jobTitle", v)}
        />
        <Field
          label="Pronouns"
          placeholder="she/her, he/him, they/them"
          value={form.pronouns}
          onChange={(v) => update("pronouns", v)}
        />
      </div>

      <div className="mb-3">
        <TextArea
          label="Short bio"
          placeholder="A sentence or two. Who you are, what you focus on."
          value={form.bio}
          onChange={(v) => update("bio", v)}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="Website"
          placeholder="https://"
          value={form.websiteUrl}
          onChange={(v) => update("websiteUrl", v)}
        />
        <Field
          label="LinkedIn"
          placeholder="linkedin.com/in/..."
          value={form.linkedinUrl}
          onChange={(v) => update("linkedinUrl", v)}
        />
      </div>
    </section>
  );
}
