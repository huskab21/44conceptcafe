import { body, guard, refresh } from "@/lib/admin-api";

const COLS = "receipt_extra_label, receipt_extra_price, receipt_thanks";

export async function GET(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { data, error } = await g.db.from("site_settings").select(COLS).eq("id", 1).maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ settings: data });
}

export async function PATCH(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const b = await body(request);
  const patch: Record<string, unknown> = {};
  if (typeof b.receipt_extra_label === "string") patch.receipt_extra_label = b.receipt_extra_label.trim().slice(0, 60);
  if (typeof b.receipt_thanks === "string") patch.receipt_thanks = b.receipt_thanks.trim().slice(0, 80);
  const price = Math.round(Number(b.receipt_extra_price));
  if (Number.isFinite(price) && price >= 0 && price <= 1_000_000) patch.receipt_extra_price = price;
  if (Object.keys(patch).length === 0) return Response.json({ error: "Өөрчлөлт алга." }, { status: 400 });

  const { data, error } = await g.db.from("site_settings").upsert({ id: 1, ...patch, updated_at: new Date().toISOString() }).select(COLS).single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  refresh("settings");
  return Response.json({ settings: data });
}
