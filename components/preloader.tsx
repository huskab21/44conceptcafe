"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";

const CUP = "M40 40 H160 L148 176 Q100 184 52 176 Z";
const HANDLE = "M158 70 Q196 74 192 108 Q188 140 152 142";

/**
 * Intro: a cup is drawn, fills with coffee, then tips and pours away while the
 * curtain lifts. Mounted once in the root layout; skipped for reduced motion.
 */
export function Preloader() {
  const [phase, setPhase] = useState<"draw" | "pour" | "done">("draw");
  const lenis = useLenis();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const t = setTimeout(() => setPhase("done"), 0);
      return () => clearTimeout(t);
    }
    document.documentElement.style.overflow = "hidden";
    const t1 = setTimeout(() => setPhase("pour"), 1500);
    const t2 = setTimeout(() => setPhase("done"), 2150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (phase === "done") {
      document.documentElement.style.overflow = "";
      lenis?.start();
    } else {
      lenis?.stop();
    }
  }, [phase, lenis]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="preloader"
          className="brew-glow fixed inset-0 z-[100] flex flex-col items-center justify-center"
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.svg
            viewBox="0 0 220 220"
            className="w-40 overflow-visible sm:w-48"
            animate={phase === "pour" ? { rotate: -115, x: -40, y: -10 } : { rotate: 0 }}
            transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
            style={{ originX: "30%", originY: "80%" }}
            aria-hidden
          >
            <defs>
              <clipPath id="pre-cup">
                <path d={CUP} />
              </clipPath>
            </defs>

            {/* coffee filling up */}
            <g clipPath="url(#pre-cup)">
              <motion.rect
                x="0"
                width="220"
                height="200"
                fill="#6b3a1a"
                initial={{ y: 190 }}
                animate={phase === "pour" ? { y: -220 } : { y: 52 }}
                transition={phase === "pour" ? { duration: 0.5, ease: "easeIn" } : { delay: 0.6, duration: 0.9, ease: [0.45, 0, 0.2, 1] }}
              />
              <motion.rect
                x="0"
                width="220"
                height="8"
                fill="#c98b55"
                initial={{ y: 186 }}
                animate={phase === "pour" ? { y: -222 } : { y: 50 }}
                transition={phase === "pour" ? { duration: 0.5, ease: "easeIn" } : { delay: 0.6, duration: 0.9, ease: [0.45, 0, 0.2, 1] }}
              />
            </g>

            {/* outline drawn in */}
            <motion.path
              d={CUP}
              fill="none"
              stroke="#f4ede3"
              strokeWidth="4"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            />
            <motion.path
              d={HANDLE}
              fill="none"
              stroke="#f4ede3"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
            />

          </motion.svg>

          <motion.p
            className="mt-10 font-deco text-3xl font-semibold tracking-[-0.06em] text-cream"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Logo size="1.9rem" />
          </motion.p>
          <motion.p
            className="mt-3 font-mono text-[0.65rem] tracking-[0.3em] text-cream-dim uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {"// Кофе бэлдэж байна"}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
