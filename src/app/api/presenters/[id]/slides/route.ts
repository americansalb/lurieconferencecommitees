import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  saveSlideStream, saveSlideLink, removeSlide, slideChunks, safeDecode, tooBigUpFront,
} from "@/lib/presenter-slides";

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
  // Metadata only. Selecting `data` here would load the whole deck just to find
  // out how big it is.
  const slide = await prisma.presenterSlide.findUnique({
    where: { presenterId: params.id },
    select: { fileName: true, mime: true, sizeBytes: true, linkUrl: true },
  });
  if (!slide) return NextResponse.json({ error: "No presentation on file." }, { status: 404 });

  if (!slide.sizeBytes && slide.linkUrl) {
    return NextResponse.redirect(slide.linkUrl);
  }
  if (!slide.sizeBytes) return NextResponse.json({ error: "No presentation on file." }, { status: 404 });

  const total = slide.sizeBytes;
  const mime = slide.mime || "application/octet-stream";
  const name = (slide.fileName || "presentation").replace(/[^\w.\- ()]/g, "_");
  const inline = mime === "application/pdf";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of slideChunks(params.id, total)) controller.enqueue(part);
        controller.close();
      } catch {
        // Nothing useful to say inside a binary file; drop the connection so
        // the browser reports a failed download rather than saving a truncated
        // deck that looks fine until someone opens it.
        controller.error(new Error("read failed"));
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(total),
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

  // A file arrives as its own raw body with the name in a header, not as
  // multipart: parsing multipart means buffering the whole deck first, which is
  // exactly what we are avoiding.
  const rawName = req.headers.get("x-file-name");
  if (rawName) {
    if (!req.body) return NextResponse.json({ error: "No file received." }, { status: 400 });
    const early = tooBigUpFront(req.headers.get("content-length"), actor);
    if (early && !early.ok) return NextResponse.json({ error: early.error }, { status: early.status });
    const fileName = safeDecode(rawName);
    const result = await saveSlideStream(
      presenter.id, req.body, fileName, req.headers.get("x-file-type"), actor,
    );
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
