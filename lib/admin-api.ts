import "server-only";
import { revalidateTag } from "next/cache";
import { isAdmin } from "./orders";
import { adminDb } from "./supabase-admin";

/** Shared guard for /api/admin/*: admin auth + a configured database. Returns an error Response or the db client. */
export async function guard(request: Request) {
  if (!(await isAdmin(request))) return { error: Response.json({ error: "Нэвтрэх эрхгүй." }, { status: 401 }) } as const;
  if (!adminDb) return { error: Response.json({ error: "Supabase (SUPABASE_SECRET_KEY) тохируулаагүй байна." }, { status: 503 }) } as const;
  return { db: adminDb } as const;
}

/**
 * Mark the public menu / Art Wear data stale after an admin edit. With "max" the page is never blocked:
 * the next visit kicks off a background refresh and every visit after that shows the edit (usually within seconds).
 * ({ expire: 0 } would block the page render and trips Next's "uncached data during prerendering" check.)
 */
export function refresh(tag: "menu" | "wear" | "gallery") {
  revalidateTag(tag, "max");
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const int = (v: unknown, min: number, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};
const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
/** Images: our own /images/… files or Supabase storage URLs. */
const image = (v: unknown) => {
  const s = str(v, 500);
  if (!s) return undefined;
  if (s.startsWith("/images/")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" && u.hostname.endsWith(".supabase.co") ? s : undefined;
  } catch {
    return undefined;
  }
};
function clean<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export const MENU_CATEGORIES = ["hot", "cold", "signature", "gelato", "dessert", "beer"] as const;

export function parseMenu(b: Record<string, unknown>) {
  return clean({
    category: MENU_CATEGORIES.includes(b.category as never) ? (b.category as string) : undefined,
    name: str(b.name, 80) || undefined,
    name_en: str(b.name_en, 80) || undefined,
    description: str(b.description, 300),
    price: int(b.price, 0, 10_000_000),
    image: image(b.image),
    is_signature: bool(b.is_signature),
    is_available: bool(b.is_available),
    sort_order: int(b.sort_order, -100000, 100000),
  });
}

export function parseWear(b: Record<string, unknown>) {
  const sizes = Array.isArray(b.sizes)
    ? b.sizes.map((s) => str(s, 8)).filter((s): s is string => Boolean(s)).slice(0, 10)
    : undefined;
  return clean({
    name: str(b.name, 80) || undefined,
    kind: str(b.kind, 120),
    price: int(b.price, 0, 100_000_000),
    image: image(b.image),
    w: int(b.w, 1, 10000),
    h: int(b.h, 1, 10000),
    sizes,
    height_min: int(b.height_min, 50, 250),
    height_max: int(b.height_max, 50, 250),
    weight_min: int(b.weight_min, 10, 300),
    weight_max: int(b.weight_max, 10, 300),
    gender: ["Унисекс", "Эрэгтэй", "Эмэгтэй"].includes(b.gender as string) ? (b.gender as string) : undefined,
    sort_order: int(b.sort_order, -100000, 100000),
    is_available: bool(b.is_available),
  });
}

export function parseGallery(b: Record<string, unknown>) {
  return clean({
    image: image(b.image),
    alt: str(b.alt, 120),
    sort_order: int(b.sort_order, -100000, 100000),
    is_visible: bool(b.is_visible),
  });
}

export async function body(request: Request): Promise<Record<string, unknown>> {
  const b = await request.json().catch(() => null);
  return b && typeof b === "object" && !Array.isArray(b) ? (b as Record<string, unknown>) : {};
}
