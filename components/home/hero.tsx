"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const INTRO = 1.9; // seconds – waits for the preloader curtain
const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Minimal hero: one full-bleed photo, an oversized "44" wordmark and a single line of copy.
 * On scroll the photo pulls back into a rounded frame.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const inset = useTransform(scrollYProgress, [0, 0.6], ["0rem", "1.25rem"]);
  const radius = useTransform(scrollYProgress, [0, 0.6], ["0rem", "2rem"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const fade = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[560px]">
      <motion.div style={{ padding: inset }} className="sticky top-0 h-[100svh] min-h-[560px]">
        <motion.div style={{ borderRadius: radius }} className="relative size-full overflow-hidden">
          {/* Photo */}
          <motion.div
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ delay: INTRO - 0.6, duration: 2.4, ease }}
            className="absolute inset-0"
          >
            <motion.div style={{ scale: imgScale }} className="absolute inset-0">
              <Image
                src="/images/hero-pourover.webp"
                alt="Бариста пур овер кофе бэлдэж буй нь"
                fill
                priority
                sizes="100vw"
                className="object-cover object-[60%_center]"
              />
            </motion.div>
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/40" />

          {/* Copy */}
          <motion.div
            style={{ y: textY, opacity: fade }}
            className="absolute inset-x-0 bottom-0 flex flex-col gap-8 px-5 pb-8 sm:px-8 sm:pb-10 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-12"
          >
            <h1 className="overflow-hidden leading-none" aria-label="44 Concept Café">
              <motion.span
                initial={{ y: "105%" }}
                animate={{ y: "0%" }}
                transition={{ delay: INTRO, duration: 1.3, ease }}
                className="block font-deco text-[42vw] leading-[0.78] font-semibold tracking-[-0.06em] text-cream sm:text-[34vw] lg:text-[22vw]"
              >
                44
              </motion.span>
            </h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: INTRO + 0.5, duration: 1, ease }}
              className="max-w-sm lg:pb-4 lg:text-right"
            >
              <p className="text-[0.7rem] tracking-[0.35em] text-cream-dim uppercase">Concept Café · Улаанбаатар</p>
              <p className="mt-4 font-display text-2xl leading-snug text-cream sm:text-3xl">
                Кофе, желато, урлаг —<br />
                <em className="text-gold">нэг дор.</em>
              </p>
              <div className="mt-6 flex items-center gap-6 lg:justify-end">
                <Link href="/reserve" className="group relative text-sm text-cream">
                  Ширээ захиалах
                  <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left bg-gold transition-transform duration-500 group-hover:scale-x-0" />
                </Link>
                <Link href="/#menu" className="text-sm text-cream-dim transition-colors hover:text-cream">
                  Меню
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
