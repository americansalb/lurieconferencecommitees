import { prisma } from "./db";
import { MAX_SLIDE_BYTES, SLIDE_NAME_RE, SLIDE_TYPES_SENTENCE, MIME_BY_EXT } from "./slide-types";

export { MAX_SLIDE_BYTES, SLIDE_NAME_RE, SLIDE_ACCEPT, SLIDE_TYPES_SENTENCE } from "./slide-types";

// Saving a presentation, in one place.
//
// Two doors lead here and they must agree on what a valid deck is, or a
// presenter gets told 50 MB and the team gets told something else:
//   - the presenter's own portal, gated by their token
//   - the team, uploading on someone's behalf from the presenters page
//
// The second door exists because not everyone we invite is comfortable with an
// upload form. They email the file, or hand it over at a meeting, and somebody
// here puts it where the run of show can find it. `uploadedBy` records that it
// arrived that way, so nobody later reads a green "slides in" badge as evidence
// the presenter sent it themselves.

type SlideRow = {
  fileName: string | null;
  sizeBytes: number | null;
  linkUrl: string | null;
  uploadedBy: string | null;
  updatedAt: Date | null;
  createdAt: Date;
};

export type SlideSummary = {
  fileName: string | null;
  sizeBytes: number | null;
  linkUrl: string | null;
  /** The team member who put it there, or null when the presenter sent it. */
  uploadedBy: string | null;
  updatedAt: string;
};

export function slideSummary(s: SlideRow): SlideSummary {
  return {
    fileName: s.fileName,
    sizeBytes: s.sizeBytes,
    linkUrl: s.linkUrl,
    uploadedBy: s.uploadedBy,
    updatedAt: (s.updatedAt || s.createdAt).toISOString(),
  };
}

export type SaveResult =
  | { ok: true; slide: SlideSummary }
  | { ok: false; error: string; status: number };

/**
 * Store an uploaded deck, replacing whatever was there.
 *
 * `actor` is the email of the team member doing it on the presenter's behalf,
 * or null when the presenter uploaded it themselves from their own portal.
 */
export async function saveSlideFile(
  presenterId: string,
  file: File,
  actor: string | null,
): Promise<SaveResult> {
  if (!SLIDE_NAME_RE.test(file.name)) {
    return { ok: false, status: 400, error: `${SLIDE_TYPES_SENTENCE}, please.` };
  }
  if (file.size > MAX_SLIDE_BYTES) {
    return {
      ok: false,
      status: 413,
      error: actor
        ? "That file is over 50 MB. Put it in Drive or Dropbox and paste the link instead."
        : "That file is over 50 MB. Please email it to contact@aalb.org instead.",
    };
  }
  if (file.size === 0) {
    return { ok: false, status: 400, error: "That file looks empty." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const mime = file.type && file.type !== "application/octet-stream"
    ? file.type
    : MIME_BY_EXT[ext] || "application/octet-stream";
  const data = {
    fileName: file.name.slice(0, 200),
    mime,
    sizeBytes: buf.length,
    data: buf,
    linkUrl: null as string | null,
    uploadedBy: actor,
  };

  const saved = await prisma.presenterSlide.upsert({
    where: { presenterId },
    update: data,
    create: { presenterId, ...data },
  });
  await logEvent(presenterId, "slides_uploaded", actor,
    `${data.fileName} (${(buf.length / 1024 / 1024).toFixed(1)} MB)${actor ? ", uploaded by the team" : ""}`);
  return { ok: true, slide: slideSummary(saved) };
}

/** Store a link to a deck (Google Slides, Drive, Dropbox) instead of a file. */
export async function saveSlideLink(
  presenterId: string,
  linkUrl: string,
  actor: string | null,
): Promise<SaveResult> {
  let parsed: URL;
  try {
    parsed = new URL(linkUrl);
  } catch {
    return { ok: false, status: 400, error: "That doesn't look like a full link." };
  }
  if (parsed.protocol !== "https:" || linkUrl.length > 600) {
    return { ok: false, status: 400, error: "Please paste an https:// link." };
  }

  const data = {
    fileName: null, mime: null, sizeBytes: null, data: null,
    linkUrl, uploadedBy: actor,
  };
  const saved = await prisma.presenterSlide.upsert({
    where: { presenterId },
    update: data,
    create: { presenterId, ...data },
  });
  await logEvent(presenterId, "slides_link_submitted", actor,
    `${linkUrl.slice(0, 200)}${actor ? ", added by the team" : ""}`);
  return { ok: true, slide: slideSummary(saved) };
}

export async function removeSlide(presenterId: string, actor: string | null): Promise<void> {
  await prisma.presenterSlide.deleteMany({ where: { presenterId } });
  await logEvent(presenterId, "slides_removed", actor, actor ? "removed by the team" : null);
}

// The history is a nicety, not the record itself, so a failure here must never
// lose the deck that just saved successfully.
async function logEvent(presenterId: string, type: string, actorEmail: string | null, meta: string | null) {
  await prisma.presenterEvent.create({
    data: { presenterId, type, actorEmail, meta },
  }).catch(() => {});
}
