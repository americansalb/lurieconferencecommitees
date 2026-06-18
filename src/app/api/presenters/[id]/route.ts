import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) {
    if (e.message.includes("does not exist") || e.message.includes("relation")) {
      return "Database table not found — the migration has not run yet. Trigger a redeploy on Render.";
    }
    return e.message;
  }
  return "Internal server error";
}

const EDITABLE_FIELDS = new Set([
  "name", "affiliation", "jobTitle", "pronouns", "phone",
  "role", "talkTitle", "talkAbstract", "sessionFormat", "sessionTrack",
  "sessionLength", "qaLength", "coPresenters", "preferredDay", "learningObjectives",
  "honorariumAmount", "travelReimbursement", "presenterMessage", "requestedChanges",
  "bio", "websiteUrl", "linkedinUrl", "twitterHandle",
  "instagramUrl", "facebookUrl", "otherSocialUrl",
  "avNotes", "needsMic", "needsProjector", "needsAudio", "needsInternet",
  "needsRecording", "needsClicker",
  "travelMode", "travelOrigin", "needsHotel", "hotelNotes", "needsParking",
  "dietary", "allergies", "accessibilityNeeds", "emergencyContact",
  "status", "declineReason", "adminNotes",
]);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const presenter = await prisma.presenter.findUnique({
      where: { id: params.id },
      include: { events: { orderBy: { createdAt: "desc" } } },
    });
    if (!presenter) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { headshotData: _omit, ...safe } = presenter;
    void _omit;
    return NextResponse.json({ ...safe, hasHeadshot: !!presenter.headshotData });
  } catch (e) {
    console.error("[presenters/:id] GET error", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
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

    // Keep confirmedAt in sync with manual status overrides: stamp it when a
    // presenter is marked confirmed, and clear it when they are moved off
    // confirmed (e.g. undoing an accidental confirm).
    if (body.status === "confirmed") {
      data.confirmedAt = new Date();
    } else if (typeof body.status === "string") {
      data.confirmedAt = null;
    }

    const updated = await prisma.presenter.update({ where: { id: params.id }, data });

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
  } catch (e) {
    console.error("[presenters/:id] PATCH error", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
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
  } catch (e) {
    console.error("[presenters/:id] DELETE error", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}
