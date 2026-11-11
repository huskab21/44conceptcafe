import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Wire payments (https://docs.wire.mn): QPay and the other operators enabled on the Wire project.
 *
 * Money goes to the settlement bank account set on the project in the Wire dashboard (https://app.wire.mn) —
 * it is NOT configured in this code. Wire has no sandbox: every payment is real.
 *
 * Env:
 *   WIRE_SECRET_KEY       sk_live_... from the project's API keys in the Wire dashboard
 *   WIRE_WEBHOOK_SECRET   whsec_... shown once when the webhook endpoint is created (optional — see below)
 *
 * The webhook is optional: the guest's status poll also asks Wire directly, so payment is confirmed either way.
 */

const BASE = "https://api.wire.mn/v1";
const secretKey = process.env.WIRE_SECRET_KEY;
const webhookSecret = process.env.WIRE_WEBHOOK_SECRET;

export const wireEnabled = Boolean(secretKey);

export type WireIntentStatus =
  | "requires_payment_method"
  | "requires_action"
  | "processing"
  | "requires_capture"
  | "succeeded"
  | "canceled";

export type WireIntent = {
  id: string; // pi_...
  amount: number;
  currency: "MNT";
  status: WireIntentStatus;
  metadata?: Record<string, string>;
  livemode?: boolean;
};

async function call<T>(method: "GET" | "POST", path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${secretKey}` };
  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    headers["Idempotency-Key"] = idempotencyKey!;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Wire ${method} ${path} failed: ${res.status} ${await res.text().catch(() => "")}`);
  return (await res.json()) as T;
}

/**
 * Creates a PaymentIntent plus a hosted checkout page (QR + bank-app links for QPay etc.).
 * `ref` is our order reference — it makes retries idempotent and comes back in the intent's metadata.
 */
export async function createCheckout(input: {
  amount: number;
  ref: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ intentId: string; url: string }> {
  const intent = await call<WireIntent>(
    "POST",
    "/payment_intents",
    { amount: input.amount, currency: "MNT", description: input.description.slice(0, 200), metadata: { order_ref: input.ref } },
    `${input.ref}-intent`,
  );
  const session = await call<{ id: string; url: string }>(
    "POST",
    "/checkout/sessions",
    { payment_intent: intent.id, success_url: input.successUrl, cancel_url: input.cancelUrl },
    `${input.ref}-checkout`,
  );
  if (!intent.id || !session.url) throw new Error("Wire checkout: unexpected response");
  return { intentId: intent.id, url: session.url };
}

export function getIntent(id: string): Promise<WireIntent> {
  return call<WireIntent>("GET", `/payment_intents/${encodeURIComponent(id)}`);
}

/* ───────────── webhook ───────────── */

export type WireEvent = {
  id: string; // evt_...
  type: string; // payment_intent.succeeded | payment_intent.payment_failed | payment_intent.canceled | endpoint.verification | ...
  data?: { id?: string; object?: string; status?: string; amount?: number };
};

/** `WirePayment-Signature: t=<unix>,v1=<hex HMAC-SHA256(secret, t + "." + rawBody)>`, max 5 minutes old. */
export function verifyWebhook(raw: string, header: string | null): boolean {
  if (!webhookSecret || !header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = Number(parts.t);
  if (!parts.v1 || !Number.isFinite(t) || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = createHmac("sha256", webhookSecret).update(`${parts.t}.${raw}`, "utf8").digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}
