"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, CalendarDays, MessageSquare, UserCircle, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, iconBg: "bg-blue-500/20", iconColor: "text-blue-400" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
  { href: "/discussions", label: "Discussions", icon: MessageSquare, iconBg: "bg-amber-500/20", iconColor: "text-amber-400" },
  { href: "/profile", label: "Profile", icon: UserCircle, iconBg: "bg-purple-500/20", iconColor: "text-purple-400" },
  { href: "/admin", label: "Admin", icon: Shield, iconBg: "bg-red-500/20", iconColor: "text-red-400", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-slate-900 border-r border-slate-800">
      <div className="px-5 pt-6 pb-4">
        <div className="text-[11px] font-semibold tracking-widest text-blue-400 uppercase">
          Conference 2026
        </div>
        <div className="text-lg font-extrabold mt-1 text-white tracking-tight">
          Committee Hub
        </div>
        <div className="text-[11px] mt-1 text-slate-500">
          Aug 15-16 &middot; Lurie Children&apos;s
        </div>
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
