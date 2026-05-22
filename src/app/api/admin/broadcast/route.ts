import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dispatchToUsers } from "@/lib/push";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (!isAdmin(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { title, message, audience } = body as {
    title?: string;
    message?: string;
    audience?: { type: "all" } | { type: "committee"; committeeIds: string[] } | { type: "users"; userIds: string[] };
  };
  if (!title || !message) {
    return NextResponse.json({ error: "title and message are required" }, { status: 400 });
  }

  let userIds: string[] = [];
  const aud = audience || { type: "all" };
  if (aud.type === "all") {
    const users = await prisma.user.findMany({ select: { id: true } });
    userIds = users.map((u) => u.id);
  } else if (aud.type === "committee") {
    const members = await prisma.committeeMember.findMany({
      where: { committeeId: { in: aud.committeeIds || [] } },
      select: { userId: true },
    });
    userIds = members.map((m) => m.userId);
  } else if (aud.type === "users") {
    userIds = aud.userIds || [];
  }

  const results = await dispatchToUsers(userIds, {
    channel: "broadcast",
    title,
    body: message,
    data: { kind: "broadcast" },
  });

  const delivered = results.reduce((s, r) => s + r.delivered, 0);
  const skipped = results.filter((r) => r.skipped).length;
  return NextResponse.json({
    recipients: userIds.length,
    delivered,
    skipped,
  });
}
