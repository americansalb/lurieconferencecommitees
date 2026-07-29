import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/presenters";
import { newAttendeeToken } from "@/lib/attendees";
import { presenterAttendeeConfirmEmail } from "@/lib/mail-templates";

// Confirm presenters as attendees and send them their portal link.
//
// A presenter is already coming, so this is bookkeeping we owe them rather
// than a sale: it creates (or links) an Attendee record, marks it
// complimentary, and carries across the dietary, accessibility, parking and
// contact answers their proposal already gave us. They only have to check
// what is there and fill the gaps, and they show up in the headcount and the
// Accommodations view like everyone else.
//
// POST { mode?: "initial" | "all" } — "initial" (default) skips presenters
// already sent this; "all" re-sends to every confirmed presenter.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const adminEmail = session.user.email || null;
  const body = await req.json().catch(() => ({} as { mode?: unknown }));
  const mode = (body as { mode?: unknown }).mode === "all" ? "all" : "initial";

  const targets = await prisma.presenter.findMany({
    where: {
      status: "confirmed",
      ...(mode === "initial" ? { attendeeInvitedAt: null } : {}),
    },
    select: {
      id: true, name: true, email: true, talkTitle: true, affiliation: true,
      phone: true, dietary: true, allergies: true, accessibilityNeeds: true,
      needsParking: true,
    },
    orderBy: { confirmedAt: "asc" },
  });
  if (!targets.length) return NextResponse.json({ sent: 0, failed: 0, skipped: 0 });

  let sent = 0, failed = 0, skipped = 0;

  for (const p of targets) {
    const email = (p.email || "").trim().toLowerCase();
    if (!email) { skipped++; continue; }

    // Their proposal already answered most of what the attendee portal asks.
    // Dietary and allergies are separate questions there and one field here,
    // so join them rather than lose either.
    const dietary = [p.dietary, p.allergies].map((x) => (x || "").trim()).filter(Boolean).join(" · ") || null;
    const accessibilityNotes = (p.accessibilityNeeds || "").trim() || null;
    const carried = {
      phone: (p.phone || "").trim() || null,
      affiliation: (p.affiliation || "").trim() || null,
      dietary,
      accessibilityNotes,
      needsParking: p.needsParking,
    };
    // Never blank out something the attendee record already holds.
    const carriedSet = Object.fromEntries(
      Object.entries(carried).filter(([, v]) => v !== null && v !== "")
    );

    const [firstName, ...rest] = (p.name || "").trim().split(/\s+/);

    try {
      const existing = await prisma.attendee.findUnique({ where: { email } });
      let token: string;
      let hadDetails: boolean;

      if (existing) {
        hadDetails = !!(existing.dietary || existing.accessibilityNotes) || !!dietary || !!accessibilityNotes;
        token = existing.inviteToken;
        await prisma.attendee.update({
          where: { id: existing.id },
          data: {
            // Fill gaps only: anything they have already told us themselves wins.
            ...Object.fromEntries(
              Object.entries(carriedSet).filter(([k]) => !(existing as unknown as Record<string, unknown>)[k])
            ),
            // A presenter who already paid keeps their payment; we don't
            // silently zero out money that changed hands.
            ...(existing.paid
              ? {}
              : {
                  discountPercent: 100, basePriceCents: 0, finalPriceCents: 0,
                  paid: true, paidAt: new Date(),
                  status: "confirmed", confirmedAt: existing.confirmedAt || new Date(),
                  attendanceMode: existing.attendanceMode || "in-person",
                }),
          },
        });
      } else {
        hadDetails = !!(dietary || accessibilityNotes);
        token = newAttendeeToken();
        await prisma.attendee.create({
          data: {
            email,
            firstName: firstName || p.name || "Presenter",
            lastName: rest.join(" "),
            attendanceMode: "in-person",
            inviteToken: token,
            ...carriedSet,
            // Complimentary, and priced at zero so it never inflates revenue.
            discountPercent: 100, basePriceCents: 0, finalPriceCents: 0,
            paid: true, paidAt: new Date(),
            status: "confirmed", confirmedAt: new Date(),
          },
        });
      }

      await sendMail({
        to: email,
        subject: "Your seat at the conference, and one thing to check",
        html: presenterAttendeeConfirmEmail({
          name: p.name,
          talkTitle: p.talkTitle,
          portalUrl: `${appUrl()}/attend/${token}`,
          hasDetails: hadDetails,
          siteUrl: appUrl(),
          assetBase: appUrl(),
        }),
      });

      await prisma.presenter.update({
        where: { id: p.id },
        data: { attendeeInvitedAt: new Date(), lastSentAt: new Date() },
      });
      await prisma.presenterEvent.create({
        data: { presenterId: p.id, type: "attendee_confirm_sent", actorEmail: adminEmail },
      }).catch(() => {});
      sent++;
    } catch (e) {
      console.error("[confirm-attendance] failed", p.email, e);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, skipped });
}
