import "server-only";

/**
 * Posts staff notifications to a (private) Viber Channel via the Channels Post API
 * (https://developers.viber.com/docs/tools/channels-post-api/).
 *
 * Env: VIBER_CHANNEL_TOKEN — Channel info → Developer Tools → copy token (Channel super admin only).
 *
 * Viber requires a webhook before posting; it's set automatically to <site>/api/viber the first time it's needed.
 */

const API = "https://chatapi.viber.com/pa";
const token = process.env.VIBER_CHANNEL_TOKEN;

export const viberEnabled = Boolean(token);

type ViberResponse = { status: number; status_message?: string; members?: { id: string; role?: string }[] };

async function call(path: string, body: Record<string, unknown>): Promise<ViberResponse> {
  const res = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Viber-Auth-Token": token! },
    body: JSON.stringify({ auth_token: token, ...body }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Viber ${path}: HTTP ${res.status}`);
  return (await res.json()) as ViberResponse;
}

function siteUrl() {
  const s = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  if (!s) throw new Error("Viber: NEXT_PUBLIC_SITE_URL is not set, can't register the webhook");
  return s.replace(/\/$/, "");
}

export async function setViberWebhook() {
  const r = await call("set_webhook", { url: `${siteUrl()}/api/viber` });
  if (r.status !== 0) throw new Error(`Viber set_webhook: ${r.status} ${r.status_message}`);
}

const cache = globalThis as unknown as { __viberFrom?: string };

/** The Channel super admin's id — the API only accepts posts "from" a super admin. */
async function senderId(): Promise<string> {
  if (cache.__viberFrom) return cache.__viberFrom;
  const r = await call("get_account_info", {});
  if (r.status !== 0) throw new Error(`Viber get_account_info: ${r.status} ${r.status_message}`);
  const admin = r.members?.find((m) => m.role === "superadmin") ?? r.members?.[0];
  if (!admin) throw new Error("Viber: no channel super admin found");
  cache.__viberFrom = admin.id;
  return admin.id;
}

export async function postToViber(text: string) {
  if (!token) return;
  const send = async () => call("post", { from: await senderId(), type: "text", text: text.slice(0, 7000) });
  let r = await send();
  if (r.status === 10) {
    // webhookNotSet
    await setViberWebhook();
    r = await send();
  }
  if (r.status !== 0) throw new Error(`Viber post: ${r.status} ${r.status_message}`);
}
