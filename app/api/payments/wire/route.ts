import { after, type NextRequest } from "next/server";
import { verifyWebhook, type WireEvent } from "@/lib/wire";
import { notifyNewOrder } from "@/lib/notify";
import { getOrderByInvoiceId } from "@/lib/orders";
import { syncPayment } from "@/lib/payment";

/**
 * Wire webhook. Register it in the Wire dashboard (or POST /v1/webhook_endpoints):
 *   https://<your-domain>/api/payments/wire
 * and put the whsec_... secret in WIRE_WEBHOOK_SECRET.
 *
 * The event is only a hint: the payment is re-checked with Wire before the order moves on.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyWebhook(raw, request.headers.get("wirepayment-signature"))) {
    console.warn("[wire] webhook rejected: bad signature");
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: WireEvent;
  try {
    event = JSON.parse(raw) as WireEvent;
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  if (!event.type?.startsWith("payment_intent.") || !event.data?.id) {
    return Response.json({ ok: true, ignored: event.type }); // incl. endpoint.verification
  }

  const order = await getOrderByInvoiceId(event.data.id);
  if (!order) {
    console.warn("[wire] webhook for unknown payment intent:", event.data.id);
    return Response.json({ ok: true, unknown: true });
  }

  const paid = await syncPayment(order); // throws → 500 → Wire retries
  if (paid) after(() => notifyNewOrder(paid));
  return Response.json({ ok: true });
}
