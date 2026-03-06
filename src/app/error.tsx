"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h2>
        <button onClick={reset} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          Try again
        </button>
      </div>
    </div>
  );
}
