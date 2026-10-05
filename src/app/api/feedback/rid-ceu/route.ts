import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { compileRidCeus, saveRidSettings, type RidSettings } from "@/lib/rid-ceu-report";
import { VANCRO_SESSIONS, uploadCsv } from "@/lib/rid-ceu";

// RID CEUs for Vancro, read from the imported feedback forms.
//
// GET                -> the compiled list, how each form was read, and what
//                       needs a look.
// GET ?format=csv    -> Vancro's RID CEU Upload Form, filled in.
// POST { workshopIds?, ceus?, forms?, materials? } -> save the team's entries.
//                       Admins only, like everything else that reads
//                       respondents' names. The whole package for Vancro is
//                       ./package.

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  if (new URL(req.url).searchParams.get("format") === "csv") {
    return new NextResponse(uploadCsv((await compileRidCeus()).rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="RID_CEU_Upload_Form.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  return NextResponse.json(await compileRidCeus());
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const body = await req.json().catch(() => null) as Partial<RidSettings> | null;
  if (!body) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });

  const sessionKeys = new Set(VANCRO_SESSIONS.map((s) => s.key));
  const patch: Partial<RidSettings> = { workshopIds: {}, ceus: {}, forms: {}, materials: {} };
  for (const [k, v] of Object.entries(body.workshopIds || {})) {
    if (!sessionKeys.has(k)) continue;
    const val = String(v ?? "").trim();
    if (val.length > 60) return NextResponse.json({ error: "That Workshop ID is too long." }, { status: 400 });
    patch.workshopIds![k] = val;
  }
  for (const [k, v] of Object.entries(body.ceus || {})) {
    if (!sessionKeys.has(k)) continue;
    const val = String(v ?? "").trim();
    if (val && !(/^\d*\.?\d+$/.test(val) && Number(val) > 0 && Number(val) <= 2)) {
      return NextResponse.json({ error: `"${val}" is not a CEU amount. RID CEUs are written like 0.1 or 0.125.` }, { status: 400 });
    }
    patch.ceus![k] = val;
  }
  for (const [k, v] of Object.entries(body.forms || {})) {
    const val = String(v ?? "").trim();
    if (val && val !== "none" && !sessionKeys.has(val)) continue;
    patch.forms![k.slice(0, 600)] = val;
  }
  for (const [k, v] of Object.entries(body.materials || {})) {
    if (!sessionKeys.has(k)) continue;
    const val = String(v ?? "").trim();
    if (val && val !== "send" && val !== "withhold") continue;
    patch.materials![k] = val;
  }
  await saveRidSettings(patch);
  return NextResponse.json(await compileRidCeus());
}
