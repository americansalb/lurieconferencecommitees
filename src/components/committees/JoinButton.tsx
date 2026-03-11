"use client";

import { useState } from "react";
import { UserPlus, Check, Loader2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface JoinButtonProps {
  committeeId: string;
  isMember: boolean;
  onJoined?: () => void;
}

export default function JoinButton({
  committeeId,
  isMember,
  onJoined,
}: JoinButtonProps) {
  const [joined, setJoined] = useState(isMember);
  const [loading, setLoading] = useState(false);
  const [showLeave, setShowLeave] = useState(false);

  async function handleJoin() {
    if (joined || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/committees/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ committeeId }),
      });

      if (res.ok || res.status === 409) {
        setJoined(true);
        onJoined?.();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    if (!joined || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/committees/join", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ committeeId }),
      });

      if (res.ok) {
        setJoined(false);
        setShowLeave(false);
        onJoined?.();
      }
    } finally {
      setLoading(false);
    }
  }

  if (joined) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowLeave(!showLeave)}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium px-4 py-2 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors"
        >
          <Check className="w-4 h-4" />
          Member
        </button>
        {showLeave && (
          <button
            onClick={handleLeave}
            disabled={loading}
            className="absolute top-full mt-1 right-0 z-10 inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors whitespace-nowrap shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Leave Committee
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md transition-colors",
        "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      Join Committee
    </button>
  );
}
