import type { Metadata } from "next";
import { ReservationsAdmin } from "@/components/admin/reservations-admin";

export const metadata: Metadata = { title: "Ширээ захиалга", robots: { index: false } };

export default function Page() {
  return <ReservationsAdmin />;
}
