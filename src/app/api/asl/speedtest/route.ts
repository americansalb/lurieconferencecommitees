import { NextResponse } from "next/server";
import { randomFillSync } from "crypto";

// Bandwidth probe for the /asl interpreter form's background connection
// check. GET streams N random bytes down; POST swallows an upload and
// reports how many bytes arrived. Payloads are random so a compressing
// proxy cannot fake a fast link, and everything is marked no-store /
// no-transform so nothing along the way caches or shrinks it.
//
// The client samples a few megabytes at a time on a timer, so per-request
// sizes stay small; both directions are hard-capped here anyway.

export const dynamic = "force-dynamic";

const MAX_DOWNLOAD_BYTES = 10_000_000;
const MAX_UPLOAD_BYTES = 8_000_000;
const CHUNK = 256 * 1024;

function randomPayload(bytes: number): Uint8Array {
  const chunk = Buffer.allocUnsafe(Math.min(CHUNK, bytes));
  randomFillSync(chunk);
  if (bytes <= CHUNK) return new Uint8Array(chunk);
  const out = Buffer.allocUnsafe(bytes);
  for (let off = 0; off < bytes; off += CHUNK) {
    chunk.copy(out, off, 0, Math.min(CHUNK, bytes - off));
  }
  return new Uint8Array(out);
}

const NO_STORE = {
  "Cache-Control": "no-store, no-transform",
  "X-Content-Type-Options": "nosniff",
} as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const requested = Number(url.searchParams.get("bytes") || 0);
  const bytes = Number.isFinite(requested)
    ? Math.max(0, Math.min(Math.floor(requested), MAX_DOWNLOAD_BYTES))
    : 0;

  // bytes=0 (or absent) is the latency ping: a minimal, uncacheable reply.
  if (bytes < 1024) {
    return NextResponse.json({ ok: true, t: Date.now() }, { headers: NO_STORE });
  }

  return new NextResponse(randomPayload(bytes) as unknown as BodyInit, {
    headers: {
      ...NO_STORE,
      "Content-Type": "application/octet-stream",
      "Content-Length": String(bytes),
    },
  });
}

export async function POST(req: Request) {
  const declared = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413, headers: NO_STORE });
  }
  let received = 0;
  try {
    const body = await req.arrayBuffer();
    received = body.byteLength;
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 400, headers: NO_STORE });
  }
  if (received > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true, receivedBytes: received }, { headers: NO_STORE });
}
