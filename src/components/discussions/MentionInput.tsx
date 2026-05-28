"use client";

import {
  useEffect, useRef, useState, useCallback, useMemo,
  type KeyboardEvent, type ChangeEvent,
} from "react";

type Candidate = { id: string; name: string; email?: string };

// Inserts @firstname when the first name is unique within the candidate set,
// otherwise falls back to @"First Last" so the server's resolver can match
// the full name verbatim.
function tokenFor(candidate: Candidate, all: Candidate[]): string {
  const first = candidate.name.split(/\s+/)[0] || candidate.name;
  const sameFirst = all.filter(
    (c) => (c.name.split(/\s+/)[0] || "").toLowerCase() === first.toLowerCase(),
  );
  if (sameFirst.length === 1 && /^[A-Za-z][A-Za-z0-9._-]*$/.test(first)) {
    return `@${first}`;
  }
  return `@"${candidate.name}"`;
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  discussionId: string;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  rows?: number;
};

export default function MentionInput({
  value, onChange, onSubmit, discussionId, placeholder, multiline,
  className, autoFocus, disabled, rows,
}: Props) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  // Lazy-load mentionable users once per discussion.
  const ensureCandidates = useCallback(async () => {
    if (candidates !== null) return;
    try {
      const res = await fetch(`/api/discussions/${discussionId}/mentionable`);
      if (res.ok) {
        const json = await res.json();
        setCandidates(json.users || []);
      } else {
        setCandidates([]);
      }
    } catch {
      setCandidates([]);
    }
  }, [candidates, discussionId]);

  // Returns the @-trigger info at the current cursor position, or null.
  function activeTrigger(text: string, caret: number) {
    const upto = text.slice(0, caret);
    // Match an @ that is at the start or preceded by whitespace, followed by
    // any letters/digits typed so far. Stop matching once a space is typed.
    const m = upto.match(/(?:^|\s)@([A-Za-z][A-Za-z0-9._-]*)?$/);
    if (!m) return null;
    return { start: caret - (m[1]?.length || 0) - 1, end: caret, partial: m[1] || "" };
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const v = e.target.value;
    onChange(v);
    const caret = e.target.selectionStart ?? v.length;
    const trig = activeTrigger(v, caret);
    if (trig) {
      void ensureCandidates();
      setQuery(trig.partial.toLowerCase());
      setOpen(true);
      setActiveIdx(0);
    } else {
      setOpen(false);
    }
  }

  const filtered = useMemo(() => {
    if (!candidates) return [];
    if (!query) return candidates.slice(0, 8);
    return candidates
      .filter((c) => {
        const norm = c.name.toLowerCase().replace(/\s+/g, "");
        return (
          c.name.toLowerCase().includes(query) ||
          norm.startsWith(query) ||
          (c.email || "").toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  }, [candidates, query]);

  function insertMention(c: Candidate) {
    const el = inputRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const trig = activeTrigger(value, caret);
    if (!trig) return;
    const token = tokenFor(c, candidates || []);
    const next = value.slice(0, trig.start) + token + " " + value.slice(trig.end);
    onChange(next);
    setOpen(false);
    // Restore caret after the inserted token + space.
    requestAnimationFrame(() => {
      const pos = trig.start + token.length + 1;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (open && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filtered[activeIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !multiline && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  }

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!inputRef.current) return;
      if (!(e.target instanceof Node)) return;
      // Close the picker on outside clicks; the dropdown lives inside the
      // same wrapper as the input so clicks inside it don't trigger this.
      if (!(inputRef.current.parentElement?.contains(e.target))) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const sharedProps = {
    ref: inputRef as never,
    value,
    onChange: handleChange,
    onKeyDown: handleKey,
    placeholder,
    autoFocus,
    disabled,
    className,
  };

  return (
    <div className="relative w-full">
      {multiline ? (
        <textarea {...sharedProps} rows={rows ?? 3} />
      ) : (
        <input type="text" {...sharedProps} />
      )}
      {open && filtered.length > 0 && (
        <div
          className="absolute z-50 bottom-full mb-1 left-0 w-64 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg"
          role="listbox"
        >
          {filtered.map((c, i) => (
            <button
              type="button"
              key={c.id}
              onMouseDown={(e) => { e.preventDefault(); insertMention(c); }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                i === activeIdx ? "bg-blue-50" : "hover:bg-slate-50"
              }`}
              role="option"
              aria-selected={i === activeIdx}
            >
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                {(c.name[0] || "?").toUpperCase()}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-slate-900 truncate">{c.name}</span>
                {c.email && (
                  <span className="block text-[11px] text-slate-400 truncate">{c.email}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && candidates !== null && filtered.length === 0 && (
        <div className="absolute z-50 bottom-full mb-1 left-0 w-64 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs text-slate-400">
          No matches.
        </div>
      )}
    </div>
  );
}
