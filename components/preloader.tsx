"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";
import { FOUR_PATH, MARK_FLIP, MARK_VIEWBOX } from "@/components/logo";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Intro: the two 4s of the mark slide in from opposite corners while their outlines are drawn,
 * fill in, then the whole mark makes a half turn — it is point-symmetric, so it lands looking the same.
 * Then the curtain lifts. Mounted once in the root layout; skipped for reduced motion.
 */
export function Preloader() {
  const [done, setDone] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const t = setTimeout(() => setDone(true), 0);
      return () => clearTimeout(t);
    }
    document.documentElement.style.overflow = "hidden";
    const t = setTimeout(() => setDone(true), 2150);
    return () => {
      clearTimeout(t);
      document.documentElement.style.overflow = "";
    };
  }, []);

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
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.svg
            viewBox={MARK_VIEWBOX}
            className="h-28 w-auto overflow-visible text-cream sm:h-36"
            initial={{ rotate: 0 }}
            animate={{ rotate: 180 }}
            transition={{ delay: 1.05, duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
            role="img"
            aria-label="44 Concept Café"
          >
            {[0, 1].map((i) => (
              <g key={i} transform={i ? MARK_FLIP : undefined}>
                <motion.path
                  d={FOUR_PATH}
                  stroke="currentColor"
                  strokeWidth={10}
                  strokeLinejoin="miter"
                  initial={{ pathLength: 0, fillOpacity: 0, x: -140, y: -140 }}
                  animate={{ pathLength: 1, fillOpacity: 1, x: 0, y: 0 }}
                  transition={{
                    pathLength: { delay: 0.1 + i * 0.08, duration: 0.8, ease: "easeInOut" },
                    x: { delay: 0.1 + i * 0.08, duration: 0.9, ease },
                    y: { delay: 0.1 + i * 0.08, duration: 0.9, ease },
                    fillOpacity: { delay: 0.75, duration: 0.35 },
                  }}
                  fill="currentColor"
                />
              </g>
            ))}
          </motion.svg>

          <motion.p
            className="mt-10 font-mono text-[0.68rem] font-bold tracking-[0.45em] text-cream uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6, ease }}
          >
            Concept Café
          </motion.p>
          <motion.p
            className="mt-3 font-mono text-[0.6rem] tracking-[0.45em] text-gold uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            Selling the vibe
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
