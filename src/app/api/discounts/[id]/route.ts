import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Fetch one code with its redemption history (the audit trail / tracking).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const code = await prisma.discountCode.findUnique({
    where: { id },
    include: { redemptions: { orderBy: { createdAt: "desc" } } },
  });
  if (!code) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ code });
}

// Update editable fields. The code string and value kind are intentionally
// immutable once created so existing redemptions stay meaningful; toggle
// active, expiry, cap, per-mode values, and description instead.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if ("description" in body) data.description = (body.description || "").trim() || null;

  // Per-mode values, interpreted against the code's existing kind.
  function parseModeValue(raw: unknown): { value: number | null; error?: string } {
    if (raw === "" || raw == null) return { value: null };
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return { value: null, error: "Values must be greater than zero." };
    if (existing!.kind === "percent") {
      if (n > 100) return { value: null, error: "Percentage cannot exceed 100." };
      return { value: Math.round(n) };
    }
    return { value: Math.round(n * 100) };
  }
  const nextVirtual = "virtualValue" in body ? parseModeValue(body.virtualValue) : { value: existing.virtualValue };
  const nextInPerson = "inPersonValue" in body ? parseModeValue(body.inPersonValue) : { value: existing.inPersonValue };
  if (nextVirtual.error) return NextResponse.json({ error: nextVirtual.error }, { status: 400 });
  if (nextInPerson.error) return NextResponse.json({ error: nextInPerson.error }, { status: 400 });
  if (("virtualValue" in body || "inPersonValue" in body) && nextVirtual.value == null && nextInPerson.value == null) {
    return NextResponse.json({ error: "A code must apply to at least one mode." }, { status: 400 });
  }
  if ("virtualValue" in body) data.virtualValue = nextVirtual.value;
  if ("inPersonValue" in body) data.inPersonValue = nextInPerson.value;

  if ("expiresAt" in body) {
    if (!body.expiresAt) {
      data.expiresAt = null;
    } else {
      const d = new Date(body.expiresAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid expiry date." }, { status: 400 });
      }
      data.expiresAt = d;
    }
  }
  if ("maxRedemptions" in body) {
    data.maxRedemptions =
      body.maxRedemptions === "" || body.maxRedemptions == null
        ? null
        : Math.max(1, Math.round(Number(body.maxRedemptions)));
  }

  const updated = await prisma.discountCode.update({ where: { id }, data });
  return NextResponse.json({ ok: true, code: updated });
}

// Delete a code. Redemptions cascade; do this only for codes created in
// error. Deactivating is usually preferable to preserve history.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.discountCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
