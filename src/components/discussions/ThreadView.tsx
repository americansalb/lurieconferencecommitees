"use client";

import { useState } from "react";
import { MessageSquare, Send, Loader2, ChevronDown, ChevronUp, Pin } from "lucide-react";

interface Post {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string };
}

interface Discussion {
  id: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  author: { name: string };
  posts: Post[];
  _count?: { posts: number };
}

interface ThreadViewProps {
  discussion: Discussion;
  onReplyPosted?: () => void;
}

export default function ThreadView({
  discussion,
  onReplyPosted,
}: ThreadViewProps) {
  const [expanded, setExpanded] = useState(false);
  const [posts, setPosts] = useState<Post[]>(discussion.posts || []);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  async function loadPosts() {
    if (posts.length > 0) {
      setExpanded(!expanded);
      return;
    }
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/discussions/${discussion.id}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } finally {
      setLoadingPosts(false);
      setExpanded(true);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/discussions/${discussion.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts((prev) => [...prev, newPost]);
        setReply("");
        onReplyPosted?.();
      }
    } finally {
      setLoading(false);
    }
  }

  const postCount = discussion._count?.posts ?? posts.length;

  return (
    <div className="border border-gray-100 rounded-lg">
      {/* Thread header */}
      <button
        onClick={loadPosts}
        className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left rounded-lg"
      >
        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {discussion.isPinned && (
              <Pin className="w-3 h-3 text-amber-500 shrink-0" />
            )}
            <p className="font-medium text-sm text-gray-900 truncate">
              {discussion.title}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {discussion.author.name} &middot;{" "}
            {new Date(discussion.createdAt).toLocaleDateString()} &middot;{" "}
            {postCount} {postCount === 1 ? "reply" : "replies"}
          </p>
        </div>
        {loadingPosts ? (
          <Loader2 className="w-4 h-4 text-gray-300 animate-spin shrink-0" />
        ) : expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-300 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />
        )}
      </button>

      {/* Expanded posts */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 pb-3">
          {posts.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 pl-7">
              No replies yet. Be the first!
            </p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {posts.map((post) => (
                <li key={post.id} className="py-3 pl-7">
                  <p className="text-sm text-gray-700">{post.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {post.author.name} &middot;{" "}
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Reply form */}
          <form onSubmit={handleReply} className="flex gap-2 mt-2 pl-7">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !reply.trim()}
              className="p-1.5 text-blue-600 hover:text-blue-700 disabled:opacity-30 transition-colors"
              aria-label="Send reply"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
