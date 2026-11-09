import { after, type NextRequest } from "next/server";
import { verifyWebhook, type BonumWebhook } from "@/lib/bonum";
import { notifyNewOrder } from "@/lib/notify";
import { getOrderByPaymentRef, markPaid, setOrderStatus } from "@/lib/orders";

/**
 * Bonum payment webhook. Register this URL with Bonum (merchant portal / support):
 *   https://<your-domain>/api/payments/bonum
 *
 * A verified "PAID" message moves the order from awaiting_payment to new, so it appears on /admin.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyWebhook(raw, request.headers.get("x-checksum-v2"))) {
    console.warn("[bonum] webhook rejected: bad checksum");
    return Response.json({ error: "invalid checksum" }, { status: 401 });
  }

  let msg: BonumWebhook;
  try {
    msg = JSON.parse(raw) as BonumWebhook;
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  if (msg.type !== "PAYMENT") return Response.json({ ok: true, ignored: msg.type });

  const ref = msg.body?.transactionId;
  const order = ref ? await getOrderByPaymentRef(ref) : null;
  if (!order) {
    console.warn("[bonum] webhook for unknown transactionId:", ref);
    return Response.json({ ok: true, unknown: true });
  }

  const paid = msg.status === "SUCCESS" && String(msg.body.status).toUpperCase() === "PAID";
  if (paid) {
    if (Math.round(Number(msg.body.amount)) !== order.total) {
      console.error(`[bonum] amount mismatch for order ${order.id}: paid ${msg.body.amount}, expected ${order.total}`);
      return Response.json({ ok: true, mismatch: true });
    }
    const updated = await markPaid(order.id);
    if (updated) after(() => notifyNewOrder(updated));
    return Response.json({ ok: true });
  }

  if (msg.status === "FAILED" && order.status === "awaiting_payment") {
    await setOrderStatus(order.id, "cancelled");
  }
  return Response.json({ ok: true });
}
