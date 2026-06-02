import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Add a one-off availability exception (an extra opening or a blocked period)
// for the current user. Body: { kind, startAt, endAt, note }.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const kind = body.kind === "add" ? "add" : "block";
  const startAt = new Date(body.startAt);
  const endAt = new Date(body.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: "Invalid start/end." }, { status: 400 });
  }

  const ex = await prisma.availabilityException.create({
    data: { userId, kind, startAt, endAt, note: (body.note || "").trim() || null },
  });
  return NextResponse.json({ ok: true, exception: ex }, { status: 201 });
}

// Delete one of the current user's exceptions. Body: { id }.
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const ex = await prisma.availabilityException.findUnique({ where: { id } });
  if (!ex || ex.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.availabilityException.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
