import { randomBytes } from "crypto";
import { prisma } from "./db";
import { appUrl } from "./presenters";

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
