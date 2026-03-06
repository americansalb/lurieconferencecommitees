"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  MapPin,
  Monitor,
  Megaphone,
  Handshake,
  Users,
  MessageSquare,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import JoinButton from "@/components/committees/JoinButton";
import CreateDiscussionForm from "@/components/discussions/CreateDiscussionForm";
import ThreadView from "@/components/discussions/ThreadView";

const iconMap: Record<string, React.ElementType> = {
  "map-pin": MapPin,
  monitor: Monitor,
  megaphone: Megaphone,
  handshake: Handshake,
  users: Users,
};

interface Committee {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  members: {
    user: { id: string; name: string; email: string };
    role: string;
  }[];
  discussions: {
    id: string;
    title: string;
    isPinned: boolean;
    author: { name: string };
    createdAt: string;
    posts: [];
    _count: { posts: number };
  }[];
  events: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    timezone?: string;
    meetingUrl?: string | null;
  }[];
  _count: { discussions: number; events: number; members: number };
}

type Tab = "overview" | "members" | "discussions" | "events";

export default function CommitteeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const fetchCommittee = useCallback(() => {
    fetch("/api/committees")
      .then((res) => res.json())
      .then((data: Committee[]) => {
        const found = data.find((c) => c.slug === params.slug);
        setCommittee(found || null);
        setLoading(false);
      });
  }, [params.slug]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    fetchCommittee();
  }, [fetchCommittee]);

  const userId = (session?.user as { id?: string })?.id;
  const isMember = committee?.members.some((m) => m.user.id === userId) ?? false;

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-4">Committee not found.</p>
              <Link href="/committees" className="text-blue-600 hover:underline text-sm">
                Back to committees
              </Link>
            </div>
          </div>
          <MobileNav />
        </div>
      </div>
    );
  }

  const Icon = iconMap[committee.icon] || Users;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Icon },
    { key: "members", label: "Members", icon: Users },
    { key: "discussions", label: "Discussion", icon: MessageSquare },
    { key: "events", label: "Events", icon: CalendarDays },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
        {/* Back link */}
        <Link
          href="/committees"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          All Committees
        </Link>

        {/* Header */}
        <div
          className="bg-white rounded-lg border border-gray-200 border-l-4 p-5 mb-6"
          style={{ borderLeftColor: committee.color }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: committee.color + "15" }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: committee.color }}
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {committee.name}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {committee.members.length} members
                </p>
              </div>
            </div>
            <JoinButton
              committeeId={committee.id}
              isMember={isMember}
              onJoined={fetchCommittee}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {committee.description}
            </p>
          </div>
        )}

        {activeTab === "members" && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Members</h2>
            {committee.members.length === 0 ? (
              <p className="text-gray-400 text-sm">No members yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {committee.members.map((m) => (
                  <li
                    key={m.user.id}
                    className="py-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {m.user.name}
                      </p>
                      <p className="text-xs text-gray-400">{m.user.email}</p>
                    </div>
                    {m.role === "chair" && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                        Chair
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "discussions" && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Discussions</h2>
              {isMember && (
                <CreateDiscussionForm
                  committeeId={committee.id}
                  onCreated={fetchCommittee}
                />
              )}
            </div>
            {!isMember && (
              <p className="text-gray-400 text-sm mb-4">
                Join this committee to start or reply to discussions.
              </p>
            )}
            {!committee.discussions || committee.discussions.length === 0 ? (
              <p className="text-gray-400 text-sm">No discussions yet.</p>
            ) : (
              <div className="space-y-2">
                {committee.discussions.map((d) => (
                  <ThreadView
                    key={d.id}
                    discussion={d}
                    onReplyPosted={fetchCommittee}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              Upcoming Events
            </h2>
            {!committee.events || committee.events.length === 0 ? (
              <p className="text-gray-400 text-sm">No events scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {committee.events.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-start gap-3 p-3 rounded-md bg-gray-50"
                  >
                    <CalendarDays className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">
                        {ev.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(ev.startTime).toLocaleDateString()} &middot;{" "}
                        {new Date(ev.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(ev.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {ev.timezone && (
                          <span className="ml-1 text-gray-300">
                            ({ev.timezone.replace("America/", "").replace(/_/g, " ")})
                          </span>
                        )}
                      </p>
                      {ev.meetingUrl && (
                        <a
                          href={ev.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          Join Meeting
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
