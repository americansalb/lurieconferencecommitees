import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const presenter = await prisma.presenter.findUnique({
    where: { id: params.id },
    select: { headshotData: true, headshotMime: true },
  });
  if (!presenter?.headshotData) {
    return new NextResponse("Not found", { status: 404 });
  }
  const buf = Buffer.from(presenter.headshotData);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": presenter.headshotMime || "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}
