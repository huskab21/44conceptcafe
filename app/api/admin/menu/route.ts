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
  if (!item.name || !item.category || item.price === undefined) {
    return Response.json({ error: "Нэр, ангилал, үнэ заавал." }, { status: 400 });
  }
  // One name is entered in the admin; the (required, unique) name_en column just mirrors it for new items.
  item.name_en ??= item.name;
  const { data, error } = await g.db.from("menu_items").insert(item).select("*").single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  refresh("menu");
  return Response.json({ item: data }, { status: 201 });
}
