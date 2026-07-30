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

type RetrievedSession = {
  id: string;
  paid: boolean;
  amountTotal: number | null;
  paymentIntentId: string | null;
  // Session metadata as set at creation (kind, sponsorId, ...). Callers MUST
  // check this to prove the session belongs to the record they are about to
  // mark paid — any paid session ID is otherwise interchangeable.
  metadata: Record<string, string>;
};

// Fetch a checkout session straight from Stripe to verify its real payment
// state, independent of whether the webhook ever arrived. Lets the success page
// and an admin action confirm a payment even if the webhook was missed.
// Returns null if Stripe has no such session.
export async function retrieveCheckoutSession(sessionId: string): Promise<RetrievedSession | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${key}` } }
  );
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Stripe error ${res.status}: ${data?.error?.message || "unknown"}`);
  }
  const pi = data?.payment_intent;
  return {
    id: data.id,
    paid: data?.payment_status === "paid",
    amountTotal: typeof data?.amount_total === "number" ? data.amount_total : null,
    paymentIntentId: typeof pi === "string" ? pi : (pi?.id ?? null),
    metadata: data?.metadata && typeof data.metadata === "object" ? data.metadata : {},
  };
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

// ─── Settlement: what actually landed, per payment ─────────────────────────
//
// Everything else in this app records what we MEANT to charge: finalPriceCents
// on an attendee, amountCents on a sponsor. Neither is money. Stripe takes a
// processing fee out of every charge before it reaches the balance, refunds
// come back out afterwards, and neither event is written to our database. A
// dashboard that sums our own price columns and calls the total "revenue
// actually collected" is reporting an intention.
//
// The balance transaction is the deterministic record. Every charge has one,
// and it carries three numbers Stripe computed and we cannot: `amount` (gross),
// `fee` (what Stripe kept), and `net` (what reached the balance). Every refund
// has its own balance transaction with a negative net, and if Stripe returned
// part of its fee that shows there too.
//
//   net received = charge.balance_transaction.net + Σ refund.balance_transaction.net
//
// That identity is the whole point of this function: no arithmetic of ours is
// involved beyond the sum, so the result cannot drift from Stripe.

export type Settlement = {
  paymentIntentId: string;
  chargeId: string | null;
  /** What the customer was charged, in cents. */
  grossCents: number;
  /** What Stripe kept, in cents, net of any fee refunded. Always >= 0. */
  feeCents: number;
  /** Gross value of refunds issued, in cents. Always >= 0. */
  refundedCents: number;
  /** What actually reached the Stripe balance after fees and refunds. */
  netCents: number;
  currency: string;
  /** Stripe's own status. Anything other than "succeeded" is not money. */
  status: string;
  /** False for test-mode payments, which must never be counted as income. */
  livemode: boolean;
  /** When the funds became available, if Stripe has settled them. */
  availableOn: Date | null;
};

async function stripeGet(path: string): Promise<Record<string, unknown>> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 404) return {};
    throw new Error(`Stripe error ${res.status}: ${(data as { error?: { message?: string } })?.error?.message || "unknown"}`);
  }
  return data as Record<string, unknown>;
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * The money that actually landed for one payment intent, straight from Stripe.
 * Returns null when Stripe has no record of the id.
 */
export async function retrieveSettlement(paymentIntentId: string): Promise<Settlement | null> {
  const pi = await stripeGet(
    `payment_intents/${encodeURIComponent(paymentIntentId)}?expand[]=latest_charge.balance_transaction`,
  );
  if (!pi || !pi.id) return null;

  const charge = (pi.latest_charge && typeof pi.latest_charge === "object"
    ? pi.latest_charge
    : null) as Record<string, unknown> | null;
  const bt = (charge?.balance_transaction && typeof charge.balance_transaction === "object"
    ? charge.balance_transaction
    : null) as Record<string, unknown> | null;

  // No charge means no money, whatever the intent's status says.
  if (!charge || !bt) {
    return {
      paymentIntentId: String(pi.id),
      chargeId: null,
      grossCents: 0, feeCents: 0, refundedCents: 0, netCents: 0,
      currency: String(pi.currency || "usd"),
      status: String(pi.status || "unknown"),
      livemode: Boolean(pi.livemode),
      availableOn: null,
    };
  }

  // Refunds are paginated and each carries its own balance transaction. Sum the
  // nets rather than trusting charge.amount_refunded, which is a gross figure
  // and says nothing about whether Stripe gave the fee back.
  let refundedCents = 0;
  let refundNetCents = 0;
  let startingAfter: string | null = null;
  for (let page = 0; page < 10; page++) {
    const qs = new URLSearchParams({ charge: String(charge.id), limit: "100" });
    qs.append("expand[]", "data.balance_transaction");
    if (startingAfter) qs.set("starting_after", startingAfter);
    const list = await stripeGet(`refunds?${qs.toString()}`);
    const data = Array.isArray(list.data) ? (list.data as Record<string, unknown>[]) : [];
    for (const r of data) {
      if (r.status !== "succeeded" && r.status !== "pending") continue;
      refundedCents += num(r.amount);
      const rbt = (r.balance_transaction && typeof r.balance_transaction === "object"
        ? r.balance_transaction
        : null) as Record<string, unknown> | null;
      // A refund's balance transaction net is negative. Falling back to the
      // gross amount would understate what came back if Stripe kept its fee.
      refundNetCents += rbt ? num(rbt.net) : -num(r.amount);
    }
    if (!list.has_more || !data.length) break;
    startingAfter = String(data[data.length - 1].id);
  }

  const grossCents = num(bt.amount);
  const netCents = num(bt.net) + refundNetCents;
  return {
    paymentIntentId: String(pi.id),
    chargeId: String(charge.id),
    grossCents,
    // Derived, not read: this is the fee Stripe ended up keeping once refunded
    // fees are accounted for, which is the only fee figure worth reporting.
    feeCents: Math.max(0, grossCents - refundedCents - netCents),
    refundedCents,
    netCents,
    currency: String(bt.currency || "usd"),
    status: String(pi.status || "unknown"),
    livemode: Boolean(pi.livemode),
    availableOn: typeof bt.available_on === "number" ? new Date(bt.available_on * 1000) : null,
  };
}

// ─── The other direction: everything Stripe has ────────────────────────────
//
// retrieveSettlement answers "what happened to this payment we know about",
// which can only ever describe money we already have an id for. It cannot see
// a charge nobody linked to a record, and a report built only from our own
// rows will look complete while silently missing income.
//
// So this walks Stripe's charge list instead, with no reference to our
// database at all. Subtracting what we matched from what Stripe holds is the
// only check that can catch a payment we never recorded.

export type StripeCharge = {
  id: string;
  paymentIntentId: string | null;
  email: string | null;
  description: string | null;
  grossCents: number;
  netCents: number;
  refundedCents: number;
  created: Date;
  /**
   * Set at checkout and copied onto the charge: attendeeId / attendeeEmail /
   * attendanceMode for a ticket, or kind=sponsor / sponsorId / tier for a
   * sponsorship. This is what makes a charge attributable without trusting any
   * flag in our own database.
   */
  metadata: Record<string, string>;
};

/**
 * Every live-mode succeeded charge on the account, newest first. Pages until
 * Stripe says there are no more, capped so a runaway cannot hang the request.
 */
export async function listAllCharges(maxPages = 40): Promise<{ charges: StripeCharge[]; truncated: boolean }> {
  const charges: StripeCharge[] = [];
  let startingAfter: string | null = null;
  let truncated = false;
  for (let page = 0; ; page++) {
    if (page >= maxPages) { truncated = true; break; }
    const qs = new URLSearchParams({ limit: "100" });
    qs.append("expand[]", "data.balance_transaction");
    qs.append("expand[]", "data.payment_intent");
    if (startingAfter) qs.set("starting_after", startingAfter);
    const list = await stripeGet(`charges?${qs.toString()}`);
    const data = Array.isArray(list.data) ? (list.data as Record<string, unknown>[]) : [];
    for (const c of data) {
      if (!c.livemode || c.status !== "succeeded") continue;
      const bt = (c.balance_transaction && typeof c.balance_transaction === "object"
        ? c.balance_transaction
        : null) as Record<string, unknown> | null;
      const billing = (c.billing_details && typeof c.billing_details === "object"
        ? c.billing_details
        : null) as Record<string, unknown> | null;
      const pi = (c.payment_intent && typeof c.payment_intent === "object"
        ? c.payment_intent
        : null) as Record<string, unknown> | null;
      // Checkout writes the same metadata to both, but only one of them is
      // guaranteed to still carry it, so read the charge first and fall back.
      const meta: Record<string, string> = {};
      for (const src of [pi?.metadata, c.metadata]) {
        if (src && typeof src === "object") {
          for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
            if (typeof v === "string" && v) meta[k] = v;
          }
        }
      }
      charges.push({
        id: String(c.id),
        paymentIntentId: typeof c.payment_intent === "string"
          ? c.payment_intent
          : (pi?.id ? String(pi.id) : null),
        metadata: meta,
        email: (typeof c.receipt_email === "string" && c.receipt_email)
          || (typeof billing?.email === "string" ? (billing.email as string) : null)
          || null,
        description: typeof c.description === "string" ? c.description : null,
        grossCents: num(c.amount),
        // bt.net is already gross minus Stripe's fee. Refunds are subtracted by
        // the caller from refundedCents, since a per-refund balance lookup for
        // every charge on the account would be a lot of requests for an audit.
        netCents: bt ? num(bt.net) : num(c.amount),
        refundedCents: num(c.amount_refunded),
        created: new Date(num(c.created) * 1000),
      });
    }
    if (!list.has_more || !data.length) break;
    startingAfter = String(data[data.length - 1].id);
  }
  return { charges, truncated };
}
