import type { Metadata } from "next";
import { OrdersHistory } from "@/components/admin/orders-history";

export const metadata: Metadata = { title: "Захиалгын түүх", robots: { index: false } };

export default function Page() {
  return <OrdersHistory />;
}
