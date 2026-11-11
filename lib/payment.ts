import "server-only";
import { getIntent } from "./wire";
import { markPaid, setOrderStatus, type Order } from "./orders";
import { cancelReservation, markDepositPaid, type ReservationRow } from "./reservations";

/**
 * Asks Wire for the order's payment and moves the order on:
 *   succeeded → new (returns the updated order so the caller can notify staff once)
 *   canceled  → cancelled
 * The amount must match the order total, otherwise nothing changes.
 */
export async function syncPayment(order: Order): Promise<Order | null> {
  if (order.status !== "awaiting_payment" || !order.invoice_id) return null;
  const intent = await getIntent(order.invoice_id);
  if (intent.status === "succeeded") {
    if (intent.amount !== order.total) {
      console.error(`[wire] amount mismatch for order ${order.id}: paid ${intent.amount}, expected ${order.total}`);
      return null;
    }
    return markPaid(order.id);
  }
  if (intent.status === "canceled") await setOrderStatus(order.id, "cancelled");
  return null;
}

/** Same for a table booking's deposit: succeeded → confirmed + deposit_paid (returned once, for notifying staff). */
export async function syncDeposit(r: ReservationRow): Promise<ReservationRow | null> {
  if (r.deposit_paid || r.status === "cancelled" || !r.invoice_id) return null;
  const intent = await getIntent(r.invoice_id);
  if (intent.status === "succeeded") {
    if (intent.amount !== r.deposit) {
      console.error(`[wire] deposit mismatch for reservation ${r.id}: paid ${intent.amount}, expected ${r.deposit}`);
      return null;
    }
    return markDepositPaid(r.id);
  }
  if (intent.status === "canceled") await cancelReservation(r.id);
  return null;
}
