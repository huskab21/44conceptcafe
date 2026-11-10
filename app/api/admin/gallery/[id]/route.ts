import { body, guard, parseGallery, refresh } from "@/lib/admin-api";

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/gallery/[id]">) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const patch = parseGallery(await body(request));
  if (Object.keys(patch).length === 0) return Response.json({ error: "Өөрчлөлт алга." }, { status: 400 });
  const { data, error } = await g.db.from("gallery_items").update(patch).eq("id", id).select("id, image, alt, sort_order, is_visible").maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Олдсонгүй." }, { status: 404 });
  refresh("gallery");
  return Response.json({ item: data });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/gallery/[id]">) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const { error } = await g.db.from("gallery_items").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  refresh("gallery");
  return Response.json({ ok: true });
}
