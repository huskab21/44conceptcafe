"use client";

import Link from "next/link";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { HERO_CLIPS, HeroVideo } from "@/components/home/hero-video";
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
  const [speedLabel, setSpeedLabel] = useState("1.0×");
  useMotionValueEvent(speed, "change", (v) => {
    const label = `${v.toFixed(1)}×`;
    setSpeedLabel((prev) => (prev === label ? prev : label));
  });

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
        className="absolute inset-0"
      >
        <HeroVideo progress={progress} speed={speed} onIndexChange={setClip} requestIndex={request} />
      </motion.div>

      {/* Legibility: darken the left (copy side) and blend the bottom into the next section */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-ink/90 via-ink/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-ink/70 to-transparent" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-[1400px] items-center px-5 pt-28 pb-32 sm:px-8 lg:px-10 lg:pt-24">
        {/* Copy */}
        <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 max-w-2xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: INTRO, duration: 0.8 }}>
            <Eyebrow>44 Concept Café · Meru Tower 2 давхар</Eyebrow>
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
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: INTRO + 0.35, duration: 0.9, ease }}
            className="mt-8 flex items-center gap-4 font-mono text-[0.72rem] font-bold tracking-[0.45em] text-gold uppercase sm:text-xs"
          >
            <span className="h-px w-10 bg-gold/60 sm:w-16" aria-hidden />
            Selling the vibe
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: INTRO + 0.45, duration: 0.9, ease }}
            className="mt-5 max-w-xs text-sm leading-snug font-bold tracking-tight text-cream uppercase sm:text-[0.95rem]"
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
        <span className="hidden sm:inline" aria-hidden>Scroll ↓ · хурдлуулна</span>
        <span className="tabular-nums" aria-hidden>
          <span className={speedLabel === "1.0×" ? "text-muted" : "text-gold"}>{speedLabel}</span> · N°44
        </span>
      </motion.div>
    </section>
  );
}
