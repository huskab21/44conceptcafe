import "server-only";
import { adminDb } from "./supabase-admin";

/**
 * Server-side reservation helpers for the online (Wire / QPay) deposit.
 *
 * pending + unpaid → (Wire confirms the deposit) → confirmed + deposit_paid.
 * Unpaid online bookings are cancelled after UNPAID_TTL_MIN so they stop holding seats in the slot.
 */

export type ReservationRow = {
  id: string;
  full_name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  note: string | null;
  status: "pending" | "confirmed" | "cancelled";
  deposit: number;
  deposit_paid: boolean;
  payment_ref: string | null;
  invoice_id: string | null;
  pay_url: string | null;
  paid_at: string | null;
  created_at: string;
};

export const UNPAID_TTL_MIN = 20;

function db() {
  if (!adminDb) throw new Error("Supabase is not configured");
  return adminDb;
}

export async function getReservation(id: string): Promise<ReservationRow | null> {
  const { data } = await db().from("reservations").select("*").eq("id", id).maybeSingle();
  return (data as ReservationRow) ?? null;
}

export async function getReservationByInvoiceId(invoiceId: string): Promise<ReservationRow | null> {
  const { data } = await db().from("reservations").select("*").eq("invoice_id", invoiceId).maybeSingle();
  return (data as ReservationRow) ?? null;
}

export async function attachReservationInvoice(id: string, invoice: { invoice_id: string; pay_url: string }) {
  const { data, error } = await db().from("reservations").update(invoice).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ReservationRow) ?? null;
}

/** Idempotent — returns the row only for the call that actually marked it paid (so staff are notified once). */
export async function markDepositPaid(id: string): Promise<ReservationRow | null> {
  const { data, error } = await db()
    .from("reservations")
    .update({ deposit_paid: true, status: "confirmed", paid_at: new Date().toISOString() })
    .eq("id", id)
    .eq("deposit_paid", false)
    .neq("status", "cancelled")
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ReservationRow) ?? null;
}

export async function cancelReservation(id: string) {
  await db().from("reservations").update({ status: "cancelled" }).eq("id", id).eq("deposit_paid", false);
}

/** Frees seats held by online bookings whose deposit was never paid. */
export async function expireUnpaid() {
  const before = new Date(Date.now() - UNPAID_TTL_MIN * 60_000).toISOString();
  const { error } = await db()
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("status", "pending")
    .eq("deposit_paid", false)
    .not("invoice_id", "is", null)
    .lt("created_at", before);
  if (error) console.error("[reservations] expire unpaid failed:", error.message);
}
