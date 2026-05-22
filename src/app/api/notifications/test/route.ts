import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import { dispatchToUser } from "@/lib/push";

async function getUserId(req: Request): Promise<string | null> {
  const mobile = await getMobileUserFromRequest(req);
  if (mobile) return mobile.id;
  const session = await getServerSession(authOptions);
  if (session?.user) return (session.user as { id: string }).id;
  return null;
}

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await dispatchToUser(userId, {
    channel: "broadcast",
    title: "Test notification",
    body: "Push notifications are working on this device.",
    data: { kind: "test" },
  });
  return NextResponse.json(result);
}
