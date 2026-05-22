import { randomBytes } from "crypto";
import { prisma } from "./db";

export const MOBILE_SESSION_TTL_DAYS = 90;

export function newMobileToken() {
  return randomBytes(48).toString("base64url");
}

export type MobileUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  timezone: string;
  sessionId: string;
};

export async function getMobileUserFromRequest(req: Request): Promise<MobileUser | null> {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  if (!m) return null;
  const token = m[1].trim();
  if (!token) return null;

  const session = await prisma.mobileSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.mobileSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  prisma.mobileSession
    .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    timezone: session.user.timezone,
    sessionId: session.id,
  };
}

export async function requireMobileUser(req: Request): Promise<MobileUser | Response> {
  const user = await getMobileUserFromRequest(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return user;
}
