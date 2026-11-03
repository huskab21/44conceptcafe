"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Magnetic, SplitText } from "@/components/ui/motion";

const INTRO = 1.9; // seconds – waits for the preloader curtain

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const bigY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden pt-28 pb-16 sm:pt-32">
      {/* Background: oversized outline "44" */}
      <motion.div
        style={{ y: bigY }}
        className="pointer-events-none absolute inset-x-0 top-[12%] flex justify-center select-none"
        aria-hidden
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: INTRO - 0.3, duration: 1.6 }}
          className="font-deco text-[62vw] leading-none font-semibold text-outline opacity-50 md:text-[38vw]"
        >
          44
        </motion.span>
      </motion.div>
      <div className="deco-rays pointer-events-none absolute inset-x-0 bottom-0 h-[60vh] opacity-70" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12">
        <motion.div style={{ y: textY, opacity: fade }} className="lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: INTRO, duration: 0.9 }}
            className="mb-6 inline-flex items-center gap-3 rounded-full border border-line bg-ink/50 px-4 py-2 text-xs tracking-[0.25em] text-cream-dim uppercase backdrop-blur"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            Одоо нээлттэй · Улаанбаатар
          </motion.p>

          <h1 className="font-display text-[15vw] leading-[0.88] font-medium tracking-tight text-cream sm:text-[11vw] lg:text-[7.6rem]">
            <SplitText text="Кофе." animateOnMount delay={INTRO} className="block" />
            <SplitText text="Желато." animateOnMount delay={INTRO + 0.12} className="block italic text-gold" />
            <SplitText text="Урлаг." animateOnMount delay={INTRO + 0.24} className="block" />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: INTRO + 0.5, duration: 1 }}
            className="mt-8 max-w-md text-base leading-relaxed text-cream-dim sm:text-lg"
          >
            Art Deco уур амьсгалтай концепт кафе. Гараар бэлдсэн кофе, өдөр бүр шинээр хийсэн желато,
            мөн урлагийн хувцасны цуглуулга — бүгд нэг дор.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: INTRO + 0.65, duration: 1 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Magnetic>
              <Link
                href="/reserve"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-cream px-7 py-4 font-semibold text-ink"
              >
                <span className="relative z-10">Ширээ захиалах</span>
                <span className="relative z-10 transition-transform duration-500 group-hover:translate-x-1">→</span>
                <span className="absolute inset-0 translate-y-full bg-gold transition-transform duration-500 group-hover:translate-y-0" />
              </Link>
            </Magnetic>
            <Link
              href="/#menu"
              className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-4 text-cream transition-colors hover:border-gold"
            >
              Меню үзэх
            </Link>
          </motion.div>
        </motion.div>

        {/* Image stack */}
        <div className="relative lg:col-span-5">
          <motion.div
            initial={{ clipPath: "inset(100% 0 0 0)" }}
            animate={{ clipPath: "inset(0% 0 0 0)" }}
            transition={{ delay: INTRO + 0.1, duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
            className="deco-frame relative mx-auto aspect-[4/5] w-[78%] overflow-hidden rounded-t-full sm:w-[62%] lg:w-full"
            data-cursor="44"
          >
            <motion.div style={{ scale: imgScale, y: imgY }} className="absolute inset-0">
              <Image
                src="/images/latte.webp"
                alt="Латте арт хийж буй бариста"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 70vw"
                className="object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40, rotate: -8 }}
            animate={{ opacity: 1, x: 0, rotate: -6 }}
            transition={{ delay: INTRO + 0.6, duration: 1.2 }}
            className="absolute -bottom-6 left-0 w-[34%] overflow-hidden rounded-2xl border border-line shadow-2xl shadow-black/60 sm:left-[8%] lg:-left-12"
          >
            <div className="relative aspect-square">
              <Image src="/images/gelato.webp" alt="Желато" fill sizes="20vw" className="object-cover" />
            </div>
          </motion.div>

          {/* Rotating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: INTRO + 0.8, duration: 1 }}
            className="absolute -top-4 right-[6%] size-28 sm:size-32 lg:-right-6"
          >
            <svg viewBox="0 0 100 100" className="size-full animate-spin-slow" aria-hidden>
              <defs>
                <path id="circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <text className="fill-gold text-[9.5px] tracking-[0.28em] uppercase">
                <textPath href="#circle">Est. Ulaanbaatar ✦ 44 Concept ✦ </textPath>
              </text>
            </svg>
            <span className="absolute inset-0 grid place-items-center font-deco text-lg text-cream">✦</span>
          </motion.div>
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: INTRO + 1.2 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.62rem] tracking-[0.4em] text-muted uppercase md:flex"
        aria-hidden
      >
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-line">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-gold"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
