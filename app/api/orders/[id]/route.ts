import { after, type NextRequest } from "next/server";
import { notifyNewOrder } from "@/lib/notify";
import { getOrder, isAdmin, setOrderStatus, type OrderStatus } from "@/lib/orders";
import { syncPayment } from "@/lib/payment";

/** Guest polls their own order's status (the id is an unguessable uuid). */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
  let order = await getOrder(id);
  if (!order) return Response.json({ error: "Олдсонгүй." }, { status: 404 });

  // Ask Wire directly too, so payment is confirmed even without (or before) the webhook.
  if (order.status === "awaiting_payment" && order.invoice_id) {
    try {
      const paid = await syncPayment(order);
      if (paid) after(() => notifyNewOrder(paid));
      order = (await getOrder(id)) ?? order;
    } catch (e) {
      console.error("[orders] wire status check failed:", e);
    }
  }

  const { id: oid, number, total, status, pay_url, paid_at } = order;
  return Response.json({ order: { id: oid, number, total, status, pay_url, paid_at } });
}

/** Staff can move a paid order along: new → preparing → served → paid (or cancel). Payment itself is only confirmed by Wire. */
const STAFF_STATUSES: OrderStatus[] = ["new", "preparing", "served", "paid", "cancelled"];

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  if (!(await isAdmin(request))) return Response.json({ error: "Нэвтрэх эрхгүй." }, { status: 401 });
  const { id } = await ctx.params;
  const { status } = (await request.json().catch(() => ({}))) as { status?: string };
  if (!STAFF_STATUSES.includes(status as OrderStatus)) return Response.json({ error: "Буруу төлөв." }, { status: 400 });
  const current = await getOrder(id);
  if (!current) return Response.json({ error: "Олдсонгүй." }, { status: 404 });
  if (current.status === "awaiting_payment" && status !== "cancelled") {
    return Response.json({ error: "Төлбөр баталгаажаагүй байна." }, { status: 409 });
  }
  const order = await setOrderStatus(id, status as OrderStatus);
  if (!order) return Response.json({ error: "Олдсонгүй." }, { status: 404 });
  return Response.json({ order });
}
