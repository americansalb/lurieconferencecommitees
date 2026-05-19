import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mailConfigDetail } from "@/lib/mail";

// Admin-only diagnostic. Hit GET /api/__mail-debug while logged in as admin
// to see env-var state. POST { "to": "you@example.com" } to send a real test.
// Delete this route once mail is healthy.

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin" && userRole !== "developer") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const env = mailConfigDetail();

  if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
    return NextResponse.json({
      step: "env-check",
      ok: false,
      reason: "RESEND_API_KEY and/or MAIL_FROM env vars are not set on this service.",
      env,
    });
  }

  // Resend has no read-only verify endpoint; hit /domains as a lightweight auth check.
  let domainsRes: Response;
  try {
    domainsRes = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}` },
    });
  } catch (e) {
    return NextResponse.json({
      step: "resend.reach",
      ok: false,
      reason: e instanceof Error ? e.message : String(e),
      env,
    });
  }

  const payload = await domainsRes.json().catch(() => null);
  if (!domainsRes.ok) {
    return NextResponse.json({
      step: "resend.auth",
      ok: false,
      status: domainsRes.status,
      reason: (payload as { message?: string })?.message || `Resend returned ${domainsRes.status}`,
      hint: domainsRes.status === 401
        ? "API key is invalid or revoked. Generate a new one in Resend → API Keys."
        : domainsRes.status === 403
        ? "API key lacks permission. Use a key with 'Full access' scope."
        : null,
      env,
    });
  }

  // Look at the configured MAIL_FROM domain and check whether it is verified.
  const fromAddr = (process.env.MAIL_FROM || "").match(/<([^>]+)>/)?.[1] || process.env.MAIL_FROM || "";
  const fromDomain = fromAddr.split("@")[1]?.toLowerCase() || null;
  const domains = (payload as { data?: { name: string; status: string }[] })?.data || [];
  const matched = fromDomain ? domains.find(d => d.name.toLowerCase() === fromDomain) : null;

  return NextResponse.json({
    step: "resend.auth",
    ok: true,
    reason: "Resend accepted the API key.",
    fromAddress: fromAddr,
    fromDomain,
    fromDomainStatus: matched ? matched.status : "not-found",
    fromDomainWarning: !matched
      ? `MAIL_FROM uses '${fromDomain}' but no matching domain is registered in Resend. Sends will be rejected. Add and verify the domain in Resend → Domains.`
      : matched.status !== "verified"
      ? `MAIL_FROM domain '${fromDomain}' is registered but status is '${matched.status}' (not 'verified'). Sends may be rejected.`
      : null,
    nextStep: "POST /api/__mail-debug with body { to: 'you@example.com' } to send a real test.",
    env,
  });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const { to } = await req.json().catch(() => ({ to: null }));
  if (!to || typeof to !== "string") {
    return NextResponse.json({ error: "Body must be { to: 'email@example.com' }" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!apiKey || !from) {
    return NextResponse.json({ ok: false, reason: "RESEND_API_KEY or MAIL_FROM not set." }, { status: 503 });
  }

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Mail debug test from /api/__mail-debug",
        text: "If you see this, the Resend path is end-to-end functional.",
      }),
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      reason: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    return NextResponse.json({
      ok: false,
      status: res.status,
      response: payload,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: (payload as { id?: string })?.id || null,
    response: payload,
  });
}
