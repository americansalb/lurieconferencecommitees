"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, CheckCircle2, Calendar, Users, MessageSquare, ArrowRight } from "lucide-react";

const benefits = [
  { label: "Collaborate", desc: "Discuss plans with your committee", icon: MessageSquare },
  { label: "Organize", desc: "Manage calendars and events", icon: Calendar },
  { label: "Connect", desc: "Work across all five teams", icon: Users },
];

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left — hero */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12 bg-slate-900 text-white relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="text-xs font-semibold tracking-widest text-blue-400 uppercase">
            Lurie Children&apos;s &middot; AALB
          </div>
          <h1 className="text-4xl font-extrabold mt-4 leading-[1.15] tracking-tight">
            Join Your Team<br />
            <span className="text-slate-400 font-medium text-2xl">Conference 2026 Planning</span>
          </h1>
          <p className="text-slate-400 text-sm mt-5 leading-relaxed max-w-xs">
            Create your account to start collaborating with your conference committee.
          </p>
        </div>

        <div className="relative z-10 space-y-2">
          {benefits.map((b) => (
            <div key={b.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-blue-500/15">
                <b.icon className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">{b.label}</div>
                <div className="text-xs text-slate-500">{b.desc}</div>
              </div>
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
              Create Account
            </h1>
          </div>

          <div className="hidden lg:flex items-center gap-2 mb-1">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-extrabold text-slate-900">Create account</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1 mb-8">
            Get started with the committee planning hub
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Jane Smith"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Email Address
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
                minLength={8}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {error && (
              <div className="rounded-lg p-3 text-sm font-medium bg-red-50 text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <div className="text-[11px] text-slate-400 text-center">
              Your timezone has been detected as <span className="font-semibold text-slate-600">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Creating account..." : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
