import { after, type NextRequest } from "next/server";
import { getMenu } from "@/lib/menu";
import { notifyNewOrder } from "@/lib/notify";
import { randomBytes } from "node:crypto";
import { bonumEnabled, createInvoice } from "@/lib/bonum";
import { attachInvoice, createOrder, isAdmin, isValidTable, listOrders, setOrderStatus, userIdFrom, type OrderLine } from "@/lib/orders";
import { totals } from "@/lib/promo";

type Body = { table?: unknown; key?: unknown; items?: unknown; note?: unknown };

/** Guest places an order from the table QR menu. Prices come from the menu on the server, never from the client. */
export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Буруу хүсэлт." }, { status: 400 });
  }

  const table = Number(body.table);
  if (!isValidTable(table, typeof body.key === "string" ? body.key : null)) {
    return Response.json({ error: "Ширээний QR код хүчингүй байна. Ширээн дээрх QR-ийг дахин уншуулна уу." }, { status: 403 });
  }

  const raw = Array.isArray(body.items) ? body.items : [];
  const menu = await getMenu();
  const byId = new Map(menu.map((m) => [m.id, m]));
  const merged = new Map<string, number>();
  for (const r of raw) {
    const id = typeof r?.id === "string" ? r.id : "";
    const qty = Math.floor(Number(r?.qty));
    if (!byId.has(id) || !(qty > 0)) continue;
    merged.set(id, Math.min(20, (merged.get(id) ?? 0) + qty));
  }
  if (merged.size === 0) return Response.json({ error: "Сагс хоосон байна." }, { status: 400 });
  if (merged.size > 30) return Response.json({ error: "Хэт олон бараа байна." }, { status: 400 });

  const lines = [...merged].map(([id, qty]) => ({ item: byId.get(id)!, qty }));
  const t = totals(lines);
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) || null : null;

  // With Bonum configured the guest pays first; the order only reaches the staff board once Bonum confirms payment.
  const prepay = bonumEnabled && t.total > 0;

  try {
    const order = await createOrder({
      table_no: table,
      lines: lines.map<OrderLine>((l) => ({ id: l.item.id, name: l.item.name, price: l.item.price, qty: l.qty })),
      note,
      subtotal: t.subtotal,
      discount: t.discount,
      total: t.total,
      status: prepay ? "awaiting_payment" : "new",
      user_id: await userIdFrom(request),
      payment_ref: prepay ? `C44${randomBytes(6).toString("hex").toUpperCase()}` : null,
    });

    if (!prepay) {
      after(() => notifyNewOrder(order));
      return Response.json({ order }, { status: 201 });
    }

    try {
      const back = new URL(`/t/${table}`, process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin);
      if (typeof body.key === "string" && body.key) back.searchParams.set("k", body.key);
      const invoice = await createInvoice({
        amount: order.total,
        transactionId: order.payment_ref!,
        callback: back.toString(),
        expiresIn: 15 * 60,
        items: lines.map((l) => ({ title: l.item.name, amount: l.item.price, count: l.qty })),
      });
      const withInvoice = await attachInvoice(order.id, { invoice_id: invoice.invoiceId, pay_url: invoice.followUpLink });
      return Response.json({ order: withInvoice ?? order }, { status: 201 });
    } catch (e) {
      console.error("[orders] bonum invoice failed:", e);
      await setOrderStatus(order.id, "cancelled").catch(() => null);
      return Response.json({ error: "Төлбөрийн нэхэмжлэх үүсгэж чадсангүй. Дахин оролдоно уу эсвэл ажилтанд хандана уу." }, { status: 502 });
    }
  } catch (e) {
    console.error("[orders] create failed:", e);
    return Response.json({ error: "Захиалга хадгалж чадсангүй. Ажилтанд хандана уу." }, { status: 500 });
  }
}

/** Staff: orders of the last 24h (board), or `?days=7` / `?days=30` for history. */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) return Response.json({ error: "Нэвтрэх эрхгүй." }, { status: 401 });
  const days = Math.min(90, Math.max(1, Math.floor(Number(request.nextUrl.searchParams.get("days")) || 1)));
  return Response.json({ orders: await listOrders(days * 24) });
}
