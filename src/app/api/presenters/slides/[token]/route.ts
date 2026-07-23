import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public, token-gated: a presenter submits their deck from the portal.
// Three shapes on one POST:
//   multipart/form-data with `file`  -> store the deck (<= 50 MB, slide types)
//   JSON { linkUrl }                 -> store a Google Slides (etc.) link
//   JSON { remove: true }            -> withdraw what they sent
// The token is the credential, same as the rest of the presenter portal.
// Decks bigger than the cap never reach this route: the portal steers them
// to email contact@aalb.org instead.

export const dynamic = "force-dynamic";

const MAX_BYTES = 50 * 1024 * 1024;
const NAME_RE = /\.(ppt|pptx|key|odp|pdf)$/i;

const MIME_BY_EXT: Record<string, string> = {
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  key: "application/vnd.apple.keynote",
  odp: "application/vnd.oasis.opendocument.presentation",
  pdf: "application/pdf",
};

function slideSummary(s: { fileName: string | null; sizeBytes: number | null; linkUrl: string | null; updatedAt: Date | null; createdAt: Date }) {
  return {
    fileName: s.fileName,
    sizeBytes: s.sizeBytes,
    linkUrl: s.linkUrl,
    updatedAt: (s.updatedAt || s.createdAt).toISOString(),
  };
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const presenter = await prisma.presenter.findUnique({
    where: { token: params.token },
    select: { id: true, status: true, name: true },
  });
  if (!presenter) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  if (presenter.status !== "confirmed" && presenter.status !== "tentative") {
    return NextResponse.json({ error: "This portal isn't set up for uploads yet." }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }
    if (!NAME_RE.test(file.name)) {
      return NextResponse.json({ error: "PowerPoint (.ppt, .pptx), Keynote (.key), OpenDocument (.odp), or PDF, please." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "That file is over 50 MB. Please email it to contact@aalb.org instead." }, { status: 413 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "That file looks empty." }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const mime = file.type && file.type !== "application/octet-stream" ? file.type : (MIME_BY_EXT[ext] || "application/octet-stream");
    const data = {
      fileName: file.name.slice(0, 200),
      mime,
      sizeBytes: buf.length,
      data: buf,
      linkUrl: null as string | null,
    };
    const saved = await prisma.presenterSlide.upsert({
      where: { presenterId: presenter.id },
      update: data,
      create: { presenterId: presenter.id, ...data },
    });
    await prisma.presenterEvent.create({
      data: { presenterId: presenter.id, type: "slides_uploaded", meta: `${data.fileName} (${Math.round(buf.length / 1024 / 1024)} MB)` },
    }).catch(() => {});
    return NextResponse.json({ ok: true, slide: slideSummary(saved) });
  }

  const body = await req.json().catch(() => ({} as { linkUrl?: unknown; remove?: unknown }));

  if ((body as { remove?: unknown }).remove === true) {
    await prisma.presenterSlide.deleteMany({ where: { presenterId: presenter.id } });
    await prisma.presenterEvent.create({
      data: { presenterId: presenter.id, type: "slides_removed" },
    }).catch(() => {});
    return NextResponse.json({ ok: true, slide: null });
  }

  const linkUrl = typeof (body as { linkUrl?: unknown }).linkUrl === "string" ? (body as { linkUrl: string }).linkUrl.trim() : "";
  if (linkUrl) {
    let parsed: URL;
    try {
      parsed = new URL(linkUrl);
    } catch {
      return NextResponse.json({ error: "That doesn't look like a full link." }, { status: 400 });
    }
    if (parsed.protocol !== "https:" || linkUrl.length > 600) {
      return NextResponse.json({ error: "Please paste an https:// link." }, { status: 400 });
    }
    const data = { fileName: null, mime: null, sizeBytes: null, data: null, linkUrl };
    const saved = await prisma.presenterSlide.upsert({
      where: { presenterId: presenter.id },
      update: data,
      create: { presenterId: presenter.id, ...data },
    });
    await prisma.presenterEvent.create({
      data: { presenterId: presenter.id, type: "slides_link_submitted", meta: linkUrl.slice(0, 200) },
    }).catch(() => {});
    return NextResponse.json({ ok: true, slide: slideSummary(saved) });
  }

  return NextResponse.json({ error: "Send a file, a linkUrl, or remove: true." }, { status: 400 });
}
