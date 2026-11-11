import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "./supabase";

/* ───────────── types ───────────── */

/**
 * awaiting_payment → (Wire payment confirmed) → new → preparing → served → paid.
 * Orders that are still awaiting payment never reach the staff board.
 */
export type OrderStatus = "awaiting_payment" | "new" | "preparing" | "served" | "paid" | "cancelled";
export const ORDER_STATUSES: OrderStatus[] = ["awaiting_payment", "new", "preparing", "served", "paid", "cancelled"];

export type OrderLine = { id: string; name: string; price: number; qty: number };

export type Order = {
  id: string;
  number: number; // short, human number shown to guests and staff
  table_no: number;
  lines: OrderLine[];
  note: string | null;
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  /** Our order reference sent to Wire (idempotency key + metadata.order_ref). */
  payment_ref: string | null;
  invoice_id: string | null;
  pay_url: string | null;
  /** Set when Wire confirms the payment. */
  paid_at: string | null;
  /** Signed-in guest who placed it (shown on their /account page). */
  user_id?: string | null;
};

type NewOrder = Omit<Order, "id" | "number" | "status" | "created_at" | "invoice_id" | "pay_url" | "paid_at"> & {
  status?: OrderStatus;
};

/* ───────────── tables & QR signatures ───────────── */

export const TABLE_COUNT = Number(process.env.TABLE_COUNT ?? 12);

/**
 * Each table's QR carries a short signature (`/t/5?k=…`) so a photographed / guessed link for another table
 * is rejected. Without ORDER_SECRET (local dev) any table link is accepted.
 */
export function tableKey(table: number): string {
  const secret = process.env.ORDER_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(`table:${table}`).digest("base64url").slice(0, 10);
}

export function isValidTable(table: number, key: string | null | undefined): boolean {
  if (!Number.isInteger(table) || table < 1 || table > TABLE_COUNT) return false;
  const expected = tableKey(table);
  if (!expected) return true;
  const a = Buffer.from(expected);
  const b = Buffer.from(key ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ───────────── admin auth ───────────── */

/**
 * Admin requests are accepted in two ways:
 *  1. `Authorization: Bearer <Supabase access token>` of a signed-in user whose app_metadata.role is "admin"
 *     (only settable with the service key / SQL — users can't grant it to themselves). See supabase/schema.sql.
 *  2. `x-admin-key: <ADMIN_KEY>` — shared staff key, e.g. for a tablet at the bar.
 */
export async function isAdmin(request: Request): Promise<boolean> {
  const expected = process.env.ADMIN_KEY;
  const got = request.headers.get("x-admin-key");
  if (expected && got) {
    const a = Buffer.from(expected);
    const b = Buffer.from(got);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }

  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const sb = getServerSupabase();
  if (!bearer || !sb) return false;
  const { data, error } = await sb.auth.getUser(bearer);
  return !error && data.user?.app_metadata?.role === "admin";
}

/* ───────────── storage ─────────────
 * Supabase (with the server-only secret key) when configured, otherwise an in-memory list that lives as long as
 * the server process — fine for trying it locally, NOT for production (it empties on every restart / deploy).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const db = url && secret ? createClient(url, secret, { auth: { persistSession: false } }) : null;
export const ordersDemoMode = !db;

const mem = globalThis as unknown as { __orders44?: Order[] };
mem.__orders44 ??= [];

export async function createOrder(input: NewOrder): Promise<Order> {
  if (db) {
    const { data, error } = await db.from("orders").insert(input).select("*").single();
    if (error) throw new Error(error.message);
    return data as Order;
  }
  const list = mem.__orders44!;
  const order: Order = {
    invoice_id: null,
    pay_url: null,
    paid_at: null,
    status: "new",
    ...input,
    id: randomUUID(),
    number: (list[0]?.number ?? 0) + 1,
    created_at: new Date().toISOString(),
  };
  list.unshift(order);
  return order;
}

/** Signed-in user's id from `Authorization: Bearer <Supabase access token>`, or null. */
export async function userIdFrom(request: Request): Promise<string | null> {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const sb = getServerSupabase();
  if (!bearer || !sb) return null;
  const { data, error } = await sb.auth.getUser(bearer);
  return error ? null : (data.user?.id ?? null);
}

/** A guest's own orders (last 90 days), newest first. */
export async function listUserOrders(userId: string): Promise<Order[]> {
  const since = new Date(Date.now() - 90 * 86400_000).toISOString();
  if (db) {
    const { data, error } = await db.from("orders").select("*").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as Order[];
  }
  return mem.__orders44!.filter((o) => o.user_id === userId && o.created_at >= since);
}

/** Staff board: today's orders, without the ones still waiting for payment. */
export async function listOrders(sinceHours = 24): Promise<Order[]> {
  const since = new Date(Date.now() - sinceHours * 3600_000).toISOString();
  if (db) {
    const { data, error } = await db
      .from("orders")
      .select("*")
      .gte("created_at", since)
      .neq("status", "awaiting_payment")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as Order[];
  }
  return mem.__orders44!.filter((o) => o.created_at >= since && o.status !== "awaiting_payment");
}

async function patchOrder(id: string, patch: Partial<Order>): Promise<Order | null> {
  if (db) {
    const { data, error } = await db.from("orders").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Order) ?? null;
  }
  const o = mem.__orders44!.find((x) => x.id === id);
  if (o) Object.assign(o, patch);
  return o ?? null;
}

export function attachInvoice(id: string, invoice: { invoice_id: string; pay_url: string }) {
  return patchOrder(id, invoice);
}

/** Finds the order by its Wire PaymentIntent id (pi_...). */
export async function getOrderByInvoiceId(invoiceId: string): Promise<Order | null> {
  if (db) {
    const { data } = await db.from("orders").select("*").eq("invoice_id", invoiceId).maybeSingle();
    return (data as Order) ?? null;
  }
  return mem.__orders44!.find((o) => o.invoice_id === invoiceId) ?? null;
}

export async function getOrderByPaymentRef(ref: string): Promise<Order | null> {
  if (db) {
    const { data } = await db.from("orders").select("*").eq("payment_ref", ref).maybeSingle();
    return (data as Order) ?? null;
  }
  return mem.__orders44!.find((o) => o.payment_ref === ref) ?? null;
}

/**
 * Wire confirmed the payment: awaiting_payment → new (now visible on the staff board).
 * Idempotent — returns null when the order was already moved on, so the caller notifies staff only once.
 */
export async function markPaid(id: string): Promise<Order | null> {
  const patch = { status: "new" as const, paid_at: new Date().toISOString() };
  if (db) {
    const { data, error } = await db
      .from("orders")
      .update(patch)
      .eq("id", id)
      .eq("status", "awaiting_payment")
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Order) ?? null;
  }
  const o = mem.__orders44!.find((x) => x.id === id && x.status === "awaiting_payment");
  if (o) Object.assign(o, patch);
  return o ?? null;
}

export async function getOrder(id: string): Promise<Order | null> {
  if (db) {
    const { data } = await db.from("orders").select("*").eq("id", id).maybeSingle();
    return (data as Order) ?? null;
  }
  return mem.__orders44!.find((o) => o.id === id) ?? null;
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  if (db) {
    const { data, error } = await db.from("orders").update({ status }).eq("id", id).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Order) ?? null;
  }
  const o = mem.__orders44!.find((x) => x.id === id);
  if (o) o.status = status;
  return o ?? null;
}
