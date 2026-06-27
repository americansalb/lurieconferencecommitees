"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { LayoutDashboard, CalendarDays, MessageSquare, UserCircle, LogOut, Shield, Mic, Bell, AtSign, Search, Ticket, Award, Tag, CalendarClock, Upload, CalendarRange, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, iconBg: "bg-blue-500/20", iconColor: "text-blue-400" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
  { href: "/discussions", label: "Discussions", icon: MessageSquare, iconBg: "bg-amber-500/20", iconColor: "text-amber-400" },
  { href: "/mentions", label: "Mentions", icon: AtSign, iconBg: "bg-indigo-500/20", iconColor: "text-indigo-400", badgeKey: "mentions" as const },
  { href: "/presenters", label: "Presenters", icon: Mic, iconBg: "bg-pink-500/20", iconColor: "text-pink-400" },
  { href: "/schedule", label: "Schedule", icon: CalendarRange, iconBg: "bg-orange-500/20", iconColor: "text-orange-400" },
  { href: "/meetings", label: "Meetings", icon: CalendarClock, iconBg: "bg-violet-500/20", iconColor: "text-violet-400" },
  { href: "/attendees", label: "Attendees", icon: Ticket, iconBg: "bg-teal-500/20", iconColor: "text-teal-400" },
  { href: "/sponsors", label: "Sponsors", icon: Award, iconBg: "bg-amber-500/20", iconColor: "text-amber-400" },
  { href: "/queue", label: "Email queue", icon: Mail, iconBg: "bg-blue-500/20", iconColor: "text-blue-400", adminOnly: true },
  { href: "/discounts", label: "Discount codes", icon: Tag, iconBg: "bg-rose-500/20", iconColor: "text-rose-400" },
  { href: "/notifications", label: "Notifications", icon: Bell, iconBg: "bg-sky-500/20", iconColor: "text-sky-400" },
  { href: "/import", label: "Import", icon: Upload, iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400", adminOnly: true },
  { href: "/profile", label: "Profile", icon: UserCircle, iconBg: "bg-purple-500/20", iconColor: "text-purple-400" },
  { href: "/admin", label: "Admin", icon: Shield, iconBg: "bg-red-500/20", iconColor: "text-red-400", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mentionCount, setMentionCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/mentions?unread=1");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setMentionCount(data.unreadCount || 0);
        }
      } catch { /* ignore */ }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [status, pathname]);

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-slate-900 border-r border-slate-800">
      <div className="px-5 pt-6 pb-4">
        <div className="text-[11px] font-semibold tracking-widest text-blue-400 uppercase">
          Lurie Children&apos;s &amp; AALB
        </div>
        <div className="text-lg font-extrabold mt-1 text-white tracking-tight">
          Conference 2026
        </div>
        <div className="text-[11px] mt-1 text-slate-500">
          True Language Access
        </div>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={() => {
            const ev = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
            window.dispatchEvent(ev);
          }}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[12px]">Search…</span>
          <kbd className="ml-auto text-[10px] font-mono bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
      </div>

      <div className="px-2.5 flex-1">
        <div className="space-y-0.5">
          {navItems
            .filter((item) => {
              if ((item as { adminOnly?: boolean }).adminOnly) {
                const role = (session?.user as { role?: string })?.role;
                return role === "admin" || role === "developer";
              }
              return true;
            })
            .map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"));
            const Icon = item.icon;
            const badge = (item as { badgeKey?: "mentions" }).badgeKey === "mentions" ? mentionCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all w-full",
                  isActive ? "bg-white/[0.08] border border-white/[0.08]" : "border border-transparent hover:bg-white/[0.04]"
                )}
              >
                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", item.iconBg)}>
                  <Icon className={cn("w-3.5 h-3.5", item.iconColor)} />
                </div>
                <span className={cn("text-[13px]", isActive ? "font-bold text-slate-100" : "font-medium text-slate-400")}>
                  {item.label}
                </span>
                {badge > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-blue-500 text-white rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {session?.user && (
        <div className="px-5 py-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 truncate mb-2">{session.user.name}</div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[11px] text-slate-600 hover:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
