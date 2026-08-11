import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exportToken, rotateExportToken, importFormula } from "@/lib/attendee-export";
import { sheetsConfigured, sheetId, serviceAccountEmail } from "@/lib/google-sheets";
import { syncAttendeeSheet, lastSyncedAt, IN_PERSON_TAB, VIRTUAL_TAB } from "@/lib/sheet-sync";

// Everything the Attendees page needs to set up and watch the Google Sheet:
// the two IMPORTDATA formulas, and the state of the live push if one is set up.

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "admin" || role === "developer";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const token = await exportToken();
  return NextResponse.json({
    ok: true,
    formulas: {
      inPerson: importFormula("in-person", token),
      virtual: importFormula("virtual", token),
    },
    tabs: { inPerson: IN_PERSON_TAB, virtual: VIRTUAL_TAB },
    live: {
      configured: sheetsConfigured(),
      sheetId: sheetId() || null,
      sheetUrl: sheetId() ? `https://docs.google.com/spreadsheets/d/${sheetId()}/edit` : null,
      serviceAccount: serviceAccountEmail(),
      lastSyncedAt: await lastSyncedAt(),
    },
  });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const body = await req.json().catch(() => ({}));

  if (body?.action === "rotate") {
    const token = await rotateExportToken();
    return NextResponse.json({
      ok: true,
      formulas: {
        inPerson: importFormula("in-person", token),
        virtual: importFormula("virtual", token),
      },
    });
  }

  // Push now rather than waiting for the next tick.
  const result = await syncAttendeeSheet(true);
  if (result.skipped === "not-configured") {
    return NextResponse.json(
      { ok: false, error: "No Google service account is configured, so there is nothing to push to. The IMPORTDATA formulas work without one." },
      { status: 400 },
    );
  }
  if (result.error) return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true, ...result, lastSyncedAt: await lastSyncedAt() });
}
