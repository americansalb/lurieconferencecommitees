import { createSign } from "crypto";

type FcmConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export function fcmConfig(): FcmConfig | null {
  const projectId = process.env.FCM_PROJECT_ID?.trim();
  const clientEmail = process.env.FCM_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

function base64UrlEncode(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return b.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getAccessToken(cfg: FcmConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) return cachedAccessToken.token;

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: cfg.clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const signingInput =
    base64UrlEncode(JSON.stringify(header)) + "." + base64UrlEncode(JSON.stringify(claim));
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = signer.sign(cfg.privateKey);
  const assertion = signingInput + "." + base64UrlEncode(signature);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`FCM OAuth failed: ${res.status} ${errBody}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = { token: data.access_token, expiresAt: now + data.expires_in };
  return data.access_token;
}

export type FcmPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
};

export type FcmResult = {
  ok: boolean;
  status: number;
  name?: string;
  error?: string;
  errorCode?: string;
  unregistered?: boolean;
};

export async function sendFcm(deviceToken: string, payload: FcmPayload): Promise<FcmResult> {
  const cfg = fcmConfig();
  if (!cfg) return { ok: false, status: 0, error: "FCM not configured" };

  let accessToken: string;
  try {
    accessToken = await getAccessToken(cfg);
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
  }

  const url = `https://fcm.googleapis.com/v1/projects/${cfg.projectId}/messages:send`;
  const body = {
    message: {
      token: deviceToken,
      notification: { title: payload.title, body: payload.body },
      data: payload.data || {},
      android: { priority: "HIGH" as const },
      apns: payload.badge !== undefined
        ? { payload: { aps: { badge: payload.badge } } }
        : undefined,
    },
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
  }

  const json = (await res.json().catch(() => ({}))) as {
    name?: string;
    error?: { status?: string; message?: string };
  };
  if (res.ok) return { ok: true, status: res.status, name: json.name };

  const errCode = json.error?.status;
  const unregistered =
    res.status === 404 ||
    errCode === "NOT_FOUND" ||
    errCode === "UNREGISTERED" ||
    errCode === "INVALID_ARGUMENT";
  return {
    ok: false,
    status: res.status,
    errorCode: errCode,
    error: json.error?.message || `FCM error ${res.status}`,
    unregistered,
  };
}
