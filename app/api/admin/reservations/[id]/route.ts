import { body, guard } from "@/lib/admin-api";

/** Admin: mark deposit paid (auto-confirms), confirm or cancel. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/reservations/[id]">) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const b = await body(request);
  const patch: Record<string, unknown> = {};
  if (typeof b.deposit_paid === "boolean") {
    patch.deposit_paid = b.deposit_paid;
    if (b.deposit_paid) patch.status = "confirmed";
  }
  if (b.status === "pending" || b.status === "confirmed" || b.status === "cancelled") patch.status = b.status;
  if (Object.keys(patch).length === 0) return Response.json({ error: "Өөрчлөлт алга." }, { status: 400 });
  const { data, error } = await g.db.from("reservations").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Олдсонгүй." }, { status: 404 });
  return Response.json({ item: data });
}
