"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import ProgramBookBuilder from "./ProgramBookBuilder";

export default function ProgramBookPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="no-print contents"><Sidebar /></div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="no-print contents"><Navbar /></div>
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <ProgramBookBuilder />
          </div>
        </main>
        <div className="no-print contents"><MobileNav /></div>
      </div>
    </div>
  );
}
