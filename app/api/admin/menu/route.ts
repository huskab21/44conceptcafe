import { body, guard, parseMenu, refresh } from "@/lib/admin-api";

/** Admin: every menu item, including hidden ones. */
export async function GET(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { data, error } = await g.db.from("menu_items").select("*").order("category").order("sort_order");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data });
}

export async function POST(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const item = parseMenu(await body(request));
  if (!item.name || !item.name_en || !item.category || item.price === undefined) {
    return Response.json({ error: "Нэр, англи нэр, ангилал, үнэ заавал." }, { status: 400 });
  }
  const { data, error } = await g.db.from("menu_items").insert(item).select("*").single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  refresh("menu");
  return Response.json({ item: data }, { status: 201 });
}
