import { body, guard, parseWear, refresh } from "@/lib/admin-api";

/** Admin: every Art Wear piece, including hidden / sold ones. */
export async function GET(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { data, error } = await g.db.from("wear_items").select("*").order("sort_order");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data });
}

export async function POST(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const item = parseWear(await body(request));
  if (!item.name || !item.image || item.price === undefined) {
    return Response.json({ error: "Нэр, зураг, үнэ заавал." }, { status: 400 });
  }
  const { data, error } = await g.db.from("wear_items").insert(item).select("*").single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  refresh("wear");
  return Response.json({ item: data }, { status: 201 });
}
