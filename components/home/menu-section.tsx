"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useMemo, useState } from "react";
import { Eyebrow, Reveal } from "@/components/ui/motion";
import { categories, type MenuCategory, type MenuItem } from "@/lib/menu-data";
import { formatPrice } from "@/lib/site";

export function MenuSection({ items }: { items: MenuItem[] }) {
  const available = categories.filter((c) => items.some((i) => i.category === c.id));
  const [active, setActive] = useState<MenuCategory>(available.find((c) => c.id === "hot")?.id ?? available[0]?.id ?? "hot");
  const [hovered, setHovered] = useState<MenuItem | null>(null);

  const list = useMemo(() => items.filter((i) => i.category === active), [items, active]);

  // Floating preview image that follows the pointer (desktop)
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 180, damping: 22 });
  const sy = useSpring(py, { stiffness: 180, damping: 22 });

  return (
    <section id="menu" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="deco-rays pointer-events-none absolute inset-x-0 top-0 h-80 rotate-180 opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <Eyebrow>Menu · Үнийн жагсаалт</Eyebrow>
          <Reveal>
            <h2 className="mt-5 font-display text-5xl text-cream sm:text-7xl">
              Манай <em className="text-gold">меню</em>
            </h2>
          </Reveal>
        </div>

        {/* Category tabs */}
        <div className="no-scrollbar -mx-4 mt-12 overflow-x-auto px-4" role="tablist" aria-label="Ангилал">
          <div className="mx-auto flex w-max gap-1 rounded-full border border-line bg-ink-2 p-1.5">
            {available.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={active === c.id}
                onClick={() => setActive(c.id)}
                className={`relative rounded-full px-4 py-2.5 text-sm whitespace-nowrap transition-colors sm:px-6 ${
                  active === c.id ? "text-ink" : "text-cream-dim hover:text-cream"
                }`}
              >
                {active === c.id && (
                  <motion.span
                    layoutId="menu-pill"
                    className="absolute inset-0 rounded-full bg-gold"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10 font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <div
          className="relative mt-12"
          role="tabpanel"
          onPointerMove={(e) => {
            px.set(e.clientX);
            py.set(e.clientY);
          }}
          onPointerLeave={() => setHovered(null)}
        >
          <AnimatePresence mode="wait">
            <motion.ul
              key={active}
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              className="grid gap-x-14 md:grid-cols-2"
            >
              {list.map((item) => (
                <motion.li
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                    exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
                  }}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(item)}
                  onPointerLeave={() => setHovered(null)}
                  className="group flex items-center gap-4 border-b border-line py-5"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl md:hidden">
                    <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <h3 className="font-display text-2xl text-cream transition-colors group-hover:text-gold sm:text-[1.7rem]">
                        {item.name}
                      </h3>
                      {item.is_signature && (
                        <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[0.6rem] tracking-widest text-gold uppercase">
                          44
                        </span>
                      )}
                      <span className="mb-1.5 hidden flex-1 border-b border-dotted border-muted/50 sm:block" aria-hidden />
                      <span className="ml-auto font-semibold text-cream tabular-nums sm:ml-0">{formatPrice(item.price)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      <span className="text-cream-dim">{item.name_en}</span> · {item.description}
                    </p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>

          <AnimatePresence>
            {hovered && (
              <motion.div
                key="preview"
                className="pointer-events-none fixed top-0 left-0 z-30 hidden md:block"
                style={{ x: sx, y: sy }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative -mt-36 ml-8 h-56 w-44 overflow-hidden rounded-t-full rounded-b-2xl border border-gold/40 shadow-2xl shadow-black/70">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={hovered.id}
                      initial={{ opacity: 0, scale: 1.15 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      <Image src={hovered.image} alt="" fill sizes="176px" className="object-cover" />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-10 text-center text-xs text-muted">
          Үнэ НӨАТ орсон. Сүүг овъёос, бадмаарагны сүүгээр солих боломжтой (+₮1,500).
        </p>
      </div>
    </section>
  );
}
