import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPolicy, planSendTimes } from "@/lib/email-queue";
import { assertPublicBaseUrl } from "@/lib/sponsor-invite";
import { ambassadorInviteEmail } from "@/lib/mail-templates";
import {
  AMBASSADOR_DISCOUNT_PCT, AMBASSADOR_CODE_EXPIRES,
  ambassadorNearChicago, ambassadorShareUrl, ambassadorSubject, ambassadorUnsubscribeUrl,
} from "@/lib/ambassadors";
import { appUrl } from "@/lib/presenters";

function letterDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "America/Chicago",
  });
}

// Schedule ambassador invites into the shared paced email queue. For each
// pending ambassador (or the specific ids passed): create/refresh their live
// 20% discount code (unlimited uses, valid through Aug 10), render the
// engraved share letter, and enqueue it. Claims each row atomically so a
// double click can't enqueue twice. Admin only.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const actorEmail = session?.user?.email || null;

  const base = appUrl();
  try {
    assertPublicBaseUrl(base);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids)
    ? (body.ids as unknown[]).filter((x): x is string => typeof x === "string")
    : null;

  const pending = await prisma.ambassador.findMany({
    where: {
      status: "pending",
      unsubscribedAt: null,
      ...(ids && ids.length ? { id: { in: ids } } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  if (!pending.length) return NextResponse.json({ ok: true, queued: 0 });

  const policy = await getPolicy();
  const times = await planSendTimes(pending.length, policy);
  const batchId = `ambassador-${Date.now()}`;
  let queued = 0;

  for (let i = 0; i < pending.length; i++) {
    const a = pending[i];

    // Claim atomically before any side effects.
    const claim = await prisma.ambassador.updateMany({
      where: { id: a.id, status: "pending" },
      data: { status: "queued" },
    });
    if (claim.count === 0) continue;

    // The code must redeem before the letter lands. Upsert never touches
    // redeemedCount; re-queueing refreshes expiry/percent to current policy.
    await prisma.discountCode.upsert({
      where: { code: a.code },
      create: {
        code: a.code,
        description: `Ambassador — ${a.contactName || a.orgName} (${a.orgName})`,
        kind: "percent",
        virtualValue: AMBASSADOR_DISCOUNT_PCT,
        inPersonValue: AMBASSADOR_DISCOUNT_PCT,
        active: true,
        expiresAt: AMBASSADOR_CODE_EXPIRES,
        createdByEmail: actorEmail,
      },
      update: {
        kind: "percent",
        virtualValue: AMBASSADOR_DISCOUNT_PCT,
        inPersonValue: AMBASSADOR_DISCOUNT_PCT,
        active: true,
        expiresAt: AMBASSADOR_CODE_EXPIRES,
      },
    });

    const html = ambassadorInviteEmail({
      contactName: a.contactName,
      orgName: a.orgName,
      note: a.note,
      code: a.code,
      shareUrl: ambassadorShareUrl(a.code, base),
      learnMoreUrl: base,
      unsubscribeUrl: ambassadorUnsubscribeUrl(a.token),
      dateLabel: letterDate(),
      nearChicago: ambassadorNearChicago(a.orgName, a.audience),
      assetBase: base,
    });

    // Re-queueing replaces, never duplicates.
    await prisma.emailQueue.updateMany({
      where: { recipientType: "ambassador", recipientId: a.id, status: "pending" },
      data: { status: "canceled" },
    }).catch(() => {});
    await prisma.emailQueue.create({
      data: {
        batchId,
        recipientType: "ambassador",
        recipientId: a.id,
        to: a.email,
        subject: ambassadorSubject(a.orgName),
        html,
        scheduledFor: times[i],
        status: "pending",
      },
    });
    queued++;
  }

  return NextResponse.json({ ok: true, queued });
}
