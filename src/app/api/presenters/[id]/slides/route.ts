import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Team-facing: fetch a presenter's submitted deck. PDFs render inline in the
// browser tab (that's the preview); slide files download with their original
// name; a link submission 302s straight to the link. Any logged-in member can
// view, matching the presenters dashboard.

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const slide = await prisma.presenterSlide.findUnique({ where: { presenterId: params.id } });
  if (!slide) return NextResponse.json({ error: "No presentation on file." }, { status: 404 });

  if (!slide.data && slide.linkUrl) {
    return NextResponse.redirect(slide.linkUrl);
  }
  if (!slide.data) return NextResponse.json({ error: "No presentation on file." }, { status: 404 });

  const mime = slide.mime || "application/octet-stream";
  const name = (slide.fileName || "presentation").replace(/[^\w.\- ()]/g, "_");
  const inline = mime === "application/pdf";
  return new NextResponse(Buffer.from(slide.data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(slide.data.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
