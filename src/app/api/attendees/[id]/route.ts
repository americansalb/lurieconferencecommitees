import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const attendee = await prisma.attendee.findUnique({
    where: { id: params.id },
    include: { events: { orderBy: { createdAt: "desc" } } },
  });
  if (!attendee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(attendee);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const allowed = ["adminNotes", "status", "discountPercent", "inviteMessage"] as const;
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
  }

  // Correcting what someone actually paid. Used when the amount on file is
  // wrong, e.g. a guest registered on a 100% code and then paid us directly:
  // the record should read as if it had been right from the start. This is a
  // correction, not a new transaction, so it writes no AttendeeEvent and the
  // timeline is left alone.
  if (body.paidAmountCents !== undefined) {
    const cents = body.paidAmountCents === null ? null : Math.round(Number(body.paidAmountCents));
    if (cents !== null && (!Number.isFinite(cents) || cents < 0)) {
      return NextResponse.json({ error: "Amount must be 0 or more." }, { status: 400 });
    }
    data.finalPriceCents = cents;
    // A non-zero amount means money changed hands, so the record should say
    // paid. Zero is left alone: a genuine comp is also zero.
    if (cents !== null && cents > 0 && body.paid === undefined) {
      const current = await prisma.attendee.findUnique({ where: { id: params.id }, select: { paid: true, paidAt: true, confirmedAt: true } });
      if (current && !current.paid) {
        data.paid = true;
        data.paidAt = current.paidAt ?? new Date();
        data.status = "confirmed";
        data.confirmedAt = current.confirmedAt ?? new Date();
      }
    }
  }
  if (body.paid !== undefined) {
    data.paid = Boolean(body.paid);
    if (body.paid) {
      const current = await prisma.attendee.findUnique({ where: { id: params.id }, select: { paidAt: true, confirmedAt: true } });
      data.paidAt = current?.paidAt ?? new Date();
      data.status = "confirmed";
      data.confirmedAt = current?.confirmedAt ?? new Date();
    } else {
      data.paidAt = null;
    }
  }

  const updated = await prisma.attendee.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Also clear any pending queue entries for this attendee.
  await prisma.emailQueue.deleteMany({
    where: { recipientType: "attendee", recipientId: params.id, status: "pending" },
  });
  await prisma.attendee.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
