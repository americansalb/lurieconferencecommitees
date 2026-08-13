import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { aslInterpreterConfirmedEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";
import { CONFERENCE_TZ, availabilityRanges, sameClockAsChicago } from "@/lib/asl-slots";

// The manual Accept button on /asl-team. Nothing is emailed to an
// interpreter when they submit the form; this click is what sends their
// confirmation and flips the row to "accepted". Clicking again on an
// already-accepted interpreter resends the same confirmation without
// touching the original acceptance timestamp.

export const dynamic = "force-dynamic";

function isAdmin(role: string) {
  return role === "admin" || role === "developer";
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "Only admins can accept interpreters." }, { status: 403 });
  }

  const interpreter = await prisma.aslInterpreter.findUnique({ where: { id: params.id } });
  if (!interpreter) {
    return NextResponse.json({ error: "Interpreter not found." }, { status: 404 });
  }

  const slotIds = new Set(interpreter.availability);
  const localRanges = availabilityRanges(slotIds, interpreter.timezone);
  const dayLines = localRanges.map((r) => `${r.day.label}: ${r.text} (${r.hours} hr)`);
  const chicagoLines = sameClockAsChicago(interpreter.timezone)
    ? []
    : availabilityRanges(slotIds, CONFERENCE_TZ).map((r) => `${r.day.label.split(",")[0]} ${r.text}`);
  const rateLabel = `$${(interpreter.hourlyCents / 100).toFixed(2)} per hour`;

  // Send first, record second: a row must never say "accepted" when the
  // confirmation never reached them.
  try {
    const result = await sendMail({
      to: interpreter.email,
      subject: "You are confirmed: ASL interpreting, August 15 and 16",
      html: aslInterpreterConfirmedEmail({
        fullName: interpreter.fullName,
        dayLines,
        chicagoLines,
        timezone: interpreter.timezone,
        rateLabel,
        assetBase: appUrl(),
      }),
    });
    if ((result as { skipped?: boolean } | undefined)?.skipped) {
      return NextResponse.json(
        { error: "Email is not configured on the server, so nothing was sent." },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("[asl-interpreter-accept] confirmation email failed", e);
    return NextResponse.json(
      { error: "The confirmation email could not be sent. Nothing was changed; try again." },
      { status: 502 }
    );
  }

  const alreadyAccepted = interpreter.status === "accepted";
  const updated = await prisma.aslInterpreter.update({
    where: { id: interpreter.id },
    data: alreadyAccepted
      ? {}
      : {
          status: "accepted",
          acceptedAt: new Date(),
          acceptedById: (session.user as { id: string }).id,
        },
  });

  return NextResponse.json({
    ok: true,
    resent: alreadyAccepted,
    status: updated.status,
    acceptedAt: updated.acceptedAt,
  });
}
