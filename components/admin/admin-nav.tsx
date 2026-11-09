"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Шууд захиалга" },
  { href: "/admin/orders", label: "Захиалгын түүх" },
  { href: "/admin/reservations", label: "Ширээ захиалга" },
  { href: "/admin/menu", label: "Меню" },
  { href: "/admin/wear", label: "Art Wear" },
  { href: "/admin/qr", label: "Ширээний QR" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="no-scrollbar sticky top-0 z-30 flex gap-1.5 overflow-x-auto border-b border-white/10 bg-ink/90 px-4 py-3 backdrop-blur-md sm:px-6 print:hidden">
      <Link href="/" className="mr-2 shrink-0 self-center font-deco text-xl font-semibold tracking-[-0.06em] text-cream" aria-label="Сайт руу буцах">
        44
      </Link>
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 font-mono text-[0.65rem] tracking-[0.15em] whitespace-nowrap uppercase transition-colors ${active ? "bg-gold text-ink" : "border border-white/15 text-cream hover:border-gold"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
