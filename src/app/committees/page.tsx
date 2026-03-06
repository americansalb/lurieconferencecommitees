"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import CommitteeCard from "@/components/committees/CommitteeCard";

interface Committee {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  _count: {
    members: number;
    discussions: number;
  };
}

export default function CommitteesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/committees")
        .then((res) => res.json())
        .then((data) => {
          setCommittees(data);
          setLoading(false);
        });
    }
  }, [session]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 p-4 md:p-6">
          <div className="md:hidden mb-4">
            <h1 className="text-xl font-bold text-gray-900">Committees</h1>
          </div>

          <div className="hidden md:block mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Conference Committees
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              AALB Conference 2026 at Lurie Children&apos;s
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {committees.map((committee) => (
                <CommitteeCard
                  key={committee.id}
                  slug={committee.slug}
                  name={committee.name}
                  description={committee.description}
                  color={committee.color}
                  icon={committee.icon}
                  memberCount={committee._count.members}
                  discussionCount={committee._count.discussions}
                />
              ))}
            </div>
          )}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
