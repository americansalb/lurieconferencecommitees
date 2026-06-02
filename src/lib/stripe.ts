// Lazy Stripe client. We use direct REST calls instead of the npm sdk to keep
// dependencies light and avoid a build-time require of a missing key.

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

type CheckoutSessionArgs = {
  amountCents: number;
  customerEmail: string;
  productName: string;
  productDescription?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
};

type CheckoutSession = {
  id: string;
  url: string;
};

export async function createCheckoutSession(args: CheckoutSessionArgs): Promise<CheckoutSession> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("payment_method_types[0]", "card");
  form.set("customer_email", args.customerEmail);
  form.set("success_url", args.successUrl);
  form.set("cancel_url", args.cancelUrl);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", String(args.amountCents));
  form.set("line_items[0][price_data][product_data][name]", args.productName);
  if (args.productDescription) {
    form.set("line_items[0][price_data][product_data][description]", args.productDescription);
  }
  for (const [k, v] of Object.entries(args.metadata)) {
    form.set(`metadata[${k}]`, v);
    form.set(`payment_intent_data[metadata][${k}]`, v);
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Stripe error ${res.status}: ${data?.error?.message || "unknown"}`);
  }
  return { id: data.id, url: data.url };
}

// Verifies a Stripe webhook signature header against the raw payload using
// the configured webhook secret. Returns true if the signature is valid.
export async function verifyWebhookSignature(
  payload: string,
  header: string | null,
  // One secret, or several to try in turn. Stripe issues a distinct signing
  // secret per endpoint, so a route serving multiple destinations can pass
  // all of its candidate secrets and accept the event if any one matches.
  secret: string | undefined | (string | undefined)[],
  toleranceSec = 300
): Promise<boolean> {
  if (!header) return false;
  const secrets = (Array.isArray(secret) ? secret : [secret]).filter(
    (s): s is string => typeof s === "string" && s.length > 0
  );
  if (secrets.length === 0) return false;

  const parts = header.split(",").reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const ts = parseInt(t, 10);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;

  const encoder = new TextEncoder();
  for (const s of secrets) {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(s),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${t}.${payload}`));
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (timingSafeEqual(expected, v1)) return true;
  }
  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
