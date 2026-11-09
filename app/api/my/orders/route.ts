import { listUserOrders, userIdFrom } from "@/lib/orders";

/** Signed-in guest: their own QR-menu orders. */
export async function GET(request: Request) {
  const uid = await userIdFrom(request);
  if (!uid) return Response.json({ error: "Нэвтэрнэ үү." }, { status: 401 });
  const orders = await listUserOrders(uid);
  return Response.json({
    orders: orders.map(({ id, number, table_no, lines, total, discount, status, created_at, paid_at }) => ({ id, number, table_no, lines, total, discount, status, created_at, paid_at })),
  });
}
