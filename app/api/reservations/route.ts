import { after, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { notifyNewReservation } from "@/lib/notify";
import { attachReservationInvoice, cancelReservation, expireUnpaid } from "@/lib/reservations";
import { createCheckout, wireEnabled } from "@/lib/wire";
import { userIdFrom } from "@/lib/orders";
import { reservation as rules, timeSlots } from "@/lib/site";
import { adminDb } from "@/lib/supabase-admin";

/** Light per-instance throttle so the open (no-login) form can't be flooded: 5 bookings per IP per 10 minutes. */
const hits = new Map<string, number[]>();
function throttled(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * Guest books a table — no account needed. Signed-in guests get the booking linked to their account
 * (so it shows under "Миний захиалга"). Date/time/capacity/age rules are enforced again by the DB trigger.
 *
 * With Wire configured the guest pays the deposit online (QPay etc.) right away; the booking is confirmed and
 * staff are notified once Wire confirms it. Unpaid online bookings are released after a while (lib/reservations).
 */
export async function POST(request: NextRequest) {
  if (!adminDb) return Response.json({ error: "Захиалга түр ажиллахгүй байна." }, { status: 503 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (throttled(ip)) return Response.json({ error: "Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу." }, { status: 429 });

  let b: Record<string, unknown>;
  try {
    b = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Буруу хүсэлт." }, { status: 400 });
  }

  const full_name = str(b.full_name);
  const phone = str(b.phone);
  const date = str(b.date);
  const time = str(b.time);
  const guests = Math.floor(Number(b.guests));
  const note = str(b.note).slice(0, 300) || null;

  if (full_name.length < 2 || full_name.length > 80) return Response.json({ error: "Нэрээ оруулна уу." }, { status: 400 });
  if (!/^[+\d\s-]{8,20}$/.test(phone)) return Response.json({ error: "Утасны дугаараа зөв оруулна уу." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: "Өдрөө сонгоно уу." }, { status: 400 });
  if (!timeSlots().includes(time)) return Response.json({ error: "Ширээ зөвхөн 18:00-оос хойш захиалагдана." }, { status: 400 });
  if (!(guests >= 1 && guests <= rules.maxGuests)) return Response.json({ error: "Хүний тоо буруу байна." }, { status: 400 });
  if (b.age_confirmed !== true) return Response.json({ error: `Ширээ захиалга зөвхөн ${rules.minAge} нас хүрсэн хүнд.` }, { status: 400 });

  const prepay = wireEnabled && rules.deposit > 0;
  if (prepay) await expireUnpaid(); // free seats held by abandoned payments before checking capacity

  const { data, error } = await adminDb
    .from("reservations")
    .insert({
      user_id: await userIdFrom(request),
      full_name,
      phone,
      date,
      time,
      guests,
      note,
      age_confirmed: true,
      status: "pending",
      deposit: rules.deposit,
      deposit_paid: false,
      ...(prepay ? { payment_ref: `R44${randomBytes(6).toString("hex").toUpperCase()}` } : {}),
    })
    .select()
    .single();

  if (error) {
    const m = error.message;
    const msg = m.includes("reservation_slot_full")
      ? "Энэ цагт ширээ дүүрсэн байна. Өөр цаг сонгоно уу."
      : m.includes("reservation_invalid_time")
        ? "Ширээ зөвхөн 18:00-оос хойш захиалагдана."
        : m.includes("reservation_invalid_date")
          ? "Энэ өдөр захиалга авах боломжгүй. Өөр өдөр сонгоно уу."
          : m.includes("reservation_age")
            ? `Ширээ захиалга зөвхөн ${rules.minAge} нас хүрсэн хүнд.`
            : "Захиалга илгээхэд алдаа гарлаа. Дахин оролдоно уу.";
    if (msg.startsWith("Захиалга илгээхэд")) console.error("[reservations]", m);
    return Response.json({ error: msg }, { status: 400 });
  }
  if (!prepay) {
    after(() => notifyNewReservation(data));
    return Response.json({ reservation: data }, { status: 201 });
  }

  try {
    const back = new URL("/reserve", process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin);
    back.searchParams.set("r", data.id);
    const checkout = await createCheckout({
      amount: rules.deposit,
      ref: data.payment_ref,
      description: `44 Concept Café · Ширээ захиалга ${date} ${time} · ${guests} хүн`,
      successUrl: back.toString(),
      cancelUrl: back.toString(),
    });
    const withInvoice = await attachReservationInvoice(data.id, { invoice_id: checkout.intentId, pay_url: checkout.url });
    return Response.json({ reservation: withInvoice ?? data }, { status: 201 });
  } catch (e) {
    console.error("[reservations] wire checkout failed:", e);
    await cancelReservation(data.id).catch(() => null);
    return Response.json({ error: "Deposit-ийн нэхэмжлэх үүсгэж чадсангүй. Дахин оролдоно уу." }, { status: 502 });
  }
}
