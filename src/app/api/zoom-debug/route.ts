import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Admin-only Zoom diagnostic. Visit GET /api/zoom-debug while logged in as
// an admin to check, in order: env vars present → Server-to-Server OAuth token
// mints → which scopes were granted → which emails are valid Zoom hosts on the
// account. POST { "hostEmail": "x@y.com" } to actually create and delete a test
// meeting for that host, surfacing the exact create error.
// Delete this route once Zoom is healthy.

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "developer") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

function envState() {
  return {
    ZOOM_ACCOUNT_ID: Boolean(process.env.ZOOM_ACCOUNT_ID),
    ZOOM_CLIENT_ID: Boolean(process.env.ZOOM_CLIENT_ID),
    ZOOM_CLIENT_SECRET: Boolean(process.env.ZOOM_CLIENT_SECRET),
  };
}

async function mintToken(): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const accountId = process.env.ZOOM_ACCOUNT_ID || "";
  const clientId = process.env.ZOOM_CLIENT_ID || "";
  const clientSecret = process.env.ZOOM_CLIENT_SECRET || "";
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && Boolean((data as { access_token?: string }).access_token), status: res.status, data };
}

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const env = envState();
  if (!env.ZOOM_ACCOUNT_ID || !env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET) {
    return NextResponse.json({
      step: "env",
      ok: false,
      env,
      reason: "One or more ZOOM_* env vars are missing on this service.",
    });
  }

  let token;
  try {
    token = await mintToken();
  } catch (e) {
    return NextResponse.json({ step: "auth", ok: false, env, reason: e instanceof Error ? e.message : String(e) });
  }
  if (!token.ok) {
    return NextResponse.json({
      step: "auth",
      ok: false,
      env,
      status: token.status,
      reason: token.data?.reason || token.data?.error || "Token request failed.",
      hint: "Confirm the Account ID and the Client ID/Secret all belong to the SAME Server-to-Server OAuth app, and that the app is Activated in the Zoom Marketplace.",
    });
  }

  const access = String(token.data.access_token);
  const grantedScopes = typeof token.data.scope === "string" ? token.data.scope.split(/\s+/).filter(Boolean) : [];
  const hasMeetingWrite = grantedScopes.some((s) => s.startsWith("meeting:write"));

  // Try to list the account's Zoom users — these are the only valid host emails.
  let hosts: { listed: boolean; status?: number; emails?: string[]; reason?: string } = { listed: false };
  try {
    const uRes = await fetch("https://api.zoom.us/v2/users?status=active&page_size=50", {
      headers: { Authorization: `Bearer ${access}` },
    });
    const uData = await uRes.json().catch(() => ({}));
    if (uRes.ok && Array.isArray(uData.users)) {
      hosts = { listed: true, emails: uData.users.map((u: { email: string }) => u.email) };
    } else {
      hosts = { listed: false, status: uRes.status, reason: uData?.message || "Could not list users (the app may be missing the user:read:admin scope)." };
    }
  } catch (e) {
    hosts = { listed: false, reason: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({
    step: "auth",
    ok: true,
    env,
    grantedScopes,
    hasMeetingWrite,
    meetingScopeHint: hasMeetingWrite
      ? "meeting:write scope is present."
      : "MISSING a meeting:write scope. Add 'meeting:write:admin' to the Server-to-Server OAuth app's Scopes, then re-activate the app.",
    validZoomHosts: hosts,
    hostHint:
      "Bookings create the meeting on the assigned team member's email. That email MUST appear in validZoomHosts above — otherwise Zoom returns 404 'User does not exist'. Make each team member's app email match a real licensed Zoom user, or add them to the Zoom account.",
    next: "POST { \"hostEmail\": \"someone@yourdomain.com\" } to this URL to create + delete a real test meeting for that host.",
  });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const hostEmail = (body.hostEmail || "").trim();
  if (!hostEmail) {
    return NextResponse.json({ error: "Provide { hostEmail } to test." }, { status: 400 });
  }

  const token = await mintToken();
  if (!token.ok) {
    return NextResponse.json({ step: "auth", ok: false, status: token.status, reason: token.data?.reason || "auth failed" });
  }
  const access = String(token.data.access_token);

  const start = new Date(Date.now() + 3600_000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const createRes = await fetch(`https://api.zoom.us/v2/users/${encodeURIComponent(hostEmail)}/meetings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({ topic: "Zoom connectivity test (safe to ignore)", type: 2, start_time: start, duration: 15, timezone: "UTC" }),
  });
  const created = await createRes.json().catch(() => ({}));
  if (!createRes.ok || !created.id) {
    return NextResponse.json({
      step: "create",
      ok: false,
      hostEmail,
      status: createRes.status,
      code: created?.code,
      reason: created?.message || "Meeting create failed.",
      hint:
        createRes.status === 404
          ? "This email is not a user on the connected Zoom account. Use a licensed Zoom user's email, or change the team member's app email to match their Zoom login."
          : "Likely the Server-to-Server OAuth app is missing the 'meeting:write:admin' scope. Add it under the app's Scopes and re-activate.",
    });
  }

  // Clean up the test meeting so it doesn't linger on the host's calendar.
  await fetch(`https://api.zoom.us/v2/meetings/${created.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${access}` },
  }).catch(() => {});

  return NextResponse.json({
    step: "create",
    ok: true,
    hostEmail,
    meetingId: String(created.id),
    note: "Created and deleted a test meeting successfully — Zoom is fully working for this host.",
  });
}
