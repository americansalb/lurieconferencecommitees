import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveSlideFile, saveSlideLink, removeSlide } from "@/lib/presenter-slides";

// Team-facing, by presenter id.
//
// GET fetches a submitted deck: PDFs render inline in the browser tab (that's
// the preview); slide files download with their original name; a link
// submission 302s straight to the link. Any logged-in member can view, matching
// the presenters dashboard.
//
// POST puts a deck on file for a presenter who cannot do it themselves. Some of
// the people we invite are not going to work an upload form, and chasing them
// through their portal is not a good use of anyone's week: they email the file
// or hand it over, and it gets loaded here. Admins only, since it writes on
// somebody else's behalf, and it records who did it.

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") return null;
  return session;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const slide = await prisma.presenterSlide.findUnique({ where: { presenterId: params.id } });
  if (!slide) return NextResponse.json({ error: "No presentation on file." }, { status: 404 });

  if (!slide.data && slide.linkUrl) {
    return NextResponse.redirect(slide.linkUrl);
  }
  if (!slide.data) return NextResponse.json({ error: "No presentation on file." }, { status: 404 });

  const mime = slide.mime || "application/octet-stream";
  const name = (slide.fileName || "presentation").replace(/[^\w.\- ()]/g, "_");
  const inline = mime === "application/pdf";
  return new NextResponse(Buffer.from(slide.data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(slide.data.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const presenter = await prisma.presenter.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!presenter) return NextResponse.json({ error: "No such presenter." }, { status: 404 });

  // Whoever is signed in, so the badge can say the deck came from us rather
  // than from the presenter.
  const actor = session.user?.email || "the team";
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }
    const result = await saveSlideFile(presenter.id, file, actor);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, slide: result.slide });
  }

  const body = await req.json().catch(() => ({}));
  const linkUrl = typeof (body as { linkUrl?: unknown }).linkUrl === "string"
    ? (body as { linkUrl: string }).linkUrl.trim()
    : "";
  if (!linkUrl) {
    return NextResponse.json({ error: "Send a file or a linkUrl." }, { status: 400 });
  }
  const result = await saveSlideLink(presenter.id, linkUrl, actor);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, slide: result.slide });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  await removeSlide(params.id, session.user?.email || "the team");
  return NextResponse.json({ ok: true, slide: null });
}
