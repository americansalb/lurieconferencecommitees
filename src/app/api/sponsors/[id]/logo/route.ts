import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveLogoFromDataUrl } from "@/lib/sponsor-logo";

// Serves a sponsor/exhibitor logo. Public so it can be shown on the website.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const logo = await prisma.sponsorLogo.findUnique({ where: { sponsorId: params.id } });
  if (!logo) return new NextResponse("Not found", { status: 404 });
  const body = new Uint8Array(logo.data);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": logo.mime || "application/octet-stream",
      "Cache-Control": "public, max-age=300",
    },
  });
}

// Upload artwork on a sponsor's behalf. The public uploader is token-gated and
// goes through the sponsor's own portal, which is no help when the file is
// already sitting on our desk: emailing a partner to ask for a logo we were
// handed weeks ago is how a confirmed sponsor ends up on the site as plain
// text. Admins put the file in directly here, and it is live immediately.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const sponsor = await prisma.sponsor.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { dataUrl, fileName } = (body || {}) as { dataUrl?: unknown; fileName?: string };
  if (!dataUrl) return NextResponse.json({ error: "No logo file provided." }, { status: 400 });

  const saved = await saveLogoFromDataUrl(sponsor.id, dataUrl, fileName || null).catch(() => false);
  if (!saved) {
    return NextResponse.json(
      { error: "That file could not be read as an image. PNG, JPG, WebP or SVG, up to 25MB." },
      { status: 400 }
    );
  }

  await prisma.sponsor.update({ where: { id: sponsor.id }, data: { wantsLogo: true } });
  await prisma.sponsorEvent
    .create({ data: { sponsorId: sponsor.id, type: "logo_uploaded", meta: "uploaded by the team", actorEmail: session.user.email || null } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
