import type { Metadata } from "next";
import { OrdersBoard } from "@/components/admin/orders-board";

export const metadata: Metadata = { title: "Захиалгууд", robots: { index: false } };

export default function AdminPage() {
  return <OrdersBoard />;
}
