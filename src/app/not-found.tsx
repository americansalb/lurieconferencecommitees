import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">404</h1>
        <p className="text-sm text-slate-500 mb-4">Page not found</p>
        <Link href="/dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
