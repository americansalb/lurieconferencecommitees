"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { token } = params;
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/auth/password-reset/confirm?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => setValid(!!d.valid))
      .catch(() => setValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm") || "");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>

        <h2 className="text-2xl font-extrabold text-slate-900">Choose a new password</h2>
        <p className="text-sm text-slate-500 mt-1 mb-8">
          Pick something at least 8 characters long.
        </p>

        {checking ? (
          <div className="text-sm text-slate-400">Checking link...</div>
        ) : !valid ? (
          <div className="rounded-lg p-4 text-sm bg-red-50 text-red-600 border border-red-200">
            This reset link is invalid or has expired. <Link href="/forgot-password" className="font-semibold underline">Request a new one</Link>.
          </div>
        ) : done ? (
          <div className="rounded-lg p-4 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
            Password updated. Redirecting you to sign in...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Confirm new password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
              {loading ? "Saving..." : (<>Update password <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
