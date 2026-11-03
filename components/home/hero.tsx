"use client";

import Link from "next/link";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BagMockup, CupMockup } from "@/components/home/mockups";
import { Eyebrow } from "@/components/ui/motion";
import type { MenuItem } from "@/lib/menu-data";
import { formatPrice } from "@/lib/site";

const INTRO = 1.9; // seconds – waits for the preloader curtain
const ease = [0.22, 1, 0.36, 1] as const;
const words = ["өглөөнд", "мөчид", "сэтгэлд", "найзуудад"];

/** Handwritten word that types, pauses, deletes and moves to the next one. */
function TypedWord() {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const word = words[index];

  useEffect(() => {
    const done = !deleting && length === word.length;
    const empty = deleting && length === 0;
    const delay = done ? 1800 : empty ? 300 : deleting ? 45 : 95;
    const t = setTimeout(
      () => {
        if (done) setDeleting(true);
        else if (empty) {
          setDeleting(false);
          setIndex((i) => (i + 1) % words.length);
        } else setLength((l) => l + (deleting ? -1 : 1));
      },
      length === 0 && !deleting && index === 0 ? INTRO * 1000 + 600 : delay,
    );
    return () => clearTimeout(t);
  }, [length, deleting, word, index]);

  return (
    <span className="relative inline-block min-h-[1em] min-w-[2ch]">
      {word.slice(0, length)}
      <span className="ml-1 inline-block h-[0.8em] w-[3px] animate-pulse bg-gold-soft align-middle" aria-hidden />
    </span>
  );
}

export function Hero({ featured }: { featured?: MenuItem }) {
  const ref = useRef<HTMLElement>(null);

  // Pointer parallax for the product mockups
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const cupX = useTransform(sx, (v) => v * -28);
  const cupY = useTransform(sy, (v) => v * -20);
  const bagX = useTransform(sx, (v) => v * 16);
  const bagY = useTransform(sy, (v) => v * 12);
  const cardX = useTransform(sx, (v) => v * 34);

  // Scroll: content drifts and fades
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const productsY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="brew-glow relative min-h-[100svh] overflow-hidden"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      }}
    >
      <div className="relative mx-auto grid min-h-[100svh] max-w-[1400px] items-center gap-6 px-5 pt-28 pb-24 sm:px-8 lg:grid-cols-12 lg:px-10 lg:pt-24">
        {/* Copy */}
        <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 lg:col-span-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: INTRO, duration: 0.8 }}>
            <Eyebrow>Концепт кофе шоп · Улаанбаатар</Eyebrow>
          </motion.div>

          <h1 className="mt-6 font-display text-[17vw] text-cream sm:text-[12vw] lg:text-[7.4rem]">
            {["Кофе", "таны"].map((w, i) => (
              <span key={w} className="block overflow-hidden pb-[0.04em]">
                <motion.span
                  className="block"
                  initial={{ y: "105%" }}
                  animate={{ y: "0%" }}
                  transition={{ delay: INTRO + i * 0.12, duration: 1.1, ease }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
            <em className="-mt-[0.05em] block text-[0.82em] leading-[1] sm:pl-[0.9em]">
              <TypedWord />
            </em>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: INTRO + 0.45, duration: 0.9, ease }}
            className="mt-8 max-w-xs text-sm leading-snug font-bold tracking-tight text-cream uppercase sm:text-[0.95rem]"
          >
            Жижиг багцаар шарсан үр, гараар бэлдсэн аяга бүр. <span className="text-cream-dim">Art Deco орчинд.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: INTRO + 0.6, duration: 0.9, ease }}
            className="mt-10 flex items-center gap-8"
          >
            <Link href="/#menu" className="group relative inline-flex items-center gap-2 text-sm font-bold tracking-wide text-cream uppercase">
              Меню үзэх
              <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
              <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left bg-cream/60 transition-transform duration-500 group-hover:scale-x-0" />
            </Link>
            <Link href="/reserve" className="text-sm font-bold tracking-wide text-gold uppercase transition-colors hover:text-gold-soft">
              Ширээ захиалах →
            </Link>
          </motion.div>
        </motion.div>

        {/* Products */}
        <motion.div style={{ y: productsY }} className="relative h-[52svh] min-h-[340px] lg:col-span-6 lg:h-[78vh]">
          <motion.div
            style={{ x: bagX, y: bagY }}
            initial={{ opacity: 0, y: 80, rotate: 10 }}
            animate={{ opacity: 1, y: 0, rotate: 4 }}
            transition={{ delay: INTRO + 0.15, duration: 1.4, ease }}
            className="absolute top-[4%] right-[-6%] w-[62%] sm:right-0 lg:right-[-4%] lg:w-[64%]"
          >
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              <BagMockup className="w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.55)]" />
            </motion.div>
          </motion.div>

          <motion.div
            style={{ x: cupX, y: cupY }}
            initial={{ opacity: 0, y: 120, rotate: -18 }}
            animate={{ opacity: 1, y: 0, rotate: -9 }}
            transition={{ delay: INTRO + 0.3, duration: 1.4, ease }}
            className="absolute bottom-[2%] left-[2%] w-[44%] sm:left-[10%] lg:left-[0%] lg:w-[42%]"
          >
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>
              <CupMockup className="w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]" />
            </motion.div>
          </motion.div>

          {featured && (
            <motion.div
              style={{ x: cardX }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: INTRO + 0.8, duration: 1, ease }}
              className="absolute top-[4%] left-0 z-10 hidden w-[18rem] border border-white/10 bg-black/45 p-4 backdrop-blur-md sm:block lg:top-[10%] lg:left-[2%]"
            >
              <p className="font-mono text-[0.65rem] tracking-widest text-cream-dim uppercase">{"// Өнөөдрийн онцлох"}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <p className="font-display text-2xl leading-none text-cream">{featured.name}</p>
                <p className="font-mono text-sm text-cream tabular-nums">{formatPrice(featured.price)}</p>
              </div>
              <p className="mt-3 border-t border-white/10 pt-2 font-mono text-[0.62rem] tracking-wider text-cream-dim uppercase">
                {featured.description}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom rule marks */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: INTRO + 1 }}
        className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto flex max-w-[1400px] items-end justify-between px-5 font-mono text-[0.62rem] tracking-[0.2em] text-muted uppercase sm:px-8 lg:px-10"
        aria-hidden
      >
        <span className="flex items-end gap-16">
          <span className="h-8 w-px bg-cream/30" />
          <span className="h-8 w-px bg-cream/30" />
        </span>
        <span>Scroll ↓</span>
        <span>N°44 — Est. Ulaanbaatar</span>
      </motion.div>
    </section>
  );
}
