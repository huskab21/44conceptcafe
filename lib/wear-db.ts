import { cacheLife, cacheTag } from "next/cache";
import { getServerSupabase } from "./supabase";
import { wear as fallbackWear, type Gender, type WearItem } from "./wear";

export type WearRow = {
  id: string;
  name: string;
  kind: string;
  price: number;
  image: string;
  w: number;
  h: number;
  sizes: string[];
  height_min: number;
  height_max: number;
  weight_min: number;
  weight_max: number;
  gender: Gender;
  sort_order: number;
  is_available: boolean;
};

export function rowToWear(r: WearRow): WearItem {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    price: r.price,
    image: r.image,
    w: r.w,
    h: r.h,
    sizes: r.sizes,
    height: [r.height_min, r.height_max],
    weight: [r.weight_min, r.weight_max],
    gender: r.gender,
  };
}

/** Art Wear catalogue from Supabase `wear_items` (edited on /admin), falling back to the bundled list. */
export async function getWear(): Promise<WearItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("wear");

  const sb = getServerSupabase();
  if (!sb) return fallbackWear;
  const { data, error } = await sb.from("wear_items").select("*").eq("is_available", true).order("sort_order", { ascending: true });
  if (error) {
    // e.g. supabase/admin-content.sql not run yet — the bundled list keeps the page working.
    console.warn("[wear] using bundled list:", error.message);
    return fallbackWear;
  }
  return (data as WearRow[]).map(rowToWear);
}
