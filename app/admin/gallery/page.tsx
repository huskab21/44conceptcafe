import type { Metadata } from "next";
import { GalleryEditor } from "@/components/admin/gallery-editor";

export const metadata: Metadata = { title: "44 Мөчүүд засах", robots: { index: false } };

export default function Page() {
  return <GalleryEditor />;
}
