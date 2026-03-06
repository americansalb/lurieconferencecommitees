"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Monitor, Megaphone, Handshake, Users, ArrowRight } from "lucide-react";

const committees = [
  { name: "Logistics & Venue", icon: MapPin, color: "#3b82f6" },
  { name: "Technology & Virtual", icon: Monitor, color: "#06b6d4" },
  { name: "Marketing & Communications", icon: Megaphone, color: "#f59e0b" },
  { name: "Sponsorship & Fundraising", icon: Handshake, color: "#8b5cf6" },
  { name: "Volunteer & Participant Experience", icon: Users, color: "#10b981" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left — hero */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12 bg-slate-900 text-white relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="text-xs font-semibold tracking-widest text-blue-400 uppercase">
            Lurie Children&apos;s &middot; AALB
          </div>
          <h1 className="text-4xl font-extrabold mt-4 leading-[1.15] tracking-tight">
            Conference 2026<br />
            <span className="text-slate-400 font-medium text-2xl">Committee Planning Hub</span>
          </h1>
          <p className="text-slate-400 text-sm mt-5 leading-relaxed max-w-xs">
            One workspace for all five conference committees. Coordinate members, calendars, and discussions.
          </p>
        </div>

        <div className="relative z-10 space-y-2">
          {committees.map((c) => (
            <div key={c.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: c.color + "20" }}>
                <c.icon className="w-4 h-4" style={{ color: c.color }} />
              </div>
              <span className="text-sm text-slate-300">{c.name}</span>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          August 15-16, 2026
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <div className="text-xs font-semibold tracking-widest text-blue-600 uppercase">
              AALB Conference 2026
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Committee Hub
            </h1>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1 mb-8">
            Welcome back to your planning workspace
          </p>

          {registered && (
            <div className="rounded-lg p-3 mb-5 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Account created! Please sign in.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {error && (
              <div className="rounded-lg p-3 text-sm font-medium bg-red-50 text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Signing in..." : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New to the team?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-pulse text-sm text-slate-400">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
