import type { Metadata } from "next";
import { QrSheet } from "@/components/admin/qr-sheet";

export const metadata: Metadata = { title: "Ширээний QR", robots: { index: false } };

export default function AdminQrPage() {
  return <QrSheet />;
}
