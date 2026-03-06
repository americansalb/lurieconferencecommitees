import Link from "next/link";
import {
  MapPin,
  Monitor,
  Megaphone,
  Handshake,
  Users,
  MessageSquare,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  "map-pin": MapPin,
  monitor: Monitor,
  megaphone: Megaphone,
  handshake: Handshake,
  users: Users,
};

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  "#2563EB": {
    border: "border-l-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  "#059669": {
    border: "border-l-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  "#F97316": {
    border: "border-l-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-500",
  },
  "#9333EA": {
    border: "border-l-purple-600",
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
  "#0D9488": {
    border: "border-l-teal-600",
    bg: "bg-teal-50",
    text: "text-teal-600",
  },
};

interface CommitteeCardProps {
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  memberCount: number;
  discussionCount: number;
  nextEvent?: string | null;
}

export default function CommitteeCard({
  slug,
  name,
  description,
  color,
  icon,
  memberCount,
  discussionCount,
  nextEvent,
}: CommitteeCardProps) {
  const Icon = iconMap[icon] || Users;
  const colors = colorMap[color] || colorMap["#2563EB"];

  return (
    <Link
      href={`/committees/${slug}`}
      className={cn(
        "block bg-white rounded-lg border border-gray-200 border-l-4 p-5 hover:shadow-md transition-shadow",
        colors.border
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("p-2 rounded-lg", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.text)} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5" />
          {discussionCount} threads
        </span>
        {nextEvent && (
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            {nextEvent}
          </span>
        )}
      </div>
    </Link>
  );
}
