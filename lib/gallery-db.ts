import { cacheLife, cacheTag } from "next/cache";
import { getServerSupabase } from "./supabase";

export type GalleryRow = { id: string; image: string; alt: string; sort_order: number; is_visible: boolean };
export type GalleryImage = { src: string; alt: string };

const fallback: GalleryImage[] = [
  { src: "/images/bar.webp", alt: "Кофе бар" },
  { src: "/images/terrace.webp", alt: "Ногоон ургамалтай дэнж" },
  { src: "/images/cafe-sign.webp", alt: "Кафены гэрэлт хаяг" },
  { src: "/images/cheers.webp", alt: "Найзууд кофе уух нь" },
  { src: "/images/iced-latte.webp", alt: "Айс латте" },
  { src: "/images/croissant.webp", alt: "Круассан" },
  { src: "/images/cake.webp", alt: "Шоколадан бялуу" },
  { src: "/images/beans.webp", alt: "Шарсан кофены үр" },
  { src: "/images/interior-2.webp", alt: "Кафены танхим" },
];

/** "Мөчүүд @44" photos from Supabase `gallery_items` (edited on /admin/gallery), falling back to the bundled set. */
export async function getGallery(): Promise<GalleryImage[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("gallery");

  const sb = getServerSupabase();
  if (!sb) return fallback;
  const { data, error } = await sb.from("gallery_items").select("image, alt").eq("is_visible", true).order("sort_order", { ascending: true });
  if (error) {
    // e.g. supabase/gallery.sql not run yet
    console.warn("[gallery] using bundled photos:", error.message);
    return fallback;
  }
  return (data as Pick<GalleryRow, "image" | "alt">[]).map((r) => ({ src: r.image, alt: r.alt }));
}
