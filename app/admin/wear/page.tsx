import type { Metadata } from "next";
import { WearEditor } from "@/components/admin/wear-editor";

export const metadata: Metadata = { title: "Art Wear засах", robots: { index: false } };

export default function Page() {
  return <WearEditor />;
}
