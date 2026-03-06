"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="hidden md:flex lg:hidden items-center justify-between h-14 px-5 bg-white border-b border-slate-200">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-500">
          Conference 2026
        </span>
        <span className="font-extrabold text-slate-900 tracking-tight">
          Committee Hub
        </span>
      </Link>

      <nav className="flex items-center gap-5">
        <Link href="/dashboard" className="text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors">
          Dashboard
        </Link>
        <Link href="/calendar" className="text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors">
          Calendar
        </Link>
        <Link href="/discussions" className="text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors">
          Discussions
        </Link>
        <Link href="/profile" className="text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors">
          Profile
        </Link>
      </nav>

      {session?.user ? (
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-slate-900">
            {session.user.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[12px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <Link href="/login" className="text-[13px] font-semibold text-blue-600">
          Sign In
        </Link>
      )}
    </header>
  );
}
