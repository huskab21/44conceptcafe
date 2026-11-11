import { after, type NextRequest } from "next/server";
import { verifyWebhook, type WireEvent } from "@/lib/wire";
import { notifyNewOrder, notifyNewReservation } from "@/lib/notify";
import { getOrderByInvoiceId } from "@/lib/orders";
import { getReservationByInvoiceId } from "@/lib/reservations";
import { syncDeposit, syncPayment } from "@/lib/payment";

/**
 * Wire's dashboard "Баталгаажуулах" check reaches the URL with GET and only needs a 2xx.
 * It changes nothing — orders only move on via the signed POST events (or the guest's status poll).
 */
export function GET() {
  return Response.json({ ok: true });
}

/**
 * Wire webhook. Register it in the Wire dashboard (or POST /v1/webhook_endpoints):
 *   https://<your-domain>/api/payments/wire
 * and put the whsec_... secret in WIRE_WEBHOOK_SECRET.
 *
 * Handles QR-menu orders and table-booking deposits. The event is only a hint: the payment is
 * re-checked with Wire before anything moves on.
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

  // Errors below throw → 500 → Wire retries.
  const order = await getOrderByInvoiceId(event.data.id);
  if (order) {
    const paid = await syncPayment(order);
    if (paid) after(() => notifyNewOrder(paid));
    return Response.json({ ok: true });
  }

  const booking = await getReservationByInvoiceId(event.data.id);
  if (booking) {
    const paid = await syncDeposit(booking);
    if (paid) after(() => notifyNewReservation(paid));
    return Response.json({ ok: true });
  }

  console.warn("[wire] webhook for unknown payment intent:", event.data.id);
  return Response.json({ ok: true, unknown: true });
}
