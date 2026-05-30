"use client";

import { useEffect, useState } from "react";
import { SpeakerCard } from "../../SpeakerCard";
import type { Form } from "../../useProposalForm";

// Restores the in-flight card the user just submitted from sessionStorage.
// Falls back to the persisted Presenter record (which never has the headshot
// bytes inlined for the client) so the success page always renders something.
export default function SuccessHero({ fallback }: { fallback: Form }) {
  const [form, setForm] = useState<Form>(fallback);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("proposal:lastCard");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Form>;
        setForm({ ...fallback, ...parsed });
      }
    } catch { /* ignore */ }
  }, [fallback]);

  return <SpeakerCard form={form} isExemplar={false} />;
}
