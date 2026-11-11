import "server-only";
import { getIntent } from "./wire";
import { markPaid, setOrderStatus, type Order } from "./orders";

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
