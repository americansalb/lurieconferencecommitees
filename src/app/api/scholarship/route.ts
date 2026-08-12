import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkEligibility, AWARD_COUNT } from "@/lib/scholarship";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { appUrl } from "@/lib/presenters";
import { scholarshipReceivedEmail } from "@/lib/mail-templates";
import { attendeeFromHeader, attendeeReplyTo } from "@/lib/attendees";

// Public: check an address against the AALB training roster, and take an
// application from someone it recognizes.
//
// Eligibility is re-checked on submit rather than trusted from the client. The
// check step is a courtesy that saves somebody writing three paragraphs before
// being told they cannot apply; it is not the gate.

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email") || "";
  if (!EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "That does not look like an email address." }, { status: 400 });
  }
  const verdict = checkEligibility(email);

  // Someone who has already applied should be told, not allowed to write it all
  // out a second time and wonder which one we read.
  const existing = await prisma.scholarshipApplication.findFirst({
    where: { email: email.trim().toLowerCase() },
    select: { createdAt: true, status: true },
  });

  return NextResponse.json({ ...verdict, alreadyApplied: existing ? existing.createdAt.toISOString() : null });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const str = (k: string) => String((body as Record<string, unknown>)[k] ?? "").trim();

  const email = str("email").toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const verdict = checkEligibility(email);
  if (!verdict.eligible) {
    return NextResponse.json({ error: verdict.message }, { status: 403 });
  }

  const firstName = str("firstName") || verdict.firstName;
  const lastName = str("lastName") || verdict.lastName;
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "We need your name." }, { status: 400 });
  }

  // The three that carry the decision. Short answers here are not a reason to
  // reject anyone, but an empty one means there is nothing to read.
  const whyAttend = str("whyAttend");
  const barrierSeen = str("barrierSeen");
  const whatTheyWillDo = str("whatTheyWillDo");
  const missing = [
    !whyAttend && "why this conference matters to you",
    !barrierSeen && "the language barrier you have seen",
    !whatTheyWillDo && "what you would do with it afterwards",
  ].filter(Boolean);
  if (missing.length) {
    return NextResponse.json(
      { error: `Please answer ${missing.join(", ")}.` },
      { status: 400 },
    );
  }

  const already = await prisma.scholarshipApplication.findFirst({ where: { email } });
  if (already) {
    return NextResponse.json(
      { error: "You have already applied with this address. One application each; we have yours." },
      { status: 409 },
    );
  }

  const application = await prisma.scholarshipApplication.create({
    data: {
      email,
      firstName,
      lastName,
      phone: str("phone") || null,
      standing: verdict.standing,
      cohort: verdict.cohort,
      currentRole: str("currentRole") || null,
      languages: str("languages") || null,
      whyAttend,
      barrierSeen,
      whatTheyWillDo,
      costBarrier: str("costBarrier") || null,
      accessibility: str("accessibility") || null,
      dietary: str("dietary") || null,
      virtualInstead: (body as { virtualInstead?: unknown }).virtualInstead === true,
    },
  });

  // Confirmation. A failure here must not lose the application, which is
  // already saved, so it is reported and swallowed.
  let emailed = false;
  if (isMailConfigured()) {
    try {
      await sendMail({
        to: email,
        from: attendeeFromHeader(),
        replyTo: attendeeReplyTo(),
        subject: "Your scholarship application",
        html: scholarshipReceivedEmail({
          firstName,
          standing: verdict.standing === "student" ? "student" : "alumni",
          awardCount: AWARD_COUNT,
          assetBase: appUrl(),
        }),
      });
      emailed = true;
    } catch (e) {
      console.error("[scholarship] confirmation failed", email, e);
    }
  }

  return NextResponse.json({ ok: true, id: application.id, emailed });
}
