import { cacheLife, cacheTag } from "next/cache";
import { getServerSupabase } from "./supabase";

export type ReceiptSettings = { receipt_extra_label: string; receipt_extra_price: number; receipt_thanks: string };

export const defaultReceipt: ReceiptSettings = {
  receipt_extra_label: "Ургамлын сүү",
  receipt_extra_price: 1500,
  receipt_thanks: "Баярлалаа · Дахин ирээрэй",
};

/** Editable bits of the home-page menu receipt (site_settings row 1), falling back to the defaults. */
export async function getReceiptSettings(): Promise<ReceiptSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");

  const sb = getServerSupabase();
  if (!sb) return defaultReceipt;
  const { data, error } = await sb.from("site_settings").select("receipt_extra_label, receipt_extra_price, receipt_thanks").eq("id", 1).maybeSingle();
  if (error || !data) {
    if (error) console.warn("[settings] using defaults:", error.message);
    return defaultReceipt;
  }
  return data as ReceiptSettings;
}
