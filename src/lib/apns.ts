import { createSign } from "crypto";

type ApnsConfig = {
  keyId: string;
  teamId: string;
  bundleId: string;
  authKey: string;
  production: boolean;
};

let cachedToken: { jwt: string; issuedAt: number } | null = null;

export function apnsConfig(): ApnsConfig | null {
  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const bundleId = process.env.APNS_BUNDLE_ID?.trim();
  const authKey = process.env.APNS_AUTH_KEY?.replace(/\\n/g, "\n").trim();
  if (!keyId || !teamId || !bundleId || !authKey) return null;
  const production = (process.env.APNS_ENV || "production") === "production";
  return { keyId, teamId, bundleId, authKey, production };
}

function base64UrlEncode(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return b.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function derSigToJose(der: Buffer): Buffer {
  if (der[0] !== 0x30) throw new Error("Invalid DER signature");
  let offset = 2;
  if (der[1] & 0x80) offset = 2 + (der[1] & 0x7f);
  if (der[offset] !== 0x02) throw new Error("Invalid DER signature: missing R");
  const rLen = der[offset + 1];
  let r = der.subarray(offset + 2, offset + 2 + rLen);
  const sStart = offset + 2 + rLen;
  if (der[sStart] !== 0x02) throw new Error("Invalid DER signature: missing S");
  const sLen = der[sStart + 1];
  let s = der.subarray(sStart + 2, sStart + 2 + sLen);
  if (r.length > 32) r = r.subarray(r.length - 32);
  if (s.length > 32) s = s.subarray(s.length - 32);
  const out = Buffer.alloc(64);
  r.copy(out, 32 - r.length);
  s.copy(out, 64 - s.length);
  return out;
}

function issueProviderToken(cfg: ApnsConfig): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now - cachedToken.issuedAt < 1500) return cachedToken.jwt;

  const header = { alg: "ES256", kid: cfg.keyId, typ: "JWT" };
  const payload = { iss: cfg.teamId, iat: now };
  const signingInput =
    base64UrlEncode(JSON.stringify(header)) + "." + base64UrlEncode(JSON.stringify(payload));

  const signer = createSign("SHA256");
  signer.update(signingInput);
  const derSig = signer.sign(cfg.authKey);
  const joseSig = derSigToJose(derSig);
  const jwt = signingInput + "." + base64UrlEncode(joseSig);

  cachedToken = { jwt, issuedAt: now };
  return jwt;
}

export type ApnsPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  threadId?: string;
  badge?: number;
  sound?: string;
};

export type ApnsResult = {
  ok: boolean;
  status: number;
  apnsId?: string;
  error?: string;
  reason?: string;
  unregistered?: boolean;
};

export async function sendApns(deviceToken: string, payload: ApnsPayload): Promise<ApnsResult> {
  const cfg = apnsConfig();
  if (!cfg) return { ok: false, status: 0, error: "APNs not configured" };

  const host = cfg.production ? "api.push.apple.com" : "api.sandbox.push.apple.com";
  const url = `https://${host}/3/device/${deviceToken}`;
  const jwt = issueProviderToken(cfg);

  const body: Record<string, unknown> = {
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: payload.sound || "default",
      "thread-id": payload.threadId,
      badge: payload.badge,
    },
  };
  if (payload.data) Object.assign(body, payload.data);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "authorization": `bearer ${jwt}`,
        "apns-topic": cfg.bundleId,
        "apns-push-type": "alert",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
  }

  const apnsId = res.headers.get("apns-id") || undefined;
  if (res.ok) return { ok: true, status: res.status, apnsId };

  let reason: string | undefined;
  try {
    const data = (await res.json()) as { reason?: string };
    reason = data.reason;
  } catch {}
  const unregistered = res.status === 410 || reason === "Unregistered" || reason === "BadDeviceToken";
  return { ok: false, status: res.status, apnsId, reason, unregistered, error: reason };
}
