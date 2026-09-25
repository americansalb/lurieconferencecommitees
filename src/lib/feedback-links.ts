import { createHash, randomBytes } from "crypto";
import { prisma } from "./db";
import { appUrl } from "./presenters";
import { displayTalkTitle, groupSessions, titleFromFormName } from "./feedback";

// A presenter's feedback page address. Server-only, which is why it is not in
// feedback.ts: that file is also loaded by the admin page in the browser.

/** The presenter's share token, minted on first use. */
export async function feedbackTokenFor(presenterId: string): Promise<string> {
  const p = await prisma.presenter.findUnique({ where: { id: presenterId }, select: { feedbackToken: true } });
  if (p?.feedbackToken) return p.feedbackToken;
  const token = randomBytes(18).toString("base64url");
  await prisma.presenter.update({ where: { id: presenterId }, data: { feedbackToken: token } });
  return token;
}

export async function feedbackUrlFor(presenterId: string): Promise<string> {
  return `${appUrl()}/feedback/${await feedbackTokenFor(presenterId)}`;
}

/**
 * The responses that belong on a presenter's page: their own, and those of a
 * session they shared with others (a panel), which are stored once.
 */
export function feedbackWhereFor(presenterId: string) {
  return { OR: [{ presenterId }, { sharedWith: { has: presenterId } }] };
}

/** Everyone else credited on the same responses: who they presented with. */
export async function coPresentersOf(
  presenterId: string,
  rows: { presenterId?: string | null; sharedWith?: string[] | null }[],
): Promise<{ id: string; name: string; talkTitle: string | null }[]> {
  const ids = new Set<string>();
  for (const r of rows) {
    if (r.presenterId) ids.add(r.presenterId);
    for (const id of r.sharedWith || []) ids.add(id);
  }
  ids.delete(presenterId);
  if (!ids.size) return [];
  return prisma.presenter.findMany({
    where: { id: { in: Array.from(ids) } },
    select: { id: true, name: true, talkTitle: true },
    orderBy: { name: "asc" },
  });
}

/**
 * The title of the session the feedback is about. Normally the presenter's
 * own; but when every response they have came from somebody else's form (they
 * joined a panel recorded under another presenter), it is that session's
 * title, not whatever their own record says.
 */
export function sessionTitleFor(
  presenter: { id: string; talkTitle: string | null },
  rows: { presenterId?: string | null }[],
  others: { id: string; talkTitle: string | null }[],
): string | null {
  if (!rows.length || rows.some((r) => r.presenterId === presenter.id)) return presenter.talkTitle;
  const owner = others.find((o) => o.id === rows[0].presenterId);
  return owner?.talkTitle ?? presenter.talkTitle;
}

/** Every presenter who has any feedback, shared or their own. */
export async function presenterIdsWithFeedback(): Promise<string[]> {
  const rows = await prisma.feedbackResponse.findMany({
    where: { OR: [{ presenterId: { not: null } }, { sharedWith: { isEmpty: false } }] },
    select: { presenterId: true, sharedWith: true },
    distinct: ["presenterId", "sharedWith"],
  });
  const ids = new Set<string>();
  for (const r of rows) {
    if (r.presenterId) ids.add(r.presenterId);
    for (const id of r.sharedWith) ids.add(id);
  }
  return Array.from(ids);
}

export type PresenterSession<R> = {
  /** Stable id for the ?session= link parameter. */
  key: string;
  rows: R[];
  /** Who else presented it. Empty for their own solo session. */
  others: { id: string; name: string; talkTitle: string | null }[];
  title: string | null;
};

/**
 * A presenter's feedback, one entry per session they were part of.
 *
 * A session is who presented it: Wilma alone is one, Wilma with the rest of
 * a panel is another. Pooling them made a panelist's page average her own talk
 * with the panel's, and quote panel comments as if they were about her talk.
 * Their own solo session comes first, then the rest by size.
 */
export async function sessionsFor<R extends { presenterId?: string | null; sharedWith?: string[] | null; sourceName?: string }>(
  presenter: { id: string; talkTitle: string | null },
  rows: R[],
): Promise<PresenterSession<R>[]> {
  const everyone = await coPresentersOf(presenter.id, rows);
  return groupSessions(presenter.id, rows).map(({ ids, rows: mine, solo }) => {
    const owner = everyone.find((o) => o.id === mine[0].presenterId);
    const title = solo
      ? displayTalkTitle(presenter.talkTitle) || titleFromFormName(mine[0].sourceName)
      : titleFromFormName(mine[0].sourceName) || displayTalkTitle(owner?.talkTitle);
    return {
      key: createHash("sha1").update(ids.join(",")).digest("hex").slice(0, 10),
      rows: mine,
      others: everyone.filter((o) => ids.includes(o.id)),
      title,
    };
  });
}
