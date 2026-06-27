import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Consolidate two sponsor profiles into one. The record at [id] is the survivor;
// the record at body.otherId is folded into it: its contact email (plus any of
// its own additional emails) become CC'd co-applicant emails on the survivor,
// the company names are combined, its events move over, and it is marked merged
// (hidden from the pipeline). Both emails then receive every interaction and can
// open the same portal link. Admin only.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const actorEmail = session?.user?.email || null;

  const body = await req.json().catch(() => ({}));
  const otherId: string | undefined = body?.otherId;
  if (!otherId || otherId === params.id) {
    return NextResponse.json({ error: "Pick a different sponsor to merge in." }, { status: 400 });
  }

  const [primary, other] = await Promise.all([
    prisma.sponsor.findUnique({ where: { id: params.id } }),
    prisma.sponsor.findUnique({ where: { id: otherId } }),
  ]);
  if (!primary || !other) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (other.mergedIntoId) return NextResponse.json({ error: "That record is already merged into another." }, { status: 409 });
  if (primary.mergedIntoId) return NextResponse.json({ error: "This record was already merged into another." }, { status: 409 });

  // Merged set of CC'd emails: the other's primary + extras + the survivor's
  // existing extras, deduped (case-insensitive) and excluding the survivor's own.
  const primaryEmail = primary.contactEmail.toLowerCase();
  const emailSet = new Map<string, string>();
  for (const e of [...primary.additionalEmails, other.contactEmail, ...other.additionalEmails]) {
    const t = (e || "").trim();
    if (t && t.toLowerCase() !== primaryEmail) emailSet.set(t.toLowerCase(), t);
  }
  const additionalEmails = Array.from(emailSet.values());

  const sameName = primary.companyName.trim().toLowerCase() === other.companyName.trim().toLowerCase();
  const companyName = (typeof body?.companyName === "string" && body.companyName.trim())
    ? body.companyName.trim()
    : (sameName ? primary.companyName : `${primary.companyName} & ${other.companyName}`);

  // Move the other's history onto the survivor so nothing is lost.
  await prisma.sponsorEvent.updateMany({ where: { sponsorId: other.id }, data: { sponsorId: primary.id } });

  // Two co-applicants are one sponsorship, so keep the larger figure rather than
  // doubling; carry over a paid status/date from either side.
  const updated = await prisma.sponsor.update({
    where: { id: primary.id },
    data: {
      companyName,
      additionalEmails,
      amountCents: Math.max(primary.amountCents, other.amountCents),
      paid: primary.paid || other.paid,
      paidAt: primary.paidAt ?? other.paidAt,
    },
  });

  await prisma.sponsor.update({
    where: { id: other.id },
    data: { mergedIntoId: primary.id, status: "merged" },
  });

  await prisma.sponsorEvent.create({
    data: { sponsorId: primary.id, type: "merged_in", actorEmail, meta: `${other.companyName} <${other.contactEmail}>` },
  });

  return NextResponse.json({ ok: true, sponsor: updated, mergedEmails: additionalEmails });
}
