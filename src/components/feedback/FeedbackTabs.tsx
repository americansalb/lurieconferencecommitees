import Link from "next/link";

// The two feedback pages: where forms go in, and where everything is read.
export default function FeedbackTabs({ active }: { active: "manage" | "all" }) {
  const tab = (on: boolean) =>
    `px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
      on ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
    }`;
  return (
    <div className="mt-4 inline-flex gap-1 rounded-xl bg-slate-100 p-1">
      <Link href="/feedback" className={tab(active === "manage")}>Import and manage</Link>
      <Link href="/feedback/all" className={tab(active === "all")}>All feedback</Link>
    </div>
  );
}
