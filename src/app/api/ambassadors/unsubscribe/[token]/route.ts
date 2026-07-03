import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function page(title: string, body: string): NextResponse {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f8fa;color:#0f172a;">
<div style="max-width:520px;margin:64px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;text-align:center;">
<div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#0E5566;font-weight:700;">2026 Lurie Children&rsquo;s &amp; AALB Conference</div>
${body}
</div></body></html>`;
  return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// One-click unsubscribe (RFC 8058) for ambassador mail; the GET renders a
// confirm page and never mutates (link scanners prefetch GETs).
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const ok = await unsubscribe(params.token);
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData().catch(() => null);
    if (form?.get("confirm")) {
      return page(
        "Unsubscribed",
        `<h1 style="font-size:22px;margin:16px 0 8px;">${ok ? "You&rsquo;ve been unsubscribed." : "You&rsquo;re already unsubscribed."}</h1>
<p style="font-size:14px;line-height:1.6;color:#475569;">We won&rsquo;t send you any further messages about sharing the conference. If this was a mistake, just email <a href="mailto:contact@aalb.org" style="color:#0066B3;">contact@aalb.org</a> and we&rsquo;ll set it right.</p>`
      );
    }
  }
  return new NextResponse(null, { status: 200 });
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const ambassador = await prisma.ambassador.findUnique({ where: { token: params.token } });
  if (ambassador?.unsubscribedAt) {
    return page(
      "Unsubscribed",
      `<h1 style="font-size:22px;margin:16px 0 8px;">You&rsquo;re already unsubscribed.</h1>
<p style="font-size:14px;line-height:1.6;color:#475569;">We won&rsquo;t send you any further messages about sharing the conference. If this was a mistake, just email <a href="mailto:contact@aalb.org" style="color:#0066B3;">contact@aalb.org</a> and we&rsquo;ll set it right.</p>`
    );
  }
  return page(
    "Unsubscribe",
    `<h1 style="font-size:22px;margin:16px 0 8px;">Unsubscribe from these emails?</h1>
<p style="font-size:14px;line-height:1.6;color:#475569;">Click below and we won&rsquo;t send you any further messages about sharing the conference.</p>
<form method="post" style="margin:20px 0 0 0;">
<input type="hidden" name="confirm" value="1">
<button type="submit" style="background:#0E5566;color:#fff;border:0;border-radius:10px;padding:12px 28px;font-size:14px;font-weight:700;cursor:pointer;">Unsubscribe</button>
</form>
<p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:16px 0 0 0;">Changed your mind? Just close this page.</p>`
  );
}

async function unsubscribe(token: string): Promise<boolean> {
  const ambassador = await prisma.ambassador.findUnique({ where: { token } });
  if (!ambassador) return false;
  if (ambassador.unsubscribedAt) return false;
  await prisma.ambassador.update({ where: { id: ambassador.id }, data: { unsubscribedAt: new Date() } });
  return true;
}
