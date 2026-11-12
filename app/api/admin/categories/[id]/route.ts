import { body, guard, parseCategory, refresh } from "@/lib/admin-api";

const COLS = "id, label, en, sort_order";

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/categories/[id]">) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const patch = parseCategory(await body(request));
  if (Object.keys(patch).length === 0) return Response.json({ error: "Өөрчлөлт алга." }, { status: 400 });
  const { data, error } = await g.db.from("menu_categories").update(patch).eq("id", id).select(COLS).maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Олдсонгүй." }, { status: 404 });
  refresh("menu");
  return Response.json({ item: data });
}

/** Only empty categories can be deleted, so no menu item is ever left without one. */
export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/categories/[id]">) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const { count } = await g.db.from("menu_items").select("id", { count: "exact", head: true }).eq("category", id);
  if (count) {
    return Response.json({ error: `Энэ ангилалд ${count} бүтээгдэхүүн байна. Эхлээд тэдгээрийг өөр ангилал руу шилжүүлэх эсвэл устгана уу.` }, { status: 409 });
  }
  const { error } = await g.db.from("menu_categories").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  refresh("menu");
  return Response.json({ ok: true });
}
