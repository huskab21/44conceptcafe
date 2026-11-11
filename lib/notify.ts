import "server-only";
import type { Order } from "./orders";
import { postToViber, viberEnabled } from "./viber";

/**
 * Tell the staff about new orders and table bookings. Every channel is optional and configured by env vars:
 *
 * - SMS: SMS_WEBHOOK_URL is your Mongolian SMS gateway's send URL (Unitel/Mobicom/Skytel corporate SMS,
 *   messagepro.mn, …) with {to} and {text} placeholders, e.g.
 *     https://api.provider.mn/send?key=XXXX&to={to}&text={text}
 *   SMS_TO is a comma-separated list of staff phone numbers.
 * - Telegram (free, instant, good fallback): TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID.
 * - Viber Channel: VIBER_CHANNEL_TOKEN (see lib/viber.ts).
 *
 * Failures are logged and never block the guest.
 */
async function notifyStaff(short: string, rich: string) {
  const jobs: Promise<unknown>[] = [];

  const smsUrl = process.env.SMS_WEBHOOK_URL;
  const smsTo = process.env.SMS_TO;
  if (smsUrl && smsTo) {
    for (const to of smsTo.split(",").map((s) => s.trim()).filter(Boolean)) {
      const target = smsUrl.replace("{to}", encodeURIComponent(to)).replace("{text}", encodeURIComponent(short));
      jobs.push(fetch(target, { method: "GET", signal: AbortSignal.timeout(6000) }));
    }
  }

  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: tgChat, text: rich }),
        signal: AbortSignal.timeout(6000),
      }),
    );
  }

  if (viberEnabled) jobs.push(postToViber(rich));

  if (jobs.length === 0) {
    console.info("[notify] (no SMS/Telegram/Viber configured):", short);
    return;
  }
  const results = await Promise.allSettled(jobs);
  results.forEach((r) => r.status === "rejected" && console.error("[notify] failed:", r.reason));
}

export function notifyNewOrder(order: Order) {
  const lines = order.lines.map((l) => `${l.qty}x ${l.name}`).join(", ");
  const short = `44 cafe: Ширээ ${order.table_no} — #${order.number}. ${lines}. Нийт ${order.total.toLocaleString("en-US")}₮${order.note ? `. Тэмдэглэл: ${order.note}` : ""}`;
  const items = order.lines.map((l) => `• ${l.qty}× ${l.name}`).join("\n");
  const rich = `🔔 Шинэ захиалга — Ширээ ${order.table_no} (#${String(order.number).padStart(3, "0")})\n${items}\nНийт: ${order.total.toLocaleString("en-US")}₮${order.paid_at ? " ✓ Төлөгдсөн" : ""}${order.note ? `\n📝 ${order.note}` : ""}`;
  return notifyStaff(short, rich);
}

export type BookingNotice = {
  full_name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM[:SS]
  guests: number;
  note: string | null;
  deposit: number;
  deposit_paid?: boolean;
};

export function notifyNewReservation(r: BookingNotice) {
  const time = r.time.slice(0, 5);
  const amount = `${r.deposit.toLocaleString("en-US")}₮`;
  const depositLine = r.deposit_paid ? `✅ Deposit ${amount} онлайнаар төлөгдсөн — баталгаажсан` : `💰 Deposit ${amount} — хүлээгдэж байна`;
  const short = `44 cafe: Ширээ захиалга — ${r.date} ${time}, ${r.guests} хүн. ${r.full_name} ${r.phone}. ${r.deposit_paid ? `Deposit ${amount} төлөгдсөн.` : `Deposit ${amount} хүлээгдэж байна.`}`;
  const rich = `📅 Шинэ ширээ захиалга\n${r.date} · ${time} · ${r.guests} хүн\n👤 ${r.full_name}\n📞 ${r.phone}${r.note ? `\n📝 ${r.note}` : ""}\n${depositLine}`;
  return notifyStaff(short, rich);
}
