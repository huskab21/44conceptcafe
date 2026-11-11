import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/orders";
import { postToViber, viberEnabled } from "@/lib/viber";

/** Staff: send a test message to the Viber channel to check the setup. */
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) return Response.json({ error: "Нэвтрэх эрхгүй." }, { status: 401 });
  if (!viberEnabled) return Response.json({ error: "VIBER_CHANNEL_TOKEN тохируулаагүй байна." }, { status: 400 });
  try {
    await postToViber("✅ 44 cafe: Viber мэдэгдэл ажиллаж байна. Шинэ захиалга бүр энд ирнэ.");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
