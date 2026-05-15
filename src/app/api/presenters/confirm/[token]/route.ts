import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import {
  presenterConfirmedEmail,
  presenterDeclinedEmail,
  adminNotificationEmail,
} from "@/lib/mail-templates";
import { appUrl, confirmationUrl } from "@/lib/presenters";

const SUBMITTABLE = new Set([
  "name", "affiliation", "jobTitle", "pronouns", "phone",
  "talkTitle", "talkAbstract", "sessionFormat", "sessionTrack", "sessionLength",
  "coPresenters", "preferredDay", "learningObjectives",
  "bio", "websiteUrl", "linkedinUrl", "twitterHandle",
  "avNotes", "needsMic", "needsProjector", "needsAudio", "needsInternet",
  "needsRecording", "needsClicker",
  "travelMode", "travelOrigin", "needsHotel", "hotelNotes", "needsParking",
  "dietary", "allergies", "accessibilityNeeds", "emergencyContact",
  "agreedToRecord", "agreedToPhoto", "agreedToTerms",
  "declineReason",
]);

const MAX_HEADSHOT_BYTES = 4 * 1024 * 1024;

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const presenter = await prisma.presenter.findUnique({
    where: { token: params.token },
    select: {
      id: true, email: true, name: true, affiliation: true, jobTitle: true,
      pronouns: true, phone: true,
      talkTitle: true, talkAbstract: true, sessionFormat: true, sessionTrack: true,
      sessionLength: true, coPresenters: true, preferredDay: true, learningObjectives: true,
      bio: true, websiteUrl: true, linkedinUrl: true, twitterHandle: true,
      headshotMime: true,
      avNotes: true, needsMic: true, needsProjector: true, needsAudio: true,
      needsInternet: true, needsRecording: true, needsClicker: true,
      travelMode: true, travelOrigin: true, travelArrival: true, travelDeparture: true,
      needsHotel: true, hotelNotes: true, needsParking: true,
      dietary: true, allergies: true, accessibilityNeeds: true, emergencyContact: true,
      agreedToRecord: true, agreedToPhoto: true, agreedToTerms: true,
      status: true, confirmedAt: true,
    },
  });
  if (!presenter) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  return NextResponse.json({ ...presenter, hasHeadshot: !!presenter.headshotMime });
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const presenter = await prisma.presenter.findUnique({ where: { token: params.token } });
  if (!presenter) return NextResponse.json({ error: "Invalid link" }, { status: 404 });

  const body = await req.json();
  const action: "save" | "submit" | "decline" = body.action || "save";

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body.fields || {})) {
    if (!SUBMITTABLE.has(k)) continue;
    data[k] = v === "" ? null : v;
  }

  if (body.travelArrival !== undefined) {
    data.travelArrival = body.travelArrival ? new Date(body.travelArrival) : null;
  }
  if (body.travelDeparture !== undefined) {
    data.travelDeparture = body.travelDeparture ? new Date(body.travelDeparture) : null;
  }

  if (body.headshot && typeof body.headshot === "string" && body.headshot.startsWith("data:")) {
    const m = body.headshot.match(/^data:(.+);base64,(.*)$/);
    if (m) {
      const mime = m[1];
      const buf = Buffer.from(m[2], "base64");
      if (buf.byteLength > MAX_HEADSHOT_BYTES) {
        return NextResponse.json({ error: "Headshot must be under 4 MB" }, { status: 400 });
      }
      data.headshotData = buf;
      data.headshotMime = mime;
    }
  } else if (body.headshot === null) {
    data.headshotData = null;
    data.headshotMime = null;
  }

  if (action === "submit") {
    data.status = "confirmed";
    data.confirmedAt = new Date();
  } else if (action === "decline") {
    data.status = "declined";
  }

  await prisma.presenter.update({ where: { id: presenter.id }, data });

  await prisma.presenterEvent.create({
    data: {
      presenterId: presenter.id,
      type: action === "submit" ? "confirmed" : action === "decline" ? "declined" : "saved",
      actorEmail: presenter.email,
    },
  });

  if (action === "submit" || action === "decline") {
    const portalUrl = confirmationUrl(presenter.token);
    const reviewUrl = `${appUrl()}/presenters/${presenter.id}`;
    try {
      if (action === "submit") {
        await sendMail({
          to: presenter.email,
          subject: `You're confirmed for the AALB Conference at Lurie Children's`,
          html: presenterConfirmedEmail({ name: presenter.name, url: portalUrl }),
        });
      } else {
        await sendMail({
          to: presenter.email,
          subject: `Your response — AALB Conference at Lurie Children's`,
          html: presenterDeclinedEmail({ name: presenter.name }),
        });
      }
      if (process.env.MAIL_BCC) {
        await sendMail({
          to: process.env.MAIL_BCC,
          subject: `[Presenters] ${presenter.name} ${action === "submit" ? "confirmed" : "declined"}`,
          html: adminNotificationEmail({
            presenterName: presenter.name,
            presenterEmail: presenter.email,
            status: action === "submit" ? "confirmed" : "declined",
            reviewUrl,
          }),
        });
      }
    } catch (e) {
      console.error("[presenters] notification email failed", e);
    }
  }

  return NextResponse.json({ success: true, status: data.status || presenter.status });
}
