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
//
// Decks are streamed in and appended a megabyte at a time, never held whole.
// The obvious version took the instance down: handing a 20 MB Buffer to Prisma
// as a Bytes column cost 596 MB of peak memory, because the value is base64'd
// into the query protocol and copied several times on the way to Postgres. A
// 50 MB deck wanted over a gigabyte on a 512 MB box. Measured on the same file,
// appending in 1 MB pieces costs 24 MB and does not grow with the file.

/**
 * A file name that travelled in a header. Encoded by the browser so accents and
 * spaces survive; a malformed value should cost the upload, not throw.
 */
export function safeDecode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Refuse an oversized upload from its declared length, before reading a byte.
 *
 * The size is also enforced while streaming, but only as a backstop. Answering
 * mid-upload means replying while the browser is still sending, which resets
 * the connection and shows the person a network error instead of the sentence
 * explaining what to do about a deck that is too big.
 */
export function tooBigUpFront(contentLength: string | null, actor: string | null): SaveResult | null {
  const declared = Number(contentLength);
  if (!Number.isFinite(declared) || declared <= MAX_SLIDE_BYTES) return null;
  return {
    ok: false,
    status: 413,
    error: actor
      ? "That file is over 50 MB. Put it in Drive or Dropbox and paste the link instead."
      : "That file is over 50 MB. Please email it to contact@aalb.org instead.",
  };
}

/** How much is buffered before it goes to the database. Deliberately small. */
const WRITE_CHUNK = 1024 * 1024;
/** How much is read back at a time when serving a download. */
export const READ_CHUNK = 1024 * 1024;

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
export async function saveSlideStream(
  presenterId: string,
  body: ReadableStream<Uint8Array>,
  fileName: string,
  declaredMime: string | null,
  actor: string | null,
): Promise<SaveResult> {
  if (!SLIDE_NAME_RE.test(fileName)) {
    return { ok: false, status: 400, error: `${SLIDE_TYPES_SENTENCE}, please.` };
  }

  const ext = (fileName.split(".").pop() || "").toLowerCase();
  const mime = declaredMime && declaredMime !== "application/octet-stream"
    ? declaredMime
    : MIME_BY_EXT[ext] || "application/octet-stream";
  const name = fileName.slice(0, 200);

  // Start the row empty, then grow it. Anything already on file is replaced the
  // moment the new upload begins, which is the same as before.
  await prisma.$executeRaw`
    INSERT INTO lcc.lcc_presenter_slides
      ("presenterId","fileName","mime","sizeBytes","data","linkUrl","uploadedBy","createdAt","updatedAt")
    VALUES (${presenterId}, ${name}, ${mime}, 0, ''::bytea, NULL, ${actor}, NOW(), NOW())
    ON CONFLICT ("presenterId") DO UPDATE SET
      "fileName" = EXCLUDED."fileName", "mime" = EXCLUDED."mime",
      "sizeBytes" = 0, data = ''::bytea, "linkUrl" = NULL,
      "uploadedBy" = EXCLUDED."uploadedBy", "updatedAt" = NOW()`;

  const fail = async (status: number, error: string): Promise<SaveResult> => {
    // Never leave half a deck looking like a whole one.
    await prisma.presenterSlide.deleteMany({ where: { presenterId } }).catch(() => {});
    return { ok: false, status, error };
  };

  const reader = body.getReader();
  const pending: Buffer[] = [];
  let pendingBytes = 0;
  let written = 0;

  // Append one buffered chunk, refusing to write if the row is not exactly the
  // length we last left it. Two uploads racing for the same presenter would
  // otherwise interleave into a file that is neither of them.
  const flush = async (): Promise<string | null> => {
    if (!pendingBytes) return null;
    const chunk = Buffer.concat(pending, pendingBytes);
    pending.length = 0;
    pendingBytes = 0;
    const rows = await prisma.$executeRaw`
      UPDATE lcc.lcc_presenter_slides
         SET data = data || ${chunk}, "sizeBytes" = "sizeBytes" + ${chunk.length}, "updatedAt" = NOW()
       WHERE "presenterId" = ${presenterId} AND "sizeBytes" = ${written}`;
    if (rows !== 1) return "Something else was writing this presenter's deck at the same time. Try again.";
    written += chunk.length;
    return null;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.length) continue;
      pending.push(Buffer.from(value));
      pendingBytes += value.length;
      if (written + pendingBytes > MAX_SLIDE_BYTES) {
        // Stop reading rather than draining 200 MB somebody picked by mistake.
        await reader.cancel().catch(() => {});
        return fail(413, actor
          ? "That file is over 50 MB. Put it in Drive or Dropbox and paste the link instead."
          : "That file is over 50 MB. Please email it to contact@aalb.org instead.");
      }
      if (pendingBytes >= WRITE_CHUNK) {
        const clash = await flush();
        if (clash) return fail(409, clash);
      }
    }
    const clash = await flush();
    if (clash) return fail(409, clash);
  } catch {
    return fail(500, "The upload stopped part way through. Please try again.");
  }

  if (written === 0) return fail(400, "That file looks empty.");

  const saved = await prisma.presenterSlide.findUnique({ where: { presenterId } });
  if (!saved) return fail(500, "The upload did not save. Please try again.");
  await logEvent(presenterId, "slides_uploaded", actor,
    `${name} (${(written / 1024 / 1024).toFixed(1)} MB)${actor ? ", uploaded by the team" : ""}`);
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

/**
 * The stored deck, a megabyte at a time.
 *
 * Same reason as the write: `Buffer.from(row.data)` pulls the whole file into
 * memory and then the response holds another copy of it. Reading slices keeps a
 * 50 MB download flat instead of spiking on every click.
 */
export async function* slideChunks(presenterId: string, total: number): AsyncGenerator<Buffer> {
  for (let off = 0; off < total; off += READ_CHUNK) {
    // Postgres substring is 1-indexed, and the casts are required: a JavaScript
    // number binds as bigint, and substring(bytea, bigint, bigint) does not
    // exist, so without them every download fails.
    const rows = await prisma.$queryRaw<{ part: Buffer }[]>`
      SELECT substring(data from ${off + 1}::int for ${READ_CHUNK}::int) AS part
        FROM lcc.lcc_presenter_slides
       WHERE "presenterId" = ${presenterId}`;
    const part = rows[0]?.part;
    if (!part?.length) return;
    yield Buffer.from(part);
  }
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
