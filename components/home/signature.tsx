"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import { Eyebrow, Reveal } from "@/components/ui/motion";
import type { MenuItem } from "@/lib/menu-data";
import { formatPrice } from "@/lib/site";

/** Product card that leans toward the cursor with a moving glare. */
function TiltCard({ item, index }: { item: MenuItem; index: number }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 160, damping: 18 });
  const sy = useSpring(py, { stiffness: 160, damping: 18 });
  const rotateY = useTransform(sx, [0, 1], [-14, 14]);
  const rotateX = useTransform(sy, [0, 1], [12, -12]);
  const glareX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(sy, [0, 1], ["0%", "100%"]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.22), transparent 55%)`;

  return (
    <Reveal delay={index * 0.08} className="[perspective:1000px]">
      <motion.article
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
        }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative flex h-full flex-col overflow-hidden border border-white/10 bg-ink-2"
        data-cursor="44"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 80vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-transparent to-transparent" />
          <span className="absolute top-4 left-4 font-mono text-[0.65rem] tracking-widest text-cream/80 uppercase">
            {`// N°${String(index + 1).padStart(2, "0")}`}
          </span>
        </div>
        <div className="relative flex flex-1 flex-col p-5" style={{ transform: "translateZ(40px)" }}>
          <p className="font-mono text-[0.65rem] tracking-widest text-gold uppercase">{item.name_en}</p>
          <h3 className="mt-2 font-display text-2xl text-cream">{item.name}</h3>
          <p className="mt-2 text-sm text-cream-dim">{item.description}</p>
          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
            <span className="font-mono text-cream tabular-nums">{formatPrice(item.price)}</span>
            <span className="grid size-8 place-items-center border border-white/20 text-cream transition-colors group-hover:bg-cream group-hover:text-ink">
              +
            </span>
          </div>
        </div>
        <motion.div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glare }} />
      </motion.article>
    </Reveal>
  );
}

export function Signature({ items }: { items: MenuItem[] }) {
  return (
    <section className="py-24 sm:py-32" aria-label="Онцлох амтууд">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Signature · Зөвхөн 44-т</Eyebrow>
            <h2 className="mt-6 font-display text-6xl text-cream sm:text-8xl">
              Онцлох <em>амтууд</em>
            </h2>
          </div>
          <p className="max-w-xs text-sm font-bold tracking-tight text-cream-dim uppercase">
            Бариста маань улирал бүр шинэ жор нэмдэг. Эдгээр нь одоогийн шилдгүүд.
          </p>
        </div>

        <div className="no-scrollbar -mx-5 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 lg:gap-5">
          {items.slice(0, 4).map((item, i) => (
            <div key={item.id} className="w-[78vw] shrink-0 snap-center sm:w-auto">
              <TiltCard item={item} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
