"use client";

import Link from "next/link";
import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";
import { HERO_CLIPS, HeroVideo } from "@/components/home/hero-video";
import { Eyebrow } from "@/components/ui/motion";
import type { MenuItem } from "@/lib/menu-data";
import { formatPrice } from "@/lib/site";

const INTRO = 1.9; // seconds – waits for the preloader curtain
const ease = [0.22, 1, 0.36, 1] as const;
/** One segment per clip: fills as that clip plays, click to jump to it. */
function ClipBar({ index, active, progress, label, onSelect }: {
  index: number;
  active: boolean;
  progress: MotionValue<number>;
  label: string;
  onSelect: () => void;
}) {
  const scaleX = useTransform(progress, (p) => (active ? p : 0));
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group pointer-events-auto flex w-16 flex-col gap-2 text-left sm:w-24"
      aria-label={`Видео ${index + 1}: ${label}`}
      data-cursor="Үзэх"
    >
      <span className={`transition-colors ${active ? "text-cream" : "text-muted group-hover:text-cream-dim"}`}>
        0{index + 1} <span className="hidden sm:inline">{label}</span>
      </span>
      <span className="relative h-px w-full bg-cream/20">
        <motion.span style={{ scaleX }} className="absolute inset-0 origin-left bg-gold" />
      </span>
    </button>
  );
}

export function Hero({ featured }: { featured?: MenuItem }) {
  const ref = useRef<HTMLElement>(null);

  // Background clips
  const progress = useMotionValue(0);
  const speed = useMotionValue(1);
  const [clip, setClip] = useState(0);
  const [request, setRequest] = useState<{ index: number } | null>(null);

  // Scroll: video sinks slower than the page, copy drifts and fades
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden bg-ink">
      {/* Video background */}
      <motion.div
        style={{ y: videoY, scale: videoScale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: INTRO - 0.4, duration: 1.4 }}
        className="absolute inset-x-0 top-0 h-[60svh] md:inset-0 md:h-auto"
      >
        <HeroVideo progress={progress} speed={speed} onIndexChange={setClip} requestIndex={request} />
        {/* Phone: the clip fills the top of the screen and melts into the background under the copy */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-transparent to-ink md:hidden" />
      </motion.div>

      {/* Legibility: darken the left (copy side) and blend the bottom into the next section */}
      <div className="pointer-events-none absolute inset-0 hidden bg-linear-to-r from-ink/90 via-ink/45 to-transparent md:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-ink/70 to-transparent" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-[1400px] items-end px-5 pt-28 pb-28 md:items-center md:pb-32 sm:px-8 lg:px-10 lg:pt-24">
        {/* Copy */}
        <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 max-w-2xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: INTRO, duration: 0.8 }}>
            <Eyebrow>
              44 Concept Café<span className="hidden sm:inline"> · Meru Tower 2 давхар</span>
            </Eyebrow>
          </motion.div>

          <h1 className="mt-5 font-display text-[19vw] leading-[0.86] text-cream uppercase sm:text-[13vw] md:mt-6 lg:text-[9.5rem]">
            <span className="block overflow-hidden pb-[0.04em]">
              <motion.span className="block" initial={{ y: "105%" }} animate={{ y: "0%" }} transition={{ delay: INTRO, duration: 1.1, ease }}>
                Selling
              </motion.span>
            </span>
            {/* "THE" with the handwritten "vibe." tucked in right after it */}
            <span className="flex items-end gap-[0.16em]">
              <span className="block overflow-hidden pb-[0.04em]">
                <motion.span className="block" initial={{ y: "105%" }} animate={{ y: "0%" }} transition={{ delay: INTRO + 0.12, duration: 1.1, ease }}>
                  The
                </motion.span>
              </span>
              <motion.em
                className="mb-[0.06em] block text-[0.82em] leading-[1] whitespace-nowrap normal-case"
                initial={{ opacity: 0, x: -24, rotate: -6 }}
                animate={{ opacity: 1, x: 0, rotate: -6 }}
                transition={{ delay: INTRO + 0.35, duration: 1, ease }}
              >
                vibe.
              </motion.em>
            </span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: INTRO + 0.6, duration: 0.9, ease }}
            className="mt-10 flex items-center gap-6 whitespace-nowrap sm:gap-8 md:mt-12"
          >
            <Link href="/#menu" className="group relative inline-flex items-center gap-2 text-[0.8rem] font-bold tracking-wide text-cream uppercase sm:text-sm">
              Меню үзэх
              <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
              <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left bg-cream/60 transition-transform duration-500 group-hover:scale-x-0" />
            </Link>
            <Link href="/reserve" className="text-[0.8rem] font-bold tracking-wide text-gold uppercase transition-colors hover:text-gold-soft sm:text-sm">
              Ширээ захиалах →
            </Link>
          </motion.div>
        </motion.div>

      </div>

      {featured && (
        <motion.div
          style={{ opacity: fade }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: INTRO + 0.8, duration: 1, ease }}
          className="absolute right-5 bottom-24 z-10 hidden w-[17rem] border border-white/10 bg-black/45 p-4 backdrop-blur-md sm:right-8 md:block lg:right-10"
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

      {/* Bottom bar: clip progress · scroll hint · playback speed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: INTRO + 1 }}
        className="pointer-events-none absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-[1400px] items-end justify-between gap-6 px-5 font-mono text-[0.62rem] tracking-[0.2em] text-muted uppercase sm:px-8 lg:px-10"
      >
        <div className="flex items-end gap-3 sm:gap-5">
          {HERO_CLIPS.map((c, i) => (
            <ClipBar
              key={c.src}
              index={i}
              label={c.label}
              active={clip === i}
              progress={progress}
              onSelect={() => setRequest({ index: i })}
            />
          ))}
        </div>
        <span className="hidden sm:inline" aria-hidden>Scroll ↓</span>
      </motion.div>
    </section>
  );
}
