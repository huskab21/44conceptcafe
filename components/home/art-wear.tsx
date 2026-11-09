"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/motion";
import { ScrambleText } from "@/components/ui/scramble-text";
import { features, type WearItem } from "@/lib/wear";
import { formatPrice } from "@/lib/site";

const ease = [0.22, 1, 0.36, 1] as const;

function FeatureIcon({ kind }: { kind: (typeof features)[number]["icon"] }) {
  const p = { stroke: "currentColor", strokeWidth: 1.4, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      {kind === "brush" && (
        <>
          <path d="M20 4 L10 14" {...p} />
          <path d="M10 14 C 7 13, 4 15, 4 20 C 8 20, 11 18, 10 14 Z" {...p} />
        </>
      )}
      {kind === "one" && (
        <>
          <circle cx="12" cy="12" r="8.5" {...p} />
          <path d="M10 9 L12.5 7.5 V16.5 M10 16.5 H15" {...p} />
        </>
      )}
      {kind === "hanger" && <path d="M12 7 C 12 4, 15.5 4.5, 14.5 6.5 C 14 7.5, 12 8, 12 9.5 L 3.5 16 C 3 16.4, 3.3 17, 3.9 17 H 20.1 C 20.7 17, 21 16.4, 20.5 16 L 12 9.5" {...p} />}
    </svg>
  );
}

function ProductCard({ item, index, active, onSelect }: { item: WearItem; index: number; active: boolean; onSelect: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.08, ease }}
      aria-pressed={active}
      className={`group relative flex flex-col overflow-hidden border bg-ink-2 p-4 text-left transition-colors duration-500 ${
        active ? "border-gold" : "border-white/10 hover:border-white/25"
      }`}
      data-cursor="Үзэх"
    >
      <div className="flex items-start justify-between font-mono text-[0.62rem] tracking-[0.2em] text-muted uppercase">
        <span>N°{String(index + 1).padStart(2, "0")}</span>
        <span className={`text-lg leading-none transition-transform duration-500 group-hover:rotate-90 ${active ? "text-gold" : "text-cream"}`}>+</span>
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl leading-[1.05] text-cream">
            <ScrambleText text={item.name} delay={(index % 4) * 120} />
          </h3>
          <p className="mt-1 text-xs text-cream-dim">{item.kind}</p>
        </div>
        <span className="shrink-0 font-mono text-xs text-cream tabular-nums">{formatPrice(item.price)}</span>
      </div>

      <div className="relative my-4 flex aspect-[4/4.2] items-center justify-center">
        <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(217,164,108,0.22),transparent_68%)] transition-transform duration-700 group-hover:scale-125" />
        <Image
          src={item.image}
          alt={`${item.name} — ${item.kind}`}
          width={item.w}
          height={item.h}
          sizes="(min-width: 1024px) 22vw, 45vw"
          className="relative max-h-full w-auto object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.55)] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-hover:scale-[1.05]"
        />
      </div>

    </motion.button>
  );
}

/** Art Wear: the featured piece up top with its fit details, then the full one-of-one collection. */
/** `items` comes from Supabase `wear_items` (editable on /admin); render only when non-empty. */
export function ArtWear({ items: wear }: { items: WearItem[] }) {
  const [selected, setSelected] = useState(wear[0]);
  const hero = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useTransform(useSpring(mx, { stiffness: 60, damping: 16 }), (v) => v * 18);
  const rotateX = useTransform(useSpring(my, { stiffness: 60, damping: 16 }), (v) => v * -8);

  function select(item: WearItem) {
    setSelected(item);
    const top = hero.current?.getBoundingClientRect().top ?? 0;
    if (top < -80) hero.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="wear" aria-label="44 Art Wear" className="relative scroll-mt-20 overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70svh] bg-[radial-gradient(ellipse_50%_60%_at_40%_40%,rgba(120,66,30,0.35),transparent_70%)]" />

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        {/* heading */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Art Wear · @44.hype</Eyebrow>
            <h2 className="mt-6 font-display text-6xl text-cream sm:text-8xl">
              Өмсдөг <em>урлаг</em>
            </h2>
          </div>
          <p className="max-w-sm text-sm font-bold tracking-tight text-cream-dim uppercase">
            Гараар зурсан, upcycle хийсэн, нэг л ширхэг хувцаснууд. Кофегоо уунгаа өмсөж үзээрэй.
          </p>
        </div>

        {/* featured piece */}
        <div
          ref={hero}
          className="relative mt-14 grid scroll-mt-28 gap-8 lg:grid-cols-[1fr_minmax(320px,30%)] lg:items-center"
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse") return;
            const r = e.currentTarget.getBoundingClientRect();
            mx.set((e.clientX - r.left) / r.width - 0.5);
            my.set((e.clientY - r.top) / r.height - 0.5);
          }}
          onPointerLeave={() => {
            mx.set(0);
            my.set(0);
          }}
        >
          <div className="relative flex min-h-[60svh] items-center justify-center border border-white/10 bg-ink-2/60 [perspective:1200px] lg:min-h-[72svh]">
            <div className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(217,164,108,0.2),transparent_65%)]" />
            <span className="absolute top-5 left-5 font-mono text-[0.62rem] tracking-[0.25em] text-cream-dim uppercase">{"// Онцлох бүтээл"}</span>
            <span className="absolute top-5 right-5 font-mono text-[0.62rem] tracking-[0.25em] text-cream-dim uppercase">One of one</span>

            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.98 }}
                transition={{ duration: 0.6, ease }}
                className="relative h-[52svh] lg:h-[60svh]"
              >
                <motion.div style={{ rotateY, rotateX }} className="h-full">
                  <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="h-full">
                    <Image
                      src={selected.image}
                      alt={`${selected.name} — ${selected.kind}`}
                      width={selected.w}
                      height={selected.h}
                      sizes="(min-width: 1024px) 45vw, 90vw"
                      className="h-full w-auto object-contain drop-shadow-[0_50px_60px_rgba(0,0,0,0.6)]"
                      priority={false}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <a
              href="/reserve"
              className="group absolute bottom-5 left-5 inline-flex items-center gap-5 border border-cream/70 px-4 py-2.5 font-mono text-[0.7rem] tracking-[0.18em] text-cream uppercase transition-colors hover:border-gold hover:bg-gold hover:text-ink"
            >
              Ирж өмсөж үзэх
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>

          {/* details + features */}
          <div className="flex flex-col gap-3">
            <div className="border border-white/10 bg-ink-2 p-5">
              <AnimatePresence mode="wait">
                <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <p className="font-mono text-[0.62rem] tracking-[0.25em] text-gold uppercase">{selected.kind}</p>
                  <h3 className="mt-3 font-display text-4xl leading-[0.95] text-cream">
                    <ScrambleText text={selected.name} hover={false} duration={700} />
                  </h3>
                  <p className="mt-4 font-display text-3xl text-gold-soft tabular-nums">{formatPrice(selected.price)}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7, ease }}
                className="grid grid-cols-[2.5rem_1fr] gap-x-4 border border-white/10 px-4 py-3"
              >
                <span className="font-mono text-[0.62rem] text-muted">{String(i + 1).padStart(2, "0")}</span>
                <p className="font-mono text-[0.72rem] tracking-[0.15em] text-cream uppercase">{f.title}</p>
                <span className="mt-auto text-gold">
                  <FeatureIcon kind={f.icon} />
                </span>
                <p className="mt-2 text-[0.8rem] leading-snug whitespace-pre-line text-cream-dim">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* collection */}
        <div className="mt-24 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="font-display text-5xl text-cream sm:text-7xl">
            <ScrambleText text="Коллекц." duration={1100} />
          </h3>
          <p className="font-mono text-[0.68rem] leading-relaxed tracking-[0.2em] text-cream-dim uppercase sm:text-right">
            {wear.length} бүтээл · Upcycle & hand-painted
            <br />
            <span className="text-muted">* Размерын мэдээлэл жишээ</span>
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {wear.map((item, i) => (
            <ProductCard key={item.id} item={item} index={i} active={item.id === selected.id} onSelect={() => select(item)} />
          ))}
        </div>
      </div>
    </section>
  );
}
