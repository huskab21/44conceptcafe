import { randomUUID } from "node:crypto";
import { guard } from "@/lib/admin-api";
import { MEDIA_BUCKET } from "@/lib/supabase-admin";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const MAX = 5 * 1024 * 1024;

/** Admin image upload → public Supabase storage URL. multipart/form-data with a `file` field. */
export async function POST(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Зураг сонгоно уу." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return Response.json({ error: "Зөвхөн JPG, PNG, WEBP, AVIF зураг." }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "Зураг 5MB-аас бага байх ёстой." }, { status: 400 });

  const folder = form?.get("folder") === "wear" ? "wear" : "menu";
  const path = `${folder}/${randomUUID()}.${ext}`;
  const { error } = await g.db.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const { data } = g.db.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
