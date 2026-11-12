import { cacheLife, cacheTag } from "next/cache";
import { fallbackCategories, fallbackMenu, type Category, type MenuItem } from "./menu-data";
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

/** Menu categories from Supabase `menu_categories` (edited on /admin/menu), falling back to the built-in list. */
export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("menu");

  const supabase = getServerSupabase();
  if (!supabase) return fallbackCategories;
  const { data, error } = await supabase.from("menu_categories").select("id, label, en, sort_order").order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) {
    // e.g. supabase/menu-categories.sql not run yet
    if (error) console.warn("[menu] categories: using built-in list:", error.message);
    return fallbackCategories;
  }
  return data as Category[];
}
