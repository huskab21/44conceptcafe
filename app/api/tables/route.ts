import type { NextRequest } from "next/server";
import { isAdmin, TABLE_COUNT, tableKey } from "@/lib/orders";

/** Staff only: the signed QR link for every table (printed once, reused forever). */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) return Response.json({ error: "Нэвтрэх эрхгүй." }, { status: 401 });
  const tables = Array.from({ length: TABLE_COUNT }, (_, i) => {
    const n = i + 1;
    const k = tableKey(n);
    return { table: n, path: `/t/${n}${k ? `?k=${k}` : ""}` };
  });
  return Response.json({ tables });
}
