import { prisma } from "./db";

// Decode a base64 data URL (from the logo uploader) and store the bytes in the
// lcc-isolated SponsorLogo table. Returns false if the input isn't a usable
// image. Kept small + defensive since it runs on public, unauthenticated paths.
export async function saveLogoFromDataUrl(sponsorId: string, dataUrl: unknown, fileName?: string | null): Promise<boolean> {
  if (typeof dataUrl !== "string") return false;
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!m) return false;
  const mime = m[1];
  if (!mime.startsWith("image/")) return false;
  let buf: Buffer;
  try { buf = Buffer.from(m[2], "base64"); } catch { return false; }
  if (buf.length === 0 || buf.length > 25 * 1024 * 1024) return false;
  await prisma.sponsorLogo.upsert({
    where: { sponsorId },
    create: { sponsorId, data: buf, mime, fileName: (fileName || null) },
    update: { data: buf, mime, fileName: (fileName || null) },
  });
  return true;
}
