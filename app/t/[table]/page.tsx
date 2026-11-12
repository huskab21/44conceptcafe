import type { Metadata } from "next";
import { Suspense } from "react";
import { QrMenu } from "@/components/qr/qr-menu";
import { getCategories, getMenu } from "@/lib/menu";
import { isValidTable } from "@/lib/orders";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "QR меню", robots: { index: false } };

/** Table QR menu: /t/5?k=<signature>. Each printed QR opens this page for its own table. */
export default function TablePage(props: PageProps<"/t/[table]">) {
  return (
    <Suspense fallback={<div className="grid min-h-svh place-items-center font-mono text-xs tracking-[0.3em] text-cream-dim uppercase">Меню ачааллаж байна…</div>}>
      <TableMenu {...props} />
    </Suspense>
  );
}

async function TableMenu({ params, searchParams }: PageProps<"/t/[table]">) {
  const { table: raw } = await params;
  const { k } = await searchParams;
  const table = Number(raw);
  const key = typeof k === "string" ? k : "";

  if (!isValidTable(table, key)) {
    return (
      <main className="grid min-h-svh place-items-center px-6 text-center">
        <div>
          <p className="font-display text-5xl text-cream">QR хүчингүй</p>
          <p className="mt-4 text-sm text-cream-dim">Ширээн дээрх QR кодыг дахин уншуулна уу, эсвэл ажилтанд хандаарай.</p>
          <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="mt-6 inline-block font-mono text-xs tracking-[0.2em] text-gold uppercase">
            {site.phone}
          </a>
        </div>
      </main>
    );
  }

  const [menu, categories] = await Promise.all([getMenu(), getCategories()]);
  return <QrMenu table={table} tableKey={key} items={menu} categories={categories} />;
}
