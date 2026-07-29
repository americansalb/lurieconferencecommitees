import { randomBytes } from "crypto";
import { prisma } from "./db";
import { appUrl } from "./presenters";
import { tierById } from "./sponsors";

// A sponsor's or exhibitor's own people: the staff attending on the free
// tickets their level includes, plus any extra colleagues they want to bring.
// Everyone added here becomes a real Attendee row tagged with sponsorId, so
// the Attendees list, the headcount and the accommodations view all see them.

export function newTeamToken(): string {
  return randomBytes(18).toString("base64url");
}

export function teamUrl(token: string): string {
  return `${appUrl()}/exhibitor/${token}`;
}

// Mint the shareable token on first use and keep it stable afterwards, so a
// link already sitting in someone's inbox never stops working.
export async function ensureTeamToken(sponsorId: string): Promise<string> {
  const s = await prisma.sponsor.findUnique({ where: { id: sponsorId }, select: { teamToken: true } });
  if (s?.teamToken) return s.teamToken;
  const token = newTeamToken();
  await prisma.sponsor.update({ where: { id: sponsorId }, data: { teamToken: token } });
  return token;
}

// How many free tickets the level includes. A custom-named tier still carries
// its base tier's allowance; an unknown tier gets none rather than guessing.
export function compAllowance(sponsor: { tier: string }): number {
  return tierById(sponsor.tier)?.ticketsIncluded ?? 0;
}

export type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  comp: boolean;
  paid: boolean;
  status: string;
  attendanceMode: string | null;
  inviteToken: string;
  createdAt: Date;
};

export async function teamFor(sponsorId: string): Promise<TeamMember[]> {
  const rows = await prisma.attendee.findMany({
    where: { sponsorId, isTest: false },
    orderBy: [{ compFromSponsor: "desc" }, { createdAt: "asc" }],
    select: {
      id: true, firstName: true, lastName: true, email: true, paid: true,
      status: true, attendanceMode: true, inviteToken: true, createdAt: true,
      compFromSponsor: true,
    },
  });
  return rows.map((r) => ({
    id: r.id, firstName: r.firstName, lastName: r.lastName, email: r.email,
    comp: r.compFromSponsor, paid: r.paid, status: r.status,
    attendanceMode: r.attendanceMode, inviteToken: r.inviteToken, createdAt: r.createdAt,
  }));
}

// Seats used, seats left. Only comp-flagged people consume the allowance;
// colleagues who paid their own way never eat into it.
export function seatSummary(team: TeamMember[], allowance: number) {
  const used = team.filter((m) => m.comp).length;
  return { allowance, used, remaining: Math.max(0, allowance - used) };
}
