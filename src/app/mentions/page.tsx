"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AtSign, Check, MessageSquare } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

type Mention = {
  id: string;
  createdAt: string;
  readAt: string | null;
  post: {
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; name: string };
    discussion: {
      id: string;
      title: string;
      committee: { id: string; name: string; slug: string; color: string } | null;
    };
  };
};

export default function MentionsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("unread");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/mentions${filter === "unread" ? "?unread=1" : ""}`);
    if (res.ok) {
      const data = await res.json();
      setMentions(data.mentions);
      setUnreadCount(data.unreadCount);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  async function markAllRead() {
    await fetch("/api/mentions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  }

  async function markOneRead(id: string) {
    await fetch("/api/mentions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setMentions((prev) => prev.map((m) => (m.id === id ? { ...m, readAt: new Date().toISOString() } : m)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <AtSign className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-slate-900">Mentions</h1>
                <p className="text-xs text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-1.5"
                >
                  <Check className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 w-fit">
              <button
                onClick={() => setFilter("unread")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  filter === "unread" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                Unread {unreadCount > 0 && <span className="ml-1 text-blue-600">{unreadCount}</span>}
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                All
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10 text-sm text-slate-400">Loading…</div>
            ) : mentions.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
                <AtSign className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  {filter === "unread" ? "No unread mentions" : "No mentions yet"}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Mention a teammate in a discussion with @firstname.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {mentions.map((m) => {
                  const c = m.post.discussion.committee;
                  const href = c
                    ? `/dashboard?committee=${c.slug}&discussion=${m.post.discussion.id}`
                    : `/discussions?discussion=${m.post.discussion.id}`;
                  return (
                    <li
                      key={m.id}
                      className={`bg-white border rounded-xl p-4 shadow-sm transition-colors ${
                        m.readAt ? "border-slate-200" : "border-blue-200 bg-blue-50/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-1 self-stretch rounded-full shrink-0"
                          style={{ background: c?.color || "#cbd5e1" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mb-1">
                            <span className="font-semibold text-slate-900">{m.post.author.name}</span>
                            <span>in</span>
                            <Link href={href} className="font-semibold text-slate-700 hover:text-blue-600 inline-flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {m.post.discussion.title}
                            </Link>
                            {c && (
                              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                {c.name}
                              </span>
                            )}
                            <span className="ml-auto text-[11px] text-slate-400">
                              {new Date(m.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                            {m.post.body}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Link
                              href={href}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                            >
                              Open thread →
                            </Link>
                            {!m.readAt && (
                              <button
                                onClick={() => markOneRead(m.id)}
                                className="text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
