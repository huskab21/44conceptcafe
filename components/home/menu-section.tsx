"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/motion";
import { Barcode, Dashed, Printer, ReceiptPaper } from "@/components/ui/receipt";
import { categories, type MenuCategory, type MenuItem } from "@/lib/menu-data";
import { formatPrice, site } from "@/lib/site";
import { LogoMark } from "@/components/logo";

/** Menu printed as a thermal receipt. Picking a category re-prints it. */
export function MenuSection({ items }: { items: MenuItem[] }) {
  const available = categories.filter((c) => items.some((i) => i.category === c.id));
  const [active, setActive] = useState<MenuCategory>(available.find((c) => c.id === "hot")?.id ?? available[0]?.id ?? "hot");
  const [printing, setPrinting] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });

  const list = items.filter((i) => i.category === active);
  const cat = categories.find((c) => c.id === active)!;

  function choose(id: MenuCategory) {
    if (id === active) return;
    setActive(id);
    setPrinting(true);
  }

  return (
    <section id="menu" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1400px] gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:px-10">
        {/* Left: heading + categories */}
        <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <Eyebrow>Меню · Үнийн жагсаалт</Eyebrow>
          <h2 className="mt-6 font-display text-6xl text-cream sm:text-8xl">
            Юу
            <br />
            уух <em>вэ?</em>
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed font-bold tracking-tight text-cream-dim uppercase">
            Ангиллаа сонго — бид шууд хэвлээд өгье.
          </p>

          <ul className="mt-10 border-t border-line" role="tablist" aria-label="Менюгийн ангилал">
            {available.map((c, i) => {
              const count = items.filter((x) => x.category === c.id).length;
              const isActive = c.id === active;
              return (
                <li key={c.id} className="border-b border-line">
                  <button
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => choose(c.id)}
                    className="group flex w-full items-center gap-5 py-4 text-left"
                  >
                    <span className="font-mono text-xs text-muted">0{i + 1}</span>
                    <span
                      className={`font-display text-2xl transition-all duration-300 sm:text-3xl ${
                        isActive ? "translate-x-2 text-cream" : "text-cream/40 group-hover:text-cream/80"
                      }`}
                    >
                      {c.label}
                    </span>
                    <span className="ml-auto font-mono text-xs text-muted">[{count}]</span>
                    {isActive && <motion.span layoutId="menu-dot" className="size-2 rounded-full bg-gold" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right: printer + receipt */}
        <div ref={ref} className="lg:col-span-6 lg:col-start-7">
          <Printer printing={printing && inView}>
            <ReceiptPaper
              printKey={active}
              start={inView}
              duration={0.9 + list.length * 0.18}
              onPrinted={() => setPrinting(false)}
            >
              <div className="text-center">
                <LogoMark className="mx-auto h-10" />
                <p className="text-[0.68rem] tracking-[0.3em] uppercase">Concept Café</p>
                <p className="mt-2 text-[0.65rem] leading-snug opacity-70">{site.address}</p>
              </div>
              <Dashed />
              <div className="flex justify-between text-[0.68rem] uppercase">
                <span>Ангилал</span>
                <span className="font-semibold">{cat.label}</span>
              </div>
              <div className="flex justify-between text-[0.68rem] uppercase opacity-70">
                <span>Category</span>
                <span>{cat.en}</span>
              </div>
              <Dashed />

              <ul className="space-y-3.5">
                {list.map((item) => (
                  <li key={item.id}>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold uppercase">{item.name}</span>
                      <span className="mb-1 flex-1 border-b border-dotted border-[#1c1611]/40" aria-hidden />
                      <span className="font-semibold tabular-nums">{formatPrice(item.price)}</span>
                    </div>
                    <p className="text-[0.66rem] leading-snug opacity-65">
                      {item.name_en} — {item.description}
                    </p>
                  </li>
                ))}
              </ul>

              <Dashed />
              <div className="flex justify-between text-[0.68rem] uppercase">
                <span>Нийт сонголт</span>
                <span>{list.length}</span>
              </div>
              <div className="flex justify-between text-[0.68rem] uppercase opacity-70">
                <span>Ургамлын сүү</span>
                <span>+₮1,500</span>
              </div>
              <Dashed />
              <p className="text-center text-[0.68rem] tracking-[0.2em] uppercase">Баярлалаа · Дахин ирээрэй</p>
              <Barcode seed={active} />
              <p className="mt-1 text-center text-[0.6rem] tracking-[0.4em]">N°44-{active.toUpperCase()}</p>
            </ReceiptPaper>
          </Printer>
        </div>
      </div>
    </section>
  );
}
