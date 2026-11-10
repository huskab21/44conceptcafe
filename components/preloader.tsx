"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Intro: the 44 Concept Café wordmark builds itself — "44" rises in, "concept" is written on,
 * "CAFÉ" spells out, a gold rule sweeps under it with the tagline — then the curtain lifts.
 * Mounted once in the root layout; skipped for reduced motion.
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
          className="brew-glow fixed inset-0 z-[100] flex flex-col items-center justify-center"
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <div
            aria-label="44 Concept Café"
            role="img"
            className="flex items-center gap-[0.22em] leading-none"
            style={{ fontSize: "clamp(3.2rem, 15vw, 6.5rem)" }}
          >
            {/* 44 */}
            <span className="flex font-deco text-[1.15em] font-semibold tracking-[-0.06em] text-cream" aria-hidden>
              {["4", "4"].map((d, i) => (
                <span key={i} className="block overflow-hidden pb-[0.06em]">
                  <motion.span
                    className="block"
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ delay: 0.1 + i * 0.1, duration: 0.8, ease }}
                  >
                    {d}
                  </motion.span>
                </span>
              ))}
            </span>

            <span className="flex flex-col items-center" aria-hidden>
              {/* concept — written on left to right */}
              <motion.span
                className="font-script text-[0.82em] leading-[0.8] text-gold-soft"
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{ delay: 0.55, duration: 0.7, ease: "easeInOut" }}
              >
                concept
              </motion.span>
              {/* CAFÉ — spelled out */}
              <span className="mt-[0.08em] flex font-deco text-[0.42em] font-bold text-cream uppercase" style={{ marginRight: "-0.42em" }}>
                {"Café".split("").map((c, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    style={{ marginRight: "0.42em" }}
                    initial={{ opacity: 0, y: "0.5em" }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.07, duration: 0.5, ease }}
                  >
                    {c}
                  </motion.span>
                ))}
              </span>
            </span>
          </div>

          {/* gold rule + tagline */}
          <motion.span
            className="mt-8 block h-px w-40 origin-left bg-gold sm:w-56"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.15, duration: 0.6, ease }}
            aria-hidden
          />
          <motion.p
            className="mt-4 font-mono text-[0.68rem] font-bold tracking-[0.45em] text-gold uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.7, ease }}
          >
            Selling the vibe
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
