import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { ASL_FEE_ERROR, feeWithinBudget } from "@/lib/asl-budget";
import { appUrl } from "@/lib/presenters";
import { ASL_CERT_KEYS, aslCertSummary } from "@/lib/asl-certs";
import { ASL_SLOT_IDS, CONFERENCE_TZ, availabilityRanges, isValidTimeZone } from "@/lib/asl-slots";

// Public acceptance from the /asl interpreter invitation. Everything is
// re-validated here regardless of what the page already checked: the rate
// cap especially, because the ceiling lives only on the server and the form
// must show nothing more specific than "outside our budget".

export const dynamic = "force-dynamic";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}


function cleanStr(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

function cleanYears(v: unknown): number | null {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 0 || n > 90) return null;
  return n;
}

function cleanMetric(v: unknown, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(Math.round(n * 100) / 100, max);
}

function chicagoRanges(slotIds: Set<string>): string[] {
  return availabilityRanges(slotIds, CONFERENCE_TZ).map(
    (r) => `${r.day.label}: ${r.text} CT (${r.hours} hr)`
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const fullName = cleanStr(body?.fullName, 120);
  if (fullName.length < 2) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }

  const email = cleanStr(body?.email, 200).toLowerCase();
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const phone = cleanStr(body?.phone, 40) || null;

  const certsRaw: unknown[] = Array.isArray(body?.certifications) ? body.certifications : [];
  const certifications = ASL_CERT_KEYS.filter((k) => certsRaw.map(String).includes(k));
  if (!certifications.length) {
    return NextResponse.json(
      { error: "Please tell us which certifications you hold, or choose None of these yet." },
      { status: 400 }
    );
  }
  const certificationOther = cleanStr(body?.certificationOther, 200) || null;

  // The RID number is only asked for, and only required, when they said they
  // hold an RID credential.
  const hasRid = certifications.includes("rid");
  const ridNumber = hasRid ? cleanStr(body?.ridNumber, 60) : "";
  if (hasRid && !ridNumber) {
    return NextResponse.json({ error: "Please enter your RID member number." }, { status: 400 });
  }

  const yearsFluent = cleanYears(body?.yearsFluent);
  const yearsInterpreting = cleanYears(body?.yearsInterpreting);
  if (yearsFluent === null || yearsInterpreting === null) {
    return NextResponse.json(
      { error: "Please tell us your years of ASL fluency and interpreting." },
      { status: 400 }
    );
  }

  const timezone = cleanStr(body?.timezone, 64);
  if (!isValidTimeZone(timezone)) {
    return NextResponse.json({ error: "Please confirm your timezone." }, { status: 400 });
  }

  const availabilityRaw: unknown[] = Array.isArray(body?.availability) ? body.availability : [];
  const availability = Array.from(
    new Set(availabilityRaw.map((s) => String(s)).filter((s) => ASL_SLOT_IDS.has(s)))
  );
  if (!availability.length) {
    return NextResponse.json(
      { error: "Please check at least one hour you are available." },
      { status: 400 }
    );
  }
  // Keep chronological order regardless of click order.
  availability.sort();

  const hourlyCents = Math.round(Number(body?.hourlyCents));
  if (!Number.isFinite(hourlyCents) || hourlyCents <= 0) {
    return NextResponse.json({ error: "Please enter your hourly rate." }, { status: 400 });
  }
  if (!feeWithinBudget(hourlyCents)) {
    return NextResponse.json({ error: ASL_FEE_ERROR }, { status: 422 });
  }

  const notes = cleanStr(body?.notes, 2000) || null;

  const speed = body?.speed || {};
  const speedDownMbps = cleanMetric(speed?.downMbps, 100000);
  const speedUpMbps = cleanMetric(speed?.upMbps, 100000);
  const speedPingMs = cleanMetric(speed?.pingMs, 600000);
  const secondsN = Number(speed?.seconds);
  const speedTestSeconds =
    Number.isFinite(secondsN) && secondsN >= 0 ? Math.min(Math.round(secondsN), 3600) : null;
  let speedTestDetail: string | null = null;
  try {
    if (speed?.detail) speedTestDetail = JSON.stringify(speed.detail).slice(0, 8000);
  } catch {
    speedTestDetail = null;
  }

  const data = {
    fullName,
    phone,
    certifications,
    certificationOther,
    ridNumber: ridNumber || null,
    yearsFluent,
    yearsInterpreting,
    timezone,
    hourlyCents,
    availability,
    notes,
    speedDownMbps,
    speedUpMbps,
    speedPingMs,
    speedTestSeconds,
    speedTestDetail,
    // Submissions wait for a manual Accept on /asl-team. The interpreter is
    // emailed nothing until that button is clicked.
    status: "submitted",
    userAgent: cleanStr(req.headers.get("user-agent"), 300) || null,
  };

  // Same email resubmitting replaces their earlier answers, so an interpreter
  // who spots a mistake can just run the form again.
  const saved = await prisma.aslInterpreter.upsert({
    where: { email },
    create: { email, ...data },
    update: data,
  });

  // Internal heads-up so scheduling can start immediately. Non-fatal: the
  // acceptance is already saved.
  try {
    const rate = `$${(hourlyCents / 100).toFixed(2)}/hr`;
    const totalHours = availability.length;
    const est = `$${((hourlyCents * totalHours) / 100).toFixed(2)}`;
    const speedLine =
      speedDownMbps !== null || speedUpMbps !== null
        ? `${speedDownMbps ?? "?"} Mbps down · ${speedUpMbps ?? "?"} Mbps up · ${speedPingMs ?? "?"} ms ping (${speedTestSeconds ?? "?"}s test)`
        : "Connection check did not complete";
    const lines = chicagoRanges(new Set(availability));
    const certText = aslCertSummary(certifications, ridNumber, certificationOther);
    await sendMail({
      to: "contact@aalb.org",
      subject: `ASL interpreter form: ${fullName} (${totalHours} hr, ${rate})`,
      html: [
        `<p><strong>${escapeHtml(fullName)}</strong> filled out the ASL interpreter form. They have not been emailed anything yet.</p>`,
        `<p>Email: ${escapeHtml(email)}${phone ? `<br/>Phone: ${escapeHtml(phone)}` : ""}<br/>Certifications: ${escapeHtml(certText)}<br/>Fluent in ASL: ${yearsFluent} years · Interpreting: ${yearsInterpreting} years<br/>Timezone: ${escapeHtml(timezone)}</p>`,
        `<p><strong>Rate:</strong> ${rate} · ${totalHours} hour${totalHours === 1 ? "" : "s"} offered · up to ${est} if all hours are used</p>`,
        `<p><strong>Availability (Chicago time):</strong><br/>${lines.map(escapeHtml).join("<br/>")}</p>`,
        `<p><strong>Connection:</strong> ${escapeHtml(speedLine)}</p>`,
        notes ? `<p><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : "",
        `<p><a href="${appUrl()}/asl-team">Review and accept them from the ASL team page</a>. Accepting is what sends their confirmation email.</p>`,
      ]
        .filter(Boolean)
        .join(""),
    });
  } catch (e) {
    console.error("[asl-accept] notification email failed", e);
  }

  return NextResponse.json({ ok: true, id: saved.id });
}
