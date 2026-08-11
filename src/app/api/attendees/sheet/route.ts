import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exportToken, rotateExportToken, importFormula } from "@/lib/attendee-export";
import { credentialsConfigured, serviceAccountEmail, credentialSource } from "@/lib/google-sheets";
import { syncAttendeeSheet, lastSyncedAt, createAttendeeSheet, resolveSheetId, IN_PERSON_TAB, VIRTUAL_TAB } from "@/lib/sheet-sync";

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
    live: await liveState(),
  });
}

async function liveState() {
  const id = await resolveSheetId();
  return {
    // Credentials in place, which is the only manual step.
    credentials: credentialsConfigured(),
    // A spreadsheet chosen or created, which the app can do itself.
    configured: credentialsConfigured() && !!id,
    sheetId: id,
    sheetUrl: id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null,
    serviceAccount: serviceAccountEmail(),
    credentialSource: credentialSource(),
    lastSyncedAt: await lastSyncedAt(),
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));

  // Make the spreadsheet for them, share it back, and fill it, so the only
  // thing anyone ever does by hand is paste the credentials once.
  if (body?.action === "create") {
    if (!credentialsConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Paste a Google service account key into GOOGLE_SERVICE_ACCOUNT_JSON first. Google will not let a server write to a spreadsheet without one." },
        { status: 400 },
      );
    }
    try {
      const id = await createAttendeeSheet(session?.user?.email || null);
      const result = await syncAttendeeSheet(true);
      if (result.error) return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
      return NextResponse.json({ ok: true, created: true, sheetId: id, ...result, live: await liveState() });
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "Could not create the spreadsheet." },
        { status: 502 },
      );
    }
  }

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
      { ok: false, error: credentialsConfigured()
        ? "No spreadsheet yet. Use \"Create the sheet\" and the app will make one and share it with you."
        : "Paste a Google service account key into GOOGLE_SERVICE_ACCOUNT_JSON first." },
      { status: 400 },
    );
  }
  if (result.error) return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true, ...result, live: await liveState() });
}
