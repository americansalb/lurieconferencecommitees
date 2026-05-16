import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { newPresenterToken, confirmationUrl, appUrl } from "@/lib/presenters";
import { sendMail } from "@/lib/mail";
import { presenterInviteEmail } from "@/lib/mail-templates";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const presenters = await prisma.presenter.findMany({
      orderBy: [{ status: "asc" }, { invitedAt: "desc" }],
      select: {
        id: true,
        email: true,
        name: true,
        affiliation: true,
        jobTitle: true,
        talkTitle: true,
        sessionFormat: true,
        sessionTrack: true,
        status: true,
        invitedAt: true,
        confirmedAt: true,
        lastSentAt: true,
        headshotMime: true,
      },
    });
    return NextResponse.json(presenters);
  } catch (e) {
    console.error("[presenters] GET error", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const {
      email,
      name,
      affiliation,
      talkTitle,
      sessionFormat,
      customMessage,
      sendNow = true,
    } = body || {};

    if (!email || !name) {
      return NextResponse.json({ error: "email and name are required" }, { status: 400 });
    }

    const existing = await prisma.presenter.findUnique({ where: { email: String(email).toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "A presenter with this email already exists", id: existing.id }, { status: 409 });
    }

    const token = newPresenterToken();
    const invitedById = (session.user as { id?: string }).id;
    const presenter = await prisma.presenter.create({
      data: {
        email: String(email).toLowerCase(),
        name,
        affiliation: affiliation || null,
        talkTitle: talkTitle || null,
        sessionFormat: sessionFormat || null,
        token,
        invitedById,
      },
    });

    const url = confirmationUrl(token);

    if (sendNow) {
      try {
        await sendMail({
          to: presenter.email,
          subject: `You're invited to present at the Lurie Children's & AALB Conference`,
          html: presenterInviteEmail({ name: presenter.name, url, customMessage }),
        });
        await prisma.presenter.update({ where: { id: presenter.id }, data: { lastSentAt: new Date() } });
        await prisma.presenterEvent.create({
          data: {
            presenterId: presenter.id,
            type: "invited",
            actorEmail: session.user.email || null,
            meta: customMessage ? JSON.stringify({ customMessage }) : null,
          },
        });
      } catch (e) {
        console.error("[presenters] invite send failed", e);
      }
    }

    return NextResponse.json({ id: presenter.id, token, url, appUrl: appUrl() });
  } catch (e) {
    console.error("[presenters] POST error", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
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
