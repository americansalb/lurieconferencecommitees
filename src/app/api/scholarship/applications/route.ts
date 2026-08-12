import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AWARD_COUNT } from "@/lib/scholarship";

// Admin: read the applications, and record a decision on one.

async function admin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "admin" || role === "developer" ? session : null;
}

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const applications = await prisma.scholarshipApplication.findMany({
    orderBy: { createdAt: "asc" },
  });

  const awarded = applications.filter((a) => a.status === "awarded").length;
  return NextResponse.json({
    ok: true,
    applications,
    awardCount: AWARD_COUNT,
    awarded,
    remaining: Math.max(0, AWARD_COUNT - awarded),
  });
}

export async function PATCH(req: Request) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, status, reviewNotes, score } = (body || {}) as {
    id?: string; status?: string; reviewNotes?: string; score?: number;
  };
  if (!id) return NextResponse.json({ error: "Which application?" }, { status: 400 });

  const allowed = ["submitted", "shortlisted", "awarded", "declined"];
  if (status && !allowed.includes(status)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }

  // Awarding an eleventh seat is almost certainly a misclick, so it is refused
  // rather than quietly allowed and discovered at the door.
  if (status === "awarded") {
    const current = await prisma.scholarshipApplication.findUnique({ where: { id }, select: { status: true } });
    if (current?.status !== "awarded") {
      const awarded = await prisma.scholarshipApplication.count({ where: { status: "awarded" } });
      if (awarded >= AWARD_COUNT) {
        return NextResponse.json(
          { error: `All ${AWARD_COUNT} seats are already awarded. Move one of them back first.` },
          { status: 409 },
        );
      }
    }
  }

  const updated = await prisma.scholarshipApplication.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(reviewNotes !== undefined ? { reviewNotes: reviewNotes || null } : {}),
      ...(score !== undefined ? { score: Number.isFinite(score) ? score : null } : {}),
      ...(status && status !== "submitted"
        ? { decidedAt: new Date(), decidedBy: session.user?.email || null }
        : {}),
    },
  });

  return NextResponse.json({ ok: true, application: updated });
}
