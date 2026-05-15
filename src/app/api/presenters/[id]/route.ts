import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

const EDITABLE_FIELDS = new Set([
  "name", "affiliation", "jobTitle", "pronouns", "phone",
  "talkTitle", "talkAbstract", "sessionFormat", "sessionTrack", "sessionLength",
  "coPresenters", "preferredDay", "learningObjectives",
  "bio", "websiteUrl", "linkedinUrl", "twitterHandle",
  "avNotes", "needsMic", "needsProjector", "needsAudio", "needsInternet",
  "needsRecording", "needsClicker",
  "travelMode", "travelOrigin", "needsHotel", "hotelNotes", "needsParking",
  "dietary", "allergies", "accessibilityNeeds", "emergencyContact",
  "status", "declineReason", "adminNotes",
]);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const presenter = await prisma.presenter.findUnique({
    where: { id: params.id },
    include: {
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!presenter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { headshotData: _omit, ...safe } = presenter;
  void _omit;
  return NextResponse.json({ ...safe, hasHeadshot: !!presenter.headshotData });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userRole = (session.user as { role?: string }).role;
  if (!isAdmin(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (EDITABLE_FIELDS.has(k)) data[k] = v;
  }

  if (data.status === "confirmed" && body.status === "confirmed") {
    data.confirmedAt = new Date();
  }

  const updated = await prisma.presenter.update({
    where: { id: params.id },
    data,
  });

  await prisma.presenterEvent.create({
    data: {
      presenterId: params.id,
      type: "admin_edited",
      actorEmail: session.user.email || null,
      meta: JSON.stringify(Object.keys(data)),
    },
  });

  const { headshotData: _omit, ...safe } = updated;
  void _omit;
  return NextResponse.json(safe);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userRole = (session.user as { role?: string }).role;
  if (!isAdmin(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.presenter.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
