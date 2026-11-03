import { cacheLife, cacheTag } from "next/cache";
import { fallbackMenu, type MenuItem } from "./menu-data";
import { getServerSupabase } from "./supabase";

/**
 * Menu for the home page. Reads `menu_items` from Supabase when configured,
 * otherwise (or on error / empty table) falls back to the bundled seed data.
 * Cached for a few minutes so price edits in Supabase show up quickly.
 */
export async function getMenu(): Promise<MenuItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("menu");

  const supabase = getServerSupabase();
  if (!supabase) return fallbackMenu;

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_available", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.error("[menu] Supabase error, using fallback:", error.message);
    return fallbackMenu;
  }
  return data as MenuItem[];
}
