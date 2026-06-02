import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeCode } from "@/lib/discounts";

// List all discount codes with their redemption tallies, newest first.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const codes = await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });
  return NextResponse.json({ codes });
}

// Create a discount code.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const actorId = (session.user as { id?: string }).id || null;
  const actorEmail = session.user.email || null;

  const body = await req.json().catch(() => ({}));
  const code = normalizeCode(body.code || "");
  if (!code || !/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code)) {
    return NextResponse.json(
      { error: "Code must be 2–40 characters: letters, numbers, hyphens or underscores." },
      { status: 400 }
    );
  }

  const kind = body.kind === "percent" ? "percent" : "fixed";

  // Each mode's value is optional; a blank/null value means the code does not
  // apply to that mode. For "fixed", inputs are dollars (converted to cents);
  // for "percent", inputs are whole percentage points.
  function parseModeValue(raw: unknown): { value: number | null; error?: string } {
    if (raw === "" || raw == null) return { value: null };
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return { value: null, error: "Values must be greater than zero." };
    if (kind === "percent") {
      if (n > 100) return { value: null, error: "Percentage cannot exceed 100." };
      return { value: Math.round(n) };
    }
    return { value: Math.round(n * 100) }; // dollars → cents
  }

  const virtual = parseModeValue(body.virtualValue);
  const inPerson = parseModeValue(body.inPersonValue);
  if (virtual.error) return NextResponse.json({ error: virtual.error }, { status: 400 });
  if (inPerson.error) return NextResponse.json({ error: inPerson.error }, { status: 400 });
  if (virtual.value == null && inPerson.value == null) {
    return NextResponse.json(
      { error: "Set a discount for at least one of virtual or in-person." },
      { status: 400 }
    );
  }

  const maxRedemptions =
    body.maxRedemptions === "" || body.maxRedemptions == null
      ? null
      : Math.max(1, Math.round(Number(body.maxRedemptions)));
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Invalid expiry date." }, { status: 400 });
  }

  const existing = await prisma.discountCode.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: `Code "${code}" already exists.` }, { status: 409 });
  }

  const created = await prisma.discountCode.create({
    data: {
      code,
      description: (body.description || "").trim() || null,
      kind,
      virtualValue: virtual.value,
      inPersonValue: inPerson.value,
      active: body.active === false ? false : true,
      expiresAt,
      maxRedemptions: Number.isFinite(maxRedemptions as number) ? maxRedemptions : null,
      createdById: actorId,
      createdByEmail: actorEmail,
    },
  });

  return NextResponse.json({ ok: true, code: created }, { status: 201 });
}
