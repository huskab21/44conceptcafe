import { body, guard, parseWear, refresh } from "@/lib/admin-api";

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/wear/[id]">) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const patch = parseWear(await body(request));
  if (Object.keys(patch).length === 0) return Response.json({ error: "Өөрчлөлт алга." }, { status: 400 });
  const { data, error } = await g.db.from("wear_items").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Олдсонгүй." }, { status: 404 });
  refresh("wear");
  return Response.json({ item: data });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/wear/[id]">) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const { error } = await g.db.from("wear_items").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  refresh("wear");
  return Response.json({ ok: true });
}
