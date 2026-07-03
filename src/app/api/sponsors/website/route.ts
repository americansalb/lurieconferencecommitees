import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public (token-gated) website save. Lets a sponsor add or correct the website
// URL we link their name to, straight from their portal, so the team never has
// to chase it over email. Mirrors the logo-upload route.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { token } = body || {};
  let website: unknown = body?.website;
  if (!token || typeof token !== "string") return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (typeof website !== "string") return NextResponse.json({ error: "No website provided." }, { status: 400 });

  website = website.trim();
  // Empty clears the field; otherwise default to https:// and sanity-check it.
  let normalized: string | null = null;
  if (website) {
    let candidate = website as string;
    if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
    let url: URL;
    try {
      url = new URL(candidate);
    } catch {
      return NextResponse.json({ error: "That doesn't look like a valid web address." }, { status: 400 });
    }
    if (!url.hostname.includes(".")) {
      return NextResponse.json({ error: "That doesn't look like a valid web address." }, { status: 400 });
    }
    normalized = url.toString();
  }

  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: token } });
  if (!sponsor) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  await prisma.sponsor.update({ where: { id: sponsor.id }, data: { website: normalized } });
  await prisma.sponsorEvent
    .create({ data: { sponsorId: sponsor.id, type: "website_saved" } })
    .catch(() => {});
  return NextResponse.json({ ok: true, website: normalized });
}
