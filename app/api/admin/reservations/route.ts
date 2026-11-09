import { guard } from "@/lib/admin-api";

/** Admin: reservations from 7 days ago onwards (upcoming first in the UI). */
export async function GET(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const from = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
  const { data, error } = await g.db
    .from("reservations")
    .select("*")
    .gte("date", from)
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data });
}
