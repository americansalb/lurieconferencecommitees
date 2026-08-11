import { prisma } from "./db";
import { EXPORT_COLUMNS, exportRows } from "./attendee-export";
import { sheetsConfigured, writeTab } from "./google-sheets";

// Keeps the Google Sheet current: one tab for in-person, one for virtual.
//
// Runs on the scheduler tick rather than inside checkout. A registration must
// never fail, or hang, because Google was slow, and a sheet that is a minute
// behind is not a problem worth risking a sale over.

export const IN_PERSON_TAB = "In person";
export const VIRTUAL_TAB = "Virtual";

const STAMP_KEY = "attendee_sheet_synced_at";
const SIGNATURE_KEY = "attendee_sheet_signature";

/**
 * A cheap fingerprint of what the sheet should contain. Nothing is written
 * while it is unchanged, so an idle conference does not spend a Google API call
 * every minute for two weeks.
 */
async function signature(): Promise<string> {
  const [count, latest] = await Promise.all([
    prisma.attendee.count({ where: { isTest: false, paid: true } }),
    prisma.attendee.findFirst({
      where: { isTest: false, paid: true },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true, id: true },
    }),
  ]);
  return `${count}:${latest?.id || ""}:${latest?.updatedAt?.toISOString() || ""}`;
}

async function setting(key: string): Promise<string | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value || null;
}

async function putSetting(key: string, value: string) {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export type SheetSyncResult = {
  skipped: "not-configured" | "unchanged" | null;
  inPerson?: number;
  virtual?: number;
  error?: string;
};

export async function syncAttendeeSheet(force = false): Promise<SheetSyncResult> {
  if (!sheetsConfigured()) return { skipped: "not-configured" };

  const sig = await signature();
  if (!force && sig === (await setting(SIGNATURE_KEY))) return { skipped: "unchanged" };

  try {
    const [inPerson, virtual] = await Promise.all([exportRows("in-person"), exportRows("virtual")]);
    const header = [...EXPORT_COLUMNS];
    await writeTab(IN_PERSON_TAB, [header, ...inPerson]);
    await writeTab(VIRTUAL_TAB, [header, ...virtual]);
    await putSetting(SIGNATURE_KEY, sig);
    await putSetting(STAMP_KEY, new Date().toISOString());
    return { skipped: null, inPerson: inPerson.length, virtual: virtual.length };
  } catch (e) {
    // Leave the signature alone so the next tick tries again.
    return { skipped: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function lastSyncedAt(): Promise<string | null> {
  return setting(STAMP_KEY);
}
