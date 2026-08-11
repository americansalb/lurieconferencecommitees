import { createSign } from "crypto";

// A minimal Google Sheets writer.
//
// Deliberately no googleapis dependency: this needs three calls (sign a JWT,
// trade it for a token, write a range), and the library is tens of megabytes on
// an instance that has already run out of memory once.
//
// Setup, once:
//   1. Google Cloud console, new service account, enable the Sheets API.
//   2. Create a JSON key. Put the whole file in GOOGLE_SERVICE_ACCOUNT_JSON.
//   3. Share the spreadsheet with the service account's client_email, as Editor.
//   4. Put the spreadsheet id (the long part of its URL) in ATTENDEE_SHEET_ID.

type ServiceAccount = { client_email: string; private_key: string };

export function sheetsConfigured(): boolean {
  return !!serviceAccount() && !!process.env.ATTENDEE_SHEET_ID?.trim();
}

export function sheetId(): string {
  return (process.env.ATTENDEE_SHEET_ID || "").trim();
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
    scope: "https://www.googleapis.com/auth/spreadsheets",
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

async function api(path: string, init: RequestInit = {}) {
  const token = await accessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Google Sheets returned ${res.status}.`);
  return json;
}

/** Tab titles that already exist in the spreadsheet. */
export async function existingTabs(): Promise<string[]> {
  const meta = await api("?fields=sheets.properties.title");
  const sheets = Array.isArray(meta.sheets) ? meta.sheets : [];
  return sheets.map((s: { properties?: { title?: string } }) => s.properties?.title || "").filter(Boolean);
}

export async function ensureTab(title: string): Promise<void> {
  const tabs = await existingTabs();
  if (tabs.includes(title)) return;
  await api(":batchUpdate", {
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
export async function writeTab(title: string, rows: string[][]): Promise<void> {
  await ensureTab(title);
  const range = encodeURIComponent(`${title}!A1:Z100000`);
  await api(`/values/${range}:clear`, { method: "POST", body: "{}" });
  await api(`/values/${range}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: rows }),
  });
}
