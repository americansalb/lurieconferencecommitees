import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEventSettings, saveEventSettings } from "@/lib/event-settings";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await getEventSettings());
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const input: { joinUrl?: string; agendaUrl?: string } = {};
  if (typeof body?.joinUrl === "string") input.joinUrl = body.joinUrl;
  if (typeof body?.agendaUrl === "string") input.agendaUrl = body.agendaUrl;
  return NextResponse.json(await saveEventSettings(input));
}
