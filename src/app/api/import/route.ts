import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { newAttendeeToken } from "@/lib/attendees";
import { newSponsorToken, tierById } from "@/lib/sponsors";
import { newPresenterToken } from "@/lib/presenters";
import { buildRecords, parseTimestamp, type ImportType } from "@/lib/imports";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

type PreviewRow = { cells: string[]; status: "new" | "update" | "exists" };
type ImportResponse = {
  ok: true;
  type: ImportType;
  committed: boolean;
  columns: string[];
  rows: PreviewRow[];
  stats: { total: number; create: number; update: number; skip: number };
  errors: string[];
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  const actor = session.user.email || null;

  const body = await req.json().catch(() => ({}));
  const type = body?.type as ImportType;
  const text = String(body?.text || "");
  const commit = !!body?.commit;
  if (!["attendees", "exhibitors", "proposals"].includes(type)) {
    return NextResponse.json({ error: "Unknown import type." }, { status: 400 });
  }

  const parsed = buildRecords(type, text);

  try {
    if (parsed.type === "attendees") {
      const emails = parsed.records.map((r) => r.email);
      const existing = await prisma.attendee.findMany({ where: { email: { in: emails } }, select: { id: true, email: true, paid: true } });
      const byEmail = new Map(existing.map((e) => [e.email, e]));
      const seen = new Set<string>();
      const rows: PreviewRow[] = [];
      const toCreate: typeof parsed.records = [];
      const toUpdate: { id: string; r: (typeof parsed.records)[number] }[] = [];
      for (const r of parsed.records) {
        const ex = byEmail.get(r.email);
        let status: PreviewRow["status"];
        if (seen.has(r.email)) status = "exists";
        else if (!ex) { status = "new"; toCreate.push(r); }
        else if (!ex.paid) { status = "update"; toUpdate.push({ id: ex.id, r }); }
        else status = "exists";
        seen.add(r.email);
        rows.push({ cells: [`${r.firstName} ${r.lastName}`.trim(), r.email, r.mode, `$${(r.amountCents / 100).toFixed(0)}`, r.paidAt || "—"], status });
      }
      if (commit) {
        for (const r of toCreate) {
          const a = await prisma.attendee.create({
            data: {
              email: r.email, firstName: r.firstName, lastName: r.lastName,
              attendanceMode: r.mode, basePriceCents: r.amountCents, finalPriceCents: r.amountCents,
              discountPercent: 0, paid: true, paidAt: parseTimestamp(r.paidAt) || new Date(),
              status: "paid", inviteToken: newAttendeeToken(),
            },
          });
          await prisma.attendeeEvent.create({ data: { attendeeId: a.id, type: "imported", actorEmail: actor, meta: "spreadsheet import" } });
        }
        for (const u of toUpdate) {
          await prisma.attendee.update({
            where: { id: u.id },
            data: { attendanceMode: u.r.mode, basePriceCents: u.r.amountCents, finalPriceCents: u.r.amountCents, paid: true, paidAt: parseTimestamp(u.r.paidAt) || new Date(), status: "paid" },
          });
          await prisma.attendeeEvent.create({ data: { attendeeId: u.id, type: "imported_marked_paid", actorEmail: actor } });
        }
      }
      const resp: ImportResponse = { ok: true, type, committed: commit, columns: ["Name", "Email", "Mode", "Amount", "Paid date"], rows, stats: { total: parsed.records.length, create: toCreate.length, update: toUpdate.length, skip: rows.filter((x) => x.status === "exists").length }, errors: parsed.errors };
      return NextResponse.json(resp);
    }

    if (parsed.type === "exhibitors") {
      const emails = parsed.records.map((r) => r.contactEmail);
      const existing = await prisma.sponsor.findMany({ where: { contactEmail: { in: emails }, tier: "exhibitor" }, select: { contactEmail: true } });
      const have = new Set(existing.map((e) => e.contactEmail.toLowerCase()));
      const seen = new Set<string>();
      const rows: PreviewRow[] = [];
      const toCreate: typeof parsed.records = [];
      for (const r of parsed.records) {
        const dupe = have.has(r.contactEmail) || seen.has(r.contactEmail);
        const status: PreviewRow["status"] = dupe ? "exists" : "new";
        if (!dupe) toCreate.push(r);
        seen.add(r.contactEmail);
        rows.push({ cells: [r.contactName, r.contactEmail, r.companyName, r.contactPhone || "—"], status });
      }
      if (commit) {
        const exTier = tierById("exhibitor");
        for (const r of toCreate) {
          const sp = await prisma.sponsor.create({
            data: {
              companyName: r.companyName, contactName: r.contactName, contactEmail: r.contactEmail,
              contactPhone: r.contactPhone, website: r.website, tier: "exhibitor",
              amountCents: exTier?.amountCents ?? 65000, status: "submitted", paid: false,
              applicationToken: newSponsorToken(), createdAt: parseTimestamp(r.appliedAt) || undefined,
            },
          });
          await prisma.sponsorEvent.create({ data: { sponsorId: sp.id, type: "imported", actorEmail: actor, meta: "exhibitor application import" } });
        }
      }
      const resp: ImportResponse = { ok: true, type, committed: commit, columns: ["Contact", "Email", "Organization", "Phone"], rows, stats: { total: parsed.records.length, create: toCreate.length, update: 0, skip: rows.filter((x) => x.status === "exists").length }, errors: parsed.errors };
      return NextResponse.json(resp);
    }

    // proposals
    const emails = parsed.records.map((r) => r.email);
    const existing = await prisma.presenter.findMany({ where: { email: { in: emails } }, select: { email: true } });
    const have = new Set(existing.map((e) => e.email.toLowerCase()));
    const seen = new Set<string>();
    const rows: PreviewRow[] = [];
    const toCreate: typeof parsed.records = [];
    for (const r of parsed.records) {
      const dupe = have.has(r.email) || seen.has(r.email);
      const status: PreviewRow["status"] = dupe ? "exists" : "new";
      if (!dupe) toCreate.push(r);
      seen.add(r.email);
      rows.push({ cells: [r.name, r.email, r.talkTitle, r.sessionLength || "—"], status });
    }
    if (commit) {
      for (const r of toCreate) {
        const p = await prisma.presenter.create({
          data: {
            email: r.email, name: r.name, talkTitle: r.talkTitle, talkAbstract: r.talkAbstract,
            sessionLength: r.sessionLength, bio: r.bio, status: "proposed", token: newPresenterToken(),
          },
        });
        await prisma.presenterEvent.create({ data: { presenterId: p.id, type: "imported", actorEmail: actor, meta: "RFP import" } });
      }
    }
    const resp: ImportResponse = { ok: true, type, committed: commit, columns: ["Name", "Email", "Title", "Length"], rows, stats: { total: parsed.records.length, create: toCreate.length, update: 0, skip: rows.filter((x) => x.status === "exists").length }, errors: parsed.errors };
    return NextResponse.json(resp);
  } catch (e) {
    console.error("[import] error", e);
    const msg = e instanceof Error ? e.message : "Import failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
