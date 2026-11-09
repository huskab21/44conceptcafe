import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Bonum payment gateway (https://psp.bonum.mn/bonum-gateway-apis.html).
 *
 * Money goes to whatever settlement bank account is set on the merchant in the Bonum portal
 * (https://merchant.bonum.mn) — it is NOT configured in this code.
 *
 * Env:
 *   BONUM_BASE_URL       https://testapi.bonum.mn (test) | https://apis.bonum.mn (production)
 *   BONUM_APP_SECRET     from Bonum
 *   BONUM_TERMINAL_ID    from Bonum
 *   BONUM_CHECKSUM_KEY   MERCHANT_CHECKSUM_KEY from Bonum — verifies the payment webhook
 */

const base = (process.env.BONUM_BASE_URL ?? "").replace(/\/$/, "");
const appSecret = process.env.BONUM_APP_SECRET;
const terminalId = process.env.BONUM_TERMINAL_ID;
const checksumKey = process.env.BONUM_CHECKSUM_KEY;

export const bonumEnabled = Boolean(base && appSecret && terminalId);
/** The invoice-status lookup is test-only per Bonum's docs ("DO NOT USE THIS SERVICE ON PRODUCTION"). */
export const bonumIsTest = base.includes("testapi.");

/* ───────────── token (cached — Bonum rate-limits token requests) ───────────── */

type Token = { access: string; refresh: string; expiresAt: number; refreshExpiresAt: number };
const cache = globalThis as unknown as { __bonumToken?: Token; __bonumTokenPending?: Promise<Token> };

type TokenResponse = { accessToken: string; refreshToken: string; expiresIn: number; refreshExpiresIn: number };

function toToken(r: TokenResponse): Token {
  const now = Date.now();
  return {
    access: r.accessToken,
    refresh: r.refreshToken,
    expiresAt: now + (r.expiresIn - 60) * 1000,
    refreshExpiresAt: now + (r.refreshExpiresIn - 60) * 1000,
  };
}

async function fetchToken(): Promise<Token> {
  const old = cache.__bonumToken;
  if (old && Date.now() < old.refreshExpiresAt) {
    const res = await fetch(`${base}/bonum-gateway/ecommerce/auth/refresh`, {
      headers: { Authorization: `Bearer ${old.refresh}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return toToken((await res.json()) as TokenResponse);
  }
  const res = await fetch(`${base}/bonum-gateway/ecommerce/auth/create`, {
    headers: { Authorization: `AppSecret ${appSecret}`, "X-TERMINAL-ID": terminalId! },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Bonum auth failed: ${res.status} ${await res.text().catch(() => "")}`);
  return toToken((await res.json()) as TokenResponse);
}

async function token(): Promise<string> {
  const t = cache.__bonumToken;
  if (t && Date.now() < t.expiresAt) return t.access;
  cache.__bonumTokenPending ??= fetchToken().finally(() => {
    cache.__bonumTokenPending = undefined;
  });
  cache.__bonumToken = await cache.__bonumTokenPending;
  return cache.__bonumToken.access;
}

/* ───────────── invoices ───────────── */

export type BonumInvoice = { invoiceId: string; followUpLink: string };

export async function createInvoice(input: {
  amount: number;
  transactionId: string;
  callback: string;
  expiresIn?: number;
  items?: { title: string; amount: number; count: number }[];
}): Promise<BonumInvoice> {
  const res = await fetch(`${base}/bonum-gateway/ecommerce/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await token()}`,
      "Accept-Language": "mn",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Bonum invoice failed: ${res.status} ${await res.text().catch(() => "")}`);
  const data = (await res.json()) as BonumInvoice;
  if (!data.invoiceId || !data.followUpLink) throw new Error("Bonum invoice: unexpected response");
  return data;
}

/** TEST ENVIRONMENT ONLY — lets local dev see a payment without a public webhook URL. */
export async function invoiceIsPaid(invoiceId: string): Promise<boolean> {
  if (!bonumIsTest) return false;
  const res = await fetch(`${base}/bonum-gateway/ecommerce/invoices/${encodeURIComponent(invoiceId)}`, {
    headers: { Authorization: `Bearer ${await token()}`, Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!res?.ok) return false;
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  const status = String(data?.status ?? (data?.body as Record<string, unknown> | undefined)?.status ?? "").toUpperCase();
  return status === "PAID";
}

/* ───────────── webhook ───────────── */

export type BonumWebhook = {
  type: string; // "PAYMENT"
  status: string; // "SUCCESS" | "FAILED"
  body: {
    transactionId?: string;
    invoiceId?: string;
    amount?: number;
    status?: string; // "PAID" on success
    invoiceStatus?: string; // e.g. "EXPIRED" on failure
    paymentVendor?: string;
    terminalId?: string;
  };
};

function sameHex(a: string, b: string) {
  const x = Buffer.from(a.toLowerCase());
  const y = Buffer.from(b.toLowerCase());
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * `x-checksum-v2` = hex HMAC-SHA256 (MERCHANT_CHECKSUM_KEY) of the JSON body. Bonum's example hashes the compact
 * re-serialized body, so both the raw bytes and the compact form are accepted.
 */
export function verifyWebhook(raw: string, header: string | null): boolean {
  if (!checksumKey || !header) return false;
  const sign = (s: string) => createHmac("sha256", checksumKey).update(s, "utf8").digest("hex");
  if (sameHex(sign(raw), header)) return true;
  try {
    return sameHex(sign(JSON.stringify(JSON.parse(raw))), header);
  } catch {
    return false;
  }
}
