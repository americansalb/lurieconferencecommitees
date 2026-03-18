import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function detectFileType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("docs.google.com/document")) return "google-doc";
  if (lower.includes("docs.google.com/spreadsheets")) return "google-sheet";
  if (lower.includes("docs.google.com/presentation")) return "google-slides";
  if (lower.includes("docs.google.com/forms")) return "google-form";
  if (lower.includes("drive.google.com")) return "google-drive";
  if (lower.includes("notion.so") || lower.includes("notion.site")) return "notion";
  if (lower.includes("figma.com")) return "figma";
  if (lower.includes("miro.com")) return "miro";
  if (lower.includes("canva.com")) return "canva";
  return "link";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const committeeId = searchParams.get("committeeId");
  if (!committeeId) {
    return NextResponse.json({ error: "committeeId required" }, { status: 400 });
  }

  const files = await prisma.committeeFile.findMany({
    where: { committeeId },
    include: { addedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(files);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { committeeId, title, url } = await req.json();
  if (!committeeId || !title?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "committeeId, title, and url are required" }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const type = detectFileType(url);

  const file = await prisma.committeeFile.create({
    data: {
      committeeId,
      title: title.trim(),
      url: url.trim(),
      type,
      addedById: userId,
    },
    include: { addedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(file, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;

  const file = await prisma.committeeFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (file.addedById !== userId && userRole !== "admin" && userRole !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.committeeFile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
