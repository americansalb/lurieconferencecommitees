// Zoom Server-to-Server OAuth client. Uses ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID,
// and ZOOM_CLIENT_SECRET to mint a short-lived token, then creates meetings.
// Direct REST (no SDK) to keep dependencies light, matching lib/stripe.ts.

export function isZoomConfigured(): boolean {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  );
}

// Cache the account token across requests in the same warm lambda.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }
  const accountId = process.env.ZOOM_ACCOUNT_ID!;
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Zoom auth failed (${res.status}): ${data?.reason || data?.error || "unknown"}`);
  }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.token;
}

export type ZoomMeeting = {
  id: string;
  joinUrl: string;
  startUrl: string;
};

// Create a scheduled Zoom meeting hosted by `hostEmail` (the assigned team
// member). startAt is absolute; Zoom is told the time in UTC.
export async function createZoomMeeting(opts: {
  hostEmail: string;
  topic: string;
  startAt: Date;
  durationMin: number;
  agenda?: string;
}): Promise<ZoomMeeting> {
  const token = await getAccessToken();
  const body = {
    topic: opts.topic.slice(0, 200),
    type: 2, // scheduled
    start_time: opts.startAt.toISOString().replace(/\.\d{3}Z$/, "Z"),
    duration: opts.durationMin,
    timezone: "UTC",
    agenda: (opts.agenda || "").slice(0, 2000),
    settings: {
      join_before_host: true,
      waiting_room: false,
      approval_type: 2,
    },
  };
  // `users/{hostEmail}/meetings` creates the meeting on that user's account.
  const res = await fetch(
    `https://api.zoom.us/v2/users/${encodeURIComponent(opts.hostEmail)}/meetings`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(`Zoom meeting create failed (${res.status}): ${data?.message || "unknown"}`);
  }
  return {
    id: String(data.id),
    joinUrl: data.join_url,
    startUrl: data.start_url,
  };
}
