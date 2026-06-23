import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/presenters";
import { newBookingToken } from "@/lib/scheduling";
import { bookingInviteEmail } from "@/lib/mail-templates";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

// List booking invites with their booking (if any), newest first.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invites = await prisma.bookingInvite.findMany({
    orderBy: { createdAt: "desc" },
    include: { booking: { include: { assignedUser: { select: { name: true, email: true } } } } },
  });
  return NextResponse.json({ invites });
}

// Send a booking invite. Body: { inviteeName, inviteeEmail, presenterId?,
// memberIds[], durationMin?, title?, message? }.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invitedById = (session.user as { id?: string }).id || null;
  const actorEmail = session.user.email || null;

  const body = await req.json().catch(() => ({}));
  const inviteeName = (body.inviteeName || "").trim();
  const inviteeEmail = (body.inviteeEmail || "").trim().toLowerCase();
  const memberIds: string[] = Array.isArray(body.memberIds) ? body.memberIds.filter((x: unknown) => typeof x === "string") : [];
  const durationMin = [15, 30, 45, 60].includes(Number(body.durationMin)) ? Number(body.durationMin) : 30;

  if (!inviteeName) return NextResponse.json({ error: "Add the invitee's name." }, { status: 400 });
  if (!isEmail(inviteeEmail)) return NextResponse.json({ error: "A valid invitee email is required." }, { status: 400 });
  if (memberIds.length === 0) return NextResponse.json({ error: "Select at least one team member calendar." }, { status: 400 });

  // Validate members exist and at least one has availability.
  const members = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, _count: { select: { availability: true } } },
  });
  if (members.length !== memberIds.length) {
    return NextResponse.json({ error: "One or more selected members no longer exist." }, { status: 400 });
  }
  if (!members.some((m) => m._count.availability > 0)) {
    return NextResponse.json(
      { error: "None of the selected members have set any availability yet." },
      { status: 400 }
    );
  }

  let presenterId: string | null = null;
  if (body.presenterId) {
    const p = await prisma.presenter.findUnique({ where: { id: String(body.presenterId) } });
    if (p) presenterId = p.id;
  }

  const token = newBookingToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 3600 * 1000);
  const invite = await prisma.bookingInvite.create({
    data: {
      token,
      inviteeName,
      inviteeEmail,
      presenterId,
      memberIds,
      durationMin,
      title: (body.title || "").trim() || null,
      message: (body.message || "").trim() || null,
      status: "sent",
      expiresAt,
      invitedById,
      invitedByEmail: actorEmail,
    },
  });

  const bookUrl = `${appUrl()}/book/${token}`;
  try {
    await sendMail({
      to: inviteeEmail,
      subject: invite.title || "Let's find a time to talk, 2026 Lurie Children's & AALB Conference",
      html: bookingInviteEmail({
        inviteeName,
        title: invite.title,
        message: invite.message,
        durationMin,
        bookUrl,
      }),
    });
    return NextResponse.json({ ok: true, inviteId: invite.id, sent: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, inviteId: invite.id, sent: false, error: msg }, { status: 502 });
  }
}
