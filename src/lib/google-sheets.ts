import { createSign } from "crypto";

// A minimal Google Sheets writer.
//
// Deliberately no googleapis dependency: this needs three calls (sign a JWT,
// trade it for a token, write a range), and the library is tens of megabytes on
// an instance that has already run out of memory once.
//
// Setup is one paste: a service account JSON key in GOOGLE_SERVICE_ACCOUNT_JSON.
// From there the app makes the spreadsheet, names both tabs and shares it back,
// so nobody has to find an id or type a formula. ATTENDEE_SHEET_ID still works
// if you would rather point it at a spreadsheet you already have; share that one
// with the service account's client_email as an Editor first.

type ServiceAccount = { client_email: string; private_key: string };

/**
 * Credentials are the only thing that cannot be automated away: Google will not
 * let a server write to a private spreadsheet without them. Everything after
 * that (making the spreadsheet, naming the tabs, sharing it back) the app does
 * itself, so the setup is one paste and never a formula.
 */
export function credentialsConfigured(): boolean {
  return !!serviceAccount();
}

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) return null;
    // Render and most dashboards store the key with literal \n sequences.
    return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

export function serviceAccountEmail(): string | null {
  return serviceAccount()?.client_email || null;
}

const b64url = (input: string | Buffer) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// Tokens last an hour; keep the last one rather than signing a fresh JWT for
// every sync tick.
let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  const sa = serviceAccount();
  if (!sa) throw new Error("No Google service account configured.");
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    // spreadsheets to write an existing sheet; drive.file to create one of our
    // own and share it back, which is what removes the setup steps.
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = b64url(signer.sign(sa.private_key));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || "Google refused the service account.");
  }
  cached = { token: json.access_token, expiresAt: Date.now() + (json.expires_in || 3600) * 1000 };
  return cached.token;
}

async function api(id: string, path: string, init: RequestInit = {}) {
  const token = await accessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Google Sheets returned ${res.status}.`);
  return json;
}

/** Make a spreadsheet with both tabs already in it, and return its id. */
export async function createSpreadsheet(title: string, tabs: string[]): Promise<string> {
  const token = await accessToken();
  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      properties: { title },
      sheets: tabs.map((t) => ({ properties: { title: t } })),
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.spreadsheetId) {
    throw new Error(json?.error?.message || "Google would not create the spreadsheet.");
  }
  return json.spreadsheetId as string;
}

/**
 * Give a person edit access to a spreadsheet the app made.
 *
 * Without this the sheet exists but belongs to the service account alone, which
 * nobody can log in as, so it would be invisible to everyone who needs it.
 */
export async function shareWith(id: string, email: string): Promise<void> {
  const token = await accessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${id}/permissions?sendNotificationEmail=true`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ role: "writer", type: "user", emailAddress: email }),
    },
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error?.message || "Google would not share the spreadsheet.");
  }
}

/** Tab titles that already exist in the spreadsheet. */
export async function existingTabs(id: string): Promise<string[]> {
  const meta = await api(id, "?fields=sheets.properties.title");
  const sheets = Array.isArray(meta.sheets) ? meta.sheets : [];
  return sheets.map((s: { properties?: { title?: string } }) => s.properties?.title || "").filter(Boolean);
}

export async function ensureTab(id: string, title: string): Promise<void> {
  const tabs = await existingTabs(id);
  if (tabs.includes(title)) return;
  await api(id, ":batchUpdate", {
    method: "POST",
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] }),
  });
}

/**
 * Replace a tab's contents with `rows`.
 *
 * Cleared first, so a cancelled registration disappears instead of leaving a
 * stale row behind when the new list is shorter than the old one.
 */
export async function writeTab(id: string, title: string, rows: string[][]): Promise<void> {
  await ensureTab(id, title);
  const range = encodeURIComponent(`${title}!A1:Z100000`);
  await api(id, `/values/${range}:clear`, { method: "POST", body: "{}" });
  await api(id, `/values/${range}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: rows }),
  });
}
