import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// One-click unsubscribe (RFC 8058). Gmail/Yahoo POST here directly from the
// inbox "Unsubscribe" affordance — no auth beyond the unguessable token. We
// idempotently mark the org unsubscribed; every send path checks this first.
export async function POST(_req: Request, { params }: { params: { token: string } }) {
  await unsubscribe(params.token);
  // Mail providers expect a fast 200 with no body for the one-click POST.
  return new NextResponse(null, { status: 200 });
}

// A human clicking the footer link lands here (GET) and gets a confirmation.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const ok = await unsubscribe(params.token);
  const body = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Unsubscribed</title></head>
<body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f8fa;color:#0f172a;">
<div style="max-width:520px;margin:64px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;text-align:center;">
<div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#0E5566;font-weight:700;">2026 Lurie Children&rsquo;s &amp; AALB Conference</div>
<h1 style="font-size:22px;margin:16px 0 8px;">${ok ? "You&rsquo;ve been unsubscribed." : "You&rsquo;re already unsubscribed."}</h1>
<p style="font-size:14px;line-height:1.6;color:#475569;">We won&rsquo;t send you any further messages about sponsoring the conference. If this was a mistake, just email <a href="mailto:contact@aalb.org" style="color:#0066B3;">contact@aalb.org</a> and we&rsquo;ll set it right.</p>
</div></body></html>`;
  return new NextResponse(body, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function unsubscribe(token: string): Promise<boolean> {
  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: token } });
  if (!sponsor) return false;
  if (sponsor.unsubscribedAt) return false;
  await prisma.sponsor.update({ where: { id: sponsor.id }, data: { unsubscribedAt: new Date() } });
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "unsubscribed", meta: sponsor.status },
  }).catch(() => {});
  return true;
}
