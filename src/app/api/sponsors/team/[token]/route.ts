import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newAttendeeToken } from "@/lib/attendees";
import { compAllowance, seatSummary, teamFor } from "@/lib/sponsor-team";
import { tierById } from "@/lib/sponsors";

// Public, token-gated. The sponsor (and anyone they forward the link to) can
// see who is already on their list and add themselves or a colleague.
//
// Free tickets included with the level are consumed first; once they are gone,
// the person is still added and tied to the sponsor, but has to pay through
// their own registration link. That keeps the association intact either way,
// which is the whole point: we always know who is coming and for whom.

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

async function loadSponsor(token: string) {
  if (!token) return null;
  return prisma.sponsor.findUnique({
    where: { teamToken: token },
    select: {
      id: true, companyName: true, tier: true, customTierName: true, mergedIntoId: true, ticketsIncluded: true,
      // What they already told us on their application, so the page can ask
      // them to confirm rather than type it a second time.
      registreeName: true, registreeEmail: true, dietary: true, accessibility: true,
    },
  });
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const sponsor = await loadSponsor(params.token);
  if (!sponsor || sponsor.mergedIntoId) {
    return NextResponse.json({ error: "This link is no longer active." }, { status: 404 });
  }
  const team = await teamFor(sponsor.id);
  // Their application named someone to staff the table and gave us that
  // person's dietary and accessibility needs. Offer it back for confirmation
  // instead of asking again, and only until they have actually added someone.
  const rn = (sponsor.registreeName || "").trim();
  const parts = rn.split(/\s+/);
  const prefill = (team.length === 0 && (rn || sponsor.registreeEmail))
    ? {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" "),
        email: (sponsor.registreeEmail || "").trim(),
        dietary: (sponsor.dietary || "").trim(),
        accessibilityNotes: (sponsor.accessibility || "").trim(),
      }
    : null;
  return NextResponse.json({
    prefill,
    company: sponsor.companyName,
    tierName: sponsor.customTierName || tierById(sponsor.tier)?.name || sponsor.tier,
    seats: seatSummary(team, compAllowance(sponsor)),
    team: team.map((m) => ({
      id: m.id, name: `${m.firstName} ${m.lastName}`.trim(), email: m.email,
      comp: m.comp, paid: m.paid, status: m.status, attendanceMode: m.attendanceMode,
      // Only unpaid people need their checkout link exposed.
      payUrl: m.paid ? null : `/attend/${m.inviteToken}`,
    })),
  });
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const sponsor = await loadSponsor(params.token);
  if (!sponsor || sponsor.mergedIntoId) {
    return NextResponse.json({ error: "This link is no longer active." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const attendanceMode = body.attendanceMode === "virtual" ? "virtual" : "in-person";
  // The same questions the attendee portal asks, so exhibitor staff show up
  // in the Accommodations view like everyone else instead of as a blank row.
  const str = (v: unknown) => { const t = String(v ?? "").trim(); return t || null; };
  const logistics = {
    phone: str(body.phone),
    primaryLanguages: str(body.primaryLanguages),
    dietary: str(body.dietary),
    accessibilityNotes: str(body.accessibilityNotes),
    needsParking: typeof body.needsParking === "boolean" ? body.needsParking : null,
  };
  // Only overwrite with an answer; a blank field never wipes what we hold.
  const logisticsSet = Object.fromEntries(
    Object.entries(logistics).filter(([, v]) => v !== null)
  );

  if (!firstName) return NextResponse.json({ error: "First name is required." }, { status: 400 });
  if (!isEmail(email)) return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });

  // Already registered? Attach them to this sponsor rather than creating a
  // duplicate. Someone who already paid keeps their paid status and does not
  // consume a free seat.
  const existing = await prisma.attendee.findUnique({ where: { email } });
  const team = await teamFor(sponsor.id);
  const seats = seatSummary(team, compAllowance(sponsor));

  if (existing) {
    if (existing.sponsorId && existing.sponsorId !== sponsor.id) {
      return NextResponse.json({ error: "That person is already registered with another organization." }, { status: 409 });
    }
    if (existing.sponsorId === sponsor.id) {
      return NextResponse.json({ error: "They are already on your list." }, { status: 409 });
    }
    const comp = !existing.paid && seats.remaining > 0;
    await prisma.attendee.update({
      where: { id: existing.id },
      data: {
        sponsorId: sponsor.id,
        compFromSponsor: comp,
        affiliation: existing.affiliation || sponsor.companyName,
        ...logisticsSet,
        ...(comp
          ? {
              basePriceCents: 0, finalPriceCents: 0, discountPercent: 100,
              paid: true, paidAt: existing.paidAt || new Date(),
              status: "confirmed", confirmedAt: existing.confirmedAt || new Date(),
              attendanceMode: existing.attendanceMode || attendanceMode,
            }
          : {}),
      },
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: existing.id, type: comp ? "sponsor_comp_seat" : "sponsor_team_linked", meta: sponsor.companyName },
    }).catch(() => {});
    return NextResponse.json({ ok: true, comp, linkedExisting: true });
  }

  const comp = seats.remaining > 0;
  const created = await prisma.attendee.create({
    data: {
      email,
      firstName,
      lastName,
      affiliation: sponsor.companyName,
      attendanceMode,
      ...logistics,
      sponsorId: sponsor.id,
      compFromSponsor: comp,
      inviteToken: newAttendeeToken(),
      // Comp seats are settled on the spot: nothing to pay, nothing to chase.
      // Everyone else registers and pays through their own link.
      discountPercent: comp ? 100 : 0,
      basePriceCents: comp ? 0 : null,
      finalPriceCents: comp ? 0 : null,
      paid: comp,
      paidAt: comp ? new Date() : null,
      status: comp ? "confirmed" : "queued",
      confirmedAt: comp ? new Date() : null,
    },
  });
  await prisma.attendeeEvent.create({
    data: { attendeeId: created.id, type: comp ? "sponsor_comp_seat" : "sponsor_team_added", meta: sponsor.companyName },
  }).catch(() => {});
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "team_member_added", meta: `${firstName} ${lastName} (${comp ? "comp" : "self-pay"})`.trim() },
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    comp,
    payUrl: comp ? null : `/attend/${created.inviteToken}`,
  });
}

// Remove someone from the list. Only ever unlinks; never deletes a person who
// paid their own way, and never deletes an attendee record outright.
export async function DELETE(req: Request, { params }: { params: { token: string } }) {
  const sponsor = await loadSponsor(params.token);
  if (!sponsor || sponsor.mergedIntoId) {
    return NextResponse.json({ error: "This link is no longer active." }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const person = await prisma.attendee.findUnique({ where: { id } });
  if (!person || person.sponsorId !== sponsor.id) {
    return NextResponse.json({ error: "Not on your list." }, { status: 404 });
  }
  if (person.compFromSponsor) {
    // Free seat: hand the seat back and undo the complimentary registration.
    await prisma.attendee.update({
      where: { id },
      data: {
        sponsorId: null, compFromSponsor: false, paid: false, paidAt: null,
        status: "queued", confirmedAt: null, finalPriceCents: null, basePriceCents: null,
      },
    });
  } else {
    // Paid their own way: only drop the association, leave their registration alone.
    await prisma.attendee.update({ where: { id }, data: { sponsorId: null } });
  }
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "team_member_removed", meta: person.email },
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
