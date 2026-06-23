import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
