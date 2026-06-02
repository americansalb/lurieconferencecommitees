import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newPresenterToken } from "@/lib/presenters";
import { sendMail } from "@/lib/mail";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

// Public speaker-proposal intake.
// Creates a Presenter row with status="proposed" (distinct from "invited")
// so the planning team can review submissions in /presenters and choose
// which ones to convert into invited speakers.
//
// Headshot is optional; if provided it arrives as a data URI string in
// `headshotDataUrl` and gets stored as raw bytes in headshotData.
export async function POST(req: Request) {
  const body = await req.json();
  const {
    name, email, phone, affiliation, jobTitle, pronouns, bio,
    websiteUrl, linkedinUrl, instagramUrl, facebookUrl, otherSocialUrl,
    talkTitle, talkAbstract, learningObjectives,
    sessionFormat, sessionLength, sessionTrack, preferredDay,
    coPresenters, presenterMessage,
    headshotDataUrl,
  } = body;

  if (!name?.trim() || !isEmail(email)) {
    return NextResponse.json(
      { error: "Please share your name and a valid email so we can reach you." },
      { status: 400 }
    );
  }
  if (!talkTitle?.trim() || !talkAbstract?.trim()) {
    return NextResponse.json(
      { error: "A working title and abstract are needed for review." },
      { status: 400 }
    );
  }

  const normalized = email.trim().toLowerCase();
  const existing = await prisma.presenter.findUnique({ where: { email: normalized } });
  if (existing) {
    return NextResponse.json(
      { error: `A submission from ${normalized} already exists. Email contact@aalb.org if you need to update it.` },
      { status: 409 }
    );
  }

  // Decode optional headshot data URI.
  let headshotData: Buffer | null = null;
  let headshotMime: string | null = null;
  if (typeof headshotDataUrl === "string" && headshotDataUrl.startsWith("data:")) {
    const m = headshotDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (m) {
      headshotMime = m[1];
      try {
        headshotData = Buffer.from(m[2], "base64");
        // Cap at ~5 MB so we don't blow up the DB.
        if (headshotData.length > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Headshot must be under 5 MB. JPG or PNG works best." },
            { status: 400 }
          );
        }
      } catch {
        headshotData = null;
        headshotMime = null;
      }
    }
  }

  const token = newPresenterToken();
  const presenter = await prisma.presenter.create({
    data: {
      email: normalized,
      name: name.trim(),
      phone: phone?.trim() || null,
      affiliation: affiliation?.trim() || null,
      jobTitle: jobTitle?.trim() || null,
      pronouns: pronouns?.trim() || null,
      bio: bio?.trim() || null,
      websiteUrl: websiteUrl?.trim() || null,
      linkedinUrl: linkedinUrl?.trim() || null,
      instagramUrl: instagramUrl?.trim() || null,
      facebookUrl: facebookUrl?.trim() || null,
      otherSocialUrl: otherSocialUrl?.trim() || null,
      talkTitle: talkTitle.trim(),
      talkAbstract: talkAbstract.trim(),
      learningObjectives: learningObjectives?.trim() || null,
      sessionFormat: sessionFormat?.trim() || null,
      sessionLength: sessionLength?.trim() || null,
      sessionTrack: sessionTrack?.trim() || null,
      preferredDay: preferredDay?.trim() || null,
      coPresenters: coPresenters?.trim() || null,
      presenterMessage: presenterMessage?.trim() || null,
      headshotData,
      headshotMime,
      status: "proposed",
      token,
    },
  });
  await prisma.presenterEvent.create({
    data: { presenterId: presenter.id, type: "public_proposal_submitted" },
  });

  // Fire-and-forget notifications.
  const adminTo = process.env.PRESENTER_ADMIN_NOTIFY || process.env.MAIL_BCC;
  sendMail({
    to: presenter.email,
    subject: "Your speaker proposal for the 2026 Lurie Children's and AALB Conference",
    html: applicantConfirmationHtml(presenter.name.split(" ")[0], presenter.talkTitle || ""),
  }).catch((e) => console.error("[proposals] applicant mail failed", e));

  if (adminTo) {
    sendMail({
      to: adminTo,
      subject: `New speaker proposal: ${presenter.talkTitle}`,
      html: adminNotificationHtml(presenter),
    }).catch((e) => console.error("[proposals] admin mail failed", e));
  }

  return NextResponse.json({ ok: true, token: presenter.token, id: presenter.id }, { status: 201 });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function applicantConfirmationHtml(first: string, title: string) {
  return `<!doctype html><html><body style="margin:0;padding:32px 16px;background:#FAFBFC;font-family:'Inter',Arial,sans-serif;color:#0B1F25;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:14px;border:1px solid #E6EBEE;padding:36px 32px;">
    <div style="font-size:11px;font-weight:bold;letter-spacing:0.28em;text-transform:uppercase;color:#C9A14B;margin-bottom:18px;">Proposal received</div>
    <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:700;letter-spacing:-0.01em;margin:0 0 16px;">Thank you, ${esc(first)}.</h1>
    <p style="font-size:15px;line-height:1.7;color:#284752;margin:0 0 14px;">
      We have your speaker proposal${title ? ` for <em>${esc(title)}</em>` : ""} for the 2026 Lurie Children&rsquo;s and AALB Conference, August 15 and 16 in Chicago.
    </p>
    <p style="font-size:15px;line-height:1.7;color:#284752;margin:0 0 14px;">
      Our program team reviews proposals on a rolling basis. We&rsquo;ll be in touch within two weeks. If you need to update anything in the meantime, just reply to this email.
    </p>
    <p style="font-size:13px;line-height:1.6;color:#5A6E76;margin:18px 0 0;">
      Thank you for putting your voice forward.
    </p>
  </div>
</body></html>`;
}

function adminNotificationHtml(p: {
  name: string; email: string; affiliation: string | null; jobTitle: string | null;
  talkTitle: string | null; sessionFormat: string | null; sessionLength: string | null;
  sessionTrack: string | null; preferredDay: string | null; talkAbstract: string | null;
}) {
  const row = (label: string, value: string | null) =>
    value
      ? `<tr><td style="padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:12px;color:#5A6E76;width:140px;">${esc(label)}</td><td style="padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0B1F25;">${esc(value)}</td></tr>`
      : "";
  return `<!doctype html><html><body style="margin:0;padding:24px 16px;background:#FAFBFC;font-family:'Inter',Arial,sans-serif;color:#0B1F25;">
  <div style="max-width:620px;margin:0 auto;background:white;border-radius:12px;border:1px solid #E6EBEE;padding:28px 28px;">
    <div style="font-size:10px;font-weight:bold;letter-spacing:0.26em;text-transform:uppercase;color:#0E4456;margin-bottom:10px;">New speaker proposal</div>
    <h2 style="font-size:18px;font-weight:700;margin:0 0 4px;">${esc(p.talkTitle || "(no title)")}</h2>
    <div style="font-size:12px;color:#5A6E76;margin-bottom:18px;">by ${esc(p.name)} &middot; ${esc(p.email)}</div>
    <table role="presentation" style="width:100%;border-collapse:separate;">
      ${row("Affiliation", p.affiliation)}
      ${row("Role", p.jobTitle)}
      ${row("Format", p.sessionFormat)}
      ${row("Length", p.sessionLength)}
      ${row("Track", p.sessionTrack)}
      ${row("Preferred day", p.preferredDay)}
    </table>
    ${p.talkAbstract ? `<div style="margin-top:18px;padding:14px;border-left:3px solid #C9A14B;background:#f8fafc;border-radius:6px;font-size:13px;color:#284752;line-height:1.65;">${esc(p.talkAbstract).replace(/\n/g, "<br>")}</div>` : ""}
  </div>
</body></html>`;
}
