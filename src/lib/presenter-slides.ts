import { prisma } from "./db";
import { randomUUID } from "crypto";
import {
  MAX_SLIDE_BYTES, MAX_SLIDE_LABEL, SLIDE_NAME_RE, SLIDE_TYPES_SENTENCE, MIME_BY_EXT,
} from "./slide-types";

export {
  MAX_SLIDE_BYTES, MAX_SLIDE_LABEL, SLIDE_NAME_RE, SLIDE_ACCEPT, SLIDE_TYPES_SENTENCE,
} from "./slide-types";

// Saving a presentation, in one place.
//
// Two doors lead here and they must agree on what a valid deck is, or a
// presenter gets told one size limit and the team gets told another:
//   - the presenter's own portal, gated by their token
//   - the team, uploading on someone's behalf from the presenters page
//
// The second door exists because not everyone we invite is comfortable with an
// upload form. They email the file, or hand it over at a meeting, and somebody
// here puts it where the run of show can find it. `uploadedBy` records that it
// arrived that way, so nobody later reads a green "slides in" badge as evidence
// the presenter sent it themselves.
//
// Decks are streamed in and stored a megabyte at a time, never held whole.
// The obvious version took the instance down: handing a 20 MB Buffer to Prisma
// as a Bytes column cost 596 MB of peak memory, because the value is base64'd
// into the query protocol and copied several times on the way to Postgres. A
// 50 MB deck wanted over a gigabyte on a 512 MB box. Measured on the same file,
// writing in 1 MB pieces costs 24 MB and does not grow with the file.
//
// The pieces are rows rather than one growing column, which matters at these
// sizes: appending to a single bytea rewrites the whole value each time, so the
// cost is quadratic. 100 MB took 34.5 seconds that way against 3.5 as rows.

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
  return { ok: false, status: 413, error: oversizeMessage(actor) };
}

/** What to tell someone whose file will not fit, in their own terms. */
export function oversizeMessage(actor: string | null): string {
  return actor
    ? `That file is over ${MAX_SLIDE_LABEL}. Put it in Drive or Dropbox and paste the link instead.`
    : `That file is over ${MAX_SLIDE_LABEL}. Please email it to contact@aalb.org instead.`;
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
  // Names this upload's chunks. A second upload for the same presenter claims
  // the id on the metadata row, and this one notices at the end and gives up,
  // so the two can never end up spliced together.
  const uploadId = randomUUID();

  // Claim the row, and drop any chunks from an upload that never finished.
  await prisma.$executeRaw`
    INSERT INTO lcc.lcc_presenter_slides
      ("presenterId","fileName","mime","sizeBytes","data","linkUrl","uploadedBy","uploadId","createdAt","updatedAt")
    VALUES (${presenterId}, ${name}, ${mime}, 0, NULL, NULL, ${actor}, ${uploadId}, NOW(), NOW())
    ON CONFLICT ("presenterId") DO UPDATE SET
      "fileName" = EXCLUDED."fileName", "mime" = EXCLUDED."mime",
      "sizeBytes" = 0, data = NULL, "linkUrl" = NULL,
      "uploadedBy" = EXCLUDED."uploadedBy", "uploadId" = EXCLUDED."uploadId",
      "updatedAt" = NOW()`;
  await prisma.$executeRaw`
    DELETE FROM lcc.lcc_presenter_slide_chunks
     WHERE "presenterId" = ${presenterId} AND "uploadId" <> ${uploadId}`;

  const fail = async (status: number, error: string): Promise<SaveResult> => {
    // Never leave half a deck looking like a whole one.
    await prisma.presenterSlide.deleteMany({ where: { presenterId } }).catch(() => {});
    return { ok: false, status, error };
  };

  const reader = body.getReader();
  const pending: Buffer[] = [];
  let pendingBytes = 0;
  let written = 0;
  let seq = 0;

  const flush = async (): Promise<void> => {
    if (!pendingBytes) return;
    const chunk = Buffer.concat(pending, pendingBytes);
    pending.length = 0;
    pendingBytes = 0;
    await prisma.$executeRaw`
      INSERT INTO lcc.lcc_presenter_slide_chunks ("presenterId","uploadId","seq","data")
      VALUES (${presenterId}, ${uploadId}, ${seq}, ${chunk})`;
    written += chunk.length;
    seq += 1;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.length) continue;
      pending.push(Buffer.from(value));
      pendingBytes += value.length;
      if (written + pendingBytes > MAX_SLIDE_BYTES) {
        // Stop reading rather than draining 300 MB somebody picked by mistake.
        await reader.cancel().catch(() => {});
        return fail(413, oversizeMessage(actor));
      }
      if (pendingBytes >= WRITE_CHUNK) await flush();
    }
    await flush();
  } catch {
    return fail(500, "The upload stopped part way through. Please try again.");
  }

  if (written === 0) return fail(400, "That file looks empty.");

  // Record the finished length, but only if this is still the upload that owns
  // the row. If somebody started another one while this was going, theirs wins
  // and these chunks are thrown away rather than mixed into it.
  const claimed = await prisma.$executeRaw`
    UPDATE lcc.lcc_presenter_slides
       SET "sizeBytes" = ${written}, "updatedAt" = NOW()
     WHERE "presenterId" = ${presenterId} AND "uploadId" = ${uploadId}`;
  if (claimed !== 1) {
    await prisma.$executeRaw`
      DELETE FROM lcc.lcc_presenter_slide_chunks
       WHERE "presenterId" = ${presenterId} AND "uploadId" = ${uploadId}`.catch(() => {});
    return {
      ok: false, status: 409,
      error: "Another upload for this presenter finished first. Check what is on file, and send this one again if it is the one you want.",
    };
  }

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
 * large download flat instead of spiking on every click.
 */
export async function* slideChunks(presenterId: string, total: number): AsyncGenerator<Buffer> {
  const [meta] = await prisma.$queryRaw<{ uploadId: string | null }[]>`
    SELECT "uploadId" FROM lcc.lcc_presenter_slides WHERE "presenterId" = ${presenterId}`;

  if (meta?.uploadId) {
    // Stored in pieces: hand them over in order, one round trip each, so the
    // whole file is never assembled on this side.
    for (let seq = 0; ; seq += 1) {
      const rows = await prisma.$queryRaw<{ data: Buffer }[]>`
        SELECT data FROM lcc.lcc_presenter_slide_chunks
         WHERE "presenterId" = ${presenterId} AND "uploadId" = ${meta.uploadId} AND seq = ${seq}`;
      const part = rows[0]?.data;
      if (!part?.length) return;
      yield Buffer.from(part);
    }
  }

  // Decks uploaded before chunked storage still live in the single column.
  // Read them in slices for the same reason. Postgres substring is 1-indexed,
  // and the casts are required: a JavaScript number binds as bigint, and
  // substring(bytea, bigint, bigint) does not exist, so without them every one
  // of these downloads fails.
  for (let off = 0; off < total; off += READ_CHUNK) {
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
