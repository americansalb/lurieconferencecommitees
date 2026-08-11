import { prisma } from "./db";
import { EXPORT_COLUMNS, exportRows } from "./attendee-export";
import { credentialsConfigured, createSpreadsheet, shareWith, writeTab } from "./google-sheets";

// Keeps the Google Sheet current: one tab for in-person, one for virtual.
//
// Runs on the scheduler tick rather than inside checkout. A registration must
// never fail, or hang, because Google was slow, and a sheet that is a minute
// behind is not a problem worth risking a sale over.

export const IN_PERSON_TAB = "In person";
export const VIRTUAL_TAB = "Virtual";

const STAMP_KEY = "attendee_sheet_synced_at";
const SIGNATURE_KEY = "attendee_sheet_signature";
const SHEET_ID_KEY = "attendee_sheet_id";

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

/**
 * Which spreadsheet we are writing.
 *
 * An id set in the environment wins, for pointing at a spreadsheet that already
 * exists. Otherwise it is one the app made and remembered, so nobody has to go
 * and find an id in a URL.
 */
export async function resolveSheetId(): Promise<string | null> {
  const fromEnv = (process.env.ATTENDEE_SHEET_ID || "").trim();
  if (fromEnv) return fromEnv;
  return setting(SHEET_ID_KEY);
}

/** Make the spreadsheet, share it with whoever asked, and remember it. */
export async function createAttendeeSheet(shareEmail: string | null): Promise<string> {
  const id = await createSpreadsheet(
    "Attendees | 2026 Lurie Children's & AALB Conference",
    [IN_PERSON_TAB, VIRTUAL_TAB],
  );
  await putSetting(SHEET_ID_KEY, id);
  if (shareEmail) await shareWith(id, shareEmail);
  return id;
}

export type SheetSyncResult = {
  skipped: "not-configured" | "unchanged" | null;
  inPerson?: number;
  virtual?: number;
  error?: string;
};

export async function syncAttendeeSheet(force = false): Promise<SheetSyncResult> {
  if (!credentialsConfigured()) return { skipped: "not-configured" };
  const id = await resolveSheetId();
  if (!id) return { skipped: "not-configured" };

  const sig = await signature();
  if (!force && sig === (await setting(SIGNATURE_KEY))) return { skipped: "unchanged" };

  try {
    const [inPerson, virtual] = await Promise.all([exportRows("in-person"), exportRows("virtual")]);
    const header = [...EXPORT_COLUMNS];
    await writeTab(id, IN_PERSON_TAB, [header, ...inPerson]);
    await writeTab(id, VIRTUAL_TAB, [header, ...virtual]);
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
