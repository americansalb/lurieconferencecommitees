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

// One-click unsubscribe (RFC 8058). Gmail/Yahoo POST here directly from the
// inbox "Unsubscribe" affordance — no auth beyond the unguessable token. We
// idempotently mark the org unsubscribed; every send path checks this first.
// A human clicking the confirm button on the GET page also lands here (form
// POST), and gets an HTML confirmation instead of the bare 200.
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const ok = await unsubscribe(params.token);
  const contentType = req.headers.get("content-type") || "";
  const isFormPost = contentType.includes("application/x-www-form-urlencoded");
  if (isFormPost) {
    const form = await req.formData().catch(() => null);
    // The mail-provider one-click POST carries List-Unsubscribe=One-Click;
    // our own confirm form carries confirm=1. Both unsubscribe (already done
    // above); only the human form gets a page back.
    if (form?.get("confirm")) {
      return page(
        "Unsubscribed",
        `<h1 style="font-size:22px;margin:16px 0 8px;">${ok ? "You&rsquo;ve been unsubscribed." : "You&rsquo;re already unsubscribed."}</h1>
<p style="font-size:14px;line-height:1.6;color:#475569;">We won&rsquo;t send you any further messages about sponsoring the conference. If this was a mistake, just email <a href="mailto:contact@aalb.org" style="color:#0066B3;">contact@aalb.org</a> and we&rsquo;ll set it right.</p>`
      );
    }
  }
  // Mail providers expect a fast 200 with no body for the one-click POST.
  return new NextResponse(null, { status: 200 });
}

// A human clicking the footer link lands here. The GET must NOT mutate:
// corporate link scanners (Outlook SafeLinks, Proofpoint, Mimecast) prefetch
// every URL in an email with GET, and a side-effecting GET silently
// unsubscribed prospects before they ever opened the letter. Show a confirm
// button that POSTs instead.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: params.token } });
  if (sponsor?.unsubscribedAt) {
    return page(
      "Unsubscribed",
      `<h1 style="font-size:22px;margin:16px 0 8px;">You&rsquo;re already unsubscribed.</h1>
<p style="font-size:14px;line-height:1.6;color:#475569;">We won&rsquo;t send you any further messages about sponsoring the conference. If this was a mistake, just email <a href="mailto:contact@aalb.org" style="color:#0066B3;">contact@aalb.org</a> and we&rsquo;ll set it right.</p>`
    );
  }
  return page(
    "Unsubscribe",
    `<h1 style="font-size:22px;margin:16px 0 8px;">Unsubscribe from sponsorship emails?</h1>
<p style="font-size:14px;line-height:1.6;color:#475569;">Click below and we won&rsquo;t send you any further messages about sponsoring the conference.</p>
<form method="post" style="margin:20px 0 0 0;">
<input type="hidden" name="confirm" value="1">
<button type="submit" style="background:#0E5566;color:#fff;border:0;border-radius:10px;padding:12px 28px;font-size:14px;font-weight:700;cursor:pointer;">Unsubscribe</button>
</form>
<p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:16px 0 0 0;">Changed your mind? Just close this page.</p>`
  );
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
