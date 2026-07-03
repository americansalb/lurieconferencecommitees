import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AMBASSADOR_TARGETS } from "@/lib/ambassador-targets";
import { newAmbassadorToken, suggestAmbassadorCode } from "@/lib/ambassadors";

// Load the curated ambassador list into the database as "pending" rows.
// Idempotent: dedupes by email against ambassadors already loaded AND against
// the sponsor pipeline (an org being asked for money shouldn't also get the
// share ask at the same address). Codes are de-collided here so every
// ambassador ends up with a unique, typeable share code.
export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  let created = 0;
  const skipped: { email: string; reason: string }[] = [];
  const usedCodes = new Set(
    (await prisma.ambassador.findMany({ select: { code: true } })).map((a) => a.code)
  );

  for (const t of AMBASSADOR_TARGETS) {
    const email = t.email.trim().toLowerCase();
    if (!email) { skipped.push({ email: t.org, reason: "no email" }); continue; }

    const existing = await prisma.ambassador.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (existing) { skipped.push({ email, reason: "already loaded" }); continue; }

    const sponsorHit = await prisma.sponsor.findFirst({
      where: { contactEmail: { equals: email, mode: "insensitive" }, mergedIntoId: null },
      select: { companyName: true },
    });
    if (sponsorHit) { skipped.push({ email, reason: `in sponsor pipeline (${sponsorHit.companyName})` }); continue; }

    // Unique, typeable code: GARCIA20, then GARCIA20B, GARCIA20C, ...
    let code = suggestAmbassadorCode(t.contact, t.org);
    if (usedCodes.has(code) || (await prisma.discountCode.findUnique({ where: { code } }))) {
      for (const suffix of "BCDEFGHJKMNPQRSTUVWXYZ") {
        const candidate = `${code}${suffix}`;
        if (!usedCodes.has(candidate) && !(await prisma.discountCode.findUnique({ where: { code: candidate } }))) {
          code = candidate;
          break;
        }
      }
    }
    usedCodes.add(code);

    await prisma.ambassador.create({
      data: {
        orgName: t.org.trim(),
        contactName: t.contact.trim(),
        email,
        website: t.website?.trim() || null,
        audience: t.audience?.trim() || null,
        note: t.note?.trim() || null,
        code,
        token: newAmbassadorToken(),
        status: "pending",
      },
    });
    created++;
  }

  return NextResponse.json({ ok: true, created, skipped });
}
