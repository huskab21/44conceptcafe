import { body, guard, parseGallery, refresh } from "@/lib/admin-api";

/** Admin: every gallery photo, including hidden ones. */
export async function GET(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { data, error } = await g.db.from("gallery_items").select("id, image, alt, sort_order, is_visible").order("sort_order");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data });
}

export async function POST(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const item = parseGallery(await body(request));
  if (!item.image) return Response.json({ error: "Зураг заавал." }, { status: 400 });
  const { data, error } = await g.db.from("gallery_items").insert(item).select("id, image, alt, sort_order, is_visible").single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  refresh("gallery");
  return Response.json({ item: data }, { status: 201 });
}
