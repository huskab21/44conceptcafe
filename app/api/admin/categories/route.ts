import { body, guard, parseCategory, refresh } from "@/lib/admin-api";

const COLS = "id, label, en, sort_order";
const NOT_SET_UP = "supabase/menu-categories.sql-ийг Supabase дээр ажиллуулна уу.";

/** Admin: all menu categories. */
export async function GET(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { data, error } = await g.db.from("menu_categories").select(COLS).order("sort_order");
  if (error) return Response.json({ error: `${NOT_SET_UP} (${error.message})` }, { status: 500 });
  return Response.json({ items: data });
}

export async function POST(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const item = parseCategory(await body(request));
  if (!item.label) return Response.json({ error: "Ангиллын нэр заавал." }, { status: 400 });
  const { data, error } = await g.db.from("menu_categories").insert(item).select(COLS).single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  refresh("menu");
  return Response.json({ item: data }, { status: 201 });
}
