import { NextResponse } from "next/server";
import { ASL_FEE_ERROR, feeWithinBudget } from "@/lib/asl-budget";

// Inline validation for the rate field on /asl. The page calls this instead
// of comparing against a constant so the budget ceiling never appears in
// client JavaScript. The reply is a plain yes/no; the error message is the
// same generic line the final submit uses and never contains the number.

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const hourlyCents = Math.round(Number(body?.hourlyCents));
  if (!Number.isFinite(hourlyCents) || hourlyCents <= 0) {
    return NextResponse.json({ error: "Please enter your hourly rate." }, { status: 400 });
  }
  if (!feeWithinBudget(hourlyCents)) {
    return NextResponse.json({ error: ASL_FEE_ERROR }, { status: 422 });
  }
  return NextResponse.json({ ok: true });
}
