import "server-only";
import type { Order } from "./orders";

/**
 * Tell the staff about a new order. Every channel is optional and configured by env vars:
 *
 * - SMS: SMS_WEBHOOK_URL is your Mongolian SMS gateway's send URL (Unitel/Mobicom/Skytel corporate SMS,
 *   messagepro.mn, …) with {to} and {text} placeholders, e.g.
 *     https://api.provider.mn/send?key=XXXX&to={to}&text={text}
 *   SMS_TO is a comma-separated list of staff phone numbers.
 * - Telegram (free, instant, good fallback): TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID.
 *
 * Failures are logged and never block the guest's order.
 */
export async function notifyNewOrder(order: Order) {
  const lines = order.lines.map((l) => `${l.qty}x ${l.name}`).join(", ");
  const text = `44 cafe: Ширээ ${order.table_no} — #${order.number}. ${lines}. Нийт ${order.total.toLocaleString("en-US")}₮${order.note ? `. Тэмдэглэл: ${order.note}` : ""}`;

  const jobs: Promise<unknown>[] = [];

  const smsUrl = process.env.SMS_WEBHOOK_URL;
  const smsTo = process.env.SMS_TO;
  if (smsUrl && smsTo) {
    for (const to of smsTo.split(",").map((s) => s.trim()).filter(Boolean)) {
      const target = smsUrl.replace("{to}", encodeURIComponent(to)).replace("{text}", encodeURIComponent(text));
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
        body: JSON.stringify({ chat_id: tgChat, text }),
        signal: AbortSignal.timeout(6000),
      }),
    );
  }

  if (jobs.length === 0) {
    console.info("[orders] new order (no SMS/Telegram configured):", text);
    return;
  }
  const results = await Promise.allSettled(jobs);
  results.forEach((r) => r.status === "rejected" && console.error("[orders] notify failed:", r.reason));
}
