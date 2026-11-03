"use client";

import { AnimatePresence, motion, animate, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";

/** Intro curtain: counts 00 → 44, then lifts. Mounted once in the root layout. */
export function Preloader() {
  const [done, setDone] = useState(false);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => String(Math.round(v)).padStart(2, "0"));

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const t = setTimeout(() => setDone(true), 0);
      return () => clearTimeout(t);
    }
    document.documentElement.style.overflow = "hidden";
    const controls = animate(count, 44, { duration: 1.6, ease: [0.65, 0, 0.35, 1] });
    const t = setTimeout(() => setDone(true), 2000);
    return () => {
      controls.stop();
      clearTimeout(t);
      document.documentElement.style.overflow = "";
    };
  }, [count]);

  const lenis = useLenis();
  useEffect(() => {
    if (done) {
      document.documentElement.style.overflow = "";
      lenis?.start();
    } else {
      lenis?.stop();
    }
  }, [done, lenis]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="deco-rays pointer-events-none absolute inset-x-0 bottom-0 h-[70vh]" aria-hidden />
          <motion.span className="font-deco text-[28vw] leading-none font-semibold text-cream tabular-nums md:text-[16vw]">
            {rounded}
          </motion.span>
          <motion.div
            className="mt-6 h-px w-40 origin-left bg-gold"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
          />
          <p className="mt-5 text-[0.7rem] tracking-[0.5em] text-cream-dim uppercase">Concept Café</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
