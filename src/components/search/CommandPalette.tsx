"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search, Users, MessageSquare, FileText, Calendar, Mic,
  ListChecks, Loader2, X, CornerDownLeft,
} from "lucide-react";

type SearchResults = {
  committees: { id: string; name: string; slug: string; description: string; color: string }[];
  discussions: {
    id: string;
    title: string;
    committee: { id: string; name: string; slug: string; color: string } | null;
    _count: { posts: number };
  }[];
  posts: {
    id: string;
    snippet: string;
    author: { id: string; name: string };
    discussion: {
      id: string;
      title: string;
      committee: { id: string; name: string; slug: string; color: string } | null;
    };
  }[];
  files: {
    id: string;
    title: string;
    url: string;
    type: string;
    committee: { id: string; name: string; slug: string; color: string };
  }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    assignee: { id: string; name: string } | null;
    committee: { id: string; name: string; slug: string; color: string };
  }[];
  presenters: {
    id: string;
    name: string;
    email: string;
    affiliation: string | null;
    talkTitle: string | null;
    status: string;
  }[];
};

type FlatItem = {
  key: string;
  group: string;
  GroupIcon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  href: string;
  external?: boolean;
  color?: string;
};

const EMPTY: SearchResults = {
  committees: [], discussions: [], posts: [], files: [], tasks: [], presenters: [],
};

export default function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd-K / Ctrl-K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  // Focus when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    else { setQ(""); setResults(EMPTY); setActive(0); }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) { setResults(EMPTY); return; }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(handle);
  }, [q, open]);

  const items: FlatItem[] = flatten(results);

  const go = useCallback((it: FlatItem) => {
    setOpen(false);
    if (it.external) window.open(it.href, "_blank", "noopener,noreferrer");
    else router.push(it.href);
  }, [router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(items.length - 1, a + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === "Enter") {
        const it = items[active];
        if (it) { e.preventDefault(); go(it); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, active, open, go]);

  useEffect(() => { setActive(0); }, [q]);

  if (status !== "authenticated" || !open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search committees, discussions, files, tasks…"
            className="flex-1 text-sm outline-none placeholder:text-slate-300"
          />
          {loading && <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />}
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">ESC</kbd>
          <button onClick={() => setOpen(false)} className="sm:hidden p-1 rounded hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {q.trim().length < 2 ? (
            <div className="px-5 py-10 text-center text-xs text-slate-400">
              Type to search across committees, discussions, posts, files, tasks and presenters.
            </div>
          ) : items.length === 0 && !loading ? (
            <div className="px-5 py-10 text-center text-xs text-slate-400">
              No results for &ldquo;{q}&rdquo;
            </div>
          ) : (
            renderGrouped(items, active, go)
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="font-mono px-1 rounded bg-white border border-slate-200">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><CornerDownLeft className="w-2.5 h-2.5" /> open</span>
          </div>
          <span>{items.length} result{items.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}

function flatten(r: SearchResults): FlatItem[] {
  const out: FlatItem[] = [];
  r.committees.forEach((c) =>
    out.push({
      key: `c:${c.id}`,
      group: "Committees",
      GroupIcon: Users,
      title: c.name,
      subtitle: c.description,
      href: `/dashboard?committee=${c.slug}`,
      color: c.color,
    })
  );
  r.discussions.forEach((d) =>
    out.push({
      key: `d:${d.id}`,
      group: "Discussions",
      GroupIcon: MessageSquare,
      title: d.title,
      subtitle: d.committee ? `in ${d.committee.name} · ${d._count.posts} replies` : `${d._count.posts} replies`,
      href: d.committee ? `/dashboard?committee=${d.committee.slug}&discussion=${d.id}` : `/discussions?discussion=${d.id}`,
      color: d.committee?.color,
    })
  );
  r.posts.forEach((p) =>
    out.push({
      key: `p:${p.id}`,
      group: "Replies",
      GroupIcon: MessageSquare,
      title: p.snippet,
      subtitle: `${p.author.name} in "${p.discussion.title}"`,
      href: p.discussion.committee
        ? `/dashboard?committee=${p.discussion.committee.slug}&discussion=${p.discussion.id}`
        : `/discussions?discussion=${p.discussion.id}`,
      color: p.discussion.committee?.color,
    })
  );
  r.files.forEach((f) =>
    out.push({
      key: `f:${f.id}`,
      group: "Files",
      GroupIcon: FileText,
      title: f.title,
      subtitle: `in ${f.committee.name}`,
      href: f.url,
      external: true,
      color: f.committee.color,
    })
  );
  r.tasks.forEach((t) =>
    out.push({
      key: `t:${t.id}`,
      group: "Tasks",
      GroupIcon: ListChecks,
      title: t.title,
      subtitle: `${t.committee.name}${t.assignee ? ` · ${t.assignee.name}` : ""} · ${t.status}`,
      href: `/dashboard?committee=${t.committee.slug}&tab=tasks`,
      color: t.committee.color,
    })
  );
  r.presenters.forEach((p) =>
    out.push({
      key: `pr:${p.id}`,
      group: "Presenters",
      GroupIcon: Mic,
      title: p.name,
      subtitle: [p.talkTitle, p.affiliation, p.status].filter(Boolean).join(" · "),
      href: `/presenters/${p.id}`,
    })
  );
  return out;
}

function renderGrouped(items: FlatItem[], active: number, go: (it: FlatItem) => void) {
  const groups: Record<string, { GroupIcon: FlatItem["GroupIcon"]; rows: { item: FlatItem; idx: number }[] }> = {};
  items.forEach((item, idx) => {
    if (!groups[item.group]) groups[item.group] = { GroupIcon: item.GroupIcon, rows: [] };
    groups[item.group].rows.push({ item, idx });
  });

  return Object.entries(groups).map(([name, { GroupIcon, rows }]) => (
    <div key={name} className="px-2 pb-2">
      <div className="px-2 pt-2 pb-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <GroupIcon className="w-3 h-3" /> {name}
      </div>
      {rows.map(({ item, idx }) => (
        <button
          key={item.key}
          onClick={() => go(item)}
          onMouseEnter={() => {/* could update active here */}}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            idx === active ? "bg-blue-50" : "hover:bg-slate-50"
          }`}
        >
          <div
            className="w-1 h-8 rounded-full shrink-0"
            style={{ background: item.color || "#cbd5e1" }}
          />
          <div className="flex-1 min-w-0">
            <div className={`text-sm truncate ${idx === active ? "font-bold text-blue-900" : "font-semibold text-slate-900"}`}>
              {item.title}
            </div>
            {item.subtitle && (
              <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
            )}
          </div>
          {item.group === "Calendar" && <Calendar className="w-3.5 h-3.5 text-slate-300" />}
        </button>
      ))}
    </div>
  ));
}
