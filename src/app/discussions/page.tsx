"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare, Pin, Send, ChevronDown, ChevronUp,
  Pencil, Trash2, Check, X,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

const SLUG_COLORS: Record<string, string> = {
  "logistics-venue": "#3b82f6",
  "technology-virtual": "#06b6d4",
  "marketing-communications": "#f59e0b",
  "sponsorship-fundraising": "#8b5cf6",
  "volunteer-participant": "#10b981",
  "executive-planning": "#DC2626",
};

interface Post {
  id: string;
  body: string;
  author: { id: string; name: string };
  createdAt: string;
}

interface Discussion {
  id: string;
  title: string;
  isPinned: boolean;
  isGlobal?: boolean;
  author: { id: string; name: string };
  committee: { id: string; name: string; slug: string; color: string } | null;
  createdAt: string;
  _count: { posts: number };
}

interface Committee {
  id: string;
  name: string;
  slug: string;
  color: string;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DiscussionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSlug, setFilterSlug] = useState<string | null>(null);
  const [expandedDisc, setExpandedDisc] = useState<string | null>(null);
  const [discPosts, setDiscPosts] = useState<Record<string, Post[]>>({});
  const [replyText, setReplyText] = useState("");
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [newDiscTitle, setNewDiscTitle] = useState("");
  const [newDiscCommitteeId, setNewDiscCommitteeId] = useState("");

  const currentUserId = (session?.user as { id?: string })?.id;
  const currentUserRole = (session?.user as { role?: string })?.role;
  const canModerate = currentUserRole === "developer" || currentUserRole === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const fetchData = useCallback(() => {
    if (!session) return;
    Promise.all([
      fetch("/api/discussions").then(r => r.ok ? r.json() : []),
      fetch("/api/committees").then(r => r.ok ? r.json() : []),
    ]).then(([discs, comms]) => {
      setDiscussions(discs);
      const commList = comms.map((c: Committee) => ({ id: c.id, name: c.name, slug: c.slug, color: c.color }));
      setCommittees(commList);
      if (!newDiscCommitteeId && commList.length > 0) setNewDiscCommitteeId(commList[0].id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [session, newDiscCommitteeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredDiscussions = filterSlug
    ? discussions.filter(d => d.committee?.slug === filterSlug || d.isGlobal)
    : discussions;

  async function loadPosts(discId: string) {
    const res = await fetch(`/api/discussions/${discId}`);
    if (res.ok) {
      const data = await res.json();
      setDiscPosts(prev => ({ ...prev, [discId]: data.posts || [] }));
    }
  }

  async function handleReply(discId: string) {
    if (!replyText.trim()) return;
    await fetch(`/api/discussions/${discId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyText }),
    });
    setReplyText("");
    loadPosts(discId);
  }

  async function handleEditPost(discId: string, postId: string) {
    if (!editText.trim()) return;
    await fetch(`/api/discussions/${discId}/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editText }),
    });
    setEditingPost(null);
    setEditText("");
    loadPosts(discId);
  }

  async function handleDeletePost(discId: string, postId: string) {
    await fetch(`/api/discussions/${discId}/posts/${postId}`, { method: "DELETE" });
    loadPosts(discId);
  }

  async function handleCreateDiscussion() {
    if (!newDiscTitle.trim() || !newDiscCommitteeId) return;
    await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newDiscTitle, committeeId: newDiscCommitteeId }),
    });
    setNewDiscTitle("");
    fetchData();
  }

  async function handleDeleteDiscussion(discId: string, title: string) {
    if (!confirm(`Delete "${title}" and all its replies?`)) return;
    await fetch(`/api/discussions/${discId}`, { method: "DELETE" });
    if (expandedDisc === discId) setExpandedDisc(null);
    fetchData();
  }

  if (status === "loading" || !session || loading) {
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
            {/* Header */}
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-amber-500" /> All Discussions
            </h1>

            {/* Committee filter chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFilterSlug(null)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  !filterSlug ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                All
              </button>
              {committees.map(c => {
                const color = SLUG_COLORS[c.slug] || "#3b82f6";
                const active = filterSlug === c.slug;
                return (
                  <button
                    key={c.slug}
                    onClick={() => setFilterSlug(active ? null : c.slug)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
                    style={active
                      ? { background: color, color: "#fff", borderColor: color }
                      : { background: color + "10", color, borderColor: color + "30" }
                    }
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            {/* New discussion form */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
              <div className="flex gap-2">
                <select
                  value={newDiscCommitteeId}
                  onChange={e => setNewDiscCommitteeId(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                >
                  {((session?.user as { role?: string })?.role === "admin" || (session?.user as { role?: string })?.role === "developer") && (
                    <option value="all">All Committees (broadcast)</option>
                  )}
                  {committees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  value={newDiscTitle}
                  onChange={e => setNewDiscTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateDiscussion()}
                  placeholder="Start a new discussion..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                />
                <button
                  onClick={handleCreateDiscussion}
                  disabled={!newDiscTitle.trim()}
                  className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg px-4 py-2 transition-colors"
                >
                  Post
                </button>
              </div>
            </div>

            {/* Discussions list */}
            <div className="space-y-2">
              {filteredDiscussions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No discussions yet. Start one above.</p>
                </div>
              ) : (
                filteredDiscussions.map(disc => {
                  const color = disc.committee ? (SLUG_COLORS[disc.committee.slug] || "#3b82f6") : "#64748b";
                  const isExpanded = expandedDisc === disc.id;
                  const posts = discPosts[disc.id] || [];
                  const canDelete = disc.author.id === currentUserId || canModerate;

                  return (
                    <div key={disc.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="flex items-center gap-0 hover:bg-slate-50 transition-colors">
                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedDisc(null);
                            } else {
                              setExpandedDisc(disc.id);
                              if (!discPosts[disc.id]) loadPosts(disc.id);
                            }
                          }}
                          className="flex-1 text-left px-4 py-3 flex items-center gap-3 min-w-0"
                        >
                          <div className="w-2 h-8 rounded-full shrink-0" style={{ background: color }} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {disc.isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                              {disc.isGlobal && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-white shrink-0">ALL</span>}
                              <span className="text-sm font-bold text-slate-900 truncate">{disc.title}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              <span style={{ color }}>{disc.committee ? disc.committee.name : "All Committees"}</span>
                              {" · "}
                              {disc.author.name}
                              {" · "}
                              {timeAgo(disc.createdAt)}
                              {" · "}
                              {disc._count.posts} {disc._count.posts === 1 ? "reply" : "replies"}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteDiscussion(disc.id, disc.title)}
                            className="p-2 mr-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                            title="Delete discussion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="border-t border-slate-100">
                          {/* Posts */}
                          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                            {posts.length === 0 ? (
                              <div className="px-4 py-4 text-xs text-slate-400 text-center">No replies yet</div>
                            ) : (
                              posts.map(post => {
                                const isOwn = post.author.id === currentUserId;
                                const canEdit = isOwn || canModerate;
                                const isEditing = editingPost === post.id;

                                return (
                                  <div key={post.id} className="px-4 py-3 group">
                                    <div className="flex items-start gap-3">
                                      <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                        style={{ background: color + "18", color }}
                                      >
                                        {getInitials(post.author.name)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-slate-900">{post.author.name}</span>
                                          <span className="text-[10px] text-slate-400">{timeAgo(post.createdAt)}</span>
                                          {canEdit && !isEditing && (
                                            <div className="ml-auto opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                              <button
                                                onClick={() => { setEditingPost(post.id); setEditText(post.body); }}
                                                className="p-1 rounded hover:bg-slate-100"
                                              >
                                                <Pencil className="w-3 h-3 text-slate-400" />
                                              </button>
                                              <button
                                                onClick={() => handleDeletePost(disc.id, post.id)}
                                                className="p-1 rounded hover:bg-red-50"
                                              >
                                                <Trash2 className="w-3 h-3 text-red-400" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        {isEditing ? (
                                          <div className="mt-1 flex gap-2">
                                            <input
                                              value={editText}
                                              onChange={e => setEditText(e.target.value)}
                                              onKeyDown={e => e.key === "Enter" && handleEditPost(disc.id, post.id)}
                                              className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded outline-none focus:border-blue-400"
                                              autoFocus
                                            />
                                            <button onClick={() => handleEditPost(disc.id, post.id)} className="p-1 rounded hover:bg-emerald-50">
                                              <Check className="w-4 h-4 text-emerald-500" />
                                            </button>
                                            <button onClick={() => setEditingPost(null)} className="p-1 rounded hover:bg-slate-100">
                                              <X className="w-4 h-4 text-slate-400" />
                                            </button>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{post.body}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Reply input */}
                          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100">
                            <div className="flex gap-2">
                              <input
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleReply(disc.id)}
                                placeholder="Write a reply..."
                                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-white"
                              />
                              <button
                                onClick={() => handleReply(disc.id)}
                                disabled={!replyText.trim()}
                                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
