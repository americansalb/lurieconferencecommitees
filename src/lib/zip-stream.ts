// A zip file written as it goes, so a folder of slide decks can be downloaded
// without a deck ever being held in memory: each file's bytes pass straight
// through, and its size and checksum follow it (a data descriptor), since a
// deck's checksum is only known once it has been read.
//
// Files are stored, not compressed. Decks and PDFs are compressed already, and
// storing keeps this small enough to read. Names are UTF-8. No ZIP64, so the
// whole archive must stay under 4 GB, which a conference's slides do.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array, prev = 0): number {
  let c = prev ^ 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export type ZipEntry = {
  name: string;
  /** Text or bytes known up front, or a source read when the entry is written. */
  data: string | Uint8Array | (() => AsyncIterable<Uint8Array>);
};

/** MS-DOS time and date, which is what a zip records. */
function dosStamp(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

function header(size: number, fill: (v: DataView) => void): Uint8Array {
  const b = new Uint8Array(size);
  fill(new DataView(b.buffer));
  return b;
}

const FLAGS = 0x0808; // sizes follow the data; names are UTF-8

/** The archive's bytes, in order. */
export async function* zipBytes(entries: ZipEntry[] | AsyncIterable<ZipEntry>): AsyncGenerator<Uint8Array> {
  const enc = new TextEncoder();
  const { time, date } = dosStamp(new Date());
  const central: Uint8Array[] = [];
  const used = new Set<string>();
  let offset = 0;
  let count = 0;

  for await (const entry of entries as AsyncIterable<ZipEntry>) {
    // Two decks with the same name would overwrite each other on unzip.
    let name = entry.name;
    for (let i = 2; used.has(name.toLowerCase()); i += 1) name = entry.name.replace(/(\.[^./]+)?$/, ` (${i})$1`);
    used.add(name.toLowerCase());
    const nameBytes = enc.encode(name);
    const start = offset;

    const local = header(30, (v) => {
      v.setUint32(0, 0x04034b50, true);
      v.setUint16(4, 20, true);
      v.setUint16(6, FLAGS, true);
      v.setUint16(8, 0, true);
      v.setUint16(10, time, true);
      v.setUint16(12, date, true);
      v.setUint16(26, nameBytes.length, true);
    });
    yield local; yield nameBytes;
    offset += local.length + nameBytes.length;

    let crc = 0;
    let size = 0;
    const source: AsyncIterable<Uint8Array> | Iterable<Uint8Array> =
      typeof entry.data === "function" ? entry.data()
        : [typeof entry.data === "string" ? enc.encode(entry.data) : entry.data];
    for await (const chunk of source as AsyncIterable<Uint8Array>) {
      if (!chunk.length) continue;
      crc = crc32(chunk, crc);
      size += chunk.length;
      yield chunk;
    }
    offset += size;

    const descriptor = header(16, (v) => {
      v.setUint32(0, 0x08074b50, true);
      v.setUint32(4, crc, true);
      v.setUint32(8, size, true);
      v.setUint32(12, size, true);
    });
    yield descriptor;
    offset += descriptor.length;
    if (offset > 0xffffffff) throw new Error("zip larger than 4 GB");

    const dir = header(46, (v) => {
      v.setUint32(0, 0x02014b50, true);
      v.setUint16(4, 20, true);
      v.setUint16(6, 20, true);
      v.setUint16(8, FLAGS, true);
      v.setUint16(10, 0, true);
      v.setUint16(12, time, true);
      v.setUint16(14, date, true);
      v.setUint32(16, crc, true);
      v.setUint32(20, size, true);
      v.setUint32(24, size, true);
      v.setUint16(28, nameBytes.length, true);
      v.setUint32(42, start, true);
    });
    central.push(dir, nameBytes);
    count += 1;
  }

  const dirStart = offset;
  let dirSize = 0;
  for (const part of central) { yield part; dirSize += part.length; }
  yield header(22, (v) => {
    v.setUint32(0, 0x06054b50, true);
    v.setUint16(8, count, true);
    v.setUint16(10, count, true);
    v.setUint32(12, dirSize, true);
    v.setUint32(16, dirStart, true);
  });
}

/** The archive as a web stream, for a route to return. */
export function zipStream(entries: ZipEntry[] | AsyncIterable<ZipEntry>): ReadableStream<Uint8Array> {
  const it = zipBytes(entries);
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await it.next();
        if (done) controller.close(); else controller.enqueue(value);
      } catch (e) {
        // A broken archive is worse than a failed download, which the
        // browser at least reports.
        controller.error(e);
      }
    },
    async cancel() { await it.return(undefined); },
  });
}
