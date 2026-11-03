"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Eyebrow } from "@/components/ui/motion";
import { site } from "@/lib/site";

// Placeholder photography – swap with the café's own photos in /public/images.
const columns = [
  [
    { src: "/images/bar.webp", alt: "Кофе бар" },
    { src: "/images/cheers.webp", alt: "Найзууд кофе уух нь" },
    { src: "/images/cake.webp", alt: "Шоколадан бялуу" },
  ],
  [
    { src: "/images/terrace.webp", alt: "Ногоон ургамалтай дэнж" },
    { src: "/images/iced-latte.webp", alt: "Айс латте" },
    { src: "/images/beans.webp", alt: "Шарсан кофены үр" },
  ],
  [
    { src: "/images/cafe-sign.webp", alt: "Кафены гэрэлт хаяг" },
    { src: "/images/croissant.webp", alt: "Круассан" },
    { src: "/images/interior-2.webp", alt: "Кафены танхим" },
  ],
];

function Column({ images, y, className = "" }: { images: (typeof columns)[number]; y: MotionValue<string>; className?: string }) {
  return (
    <motion.div style={{ y }} className={`flex flex-col gap-4 sm:gap-6 ${className}`}>
      {images.map((img) => (
        <div key={img.src} className="group relative aspect-[3/4] overflow-hidden rounded-2xl sm:rounded-3xl" data-cursor="44">
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(min-width: 768px) 33vw, 50vw"
            className="object-cover grayscale-[35%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
          />
        </div>
      ))}
    </motion.div>
  );
}

export function Gallery() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], ["4%", "-14%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["-16%", "2%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

  return (
    <section id="gallery" ref={ref} className="relative scroll-mt-20 overflow-hidden py-24 sm:py-32">
      <div className="mx-auto mb-14 flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>Gallery</Eyebrow>
          <h2 className="mt-5 font-display text-5xl text-cream sm:text-7xl">
            Мөчүүд <em className="text-gold">@44</em>
          </h2>
        </div>
        <a
          href={site.instagram}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2 self-start text-cream-dim hover:text-cream md:self-auto"
        >
          Instagram-д дагах
          <span className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
        </a>
      </div>

      <div className="mx-auto grid h-[110svh] max-w-7xl grid-cols-2 gap-4 overflow-hidden px-4 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_82%,transparent)] sm:gap-6 sm:px-6 md:h-[130vh] md:grid-cols-3">
        <Column images={columns[0]} y={y1} />
        <Column images={columns[1]} y={y2} className="mt-16" />
        <Column images={columns[2]} y={y3} className="hidden md:flex" />
      </div>
    </section>
  );
}
