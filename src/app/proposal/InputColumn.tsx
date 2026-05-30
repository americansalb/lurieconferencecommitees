"use client";

import { useEffect, useRef, useState } from "react";
import type { Form, ProposalFormApi } from "./useProposalForm";
import { ScenePerson } from "./scenes/ScenePerson";
import { SceneIdea } from "./scenes/SceneIdea";
import { SceneShape } from "./scenes/SceneShape";
import { SceneNotes } from "./scenes/SceneNotes";
import { GOLD, GOLD_SOFT, HAIRLINE } from "./scenes/_atoms";

const SCENES: Array<{ key: string; label: string; required: Array<keyof Form> }> = [
  { key: "person", label: "Person",      required: ["name", "email"] },
  { key: "idea",   label: "Idea",        required: ["talkTitle", "talkAbstract"] },
  { key: "shape",  label: "Shape",       required: [] },
  { key: "notes",  label: "Notes",       required: [] },
];

export function InputColumn({
  api, missingSet, onPhotoError,
}: {
  api: ProposalFormApi;
  missingSet: Set<keyof Form>;
  onPhotoError: (msg: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<string>("person");

  // Scroll spy.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("section[data-scene]"));
    if (sections.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the section closest to top that's intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).getBoundingClientRect().top - (b.target as HTMLElement).getBoundingClientRect().top);
        if (visible[0]) {
          const key = (visible[0].target as HTMLElement).dataset.scene;
          if (key) setActive(key);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.1, 0.3] }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  function jumpTo(key: string) {
    const el = containerRef.current?.querySelector<HTMLElement>(`section[data-scene="${key}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="relative">
      {/* Vertical spy column anchored on the right edge of this card */}
      <ul className="hidden md:block absolute -right-12 top-2 space-y-3 pointer-events-auto">
        {SCENES.map((s) => {
          const isActive = active === s.key;
          const hasMissing = s.required.some((r) => missingSet.has(r));
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => jumpTo(s.key)}
                className="block w-7 group"
                aria-label={`Jump to ${s.label}`}
              >
                <span
                  className="block transition-all"
                  style={{
                    height: isActive ? 14 : 6,
                    width: isActive ? 4 : 2,
                    marginLeft: isActive ? 0 : 1,
                    background: hasMissing ? "#dc2626" : isActive ? GOLD : GOLD_SOFT,
                    borderRadius: 2,
                    boxShadow: isActive ? `0 0 8px ${GOLD}88` : undefined,
                  }}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div
        ref={containerRef}
        className="relative bg-white rounded-2xl px-5 sm:px-7 py-6 sm:py-8 overflow-hidden"
        style={{
          border: `1px solid ${HAIRLINE}`,
          boxShadow: "0 30px 80px -40px rgba(0,0,0,0.40), 0 12px 28px -16px rgba(0,0,0,0.18)",
        }}
      >
        {/* Gold-to-teal hairline along the top edge of the card */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, ${GOLD} 0%, #2A8FCC 60%, #0E4456 100%)` }}
        />

        <div className="space-y-10">
          <ScenePerson
            form={api.form}
            update={api.update}
            setHeadshot={api.setHeadshot}
            clearHeadshot={api.clearHeadshot}
            errors={missingSet}
            onPhotoError={onPhotoError}
          />
          <SceneDivider />
          <SceneIdea
            form={api.form}
            update={api.update}
            errors={missingSet}
          />
          <SceneDivider />
          <SceneShape
            form={api.form}
            update={api.update}
          />
          <SceneDivider />
          <SceneNotes
            form={api.form}
            update={api.update}
          />
        </div>
      </div>
    </div>
  );
}

function SceneDivider() {
  return (
    <div className="flex items-center justify-center pt-2">
      <span className="w-12 h-px" style={{ background: GOLD_SOFT }} />
      <span className="mx-2 text-[10px]" style={{ color: GOLD }}>&#9670;</span>
      <span className="w-12 h-px" style={{ background: GOLD_SOFT }} />
    </div>
  );
}
