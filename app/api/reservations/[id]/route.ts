import { after, type NextRequest } from "next/server";
import { notifyNewReservation } from "@/lib/notify";
import { syncDeposit } from "@/lib/payment";
import { getReservation } from "@/lib/reservations";

/**
 * Guest checks their booking after paying the deposit (the id is an unguessable uuid).
 * Asks Wire directly too, so the deposit is confirmed even without (or before) the webhook.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/reservations/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Олдсонгүй." }, { status: 404 });
  let r = await getReservation(id).catch(() => null);
  if (!r) return Response.json({ error: "Олдсонгүй." }, { status: 404 });

  if (!r.deposit_paid && r.status === "pending" && r.invoice_id) {
    try {
      const paid = await syncDeposit(r);
      if (paid) after(() => notifyNewReservation(paid));
      r = (await getReservation(id)) ?? r;
    } catch (e) {
      console.error("[reservations] wire status check failed:", e);
    }
  }

  const { date, time, guests, status, deposit, deposit_paid, pay_url, phone } = r;
  return Response.json({ reservation: { id, date, time: time.slice(0, 5), guests, status, deposit, deposit_paid, pay_url, phone } });
}
