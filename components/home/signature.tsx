"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/motion";
import type { MenuItem } from "@/lib/menu-data";
import { formatPrice } from "@/lib/site";

function Card({ item, index }: { item: MenuItem; index: number }) {
  return (
    <article
      className="group relative w-[78vw] shrink-0 snap-center sm:w-[46vw] lg:w-auto"
      data-cursor="Амтлах"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] rounded-t-[999px] border border-line lg:aspect-auto lg:h-[min(62vh,620px)] lg:w-[min(46.5vh,465px)]">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 480px, (min-width: 640px) 46vw, 78vw"
          className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
        <span className="absolute top-[22%] left-1/2 -translate-x-1/2 font-deco text-xs tracking-[0.3em] text-cream/80">
          N°{String(index + 1).padStart(2, "0")}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="text-xs tracking-[0.25em] text-gold uppercase">{item.name_en}</p>
          <h3 className="mt-2 font-display text-3xl text-cream sm:text-4xl">{item.name}</h3>
          <p className="mt-2 text-sm text-cream-dim">{item.description}</p>
          <p className="mt-4 inline-block rounded-full border border-gold/50 px-4 py-1.5 font-semibold text-gold tabular-nums">
            {formatPrice(item.price)}
          </p>
        </div>
      </div>
    </article>
  );
}

/** Desktop: pinned section that scrolls horizontally. Touch/mobile: native swipe carousel. */
export function Signature({ items }: { items: MenuItem[] }) {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    const measure = () => {
      setPinned(mq.matches);
      if (trackRef.current) setDistance(Math.max(0, trackRef.current.scrollWidth - window.innerWidth));
    };
    measure();
    mq.addEventListener("change", measure);
    window.addEventListener("resize", measure);
    return () => {
      mq.removeEventListener("change", measure);
      window.removeEventListener("resize", measure);
    };
  }, [items.length]);

  // The track only exists in the pinned layout, so measure again once it renders.
  useEffect(() => {
    if (pinned && trackRef.current) {
      setDistance(Math.max(0, trackRef.current.scrollWidth - window.innerWidth));
    }
  }, [pinned]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const heading = (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-end md:justify-between">
      <div>
        <Eyebrow>Signature</Eyebrow>
        <h2 className="mt-5 font-display text-5xl leading-none text-cream sm:text-7xl">
          Онцлох <em className="text-gold">амтууд</em>
        </h2>
      </div>
      <p className="max-w-sm text-cream-dim">
        Зөвхөн 44-т л байдаг жорууд. Бариста маань улирал бүр шинэ амт нэмдэг.
      </p>
    </div>
  );

  if (!pinned) {
    return (
      <section className="py-20 sm:py-28" aria-label="Онцлох амтууд">
        {heading}
        <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-6" data-lenis-prevent-wheel>
          {items.map((item, i) => (
            <Card key={item.id} item={item} index={i} />
          ))}
          <div className="w-1 shrink-0" aria-hidden />
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative" style={{ height: `calc(100vh + ${distance}px)` }} aria-label="Онцлох амтууд">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-16">
        {heading}
        <motion.div ref={trackRef} style={{ x }} className="mt-10 flex w-max gap-8 px-6 pr-[10vw]">
          {items.map((item, i) => (
            <Card key={item.id} item={item} index={i} />
          ))}
          <div className="flex w-[28vw] shrink-0 items-center justify-center">
            <p className="text-center font-display text-5xl text-outline">
              Илүү ихийг
              <br />
              менюнээс ↓
            </p>
          </div>
        </motion.div>
        <div className="mx-auto mt-8 h-px w-[min(80rem,90vw)] bg-line">
          <motion.div style={{ width: progressWidth }} className="h-full bg-gold" />
        </div>
      </div>
    </section>
  );
}
