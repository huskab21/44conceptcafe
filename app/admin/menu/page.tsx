import type { Metadata } from "next";
import { MenuEditor } from "@/components/admin/menu-editor";

export const metadata: Metadata = { title: "Меню засах", robots: { index: false } };

export default function Page() {
  return <MenuEditor />;
}
