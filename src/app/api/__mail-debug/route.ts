import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";

// Admin-only diagnostic. Hit GET /api/__mail-debug while logged in as admin.
// Returns the actual state of the mail transport — env presence, transport.verify() result, etc.
// Delete this route once mail is working.

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin" && userRole !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawUser = process.env.GMAIL_USER;
  const rawPass = process.env.GMAIL_APP_PASSWORD;
  const user = rawUser?.trim();
  const pass = rawPass?.replace(/\s+/g, "");
  const env = {
    GMAIL_USER: !!rawUser,
    GMAIL_USER_value_if_set: rawUser || null,
    GMAIL_USER_had_whitespace: !!rawUser && rawUser !== user,
    GMAIL_APP_PASSWORD: !!rawPass,
    GMAIL_APP_PASSWORD_length_raw: rawPass ? rawPass.length : 0,
    GMAIL_APP_PASSWORD_length_normalised: pass ? pass.length : 0,
    GMAIL_APP_PASSWORD_had_whitespace: !!rawPass && rawPass !== pass,
    MAIL_FROM: process.env.MAIL_FROM || null,
    MAIL_REPLY_TO: process.env.MAIL_REPLY_TO || null,
    MAIL_BCC: process.env.MAIL_BCC || null,
    NODE_ENV: process.env.NODE_ENV || null,
  };

  if (!user || !pass) {
    return NextResponse.json({
      step: "env-check",
      ok: false,
      reason: "GMAIL_USER and/or GMAIL_APP_PASSWORD env vars are not set on this service.",
      env,
    });
  }

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  try {
    await transport.verify();
  } catch (e) {
    return NextResponse.json({
      step: "transport.verify",
      ok: false,
      reason: e instanceof Error ? e.message : String(e),
      errorCode: (e as { code?: string })?.code || null,
      errorResponseCode: (e as { responseCode?: number })?.responseCode || null,
      env,
    });
  }

  const url = new URL("https://example.com").searchParams;
  if (!url) {
    // unreachable, just to keep variable referenced
  }

  // Optionally do a real send if ?send=<email>
  return NextResponse.json({
    step: "transport.verify",
    ok: true,
    reason: "Gmail accepted the credentials. The transport is configured correctly.",
    nextStep: "To do a live test, hit /api/__mail-debug?send=YOUR_EMAIL@example.com",
    env,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin" && userRole !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { to } = await req.json().catch(() => ({ to: null }));
  if (!to || typeof to !== "string") {
    return NextResponse.json({ error: "Body must be { to: 'email@example.com' }" }, { status: 400 });
  }

  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) {
    return NextResponse.json({ ok: false, reason: "GMAIL_USER or GMAIL_APP_PASSWORD not set." }, { status: 503 });
  }

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  try {
    const info = await transport.sendMail({
      from: process.env.MAIL_FROM || `Lurie Children's & AALB Conference <${user}>`,
      to,
      subject: "Mail debug test from /api/__mail-debug",
      text: "If you see this, the mail path is end-to-end functional.",
    });
    return NextResponse.json({
      ok: true,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      reason: e instanceof Error ? e.message : String(e),
      errorCode: (e as { code?: string })?.code || null,
      errorResponseCode: (e as { responseCode?: number })?.responseCode || null,
      errorCommand: (e as { command?: string })?.command || null,
    }, { status: 500 });
  }
}
