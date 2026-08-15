import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  saveSlideStream, saveSlideLink, removeSlide, safeDecode, tooBigUpFront,
} from "@/lib/presenter-slides";

// Public, token-gated: a presenter submits their deck from the portal.
// Three shapes on one POST:
//   multipart/form-data with `file`  -> store the deck (<= 50 MB, slide types)
//   JSON { linkUrl }                 -> store a Google Slides (etc.) link
//   JSON { remove: true }            -> withdraw what they sent
// The token is the credential, same as the rest of the presenter portal.
// Decks bigger than the cap never reach this route: the portal steers them
// to email contact@aalb.org instead.
//
// What counts as a valid deck lives in presenter-slides.ts, shared with the
// team-facing upload, so the two can never drift apart.

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const presenter = await prisma.presenter.findUnique({
    where: { token: params.token },
    select: { id: true, status: true, name: true },
  });
  if (!presenter) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  if (presenter.status !== "confirmed" && presenter.status !== "tentative") {
    return NextResponse.json({ error: "This portal isn't set up for uploads yet." }, { status: 403 });
  }

  // The deck arrives as its own raw body with the name in a header. Multipart
  // would mean buffering the whole file in memory before a byte reaches the
  // database, which is what used to take the instance down.
  const rawName = req.headers.get("x-file-name");
  if (rawName) {
    if (!req.body) return NextResponse.json({ error: "No file received." }, { status: 400 });
    const early = tooBigUpFront(req.headers.get("content-length"), null);
    if (early && !early.ok) return NextResponse.json({ error: early.error }, { status: early.status });
    const result = await saveSlideStream(
      presenter.id, req.body, safeDecode(rawName), req.headers.get("x-file-type"), null,
    );
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, slide: result.slide });
  }

  const body = await req.json().catch(() => ({} as { linkUrl?: unknown; remove?: unknown; notes?: unknown }));

  // Run-of-show notes, saved independently of the deck itself so a presenter
  // whose file comes in by email can still tell us what to handle in the
  // room. Empty string clears.
  if (typeof (body as { notes?: unknown }).notes === "string") {
    const notes = (body as { notes: string }).notes.trim().slice(0, 2000);
    await prisma.presenter.update({
      where: { id: presenter.id },
      data: { slideNotes: notes || null },
    });
    if (notes) {
      await prisma.presenterEvent.create({
        data: { presenterId: presenter.id, type: "slides_notes_saved", meta: notes.slice(0, 200) },
      }).catch(() => {});
    }
    return NextResponse.json({ ok: true, notes: notes || null });
  }

  if ((body as { remove?: unknown }).remove === true) {
    await removeSlide(presenter.id, null);
    return NextResponse.json({ ok: true, slide: null });
  }

  const linkUrl = typeof (body as { linkUrl?: unknown }).linkUrl === "string" ? (body as { linkUrl: string }).linkUrl.trim() : "";
  if (linkUrl) {
    const result = await saveSlideLink(presenter.id, linkUrl, null);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, slide: result.slide });
  }

  return NextResponse.json({ error: "Send a file, a linkUrl, or remove: true." }, { status: 400 });
}
