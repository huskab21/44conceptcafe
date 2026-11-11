"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Eyebrow, Reveal } from "@/components/ui/motion";
import { categories, type MenuItem } from "@/lib/menu-data";
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
        <div className="relative aspect-[4/3.6] overflow-hidden">
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
          <p className="font-mono text-[0.65rem] tracking-widest text-gold uppercase">{categories.find((c) => c.id === item.category)?.en}</p>
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

/** Featured drinks & bites on a horizontal track that scrolls sideways while the section is pinned. */
export function Signature({ items }: { items: MenuItem[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  // How far the track must travel = its overflow past the viewport.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setDistance(Math.max(0, el.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (p) => -p * distance);
  const smoothX = useSpring(x, { stiffness: 120, damping: 26, mass: 0.4 });
  const bar = useTransform(scrollYProgress, [0, 1], [0.04, 1]);
  const [count, setCount] = useState(1);
  useMotionValueEvent(scrollYProgress, "change", (p) => setCount(Math.min(items.length, Math.max(1, Math.round(p * (items.length - 1)) + 1))));

  return (
    <section
      ref={section}
      aria-label="Онцлох амтууд"
      className="relative"
      style={{ height: `calc(100svh + ${distance}px)` }}
    >
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden py-20">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-end md:justify-between lg:px-10">
          <div>
            <Eyebrow>Signature · Зөвхөн 44-т</Eyebrow>
            <h2 className="mt-6 font-display text-6xl text-cream sm:text-8xl">
              Онцлох <span className="text-gold-soft">амтууд</span>
            </h2>
          </div>
          <div className="flex items-end gap-8">
            <p className="max-w-xs text-sm font-bold tracking-tight text-cream-dim uppercase">
              Бариста маань улирал бүр шинэ жор нэмдэг. Гүйлгээд бүгдийг нь үзээрэй →
            </p>
            <p className="hidden font-mono text-xs tracking-widest text-cream-dim tabular-nums sm:block">
              <span className="text-cream">{String(count).padStart(2, "0")}</span> / {String(items.length).padStart(2, "0")}
            </p>
          </div>
        </div>

        <motion.div ref={track} style={{ x: smoothX }} className="mt-12 flex w-max gap-4 px-5 will-change-transform sm:px-8 lg:gap-5 lg:px-10">
          {items.map((item, i) => (
            <div key={item.id} className="w-[72vw] shrink-0 sm:w-[44vw] lg:w-[24vw] xl:w-[21vw]">
              <TiltCard item={item} index={i} />
            </div>
          ))}
          {/* closing card */}
          <a
            href="#menu"
            className="group flex w-[60vw] shrink-0 flex-col justify-between border border-white/10 p-6 sm:w-[30vw] lg:w-[18vw]"
          >
            <span className="font-mono text-[0.65rem] tracking-widest text-cream-dim uppercase">{"// Бүтэн меню"}</span>
            <span className="font-display text-4xl text-cream transition-colors group-hover:text-gold-soft">
              Бүгдийг
              <br />
              үзэх ↗
            </span>
          </a>
        </motion.div>

        <div className="mx-auto mt-10 w-full max-w-[1400px] px-5 sm:px-8 lg:px-10">
          <div className="h-px w-full bg-white/10">
            <motion.div style={{ scaleX: bar }} className="h-px origin-left bg-gold" />
          </div>
        </div>
      </div>
    </section>
  );
}
